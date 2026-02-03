# 1x2 卡片组件

2:1 比例的设备卡片组件。

## 功能特性

- Vue 3 组件架构
- 响应式布局，自动适配不同尺寸
- 支持两种布局：default（默认）和 icon-only（仅图标）
- 实时状态数据绑定
- 点击事件处理和设备控制
- 激活状态发光效果

## 使用方法

### 基础用法

```html
<card-1x2
    name="客厅灯"
    icon="💡"
    stateEntity="light.living_room"
    deviceType="light"
    layoutType="default">
</card-1x2>
```

### Props 配置

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|--------|----------|------|
| `name` | String | 否 | '设备名称' | 设备显示名称 |
| `icon` | String | 否 | '📱' | 卡片图标（emoji） |
| `stateEntity` | String | 是 | - | Home Assistant 实体 ID |
| `controlEntity` | String | 否 | - | 控制实体 ID（默认使用 stateEntity）|
| `deviceType` | String | 否 | 'switch' | 设备类型（switch、light、vacuum等）|
| `layoutType` | String | 否 | 'default' | 布局类型：'default' 或 'icon-only' |
| `description` | String | 否 | '' | 设备描述 |

### 布局类型

#### 默认布局 (default)
显示图标、名称和状态文字，适合一般设备卡片。

```html
<card-1x2
    name="空调"
    icon="❄️"
    stateEntity="climate.ac"
    deviceType="climate"
    layoutType="default">
</card-1x2>
```

#### 仅图标布局 (icon-only)
只显示图标，节省空间，适合设备较多的情况。

```html
<card-1x2
    name="扫地机"
    icon="🤖"
    stateEntity="vacuum.robot"
    deviceType="vacuum"
    layoutType="icon-only">
</card-1x2>
```

## 状态样式

- `on`: 已开启（红色文字 #ff4d4d，白色发光背景）
- `off`: 已关闭（半透明白色文字）
- `unavailable`: 不可用（红色文字 #f87171）
- `loading`: 加载中（黄色文字，呼吸动画）

## 响应式设计

卡片使用 CSS 容器查询（Container Queries）实现响应式缩放，根据卡片宽度自动调整：

- **小卡片**（< 240px）：较小文字和图标
- **中等卡片**（240px - 360px）：适中尺寸
- **大卡片**（360px - 500px）：较大文字和图标
- **超大卡片**（> 500px）：最大文字和图标

## 集成方式

### 1. 引入样式

```html
<link rel="stylesheet" href="cards/1x2/css/1x2-card.css">
```

### 2. 引入组件

```html
<script charset="UTF-8" src="cards/1x2/js/1x2-component.js"></script>
```

### 3. 注册组件

```javascript
const app = createApp({ /* ... */ });
app.component('card-1x2', window.Card1x2Component);
app.mount('#app');
```

## 全局应用集成

组件与全局应用对象交互：

```javascript
window.app = {
    // 获取设备状态
    async getDeviceState(entityId) {
        // 返回 'on' 或 'off'
        return 'on';
    },

    // 处理设备点击
    async handleDeviceClick(device) {
        console.log('点击设备:', device.name);
        // 执行设备控制逻辑
    },

    // 调用 Home Assistant 服务
    async callService(domain, service, data) {
        // 调用 HA 服务
    }
};
```

## 文件结构

```
cards/1x2/
├── js/
│   └── 1x2-component.js    # Vue 组件
├── css/
│   └── 1x2-card.css        # 样式文件
├── html/
│   └── 1x2-card.html        # HTML 模板
└── README.md                 # 使用文档
```

## 与 1x1 卡片的区别

| 特性 | 1x1 卡片 | 1x2 卡片 |
|------|-----------|-----------|
| 宽高比 | 1:1 | 2:1 |
| 默认尺寸 | 约占 1/3 网格 | 占 2/3 网格 |
| 适用场景 | 小图标按钮 | 大信息显示卡片 |
| 内容空间 | 较紧凑 | 更宽敞 |
