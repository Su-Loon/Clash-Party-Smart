# Clash Smart 分流规则

基于 Clash Meta (mihomo) 的智能分流规则脚本，支持 SUB-STORE 多机场融合。

## 版本信息

- **当前版本**: v5.2.7
- **更新日期**: 2026-05-15

## 功能特性

- 11 个 Smart 区域节点组
- 20 个业务策略组
- 373+ rule-providers 服务覆盖
- SUB-STORE 多机场融合支持
- 优化的 Provider 刷新策略（模运算回绕）
- 随机 CDN 选择（避免单 CDN 故障）
- 游戏组快速切换（GAME_TOLERANCE）
- JSON 统计输出

## 代理组

### Smart 区域节点组

| 分组 | 用途 | Fallback 顺序 |
|------|------|--------------|
| 🌍 全球节点 | 所有节点 | GLOBAL → DIRECT |
| 🇭🇰 香港节点 | 香港节点 | HK → APAC → GLOBAL → DIRECT |
| 🇹🇼 台湾节点 | 台湾节点 | TW → APAC → GLOBAL → DIRECT |
| 🇯🇵 日本节点 | 日本节点 | JP → KR → JPKR → APAC → GLOBAL → DIRECT |
| 🇰🇷 韩国节点 | 韩国节点 | KR → JP → JPKR → APAC → GLOBAL → DIRECT |
| 🌏 亚太节点 | 亚太地区节点 | APAC → GLOBAL → DIRECT |
| 🇸🇬 新加坡节点 | 新加坡节点 | 仅新加坡节点（无 fallback） |
| 🇺🇸 美国节点 | 美国节点 | 仅美国节点（无 fallback） |
| 🇪🇺 欧洲节点 | 欧洲节点 | EU → GLOBAL → DIRECT |
| 🌎 美洲节点 | 美洲节点 | AMERICAS → GLOBAL → DIRECT |
| 🌍 非洲节点 | 非洲节点 | AFRICA → GLOBAL → DIRECT |

### 业务策略组

| 分组 | 用途 | 备用代理 |
|------|------|----------|
| 🤖 AI 服务 | OpenAI, Claude, Gemini 等国际 AI 服务 | STANDARD_PROXIES |
| 🇨🇳 国内AI | 百度文心、阿里通义、讯飞星火等国内 AI 服务 | DIRECT_FIRST_PROXIES |
| 📧 邮件服务 | Gmail, Outlook 等邮件服务 | STANDARD_PROXIES |
| 💬 即时通讯 | Telegram, Discord, WhatsApp 等 | STANDARD_PROXIES |
| 📱 社交媒体 | Twitter, Facebook, Instagram 等 | STANDARD_PROXIES |
| 📺 国内流媒体 | 爱奇艺、优酷、腾讯视频等 | DIRECT_FIRST_PROXIES |
| 📺 东南亚流媒体 | Viu, WeTV 等 | SEA_PROXIES |
| 🇺🇸 美国流媒体 | Netflix, YouTube, Disney+ 等 | STANDARD_PROXIES |
| 🇭🇰 香港流媒体 | TVB, ViuTV 等 | STANDARD_PROXIES |
| 🇹🇼 台湾流媒体 | KKTV, 巴哈姆特等 | STANDARD_PROXIES |
| 🇯🇵 日本流媒体 | Abema, DMM, niconico 等 | STANDARD_PROXIES |
| 🇰🇷 韩国流媒体 | wavve, tving, Naver TV 等 | STANDARD_PROXIES |
| 🇪🇺 欧洲流媒体 | BBC, RTL, ARD 等 | STANDARD_PROXIES |
| 🕹️ 国内游戏 | 國服游戏 | DIRECT_FIRST_PROXIES |
| 🎮 国外游戏 | Steam, PlayStation 等 | STANDARD_PROXIES |
| ☁️ 云与CDN | AWS, Cloudflare, Akamai 等 | STANDARD_PROXIES |
| 🏠 国内网站 | 淘宝、京东、知乎等国内网站 | DIRECT_FIRST_PROXIES |
| 🚫 受限网站 | 被 GFW 封锁的网站 | STANDARD_PROXIES |
| 🌐 国外网站 | 普通国外网站 | STANDARD_PROXIES |
| 🐟 漏网之鱼 | 默认兜底组 | STANDARD_PROXIES |

## 规则覆盖

### AI 服务
- **国际 AI**: OpenAI, Claude, Gemini, Copilot, Perplexity, Midjourney, Cursor, Suno, Civitai 等
- **国内 AI**: 百度文心、阿里通义千问、讯飞星火、字节豆包、Moonshot、Kimi 等

