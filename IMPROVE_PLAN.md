# Clash Smart v5.2.7 优化/改进方案

## 一、分类引擎优化

### 1.1 新增 🇸🇬 新加坡独立 Smart 组
**现状：** `classifyAllNodes` 会分类 SG 节点，但没有创建对应 Smart 组，SG 节点只能通过 APAC 组访问。
**改进：** 新增 `SMART.SG`，与其他区域组保持一致。

```js
// 常量
SMART.SG: '🇸🇬 新加坡节点'

// 主函数中新增
if (c.SG.length > 0) upsertSmartGroup(config, SMART.SG, c.SG)
```

### 1.2 统一 fallback 策略
**现状：** HK/TW 有 fallback（→ apacNodes → ALL），JP/KR/US/EU/AF 无 fallback，不一致。
**改进：** 统一为无 fallback，空区域不建组。

```js
// 修改前
upsertSmartGroup(config, SMART.HK, c.HK.length > 0 ? c.HK : apacNodes.length > 0 ? apacNodes : c.ALL)
upsertSmartGroup(config, SMART.TW, c.TW.length > 0 ? c.TW : apacNodes.length > 0 ? apacNodes : c.ALL)

// 修改后
if (c.HK.length > 0) upsertSmartGroup(config, SMART.HK, c.HK)
if (c.TW.length > 0) upsertSmartGroup(config, SMART.TW, c.TW)
```

### 1.3 UNCLASSIFIED 节点归入 GLOBAL
**现状：** 无法分类的节点只进入 `c.ALL`，不进入任何区域组。
**改进：** UNCLASSIFIED 节点自动归入 GLOBAL 组（已在 c.ALL 中，无需额外处理，但可在日志中提示）。

---

## 二、业务组优化

### 2.1 修正 SEA_PROXIES
**现状：** `SEA_PROXIES = [SMART.APAC, SMART.GLOBAL, SMART.HK, SMART.JP, SMART.KR, SMART.US, 'DIRECT']`
东南亚流媒体组包含 US 节点，逻辑不合理。
**改进：** 移除 US，加入 SG。

```js
// 修改前
const SEA_PROXIES = [SMART.APAC, SMART.GLOBAL, SMART.HK, SMART.JP, SMART.KR, SMART.US, 'DIRECT']

// 修改后
const SEA_PROXIES = [SMART.APAC, SMART.GLOBAL, SMART.HK, SMART.SG, SMART.JP, SMART.KR, 'DIRECT']
```

### 2.2 优化 STANDARD_PROXIES 和 DIRECT_FIRST_PROXIES
**改进：** 加入 SMART.SG。

```js
// 修改后
const STANDARD_PROXIES = [SMART.GLOBAL, SMART.HK, SMART.TW, SMART.JP, SMART.KR, SMART.APAC, SMART.SG, SMART.US, SMART.EU, SMART.AMERICAS, SMART.AFRICA, 'DIRECT']
const DIRECT_FIRST_PROXIES = ['DIRECT', SMART.GLOBAL, SMART.HK, SMART.TW, SMART.JP, SMART.KR, SMART.APAC, SMART.SG, SMART.US, SMART.EU, SMART.AMERICAS, SMART.AFRICA]
```

### 2.3 Smart 组参数常量化
**现状：** `interval: 120`, `tolerance: 30` 硬编码在 `upsertSmartGroup` 中。
**改进：** 提取为命名常量。

```js
const SMART_INTERVAL = 120      // Smart 组数据收集间隔（秒）
const SMART_TOLERANCE = 30      // Smart 组切换容忍度（秒）

function upsertSmartGroup(config, name, proxies) {
  var group = {
    name: name, type: 'smart', uselightgbm: true, collectdata: false,
    strategy: 'sticky-sessions', interval: SMART_INTERVAL, tolerance: SMART_TOLERANCE,
    proxies: proxies.slice()
  }
  // ...
}
```

---

## 三、代码质量优化

### 3.1 更新过时注释
- 版本号注释更新为 v5.2.7
- 移除已不存在的 `ckrvxr` 相关注释
- 更新 `CHANGELOG.md` 引用

### 3.2 统一 fallback 注释风格
为每个 Smart 组添加统一格式的 fallback 说明注释。

### 3.3 移除冗余变量
`jpkrNodes` 变量已不再使用（JP/KR 独立建组后），可移除。

```js
// 删除
var jpkrNodes = c.JP.concat(c.KR)
```

---

## 四、规则优化

### 4.1 规则顺序优化
**建议：** 将高频匹配规则前置，减少平均匹配次数。
- YouTube 域名规则已前置 ✅
- AI 服务规则可适当聚合并前置

### 4.2 dead rule-providers 清理
**现状：** 部分 rule-providers 可能已失效（如 BBC.yaml、Snap.yaml 的 USER-AGENT 规则）。
**建议：** 保留但标注为已知 warning，不影响功能。

---

## 五、版本更新计划

| 版本 | 内容 |
|------|------|
| v5.2.7 | 新增 SG 组、统一 fallback、修正 SEA_PROXIES、常量化参数、清理冗余 |
| v5.2.8 | （预留）规则顺序优化、性能调优 |

---

## 六、风险评估

| 改动 | 风险 | 说明 |
|------|------|------|
| 新增 SG 组 | 🟢 低 | 纯新增，不影响现有逻辑 |
| 移除 HK/TW fallback | 🟡 中 | 如果用户没有 HK/TW 节点，组会消失（之前会降级到 APAC/ALL） |
| 修正 SEA_PROXIES | 🟢 低 | 移除不合理的 US 节点 |
| 常量化参数 | 🟢 低 | 纯重构，行为不变 |
| 移除 jpkrNodes | 🟢 低 | 死代码清理 |

---

## 七、待确认事项

1. **HK/TW fallback 移除**：你是否有 HK/TW 节点缺失的情况？如果有，保留 fallback 可能更安全。
2. **SG 组是否需要独立**：你的机场订阅有新加坡节点吗？
3. **版本号**：确认使用 v5.2.7 还是其他版本号？
