/**
 * 首页 - 移动端逻辑
 */

// 避免重复声明
if (!window.HomePage) {
    window.HomePage = {
        vueApp: null,

        // 初始化
        init() {
            // 不再自动调用 createVueApp，由 PageManager.loadPage 统一调用
        },

        // 创建 Vue 应用
        createVueApp() {
            // 如果已经存在 Vue 应用,先卸载
            if (this.vueApp) {
                this.vueApp.unmount();
                this.vueApp = null;
            }

            const container = document.getElementById('deviceCardsContainer');
            if (!container) {
                return;
            }

            // 创建一个新的 Vue 应用实例专门用于 home 页面

            const homeApp = Vue.createApp({
                data() {
                    return {
                        deviceCards: window.DEVICE_CARDS ? [...window.DEVICE_CARDS] : [],
                        draggedItem: null,
                        draggedIndex: null,
                        // 弹出卡片状态
                        showPopup: false,
                        popupTitle: '',
                        popupContent: null,
                        // 当前操作的打印机设备
                        currentPrinterDevice: null,
                        // 打印机电源状态缓存
                        printerPowerState: 'unknown',
                        // 弹出卡片是否为大尺寸（用于URL显示）
                        isLargePopup: false,
                        // 设备状态缓存
                        deviceStates: {},
                        // 空调状态缓存
                        acTemperature: '--',
                        acHumidity: '--',
                        // 空调详细状态
                        acState: null,  // 完整状态对象
                        acHvacMode: 'off',  // 当前模式
                        acTargetTemp: 26,  // 目标温度
                        acFanMode: '四档',  // 风速档位
                        acFanIndex: 3  // 风速索引（0-6 对应 自动、一档、二档、三档、四档、五档、六档、七档、Max档）
                    };
                },
                computed: {
                    // 1x1 卡片设备列表（非 span 2 的设备）
                    deviceCards1x1() {
                        return this.deviceCards.filter(device => device.span !== 2);
                    },
                    // 1x2 卡片设备列表（span 为 2 的设备）
                    deviceCards1x2() {
                        return this.deviceCards.filter(device => device.span === 2);
                    }
                },
                watch: {
                    // 打开弹出卡片时加载空调状态
                    showPopup(newVal) {
                        if (newVal && this.popupContent === 'air-conditioner') {
                            this.loadACState();
                        }
                    }
                },
                methods: {
                    // 获取卡片在原始数组中的真实索引
                    getOriginalIndex(device) {
                        return this.deviceCards.findIndex(d =>
                            d.name === device.name && d.controlEntity === device.controlEntity
                        );
                    },

                    // 获取缓存的设备状态
                    getCachedDeviceState(entityId) {
                        return this.deviceStates[entityId] || 'unknown';
                    },

                    // 获取设备状态文本
                    getDeviceStatusText(device) {
                        const state = this.getCachedDeviceState(device.stateEntity);
                        switch (state) {
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

                    // 处理设备点击
                    handleDeviceClick(device) {
                        const newState = this.getCachedDeviceState(device.stateEntity) === 'on' ? 'off' : 'on';
                        this.deviceStates[device.stateEntity] = newState;
                        // 更新卡片显示状态
                        this.$forceUpdate();
                    },

                    // 拖拽开始
                    onDragStart(event, index) {
                        this.draggedIndex = index;
                        this.draggedItem = this.deviceCards[index];
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', index);
                        // 延迟添加拖拽样式,避免拖拽时元素不可见
                        setTimeout(() => {
                            event.target.classList.add('dragging');
                        }, 0);
                    },

                    // 拖拽结束
                    onDragEnd(event) {
                        event.target.classList.remove('dragging');
                        this.draggedItem = null;
                        this.draggedIndex = null;

                        // 保存到本地存储
                        this.saveCardOrder();
                    },

                    // 拖拽经过
                    onDragOver(event) {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                    },

                    // 放下
                    onDrop(event, targetIndex) {
                        event.preventDefault();
                        if (this.draggedIndex === null || this.draggedIndex === targetIndex) {
                            return;
                        }

                        // 移动卡片
                        const draggedItem = this.deviceCards[this.draggedIndex];
                        this.deviceCards.splice(this.draggedIndex, 1);
                        this.deviceCards.splice(targetIndex, 0, draggedItem);
                    },

                    // 保存卡片顺序到本地存储
                    saveCardOrder() {
                        try {
                            const cardOrder = this.deviceCards.map(card => ({
                                name: card.name,
                                stateEntity: card.stateEntity
                            }));
                            localStorage.setItem('deviceCardOrder', JSON.stringify(cardOrder));
                        } catch (error) {
                            // 保存失败静默处理
                        }
                    },

                    // 处理详情页面打开
                    async handleOpenDetail(detail) {
                        // 根据设备类型和操作类型显示不同的弹出内容
                        const deviceType = detail.deviceType;
                        const action = detail.action || 'detail';

                        if (deviceType === 'climate') {
                            // 空调详情弹出
                            this.showAirConditionerPopup(detail);
                        } else if (deviceType === 'url') {
                            // URL类型设备（如3D打印机）
                            if (action === 'control_power') {
                                // 点击切角：弹出电源控制（异步）
                                await this.showPrinterPowerPopup(detail);
                            } else if (action === 'show_url') {
                                // 点击卡片主体：显示URL iframe
                                this.showPrinterUrlPopup(detail);
                            }
                        }
                    },

                    /**
                     * 显示空调控制弹出卡片
                     * @param {Object} detail - 设备详情对象
                     */
                    showAirConditionerPopup(detail) {
                        this.popupTitle = detail.name + ' - 详细控制';
                        this.popupContent = 'air-conditioner';
                        this.showPopup = true;
                    },

                    /**
                     * 显示URL设备弹出卡片（如3D打印机）- 显示URL
                     * @param {Object} detail - 设备详情对象
                     */
                    showPrinterUrlPopup(detail) {
                        this.popupTitle = detail.name + ' - 控制面板';
                        this.popupContent = 'printer-url';
                        this.isLargePopup = true;  // URL弹出使用大尺寸
                        this.showPopup = true;
                    },

                    /**
                     * 显示3D打印机电源控制弹出卡片
                     * @param {Object} detail - 设备详情对象
                     */
                    async showPrinterPowerPopup(detail) {
                        // 存储当前操作的打印机设备
                        this.currentPrinterDevice = detail;
                        // 设置标题为"设备名称+电源控制"
                        this.popupTitle = detail.name + '电源控制';
                        this.popupContent = 'printer-power';
                        this.isLargePopup = false;  // 电源控制使用普通尺寸
                        this.showPopup = true;

                        // 异步获取电源状态
                        await this.updatePrinterPowerState();
                    },

                    /**
                     * 更新打印机电源状态缓存
                     */
                    async updatePrinterPowerState() {
                        if (!this.currentPrinterDevice || !window.haConnection) {
                            this.printerPowerState = 'unknown';
                            return;
                        }

                        const powerEntity = this.currentPrinterDevice.powerEntity;
                        if (!powerEntity) {
                            this.printerPowerState = 'unknown';
                            return;
                        }

                        try {
                            // getDeviceState 是异步函数，返回 Promise
                            const state = await window.haConnection.getDeviceState(powerEntity);

                            // state 是字符串 'on'、'off' 或 'unavailable'
                            if (state === 'on' || state === 'off') {
                                this.printerPowerState = state;
                            } else {
                                this.printerPowerState = 'unknown';
                            }
                        } catch (error) {
                            this.printerPowerState = 'unknown';
                        }
                    },

                    /**
                     * 获取3D打印机电源状态（从缓存中读取）
                     * @returns {string} 电源状态 'on'|'off'|'unknown'
                     */
                    getPrinterPowerState() {
                        return this.printerPowerState;
                    },

                    /**
                     * 关闭弹出卡片
                     */
                    closePopup() {
                        this.showPopup = false;
                        this.popupContent = null;
                    },

                    /**
                     * 获取空调状态文本
                     * @returns {string} 状态文本
                     */
                    async getACStatus() {
                        const acDevice = this.deviceCards.find(d => d.deviceType === 'climate');
                        if (!acDevice || !window.haConnection) return '未知';

                        const state = await window.haConnection.getDeviceState(acDevice.stateEntity);
                        if (state && typeof state === 'object') {
                            const stateVal = state.state || 'off';
                            const statusMap = {
                                'off': '已关闭',
                                'idle': '待机',
                                'cooling': '制冷',
                                'heating': '制热',
                                'fan_only': '送风',
                                'dry': '干燥'
                            };
                            return statusMap[stateVal] || stateVal;
                        }
                        return '未知';
                    },

                    /**
                     * 加载空调温湿度状态
                     */
                    async loadACState() {
                        // 从 deviceCards 中查找空调设备
                        const acDevice = this.deviceCards.find(d => d.deviceType === 'climate');
                        if (!acDevice || !acDevice.stateEntity) {
                            this.acTemperature = '--';
                            this.acHumidity = '--';
                            return;
                        }

                        try {
                            const entityId = acDevice.stateEntity;

                            // 优先从 haConnection.states 缓存中获取完整状态
                            let stateData = null;
                            if (window.haConnection && window.haConnection.states && window.haConnection.states[entityId]) {
                                // states 中存储的是 state 字符串，不是完整对象
                                // 需要重新获取完整状态
                            }

                            // 使用 fetch API 获取完整状态对象（包含 attributes）
                            const haUrl = window.haConnection?.url || window.HA_URL || 'http://192.168.4.5:8123';
                            const accessToken = window.haConnection?.token || window.ACCESS_TOKEN;

                            const response = await fetch(`${haUrl}/api/states/${entityId}`, {
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'Content-Type': 'application/json'
                                }
                            });

                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }

                            stateData = await response.json();

                            if (stateData && stateData.attributes) {
                                // 保存完整状态
                                this.acState = stateData;
                                this.acHvacMode = stateData.state || 'off';
                                this.acTargetTemp = stateData.attributes.temperature || 26;
                                this.acFanMode = stateData.attributes.fan_mode || '四档';

                                // 更新风量索引
                                const fanModes = ['自动', '一档', '二档', '三档', '四档', '五档', '六档', '七档', 'Max档'];
                                this.acFanIndex = fanModes.indexOf(this.acFanMode);
                                if (this.acFanIndex === -1) this.acFanIndex = 3; // 默认四档

                                // 尝试不同的属性名
                                this.acTemperature = stateData.attributes.temperature ||
                                                   stateData.attributes.current_temperature ||
                                                   stateData.attributes['current temperature'] ||
                                                   '--';
                                this.acHumidity = stateData.attributes.humidity ||
                                                  stateData.attributes.current_humidity ||
                                                  stateData.attributes['current humidity'] ||
                                                  '--';
                            } else {
                                this.acTemperature = '--';
                                this.acHumidity = '--';
                            }
                        } catch (error) {
                            this.acTemperature = '--';
                            this.acHumidity = '--';
                        }
                    },

                    /**
                     * 控制空调
                     * @param {string} action - 操作类型（turn_off/set_temperature/set_mode）
                     * @param {number} value - 温度值或模式（仅 set_temperature/set_mode 时使用）
                     */
                    async controlAC(action, value) {
                        // 从 deviceCards 中查找空调设备
                        const acDevice = this.deviceCards.find(d => d.deviceType === 'climate');
        if (!acDevice || !acDevice.stateEntity || !window.haConnection) return;

        try {
                            if (action === 'turn_off') {
                                const serviceData = {
                                    entity_id: acDevice.stateEntity
                                };
                                await window.haConnection.callService('climate', 'turn_off', serviceData);
                            } else if (action === 'set_temperature') {
                                // 设置温度：只在用户点击温度按钮时设置温度
                                const serviceData = {
                                    entity_id: acDevice.stateEntity,
                                    temperature: value
                                };

                                // 尝试设置温度，如果失败（空调关闭），先设置模式再设置温度
                                try {
                                    await window.haConnection.callService('climate', 'set_temperature', serviceData);
                                } catch (tempError) {
                                    // 先设置为制冷模式（会自动开启空调）
                                    await window.haConnection.callService('climate', 'set_hvac_mode', {
                                        entity_id: acDevice.stateEntity,
                                        hvac_mode: 'cool'
                                    });

                                    // 等待一小段时间
                                    await new Promise(resolve => setTimeout(resolve, 300));

                                    // 再次设置温度
                                    await window.haConnection.callService('climate', 'set_temperature', serviceData);
                                }
                            } else if (action === 'set_mode') {
                                // 设置模式：只设置模式，不设置温度
                                const serviceData = {
                                    entity_id: acDevice.stateEntity,
                                    hvac_mode: value
                                };
                                await window.haConnection.callService('climate', 'set_hvac_mode', serviceData);
                            }
                            // 控制操作后刷新状态
                            setTimeout(() => this.loadACState(), 500);
                        } catch (error) {
                            // 静默处理错误
                        }
                    },

                    /**
                     * 控制空调风量
                     * @param {string} action - 操作类型（set/prev/next）
                     * @param {number} value - 档位索引（仅 set 时使用）
                     */
                    async controlFan(action, value) {
                        const fanModes = ['自动', '一档', '二档', '三档', '四档', '五档', '六档', '七档', 'Max档'];
                        const acDevice = this.deviceCards.find(d => d.deviceType === 'climate');
                        if (!acDevice || !acDevice.stateEntity || !window.haConnection) return;

                        try {
                            if (action === 'prev') {
                                this.acFanIndex = Math.max(0, this.acFanIndex - 1);
                            } else if (action === 'next') {
                                this.acFanIndex = Math.min(fanModes.length - 1, this.acFanIndex + 1);
                            } else if (action === 'set') {
                                this.acFanIndex = Math.max(0, Math.min(fanModes.length - 1, parseInt(value) || 0));
                            }

                            this.acFanMode = fanModes[this.acFanIndex];

                            // 调用 HA 服务设置风量
                            await window.haConnection.callService('climate', 'set_fan_mode', {
                                entity_id: acDevice.stateEntity,
                                fan_mode: this.acFanMode
                            });

                            // 刷新状态
                            setTimeout(() => this.loadACState(), 500);
                        } catch (error) {
                            // 静默处理错误
                        }
                    },

                    /**
                     * 控制3D打印机电源
                     * @param {string} action - 操作类型（turn_on/turn_off）
                     */
                    async controlPrinter(action) {
                        // 优先使用当前弹出卡片中存储的打印机设备
                        const printerDevice = this.currentPrinterDevice || this.deviceCards.find(d => d.deviceType === 'url');

                        if (!printerDevice || !printerDevice.powerEntity || !window.haConnection) return;

                        try {
                            if (action === 'turn_on') {
                                await window.haConnection.callService('switch', 'turn_on', {
                                    entity_id: printerDevice.powerEntity
                                });
                                // 更新状态缓存
                                this.printerPowerState = 'on';
                            } else if (action === 'turn_off') {
                                await window.haConnection.callService('switch', 'turn_off', {
                                    entity_id: printerDevice.powerEntity
                                });
                                // 更新状态缓存
                                this.printerPowerState = 'off';
                            }
                            // 操作完成后关闭弹出卡片
                            this.closePopup();
                        } catch (error) {
                            // 控制失败静默处理
                        }
                    },

                    /**
                     * 获取3D打印机控制面板URL
                     * @returns {string} URL地址
                     */
                    getPrinterUrl() {
                        const printerDevice = this.deviceCards.find(d => d.deviceType === 'url');
                        return printerDevice?.controlUrl || '';
                    },

                    // 从本地存储加载卡片顺序
                    loadCardOrder() {
                        try {
                            const savedOrder = localStorage.getItem('deviceCardOrder');
                            if (savedOrder) {
                                const order = JSON.parse(savedOrder);
                                if (Array.isArray(order) && order.length > 0) {
                                    // 根据保存的顺序重新排列卡片
                                    const newCards = [];
                                    const remainingCards = [...this.deviceCards];

                                    order.forEach(savedCard => {
                                        const index = remainingCards.findIndex(
                                            card => card.name === savedCard.name && card.stateEntity === savedCard.stateEntity
                                        );
                                        if (index !== -1) {
                                            newCards.push(remainingCards.splice(index, 1)[0]);
                                        }
                                    });
                                    
                                    // 添加剩余的卡片(新增的卡片)
                                    newCards.push(...remainingCards);
                                    this.deviceCards = newCards;
                                }
                            }
                        } catch (error) {
                            // 加载失败静默处理
                        }
                    }
                },
                        template: `
                    <div class="device-grid">
                        <card-1x1
                            v-for="(device, index) in deviceCards1x1"
                            :key="'1x1-' + index"
                            :name="device.name"
                            :icon="device.icon"
                            :stateentity="device.stateEntity"
                            :control-entity="device.controlEntity"
                            :devicetype="device.deviceType || 'switch'"
                            :layouttype="'default'"
                            :hasdetailpage="device.deviceType === 'climate' || device.deviceType === 'url'"
                            :powerentity="device.powerEntity"
                            :controlurl="device.controlUrl"
                            :data-index="index"
                            :fridge-sensor="device.customProps?.fridgeSensor"
                            :freezer-sensor="device.customProps?.freezerSensor"
                            @open-detail="handleOpenDetail"
                        ></card-1x1>
                        <card-1x2
                            v-for="(device, index) in deviceCards1x2"
                            :key="'1x2-' + index"
                            :name="device.name"
                            :icon="device.icon"
                            :stateentity="device.stateEntity"
                            :control-entity="device.controlEntity"
                            :devicetype="device.deviceType || 'switch'"
                            :layouttype="'default'"
                            :hasdetailpage="device.deviceType === 'climate' || device.deviceType === 'url'"
                            :powerentity="device.powerEntity"
                            :controlurl="device.controlUrl"
                            :data-index="index"
                            @open-detail="handleOpenDetail"
                        ></card-1x2>
                    </div>
                    <!-- 弹出卡片 -->
                    <card-popup
                        v-model="showPopup"
                        :title="popupTitle"
                        :card-class="isLargePopup ? 'popup-card--large' : ''"
                        @close="closePopup"
                    >
                        <!-- 空调控制内容 -->
                        <template v-if="popupContent === 'air-conditioner'">
                            <div class="air-conditioner-popup">
                                <!-- 状态显示 -->
                                <div class="ac-status-display">
                                    <div class="ac-status-item">
                                        <span class="ac-status-label">室温</span>
                                        <span class="ac-status-value">{{ acTemperature }}℃</span>
                                    </div>
                                    <div class="ac-status-item">
                                        <span class="ac-status-label">湿度</span>
                                        <span class="ac-status-value">{{ acHumidity }}%</span>
                                    </div>
                                </div>

                                <!-- 温度控制区 -->
                                <div class="ac-section">
                                    <h3 class="ac-section-title">温度调节</h3>
                                    <div class="ac-temp-slider">
                                        <button class="ac-slider-btn" @click="controlAC('set_temperature', acTargetTemp - 1)">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M5 12h14"/>
                                            </svg>
                                        </button>
                                        <input type="range"
                                               class="ac-slider-input"
                                               :min="16"
                                               :max="31"
                                               :step="0.5"
                                               v-model.number="acTargetTemp"
                                               @change="controlAC('set_temperature', $event.target.value)">
                                        <button class="ac-slider-btn" @click="controlAC('set_temperature', acTargetTemp + 1)">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M12 5v14"/>
                                                <path d="M19 12l-7-7-7 7"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <!-- 模式控制区 -->
                                <div class="ac-section">
                                    <h3 class="ac-section-title">模式选择</h3>
                                    <div class="ac-mode-controls">
                                        <button class="ac-mode-btn ac-mode-cool" :class="{ 'ac-mode-btn--active': acHvacMode === 'cool' }" @click="controlAC('set_mode', 'cool')">
                                            <span class="ac-mode-icon">❄️</span>
                                            <span class="ac-mode-label">制冷</span>
                                        </button>
                                        <button class="ac-mode-btn ac-mode-heat" :class="{ 'ac-mode-btn--active': acHvacMode === 'heat' }" @click="controlAC('set_mode', 'heat')">
                                            <span class="ac-mode-icon">🔥</span>
                                            <span class="ac-mode-label">制热</span>
                                        </button>
                                        <button class="ac-mode-btn ac-mode-fan" :class="{ 'ac-mode-btn--active': acHvacMode === 'fan_only' }" @click="controlAC('set_mode', 'fan_only')">
                                            <span class="ac-mode-icon">🌬</span>
                                            <span class="ac-mode-label">送风</span>
                                        </button>
                                        <button class="ac-mode-btn ac-mode-dry" :class="{ 'ac-mode-btn--active': acHvacMode === 'dry' }" @click="controlAC('set_mode', 'dry')">
                                            <span class="ac-mode-icon">💧</span>
                                            <span class="ac-mode-label">干燥</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- 风量控制区 -->
                                <div class="ac-section">
                                    <h3 class="ac-section-title">风量调节</h3>
                                    <div class="ac-fan-slider">
                                        <button class="ac-slider-btn" @click="controlFan('prev')">-</button>
                                        <input type="range"
                                               class="ac-slider-input"
                                               min="0"
                                               max="6"
                                               step="1"
                                               v-model.number="acFanIndex"
                                               @change="controlFan('set', $event.target.value)">
                                        <button class="ac-slider-btn" @click="controlFan('next')">+</button>
                                    </div>
                                    <div class="ac-fan-display">{{ acFanMode }}</div>
                                </div>

                                <!-- 电源控制区 -->
                                <div class="ac-section ac-power-section">
                                    <button class="ac-power-btn" :class="{ 'ac-power-btn--on': acHvacMode === 'off', 'ac-power-btn--off': acHvacMode !== 'off' }" @click="acHvacMode === 'off' ? controlAC('set_mode', 'cool') : controlAC('turn_off')">
                                        <span class="ac-power-icon">{{ acHvacMode === 'off' ? '▶' : '⏹' }}</span>
                                        <span class="ac-power-label">{{ acHvacMode === 'off' ? '开启' : '关闭' }}</span>
                                    </button>
                                </div>
                        </div>
                        </template>
                        <!-- 3D打印机URL内容 -->
                        <div v-if="popupContent === 'printer-url'" class="printer-url-popup">
                            <div class="printer-frame-wrapper">
                                <iframe
                                    v-if="getPrinterUrl()"
                                    :src="getPrinterUrl()"
                                    class="printer-iframe"
                                    frameborder="0"
                                ></iframe>
                            </div>
                        </div>
                        <!-- 3D打印机电源控制内容 -->
                        <div v-if="popupContent === 'printer-power'" class="printer-power-popup">
                            <!-- 打印机图标 -->
                            <div class="printer-power-icon-wrapper">
                                <span class="printer-power-icon">🖨️</span>
                            </div>
                            <!-- 确认文本 - 根据电源状态动态显示 -->
                            <p class="printer-power-confirm-text">
                                {{ getPrinterPowerState() === 'on' ? '确认要关机吗？' : '确认要开机吗？' }}
                            </p>
                            <!-- 警告提示框 -->
                            <div class="printer-power-warning">
                                <span class="printer-power-warning-icon">⚠️</span>
                                <span class="printer-power-warning-text">请确保3D打印机处于安全状态后再操作电源</span>
                            </div>
                            <!-- 按钮组 - 根据电源状态显示不同按钮 -->
                            <div class="printer-power-buttons">
                                <button class="printer-power-btn printer-power-btn-cancel" @click.stop="closePopup()">
                                    取消
                                </button>
                                <!-- 电源关闭时显示绿色开机按钮 -->
                                <button v-if="getPrinterPowerState() === 'off'" 
                                        class="printer-power-btn printer-power-btn-start" 
                                        @click.stop="controlPrinter('turn_on')">
                                    开机
                                </button>
                                <!-- 电源开启时显示红色关机按钮 -->
                                <button v-else 
                                        class="printer-power-btn printer-power-btn-stop" 
                                        @click.stop="controlPrinter('turn_off')">
                                    关机
                                </button>
                            </div>
                        </div>
                    </card-popup>
                `,
                mounted() {
                    // 从本地存储加载卡片顺序
                    this.loadCardOrder();
                }
            });

            // 根据 config.js 的 cards 配置自动注册卡片组件，无需逐个写死
            const cardConfig = window.AppConfig && window.AppConfig.cards;

            if (Array.isArray(cardConfig)) {
                cardConfig.forEach(card => {
                    const Component = card.name && window[card.name];
                    if (Component && card.tag) {
                        homeApp.component(card.tag, Component);
                    }
                });
            } else {
                // 后备方案：直接注册
                if (window.Card1x1Component) {
                    homeApp.component('card-1x1', window.Card1x1Component);
                }
                if (window.Card1x2Component) {
                    homeApp.component('card-1x2', window.Card1x2Component);
                }
            }

            // 挂载应用
            homeApp.mount(container);
            this.vueApp = homeApp;
        }
    };

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.HomePage.init();
        });
    } else {
        window.HomePage.init();
    }
}