### 流媒体服务
- **美国**: Netflix, YouTube, Disney+, HBO, Amazon Prime, Hulu, Spotify 等
- **日本**: AbemaTV, DMM, niconico, TVER, FOD, Radiko 等
- **韩国**: wavve, tving, Watcha, Naver TV, Coupang Play 等
- **欧洲**: BBC iPlayer, RTL+, ARD/ZDF Mediathek 等
- **东南亚**: Viu, WeTV, iQIYI Intl 等

### 即时通讯
- Telegram, Discord, WhatsApp, Line, KakaoTalk 等

### 社交媒体
- Twitter/X, Facebook, Instagram, Reddit, Pinterest, LinkedIn, TikTok 等

### 云服务
- AWS, Azure, Google Cloud, Cloudflare, Akamai, Fastly, DigitalOcean 等

## 使用方法

### 1. 安装要求
- Clash Meta (mihomo) 内核
- 已启用 Smart 模式

### 2. 配置步骤
1. 在 SUB-STORE 中添加此脚本作为覆写脚本
2. 确保节点命名包含地区关键词（香港/HK、台湾/TW、日本/JP 等）
3. 刷新订阅获取最新配置

### 3. 节点命名规范
脚本根据节点名称中的关键词自动分类：

| 地区 | 关键词 |
|------|--------|
| 香港 | 香港, hong kong, hkg |
| 台湾 | 台湾, taiwan, taipei, tpe |
| 日本 | 日本, japan, tokyo, osaka, nrt, hnd |
| 韩国 | 韩国, korea, seoul, icn |
| 新加坡 | 新加坡, singapore, sin |
| 美国 | 美国, usa, los angeles, new york, lax, sfo, jfk |
| 欧洲 | 英国, 法国, 德国, london, paris, frankfurt |
| 亚太 | 亚太, apac, iplc, iepl, cn2, gia |
| 美洲 | 美洲, americas, 加拿大, 墨西哥, canada, mexico |

## 规则优先级

1. 安全威胁拦截 → REJECT
2. 私有 IP 直连 → DIRECT
3. 国内网站直连 → DIRECT
4. 国内流媒体直连 → DIRECT
5. 业务规则分流 → 对应代理组
6. GEOIP 区域路由 → 对应代理组
7. 默认兜底 → FINAL

## 更新日志

### v5.2.7 (2026-05-15)
- 新增 🇸🇬 新加坡独立 Smart 区域组
- 统一 fallback 策略：HK/TW 移除 fallback，与 JP/KR/US/EU/AF 一致
- 修正 SEA_PROXIES：移除 US 节点，加入 SG 节点
- Smart 组参数常量化（SMART_INTERVAL / SMART_TOLERANCE）
- STANDARD_PROXIES / DIRECT_FIRST_PROXIES 加入 SG
- 移除死代码 jpkrNodes 变量

### v5.2.6 (2026-05-15)
- 修复 US 分组误匹配问题（移除歧义关键词：圣地亚哥、san、sea）
- US 组移除 fallback 机制（没有美国节点时不再降级到美洲/全节点组）
- 避免智利圣地亚哥、东南亚等节点误入美国分组

### v5.2.5 (2026-05-15)
- 常量具名化（RP_BASE/RP_STEP → PROVIDER_BASE_INTERVAL_SEC/PROVIDER_STEP_SEC）
- nextInterval 模运算回绕（避免间隔无限增长）
- JP/KR 冗余三元判断简化
- bm7 CDN 奇偶轮替→随机选择（避免单 CDN 故障时一半 provider 全挂）
- 游戏组新增 GAME_TOLERANCE 常量（tolerance: 15，更快切换到更优节点）
- Done! 日志增加 JSON 统计输出
- 变量命名统一（_rpIdx/_bm7Idx → _rpIntervalIdx/_bm7CdnIdx）
- 移除 anti-ad 广告拦截规则（由系统或第三方工具管理）

### v5.2.4 (2026-05-10)
- 启用所有业务组
- 分离日韩流媒体为独立分组
- 新增中国大陆 AI 服务分组
- 修复 BIZ.GLOBAL undefined 错误

### v5.2.3 (2026-05-10)
- 移除部分业务分组（规则并入 GLOBAL/GFW/DIRECT 组）
- 广告拦截规则改为 DIRECT

### v5.2.2 (2026-05-10)
- 日韩节点拆分为独立分组
- PI.ai 移至 GFW 组

### v5.2.1
- 修复 jsdelivr CDN DNS 解析问题
- 删除已废弃的规则源

## 注意事项

1. 节点名称需要包含正确的地区关键词才能被正确分类
2. 部分规则源可能需要网络访问以下载规则文件
3. 中国大陆 AI 服务默认直连，国际 AI 服务走代理

## 许可证

MIT License
