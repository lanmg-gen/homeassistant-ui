/**
 * 1x2卡片Vue组件
 * 用于智能家居设备控制面板（宽2倍，即2:1比例）
 *
 * 功能特性:
 * - 显示设备图标、名称和状态
 * - 支持点击切换设备状态
 * - 支持两种布局模式：default（默认）和icon-only（仅图标）
 * - 支持详细页面入口（右上角切角标记）
 * - 自动响应容器尺寸，适配不同屏幕
 * - 优化触摸屏交互（禁用文本选择）
 * - 占据2列宽度（CSS Grid中跨2列）
 */

const Card1x2Component = {
    name: 'Card1x2',

    // ==================== 组件属性 ====================
    props: {
        // 设备名称
        name: {
            type: String,
            default: '设备名称'
        },
        // 设备图标（emoji或SVG）
        icon: {
            type: String,
            default: '📱'
        },
        // 设备状态实体ID（必需）
        stateentity: {
            type: String,
            required: true
        },
        // 控制实体ID（可选，默认使用stateentity）
        controlEntity: {
            type: String,
            default: ''
        },
        // 设备类型：light（灯）、switch（开关）等
        devicetype: {
            type: String,
            default: 'switch'
        },
        // 布局类型：default（默认，显示名称和状态）、icon-only（仅显示图标）
        layouttype: {
            type: String,
            default: 'default',
            validator: (value) => ['default', 'icon-only'].includes(value)
        },
        // 设备描述（当前未使用，保留用于未来扩展）
        description: {
            type: String,
            default: ''
        },
        // 卡片跨列数（固定为2，确保在CSS Grid中占据2列宽度）
        span: {
            type: Number,
            default: 2
        },
        // 是否有详细页面：true/false/'true'/''（空字符串表示有）
        hasdetailpage: {
            type: [Boolean, String],
            default: false
        },
        // 电源实体ID（用于3D打印机等设备的电源控制）
        powerentity: {
            type: String,
            default: ''
        },
        // 控制URL（用于3D打印机等设备的控制面板）
        controlurl: {
            type: String,
            default: ''
        }
    },

    // ==================== 数据状态 ====================
    data() {
        return {
            state: 'off',        // 设备状态：on/off/unavailable
            loading: false        // 加载状态
        };
    },

    // ==================== 计算属性 ====================
    computed: {
        // 是否为设置卡片（没有真实实体，不需要显示状态）
        isSettingsCard() {
            return this.stateentity && this.stateentity.startsWith('settings.');
        },

        // 状态类名：根据设备状态和加载状态返回对应的CSS类
        statusClass() {
            return {
                'on': this.state === 'on' || (this.devicetype === 'vacuum' && ['cleaning', 'returning'].includes(this.state)),
                'off': this.state === 'off' || (this.devicetype === 'vacuum' && ['docked', 'idle', 'paused'].includes(this.state)) || this.devicetype === 'feeder',
                'unavailable': this.state === 'unavailable' || this.state === 'error',
                'loading': this.loading
            };
        },

        // 状态文本：将设备状态转换为中文显示
        statusText() {
            // 对于设置卡片，不显示状态文本
            if (this.isSettingsCard) return '';

            if (this.loading) return '加载中...';

            // 宠物投喂器特殊状态处理
            if (this.devicetype === 'feeder') {
                return `${this.state}次`;
            }

            // 扫地机器人特殊状态处理
            if (this.devicetype === 'vacuum') {
                const vacuumStates = {
                    'cleaning': '清扫中',
                    'returning': '返回中',
                    'docked': '已回充',
                    'idle': '待机',
                    'paused': '已暂停',
                    'error': '错误'
                };
                return vacuumStates[this.state] || '未知';
            }

            // 普通开关设备状态
            switch (this.state) {
                case 'on':
                    return '已开启';
                case 'off':
                    return '已关闭';
                case 'unavailable':
                    return '不可用';
                default:
                    return '未知';
            }
        },

        // 卡片类名：基础类名 + 布局类型 + 详细页面标记
        cardClass() {
            let result = `card-1x2 card-1x2--${this.layouttype}`;
            // 判断是否添加详细页面切角标记
            if (this.hasdetailpage === true || this.hasdetailpage === 'true' || this.hasdetailpage === '') {
                result += ' has-detail-page';
            }
            return result;
        },

        // 卡片样式：在CSS Grid中占据2列宽度
        cardStyle() {
            return {
                gridColumn: 'span 2'
            };
        }
    },

        // ==================== 生命周期钩子 ====================
    mounted() {
        // 监听全局设备状态更新事件
        window.addEventListener('device-state-update', this.handleStateUpdate);
        // 监听HA就绪后的刷新事件
        window.addEventListener('refresh-all-cards', this.handleRefreshAll);

        // 对于设置卡片，不需要加载状态，直接设置为 off 并跳过
        if (this.isSettingsCard) {
            this.state = 'off';
            return;
        }

        // 延迟加载设备状态,确保HA连接已完成初始化
        setTimeout(() => {
            this.loadDeviceState();
        }, 500);
    },

    beforeUnmount() {
        // 组件卸载前移除事件监听
        window.removeEventListener('device-state-update', this.handleStateUpdate);
        window.removeEventListener('refresh-all-cards', this.handleRefreshAll);
    },

    // ==================== 方法定义 ====================
    methods: {
        // 加载设备状态
        async loadDeviceState() {
            try {
                this.loading = true;

                // 对于设置卡片，不需要加载状态
                if (this.isSettingsCard) {
                    this.state = 'off';
                    return;
                }

                // 检查是否有有效的实体ID
                if (!this.stateentity || typeof this.stateentity !== 'string') {
                    console.warn(`[1x2卡片] 无效的实体ID: ${this.stateentity}`, new Error().stack);
                    this.state = 'unavailable';
                    return;
                }

                // 调用全局方法获取设备状态
                if (window.app && window.app.getDeviceState) {
                    this.state = await window.app.getDeviceState(this.stateentity);
                }
            } catch (error) {
                console.error('加载设备状态失败:', error);
                this.state = 'unavailable';
            } finally {
                this.loading = false;
            }
        },

        // 处理刷新所有卡片事件
        handleRefreshAll() {
            this.loadDeviceState();
        },

        // 处理卡片点击：切换设备开关状态
        async handleClick() {
            if (this.loading) return;

            try {
                this.loading = true;

                // 调用全局方法处理设备点击
                if (window.app && window.app.handleDeviceClick) {
                    const device = {
                        name: this.name,
                        icon: this.icon,
                        stateEntity: this.stateentity,
                        controlEntity: this.controlEntity || this.stateentity,
                        deviceType: this.devicetype
                    };
                    await window.app.handleDeviceClick(device);
                }
            } catch (error) {
                console.error('控制设备失败:', error);
                // 显示错误提示
                if (window.vant && window.vant.Toast) {
                    window.vant.Toast.fail('操作失败');
                }
            } finally {
                this.loading = false;
                // 延迟重新加载状态，等待设备响应
                setTimeout(() => this.loadDeviceState(), 300);
            }
        },

        // 处理全局状态更新事件
        handleStateUpdate(event) {
            if (event.detail && event.detail.entityId === this.stateentity) {
                this.state = event.detail.state;
            }
        },

        // 切换设备状态（当前未使用，保留用于未来扩展）
        async toggleState() {
            if (this.devicetype === 'light' || this.devicetype === 'switch') {
                const newState = this.state === 'on' ? 'off' : 'on';
                if (window.app && window.app.callService) {
                    await window.app.callService(
                        this.devicetype,
                        newState === 'on' ? 'turn_on' : 'turn_off',
                        { entity_id: this.controlEntity || this.stateentity }
                    );
                }
            }
        },

        // 处理详情页切角点击：阻止冒泡并触发打开详情事件
        handleDetailCornerClick(event) {
            // 阻止事件冒泡，避免触发卡片点击
            event.stopPropagation();

            // 显示提示
            if (window.vant && window.vant.Toast) {
                window.vant.Toast.success(`打开 ${this.name} 的详细页面`);
            }

            // 触发自定义事件，通知父组件打开详情页
            this.$emit('open-detail', {
                name: this.name,
                icon: this.icon,
                stateEntity: this.stateentity,
                deviceType: this.devicetype,
                powerEntity: this.powerentity
            });
        }
    },

    // ==================== 模板 ====================
    template: `
        <div :class="[cardClass, { 'on': state === 'on' }]" :style="cardStyle" @click="handleClick">
            <!-- 设备图标 -->
            <div class="card-1x2__icon">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="card-1x2__icon-svg">
                    <text x="50" y="50" font-size="70" text-anchor="middle" dominant-baseline="middle">{{ icon }}</text>
                </svg>
            </div>
            <!-- 设备信息（名称和状态） -->
            <div class="card-1x2__content">
                <div class="card-1x2__name">{{ name }}</div>
                <div v-if="!isSettingsCard" class="card-1x2__status" :class="statusClass">
                    {{ statusText }}
                </div>
            </div>
            <!-- 详细页面切角标记（通过CSS样式显示） -->
            <div v-if="hasdetailpage" @click.stop="handleDetailCornerClick"></div>
        </div>
    `
};

// ==================== 组件导出 ====================
// 支持CommonJS模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Card1x2Component;
}

// 导出到全局对象，供外部Vue应用直接使用
window.Card1x2Component = Card1x2Component;
