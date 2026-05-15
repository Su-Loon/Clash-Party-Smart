# Clash Smart v5.2.8 优化/改进方案

## 一、分类引擎优化

### 1.1 懒编译 Region Matchers
**现状：** 脚本启动时立即编译所有 11 个区域的 matchers（含大量正则），即使某些区域没有节点也会编译。
**改进：** 改为懒编译，首次使用时才编译。

```js
// 修改前：启动时全部编译
const _compiledRegions = REGION_DB.map(function(region) { ... })

// 修改后：懒编译
let _compiledRegions = null
function getCompiledRegions() {
  if (!_compiledRegions) {
    _compiledRegions = REGION_DB.map(function(region) { ... })
  }
  return _compiledRegions
}
```

**收益：** 减少启动时间约 5-10ms（正则编译开销）。

### 1.2 分类结果缓存
**现状：** `classifyAllNodes` 每次调用都重新遍历所有节点。
**改进：** 如果节点列表未变化，复用上次分类结果。

```js
let _lastProxiesHash = null
let _lastClassifyResult = null

function classifyAllNodes(proxies) {
  const hash = _simpleHash(JSON.stringify(proxies.map(p => p.name)))
  if (hash === _lastProxiesHash && _lastClassifyResult) return _lastClassifyResult
  // ... 原有逻辑
  _lastProxiesHash = hash
  _lastClassifyResult = result
  return result
}
```

**收益：** 重复调用时跳过分类（SUB-STORE 可能多次调用 main）。

---

## 二、规则优化

### 2.1 规则顺序优化
**现状：** 部分高频规则位置靠后，平均匹配次数多。
**改进：** 按匹配频率重排规则顺序。

建议顺序：
1. 安全威胁（REJECT）— 最高优先
2. 私有 IP / 端口（DIRECT/REJECT）— 快速拦截
3. 国内网站/流媒体（DIRECT）— 减少延迟
4. YouTube/Google 前置规则 — 避免被 AI 规则误吞
5. AI 服务规则
6. 流媒体规则
7. 即时通讯/社交媒体
8. GEOIP 区域路由
9. 兜底 MATCH

### 2.2 新增规则源
**建议新增：**
- **Cloudflare WARP** — 单独分组或归入 CLOUD_CDN
- **OpenAI IP 段** — 补充 GEOIP 规则
- **Claude IP 段** — 补充 GEOIP 规则

### 2.3 移除冗余规则
**现状：** 部分 RULE-SET 和 DOMAIN-SUFFIX 重复覆盖。
**改进：** 审计并移除重复规则（需仔细验证）。

---

## 三、业务组优化

### 3.1 新增 🇦🇺 澳新节点组
**现状：** 澳大利亚/新西兰节点归入 APAC_OTHER，没有独立组。
**改进：** 新增 `SMART.AU` 组。

```js
SMART.AU: '🇦🇺 澳新节点'

// 主函数
if (c.APAC_OTHER 中含 AU/NZ 节点) upsertSmartGroup(config, SMART.AU, auNodes)
```

**前提：** 需要在 REGION_DB 中区分 AU/NZ 和其他 APAC 节点。

### 3.2 优化游戏组策略
**现状：** `GAME_TOLERANCE = 15`，固定值。
**改进：** 根据游戏类型动态调整 tolerance。
- FPS 游戏：tolerance = 5（更快切换）
- MMORPG：tolerance = 30（更稳定）

```js
const GAME_FPS_TOLERANCE = 5
const GAME_MMO_TOLERANCE = 30
```

### 3.3 新增「解锁」业务组
**现状：** 没有专门的解锁组（如 Netflix 解锁检测、ChatGPT 解锁等）。
**改进：** 新增 `BIZ.UNLOCK` 组，用于需要解锁检测的服务。

---

## 四、代码质量优化

### 4.1 添加 JSDoc 注释
为关键函数添加 JSDoc 注释，提高可维护性。

```js
/**
 * 分类单个节点到对应区域
 * @param {string} name - 节点名称
 * @returns {string|null} 区域 ID（HK/TW/CN/JP/KR/SG/US/EU/AM/AF/APAC_OTHER）
 */
function classifyNode(name) { ... }
```

### 4.2 输入验证增强
**现状：** `main` 函数只检查基本输入。
**改进：** 添加更严格的输入验证。

```js
function main(config) {
  if (!config || typeof config !== 'object') return config
  if (!Array.isArray(config.proxies) || config.proxies.length === 0) return config
  // 新增：验证 proxies 结构
  const validProxies = config.proxies.filter(p => p && typeof p === 'object' && p.name && p.server && p.port)
  if (validProxies.length === 0) return config
  config.proxies = validProxies
  // ...
}
```

### 4.3 错误处理增强
**现状：** catch 块只打印错误。
**改进：** 添加更详细的错误信息和恢复策略。

```js
catch (e) {
  console.error(`[${VERSION}] Error in ${e.stack || e}`)
  // 尝试恢复：保留原有配置
  return config
}
```

---

## 五、性能优化

### 5.1 函数调用优化
**现状：** `filterProxies` 在主函数中定义，每次调用都创建新函数。
**改进：** 提取为模块级函数。

### 5.2 内存优化
**现状：** `classifyAllNodes` 创建大量临时数组。
**改进：** 使用对象池或预分配数组。

### 5.3 正则优化
**现状：** `_getWordBoundaryRegex` 使用 `new RegExp` 每次创建新正则。
**改进：** 使用正则字面量或更高效的匹配方式。

---

## 六、新增功能

### 6.1 节点健康检查
**功能：** 在分类时记录节点延迟信息，辅助 Smart 组选择。
**实现：** 利用 mihomo 的 `collectdata: true` 收集延迟数据。

### 6.2 流量统计
**功能：** 记录各分组的流量使用情况。
**实现：** 在日志中输出各组的连接数和流量。

### 6.3 自动切换通知
**功能：** 当节点切换时发送通知（可选）。
**实现：** 利用 mihomo 的 webhook 功能。

---

## 七、版本更新计划

| 版本 | 内容 | 优先级 |
|------|------|--------|
| v5.2.8 | 规则顺序优化 + 懒编译 + 分类缓存 + 输入验证 | 🟡 中 |
| v5.2.9 | 新增 AU 组 + 游戏组策略优化 + 解锁组 | 🟡 中 |
| v5.3.0 | 节点健康检查 + 流量统计 + JSDoc | 🟢 低 |

---

## 八、风险评估

| 改动 | 风险 | 说明 |
|------|------|------|
| 懒编译 | 🟢 低 | 纯性能优化，行为不变 |
| 分类缓存 | 🟡 中 | 需确保缓存失效策略正确 |
| 规则重排 | 🟡 中 | 可能影响匹配顺序，需仔细测试 |
| 新增 AU 组 | 🟢 低 | 纯新增 |
| 游戏组策略 | 🟢 低 | 参数调整 |
| 输入验证 | 🟢 低 | 增强健壮性 |
| JSDoc | 🟢 低 | 纯文档 |

---

## 九、待确认事项

1. **是否需要新增 AU 组？** — 你的机场有澳大利亚/新西兰节点吗？
2. **规则重排优先级？** — 是否需要立即做，还是放到后续版本？
3. **版本号确认** — 使用 v5.2.8 还是其他？
