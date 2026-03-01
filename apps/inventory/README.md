# 库存应用

## 应用简介

库存应用是一个基于Grocy API的客户端应用，用于管理家庭库存、购物清单、食谱和任务。

## 功能特性

- 连接到Grocy服务器
- 查看和管理库存物品
- 管理购物清单
- 查看食谱列表
- 管理任务
- 响应式设计，适配移动端和桌面端

## 技术栈

- HTML5
- CSS3
- JavaScript
- Grocy API

## 目录结构

```
apps/inventory/
  index.html          # 应用入口文件
  assets/             # 资源文件
  js/                 # JavaScript文件
  css/                # 样式文件
  config/             # 应用配置
  README.md           # 应用说明文档
```

## 配置说明

### 服务器配置

在 `index.html` 文件中，需要配置以下参数：

```javascript
this.baseUrl = 'http://192.168.4.13:8080';  // Grocy服务器地址
this.apiKey = 'rt2zKUzNmpBbchT2ZUwszoXdILuKzPudthRPqbq9oWY621unaU';  // API Key
```

### API Key 获取

1. 登录Grocy
2. 进入设置 → API
3. 复制API Key

## 使用方法

1. 确保Grocy服务器已启动
2. 配置正确的服务器地址和API Key
3. 打开应用，等待连接到服务器
4. 使用侧边栏切换不同功能模块
5. 在库存模块查看和管理库存物品
6. 在购物清单模块添加和管理购物物品
7. 在食谱模块查看食谱列表
8. 在任务模块查看和管理任务

## 独立运行

直接打开 `index.html` 文件即可独立运行。

## 在容器中运行

在智能家居控制面板中，通过应用列表点击打开。

## 常见问题

### 连接失败

- 检查服务器地址是否正确
- 检查API Key是否正确
- 检查网络连接是否正常
- 检查Grocy服务器是否运行

### 数据加载失败

- 确保API Key有足够的权限
- 检查服务器是否正常响应
- 检查网络连接是否稳定

## 版本历史

- v1.0.0 - 初始版本，支持基本的库存管理、购物清单、食谱和任务管理功能