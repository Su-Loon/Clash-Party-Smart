// Clash Party Smart Core 覆写脚本（改进版）
// 配置会在启用 Smart 内核时自动应用
// 作者: Su-Loon | 仓库: github.com/Su-Loon/Clash-Party-Smart

function main(config) {
  try {
    // ========== 基础校验 ==========
    if (!config || typeof config !== 'object') {
      console.log('[Smart Override] ❌ 无效的配置对象，跳过覆写')
      return config
    }
    console.log('[Smart Override] ✅ 开始处理配置...')

    // ========== Profile 配置 ==========
    if (!config.profile) config.profile = {}
    config.profile['smart-collector-size'] = 200  // 增大采集样本数，提高决策准确性

    // ========== 确保代理组存在 ==========
    if (!config['proxy-groups']) {
      config['proxy-groups'] = []
    }
    if (!Array.isArray(config['proxy-groups'])) {
      console.log('[Smart Override] ⚠️ proxy-groups 不是数组，已重置')
      config['proxy-groups'] = []
    }

    // ========== 阶段一：将 url-test / load-balance 转换为 smart 类型 ==========
    let hasUrlTestOrLoadBalance = false
    for (const group of config['proxy-groups']) {
      if (group && group.type) {
        const t = group.type.toLowerCase()
        if (t === 'url-test' || t === 'load-balance') {
          hasUrlTestOrLoadBalance = true
          break
        }
      }
    }

    if (hasUrlTestOrLoadBalance) {
      console.log('[Smart Override] 🔄 发现 url-test/load-balance 组，开始转换为 smart 类型...')
      const nameMapping = new Map()

      for (const group of config['proxy-groups']) {
        if (group && group.type) {
          const t = group.type.toLowerCase()
          if (t === 'url-test' || t === 'load-balance') {
            const originalName = group.name
            console.log(`[Smart Override] 🔄 转换代理组: ${originalName} (${group.type} → smart)`)

            group.type = 'smart'

            // 名称添加后缀（修复：完整匹配 "(Smart Group)"）
            if (group.name && !group.name.includes('(Smart Group)')) {
              group.name = group.name + '(Smart Group)'
              nameMapping.set(originalName, group.name)
            }

            // ===== Smart 内核核心配置 =====
            // policy-priority: <1 降优先级，>1 升优先级，支持正则
            // 常用节点命名模式：香港/沪/深/日本/美国/新加坡
            group['policy-priority'] = [
              '(?i)hk|hongkong|香港|沪|深',     // 香港节点最高优先级
              '(?i)jp|japan|日本',               // 日本节点次高
              '(?i)us|usa|america|美国',         // 美国节点
              '(?i)sg|singapore|新加坡',         // 新加坡节点
              '(?i)tw|taiwan|台湾',              // 台湾节点
              '(?i)kr|korea|韩国',               // 韩国节点
              '(?i)uk|london|英国|英格兰',        // 英国节点
            ].join('|')

            group.uselightgbm = true    // 启用 LightGBM 机器学习优化节点选择
            group.collectdata = true    // 收集流量数据用于优化
            group.strategy = 'sticky-sessions'  // 会话保持，减少连接中断

            // ===== 健康检查配置（Smart 内核兼容）=====
            group['max-failed-times'] = 3        // 最大失败次数
            group['failed-timeout'] = 300        // 失败节点冷却时间（秒）

            // 移除 url-test / load-balance 特有字段
            delete group.url
            delete group.interval
            delete group.tolerance
            delete group.lazy
            delete group['expected-status']
          }
        }
      }

      // ===== 更新所有对重命名代理组的引用 =====
      if (nameMapping.size > 0) {
        console.log(`[Smart Override] 🔗 更新代理组引用: ${Array.from(nameMapping.entries()).map(([k, v]) => `${k} → ${v}`).join(', ')}`)

        // 更新代理组内的 proxies 引用
        for (const group of config['proxy-groups']) {
          if (group && group.proxies && Array.isArray(group.proxies)) {
            group.proxies = group.proxies.map(p => nameMapping.get(p) || p)
          }
        }

        // 更新规则中的代理组引用
        const ruleParamsSet = new Set(['no-resolve', 'force-remote-dns', 'prefer-ipv6'])
        if (config.rules && Array.isArray(config.rules)) {
          config.rules = config.rules.map(rule => {
            if (typeof rule === 'string') {
              // 跳过复杂嵌套规则
              if (rule.includes('((') || rule.includes('))')) {
                return rule
              }
              const parts = rule.split(',').map(p => p.trim())
              if (parts.length < 2) return rule

              let targetIndex = -1
              if (parts[0] === 'MATCH' && parts.length === 2) {
                targetIndex = 1
              } else {
                for (let i = 2; i < parts.length; i++) {
                  if (!ruleParamsSet.has(parts[i])) {
                    targetIndex = i
                    break
                  }
                }
              }

              if (targetIndex !== -1 && nameMapping.has(parts[targetIndex])) {
                console.log(`[Smart Override] 🔗 更新规则引用: ${parts[targetIndex]} → ${nameMapping.get(parts[targetIndex])}`)
                parts[targetIndex] = nameMapping.get(parts[targetIndex])
                return parts.join(',')
              }
            } else if (typeof rule === 'object' && rule !== null) {
              for (const field of ['target', 'proxy']) {
                if (rule[field] && nameMapping.has(rule[field])) {
                  rule[field] = nameMapping.get(rule[field])
                }
              }
            }
            return rule
          })
        }

        // 更新配置顶级字段引用
        for (const field of ['mode', 'proxy-mode']) {
          if (config[field] && nameMapping.has(config[field])) {
            config[field] = nameMapping.get(config[field])
          }
        }
      }

      console.log('[Smart Override] ✅ 转换完成，跳过后续逻辑')
      return config
    }

    // ========== 阶段二：无 url-test/load-balance，创建或更新 Smart 组 ==========
    console.log('[Smart Override] ℹ️ 未发现 url-test/load-balance 组，执行创建/更新逻辑...')

    // 查找现有 Smart 组并更新配置
    let smartGroupExists = false
    for (const group of config['proxy-groups']) {
      if (group && group.type === 'smart') {
        smartGroupExists = true
        console.log(`[Smart Override] ✅ 发现现有 Smart 组: ${group.name}`)
        group['policy-priority'] = [
          '(?i)hk|hongkong|香港|沪|深',
          '(?i)jp|japan|日本',
          '(?i)us|usa|america|美国',
          '(?i)sg|singapore|新加坡',
        ].join('|')
        group.uselightgbm = true
        group.collectdata = true
        group.strategy = 'sticky-sessions'
        group['max-failed-times'] = 3
        group['failed-timeout'] = 300
        break
      }
    }

    // 创建新的 Smart Group
    if (!smartGroupExists) {
      const proxyNames = (config.proxies || [])
        .filter(p => p && typeof p === 'object' && p.name)
        .map(p => p.name)

      if (proxyNames.length > 0) {
        console.log(`[Smart Override] ➕ 创建新 Smart 组，包含 ${proxyNames.length} 个节点`)
        config['proxy-groups'].unshift({
          name: 'Smart Group',
          type: 'smart',
          'policy-priority': [
            '(?i)hk|hongkong|香港|沪|深',
            '(?i)jp|japan|日本',
            '(?i)us|usa|america|美国',
            '(?i)sg|singapore|新加坡',
            '(?i)tw|taiwan|台湾',
          ].join('|'),
          uselightgbm: true,
          collectdata: true,
          strategy: 'sticky-sessions',
          'max-failed-times': 3,
          'failed-timeout': 300,
          proxies: proxyNames,
        })
      } else {
        console.log('[Smart Override] ⚠️ 无可用代理节点，跳过 Smart 组创建')
      }
    }

    // ========== 阶段三：更新规则，将非 DIRECT 目标指向 Smart Group ==========
    if (config.rules && Array.isArray(config.rules)) {
      console.log(`[Smart Override] 📋 处理规则，共 ${config.rules.length} 条`)

      const proxyGroupNames = new Set()
      for (const g of (config['proxy-groups'] || [])) {
        if (g && g.name) proxyGroupNames.add(g.name)
      }

      const builtinTargets = new Set(['DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'COMPATIBLE'])
      const ruleParams = new Set(['no-resolve', 'force-remote-dns', 'prefer-ipv6'])

      let replacedCount = 0
      config.rules = config.rules.map(rule => {
        if (typeof rule === 'string') {
          if (rule.includes('((') || rule.includes('))')) {
            return rule  // 跳过复杂嵌套规则
          }
          const parts = rule.split(',').map(p => p.trim())
          if (parts.length < 2) return rule

          let targetIndex = -1
          if (parts[0] === 'MATCH' && parts.length === 2) {
            targetIndex = 1
          } else {
            for (let i = 2; i < parts.length; i++) {
              if (!ruleParams.has(parts[i])) {
                targetIndex = i
                break
              }
            }
          }

          if (targetIndex !== -1) {
            const targetValue = parts[targetIndex]
            const shouldReplace = !builtinTargets.has(targetValue) &&
              (proxyGroupNames.has(targetValue) || !ruleParams.has(targetValue))
            if (shouldReplace) {
              console.log(`[Smart Override] 📋 替换规则目标: ${targetValue} → Smart Group`)
              parts[targetIndex] = 'Smart Group'
              replacedCount++
              return parts.join(',')
            }
          }
        } else if (typeof rule === 'object' && rule !== null) {
          for (const field of ['target', 'proxy']) {
            if (rule[field] && !builtinTargets.has(rule[field])) {
              rule[field] = 'Smart Group'
              replacedCount++
            }
          }
        }
        return rule
      })
      console.log(`[Smart Override] 📋 规则处理完成，共替换 ${replacedCount} 条`)
    }

    // ========== 阶段四：DNS 优化（可选，默认注释）==========
    // 如需启用，取消下方注释，并确保在 Clash Party 设置中开启 DNS 功能
    /*
    if (!config.dns) config.dns = {}
    Object.assign(config.dns, {
      enable: true,
      listen: '0.0.0.0:53',
      'enhanced-mode': 'fake-ip',
      nameserver: [
        'https://doh.pub/dns-query',   // 国内 DoH
        'https://dns.alidns.com/dns-query',
      ],
      fallback: [
        'https://doh.dns.sb/dns-query',
        'tls://8.8.8.8:853',
      ],
      'fallback-filter': {
        geoip: true,
        ipcidr: ['240.0.0.0/4'],
      },
    })
    console.log('[Smart Override] 🌐 DNS 优化配置已启用')
    */

    console.log('[Smart Override] 🎉 配置处理完成！')
    return config

  } catch (error) {
    console.error('[Smart Override] ❌ 处理配置时发生错误:', error.message)
    console.error(error.stack)
    return config  // 发生错误时返回原始配置，避免破坏整个配置
  }
}
