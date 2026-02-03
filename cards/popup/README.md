# 弹出卡片组件使用指南

本组件为 Vue 弹层组件，风格与 1x1/1x2 卡片一致。

## 使用方法

1. 在 `index_new.html` 中已引入：
   - `cards/popup/css/popup-card.css`
   - `cards/popup/js/popup-component.js`

2. 首页 Vue 应用已注册为 `card-popup`，可直接在模板中使用。

3. 示例：

```html
<card-popup v-model="showPopup" title="设备详情" @close="onPopupClose">
    <p>这里是弹层内容</p>
</card-popup>
```

## Props 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| modelValue | Boolean | false | 是否显示（v-model 绑定） |
| title | String | '提示' | 标题 |
| showClose | Boolean | true | 是否显示关闭按钮 |
| closeOnMask | Boolean | true | 点击遮罩是否关闭 |

## 事件说明

- **update:modelValue**：v-model 更新时触发
- **close**：关闭时触发（点击遮罩或关闭按钮）

## 文件结构

```
cards/popup/
├── css/
│   └── popup-card.css    # 样式（与 1x1/1x2 玻璃态一致）
├── html/
│   └── popup-card.html   # 结构参考
├── js/
│   └── popup-component.js # Vue 组件
└── README.md
```

## 依赖

- Vue 3.x
- 样式与页面主背景（紫蓝渐变）及现有卡片风格一致
