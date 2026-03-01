# AppDaemon 配置存储模块

## 部署说明

### 1. 创建应用文件

在 HA 文件编辑器中：
1. 导航到 `/config/appdaemon/apps/`
2. 创建新文件 `config_storage.py`
3. 复制 `config_storage.py` 的内容粘贴进去
4. 保存（Ctrl + S）

### 2. 注册应用

编辑 `/config/appdaemon/apps.yaml`，添加：

```yaml
config_storage:
  module: config_storage
  class: ConfigStorage
```

### 3. 验证运行

查看 AppDaemon 日志，应该看到：

```
==================================================
Config Storage Module Init
==================================================
Data loaded from /config/appdaemon/panel_config.json
Loaded X config items
==================================================
Config Storage Module Ready
==================================================
```

## 可用服务

### appdaemon.panel_save_config
保存配置

参数：
- `key`: 配置键名（必需）
- `value`: 配置值（必需）

### appdaemon.panel_load_config
加载配置

参数：
- `key`: 配置键名（必需）

### appdaemon.panel_get_all_configs
获取所有配置

无需参数

### appdaemon.panel_delete_config
删除配置

参数：
- `key`: 配置键名（必需）

## 测试

### 保存配置

在 HA 开发者工具中调用：

服务：`appdaemon.panel_save_config`

服务数据：
```json
{
  "key": "test_config",
  "value": {"name": "测试", "value": 123}
}
```

### 加载配置

服务：`appdaemon.panel_load_config`

服务数据：
```json
{
  "key": "test_config"
}
```

### 获取所有配置

服务：`appdaemon.panel_get_all_configs`

无需参数

### 删除配置

服务：`appdaemon.panel_delete_config`

服务数据：
```json
{
  "key": "test_config"
}
```

## 前端调用示例

```javascript
// 保存配置
await window.haConnection.callService('appdaemon', 'panel_save_config', {
    key: 'user_theme',
    value: JSON.stringify({
        color: 'blue',
        opacity: 0.8
    })
});

// 加载配置
const result = await window.haConnection.callService('appdaemon', 'panel_load_config', {
    key: 'user_theme'
});
const theme = JSON.parse(result.value);

// 获取所有配置
const all = await window.haConnection.callService('appdaemon', 'panel_get_all_configs', {});

// 删除配置
await window.haConnection.callService('appdaemon', 'panel_delete_config', {
    key: 'user_theme'
});
```
