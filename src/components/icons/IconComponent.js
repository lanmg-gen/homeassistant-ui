/**
 * 可重用的SVG图标组件
 * 提供常用图标，包括+、-、空调模式图标等
 * 
 * 使用方法：
 * 1. 确保在HTML中引入icons.js和IconComponent.js
 * 2. 在Vue组件中注册：components: { 'icon-component': window.IconComponent }
 * 3. 在模板中使用：<icon-component name="plus" size="24" color="#4CAF50"/>
 * 
 * 属性说明：
 * - name: 图标名称，必填，支持的图标有：plus, minus, cool, heat, fan, dry, power, settings, close, refresh
 * - size: 图标大小，默认为"24"
 * - color: 图标颜色，默认为"currentColor"
 * - strokeWidth: 线条宽度，默认为"2"
 * - strokeLinecap: 线条端点样式，默认为"round"
 * - strokeLinejoin: 线条连接样式，默认为"round"
 * 
 * 示例：
 * <icon-component name="plus" size="20"/>
 * <icon-component name="cool" size="24" color="#2196F3"/>
 * <icon-component name="power" size="32" strokeWidth="3"/>
 */

if (!window.IconComponent) {
    window.IconComponent = {
        template: `
            <svg 
                :width="size" 
                :height="size" 
                viewBox="0 0 24 24" 
                fill="none" 
                :stroke="color" 
                :stroke-width="strokeWidth"
                :stroke-linecap="strokeLinecap"
                :stroke-linejoin="strokeLinejoin"
            >
                <!-- 加号图标 -->
                <template v-if="name === 'plus'">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </template>
                
                <!-- 减号图标 -->
                <template v-else-if="name === 'minus'">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </template>
                
                <!-- 空调模式图标 -->
                <template v-else-if="name === 'cool'">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 16h8"/>
                    <path d="M12 8v8"/>
                    <path d="M9 12l3 3 3-3"/>
                </template>
                
                <template v-else-if="name === 'heat'">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4"/>
                    <path d="M12 16h-4"/>
                    <path d="M16 16l-2-2-2 2-2-2"/>
                </template>
                
                <template v-else-if="name === 'fan'">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 4v2"/>
                    <path d="M12 18v2"/>
                    <path d="M4 12h2"/>
                    <path d="M18 12h2"/>
                    <path d="M7.07 7.07l1.41 1.41"/>
                    <path d="M15.54 15.54l1.41 1.41"/>
                    <path d="M7.07 16.93l1.41-1.41"/>
                    <path d="M15.54 8.46l1.41-1.41"/>
                </template>
                
                <template v-else-if="name === 'dry'">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4"/>
                    <path d="M12 16h4"/>
                    <path d="M8 16l2-2 2 2 2-2"/>
                    <path d="M12 4v2"/>
                </template>
                
                <!-- 其他常用图标 -->
                <template v-else-if="name === 'power'">
                    <path d="M12 2v20"/>
                    <path d="M17 5H9a7 7 0 1 0 0 14h8a7 7 0 0 0 0-14z"/>
                </template>
                
                <template v-else-if="name === 'settings'">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </template>
                
                <template v-else-if="name === 'close'">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </template>
                
                <template v-else-if="name === 'refresh'">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </template>
            </svg>
        `,
        props: {
            name: {
                type: String,
                required: true,
                validator: function(value) {
                    return ['plus', 'minus', 'cool', 'heat', 'fan', 'dry', 'power', 'settings', 'close', 'refresh'].includes(value);
                }
            },
            size: {
                type: String,
                default: '24'
            },
            color: {
                type: String,
                default: 'currentColor'
            },
            strokeWidth: {
                type: String,
                default: '2'
            },
            strokeLinecap: {
                type: String,
                default: 'round'
            },
            strokeLinejoin: {
                type: String,
                default: 'round'
            }
        }
    };
}
