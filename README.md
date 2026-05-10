# Clash Party Smart 覆写

这个仓库用于长期维护 Clash Party 的 Smart 内核 JS 覆写脚本。

## 目录结构

- `overrides/clash-party-region-business-override.js`
  当前主覆写脚本
- `archive/`
  历史版本、临时备份、回滚文件存放目录

## 当前主覆写能力

- 接管订阅原始 `proxy-groups`、`rules`、`rule-providers`
- 保留 6 个地区组：
  - `🇭🇰香港节点`
  - `🇹🇼台湾节点`
  - `🇯🇵日本节点`
  - `🇰🇷韩国节点`
  - `🇺🇸美国节点`
  - `🇸🇬狮城节点`
- 保留 7 个业务组：
  - `🤖 AI 服务`
  - `📧 邮件服务`
  - `💬 即时通讯`
  - `📱 社交媒体`
  - `🏠 国内网站`
  - `🌐 国外网站`
  - `🐟 漏网之鱼`
- 节点过滤、地区分类、全局参数补齐、TUN 排除、TLS 指纹注入
- 规则尾部保护层：
  - `ChinaMax`
  - `GEOIP,CN,🏠 国内网站,no-resolve`
  - `Global`
  - 本地/保留地址 `DIRECT`
  - `GEOIP,CN,DIRECT,no-resolve`
  - `MATCH,🐟 漏网之鱼`

## 使用方式

1. 打开 `overrides/clash-party-region-business-override.js`
2. 复制全部内容到 Clash Party 的 `JS 覆写`
3. 保持：
   - `mihomo-smart` 内核开启
   - `自动 Smart 规则覆写` 关闭

## 维护建议

- 每次大改前，把旧版本复制到 `archive/`
- 每次改完先做一次本地语法检查再提交
- 提交信息尽量写清楚，例如：
  - `feat: 补充 TUN 排除与指纹策略`
  - `fix: 调整 GEOIP CN 兜底顺序`
  - `refactor: 优化地区分类规则`
