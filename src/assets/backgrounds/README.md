# 背景主题库

本文件夹包含各种动态背景主题，可以应用到主页面。

## 如何使用

### 方法一：直接嵌入（推荐）

将背景 HTML 文件的内容直接嵌入到 `ha-panel.html` 中：

1. 打开想要使用的背景文件
2. 复制 `<style>` 标签内的所有 CSS
3. 复制 `<body>` 内的所有元素
4. 粘贴到 `ha-panel.html` 的对应位置

### 方法二：使用 iframe（简单）

1. 在 `ha-panel.html` 中添加 iframe 元素作为背景层：

```html
<iframe src="backgrounds/blue-gradient-waves.html" class="background-iframe"></iframe>
```

2. 添加对应的 CSS：

```css
.background-iframe {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: none;
    z-index: -1;
    pointer-events: none;
}
```

## 可用背景主题

### 1. blue-gradient-waves.html - 蓝色渐变波浪
- 描述：优雅的蓝色渐变背景，带有波浪动画
- 风格：清新、现代
- 性能：高（CSS 动画）

### 2. particle-network.html - 粒子网络
- 描述：动态粒子网络，粒子之间有连接线
- 风格：科技感、未来感
- 性能：中等（Canvas 渲染）

### 3. aurora-borealis.html - 极光效果
- 描述：绚丽的极光动画，带有星空
- 风格：梦幻、壮观
- 性能：中等（CSS 动画）

### 4. starfield.html - 星空闪烁
- 描述：星空背景，带有流星和星云
- 风格：浪漫、神秘
- 性能：高（轻量级动画）

## 自定义背景

您可以创建自己的背景 HTML 文件，遵循以下规范：

1. 文件命名：`<主题名称>.html`
2. 包含完整的 HTML 结构
3. 背景元素使用 `position: fixed` 或 `absolute`
4. 确保不会干扰主页面内容的显示
5. 添加 `overflow: hidden` 防止滚动条

## 性能建议

- 移动设备推荐：`blue-gradient-waves.html` 或 `starfield.html`
- 桌面设备推荐：`aurora-borealis.html` 或 `particle-network.html`
- 低端设备：选择纯 CSS 动画的背景
- 高端设备：可以使用 Canvas 或 WebGL 背景

## 切换背景

修改 `ha-panel.html` 中的 `background` CSS 即可切换到纯色背景。
