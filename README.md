# Clash Party Smart 覆写配置

## 项目说明

本项目提供 Clash Party 的 Smart 内核覆写配置，自动优化代理组选择策略。

### 文件说明

| 文件 | 说明 |
|------|------|
| `Smart Core Override.js` | Smart 内核覆写脚本，自动将 url-test/load-balance 转换为 smart 类型 |
| `添加直连规则.yaml` | 自定义直连规则覆写 |
| `.github/workflows/sync.yml` | GitHub Actions 自动同步工作流 |

## 使用方法

### 方式一：通过 URL 订阅

在 Clash Party 中添加以下 URL：
```
https://raw.githubusercontent.com/Su-Loon/Clash-Party-Smart/main/Smart%20Core%20Override.js
```

### 方式二：手动导入

1. 下载 `Smart Core Override.js` 文件
2. 在 Clash Party 中打开「覆写配置」
3. 选择「从文件导入」或「粘贴代码」

## 功能特性

- 🔄 自动转换代理组类型为 Smart
- 🏋️ 智能节点优先级排序
- 📊 LightGBM 机器学习优化
- 🔄 Sticky Sessions 会话保持
- ⚡ 自动失败节点冷却

## 自定义配置

编辑 `Smart Core Override.js` 中的 `policy-priority` 可调整节点优先级：

```javascript
group['policy-priority'] = [
  '(?i)hk|hongkong|香港|沪|深',     // 香港节点最高
  '(?i)jp|japan|日本',               // 日本节点次高
  '(?i)us|usa|america|美国',         // 美国节点
  '(?i)sg|singapore|新加坡',         // 新加坡节点
].join('|')
```

## License

GPL-3.0
