# 智能家居控制面板

基于 Home Assistant 的智能家居控制面板，支持灯光、开关、空调、扫地机器人、宠物投喂器等多种设备控制。

## 部署方法

### 方式一：Home Assistant 部署（推荐）

1. **复制文件到 HA 的 www 目录**

   将项目所有文件复制到 Home Assistant 的 `/config/www/webui/` 目录下：
   ```
   /config/www/webui/
   ├── index.html
   ├── index.css
   ├── index.js
   ├── manifest.json
   ├── sw.js
   ├── app/
   ├── cards/
   ├── config/
   ├── pages/
   ├── libs/
   └── backgrounds/
   ```

2. **访问控制面板**

   打开浏览器访问：
   ```
   http://HA地址:8123/local/webui/index.html
   ```

### 方式二：独立服务器部署

1. **安装任意 Web 服务器**（如 Nginx、Apache）

2. **将项目文件复制到网站根目录**

3. **访问服务器地址即可**

### 方式三：本地测试

使用 Python 临时服务器：
```bash
cd 项目目录
python -m http.server 8000
```
然后访问 `http://localhost:8000`

---
可以在ha里创建一个网页仪表盘把地址填进去，这样就可以完美的嵌入到ha仪表盘里了，

## 使用方法

### 一、配置 Home Assistant 连接

编辑 `config/config.js` 文件，修改 HA 配置：

```javascript
homeAssistant: {
    // HA 服务器地址
    url: 'http://192.168.4.5:8123',
    
    // HA 访问令牌（在HA用户资料中创建）
    token: '你的长访问令牌',
    
    // 是否启用 HA 连接
    enabled: true
}
```

**获取访问令牌步骤：**
1. 登录 Home Assistant
2. 点击左下角用户头像
3. 滚动到底部，点击"创建令牌"
4. 复制生成的长字符串

---

### 二、配置设备

所有设备配置在 `config/device_config.js` 文件中。

#### 1. 添加新设备

在 `DEVICE_CARDS` 数组中添加设备配置对象：

```javascript
// 示例：添加一个新的灯
const DEVICE_NEW_LIGHT = {
    name: '新灯名称',           // 显示名称
    icon: '💡',                // 图标（emoji）
    stateEntity: 'light.new_light_entity',  // 状态实体ID
    controlEntity: 'light.new_light_entity', // 控制实体ID
    deviceType: 'light',        // 设备类型
    description: '新灯描述'     // 描述
};

// 添加到设备列表
const DEVICE_CARDS = [
    // ... 其他设备
    DEVICE_NEW_LIGHT  // 添加在这里
];
```

#### 2. 设备类型说明

| 设备类型 | 说明 | 示例实体 |
|---------|------|---------|
| `light` | 灯光设备 | `light.living_room` |
| `switch` | 开关设备 | `switch.water_heater` |
| `climate` | 空调/温控 | `climate.bedroom_ac` |
| `vacuum` | 扫地机器人 | `vacuum.robot` |
| `feeder` | 宠物投喂器 | `number.pet_feeder` |
| `url` | URL链接（如3D打印机） | - |
| `display` | 仅显示（如温度传感器） | `sensor.temperature` |

#### 3. 获取实体ID

在 Home Assistant 中：
1. 进入"开发者工具" → "状态"
2. 找到要控制的设备
3. 复制实体ID（如 `light.living_room`）

#### 4. 删除设备

从 `DEVICE_CARDS` 数组中删除对应的设备配置对象即可。

#### 5. 调整设备顺序

`DEVICE_CARDS` 数组中的顺序就是页面显示的顺序，直接调整数组中的位置即可。

---

### 三、配置状态栏设备

页面顶部的状态栏显示在 `STATUS_CONFIGS` 中配置：

```javascript
const STATUS_CONFIGS = {
    vacuum: STATUS_VACUUM,
    ambientLight: STATUS_AMBIENT_LIGHT,
    petFeeding: STATUS_PET_FEEDING
    // 添加新的状态栏设备
};
```

---

### 四、自定义界面

#### 修改页眉标题

编辑 `config/config.js`：
```javascript
headerbar: {
    title: '我的智能家居',  // 修改这里
    showTitle: true
}
```

#### 修改天气城市

```javascript
weather: {
    enabled: true,
    city: '北京'  // 修改城市
}
```

#### 修改背景主题

```javascript
backgroundThemes: {
    current: 'aurora-borealis'  // 可选：default, aurora-borealis, blue-gradient-waves, particle-network, starfield
}
```

---

### 五、使用技巧

1. **拖拽排序**：在桌面端可以拖拽设备卡片调整顺序（移动端已禁用）
2. **详细控制**：带金色切角的卡片点击切角可打开详细控制面板
3. **离线查看**：Service Worker 缓存支持离线查看最后状态
4. **添加到主屏幕**：在浏览器菜单中选择"添加到主屏幕"可像 APP 一样使用

---

## 常见问题

### Q: 设备状态显示"不可用"
A: 检查实体ID是否正确，HA连接是否正常

### Q: 控制设备没反应
A: 检查访问令牌是否有权限控制该设备

### Q: 页面加载慢
A: 已优化批量请求和缓存，首次加载后速度会提升

### Q: 如何更新设备列表
A: 修改 `device_config.js` 后刷新页面即可生效

---

## 文件结构

```
├── index.html          # 入口页面
├── index.css           # 全局样式
├── index.js            # 主逻辑
├── config/
│   ├── config.js       # 应用配置
│   └── device_config.js # 设备配置
├── app/
│   ├── ha-connection.js    # HA连接
│   ├── state-manager.js    # 状态管理
│   ├── websocket-manager.js # WebSocket
│   └── device-controller.js # 设备控制
├── cards/              # 卡片组件
├── pages/              # 页面
└── libs/               # 第三方库
```
