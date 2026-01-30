# 智慧家庭控制中心

基于 Vue 3 和 Home Assistant 的智能家居控制面板,提供直观的设备控制和状态监控功能。

## 功能特性

- **设备控制**: 支持多种智能设备的开关控制和状态查询
  - 灯光控制(主卧、餐厅、厨房、次卧等)
  - 空调控制
  - 扫地机器人控制
  - 宠物喂食器控制
  - 热水器控制

- **状态监控**: 实时显示设备状态和环境数据
  - 天气信息
  - 设备运行状态
  - 定时器状态

- **3D模型展示**: 集成 Three.js 实现设备 3D 模型展示

- **响应式设计**: 专为移动端优化

- **流畅动画**: 使用优化的缓动函数实现平滑过渡效果

## 项目结构

```
.
├── config/                   # 配置文件目录
│   ├── ha-config.js          # Home Assistant配置
│   └── ha-device-config.js   # 设备配置
├── ha-panel.html           # 主页面文件(包含HTML、CSS)
├── ha-logic.js             # Vue应用逻辑
├── ha-custom-settings.html # 自定义设置页面
├── ha-3d-model-card.html   # 3D模型卡片
├── index.css               # 额外样式
├── vue.global.js           # Vue 3框架
├── vant.min.js             # Vant UI组件库
├── three.min.js            # Three.js 3D库
└── backgrounds/            # 背景文件目录
```

## 配置说明

在首次使用前,请先完成以下配置:

### Home Assistant 配置

在 `config/ha-config.js` 中配置你的 Home Assistant 连接信息:

```javascript
const HA_CONFIG = {
    url: 'http://your-homeassistant-ip:8123',
    token: 'your-long-lived-access-token'
};
```

### 设备配置

在 `config/ha-device-config.js` 中配置各设备的实体ID和名称。

## 安装教程

### 方法一: 直接访问

1. 将本目录所有文件复制到任意可访问的目录
2. 在浏览器中打开 `ha-panel.html` 即可使用

### 方法二: 集成到 Home Assistant(推荐)

1. 将本目录所有文件复制到 Home Assistant 的 `www` 文件夹内,或新建一个子文件夹(如 `www/smart-home-panel/`)
2. 登录 Home Assistant
3. 在仪表盘中添加"网页"卡片
4. 地址填入访问路径,如 `/local/smart-home-panel/ha-panel.html`
5. 保存并使用

## 故障排除

### 解决 CORS 跨域问题

如果连接失败,可能是 CORS 跨域限制。请在 Home Assistant 的 `configuration.yaml` 中添加:

```yaml
http:
  cors_allowed_origins:
    - "http://localhost:*"
    - "http://127.0.0.1:*"
    - "http://192.168.*:*"
```

**操作步骤:**

1. 在 Home Assistant 服务器上找到 `configuration.yaml` 文件
2. 添加上述配置(如果没有 http 部分则新增)
3. 重启 Home Assistant 服务
4. 重新打开此页面测试连接

> **注意**: 本项目专为移动端优化,未适配桌面端显示,建议在移动设备或手机浏览器中使用。

## 依赖库

- Vue 3 (vue.global.js)
- Vant (vant.min.js)
- Three.js (three.min.js)

## 浏览器兼容性

支持现代浏览器(Chrome、Firefox、Safari、Edge等)
