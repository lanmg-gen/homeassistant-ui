// 初始化Vue应用
const { createApp } = Vue;

// ========================================
// 配置辅助函数
// ========================================

/**
 * 获取Home Assistant URL
 * 优先使用localStorage中的配置，否则使用默认配置
 */
function getHAUrl() {
    const storedUrl = localStorage.getItem('haUrl');
    return storedUrl || HA_CONFIG.url;
}

/**
 * 获取访问令牌
 * 优先使用localStorage中的配置，否则使用默认配置
 */
function getAccessToken() {
    const storedToken = localStorage.getItem('accessToken');
    return storedToken || HA_CONFIG.token;
}

// 为兼容旧代码，保留全局常量引用
let HA_URL = getHAUrl();
let ACCESS_TOKEN = getAccessToken();

// 声明全局变量，以便后续更新
window.HA_URL = HA_URL;
window.ACCESS_TOKEN = ACCESS_TOKEN;

// 获取各个实体的配置
const PET_FEEDING_ENTITY = STATUS_CONFIGS.petFeeding.counterEntity;
const AMBIENT_LIGHT_ENTITY = STATUS_CONFIGS.ambientLight.stateEntity;
const AMBIENT_LIGHT_TIMER_ENTITY = STATUS_CONFIGS.ambientLight.timerEntity;
const VACUUM_ENTITY = STATUS_CONFIGS.vacuum.stateEntity;
const MASTER_BEDROOM_LIGHT_ENTITY = DEVICE_CONFIGS.masterBedroomLight.stateEntity;
const DINING_LIGHT_ENTITY = DEVICE_CONFIGS.diningLight.stateEntity;
const KITCHEN_LIGHT_ENTITY = DEVICE_CONFIGS.kitchenLight.stateEntity;
const SECOND_BEDROOM_LIGHT_ENTITY = DEVICE_CONFIGS.secondBedroomLight.stateEntity;
const CORRIDOR1_LIGHT_ENTITY = DEVICE_CONFIGS.corridor1Light.stateEntity;
const CORRIDOR3_LIGHT_ENTITY = DEVICE_CONFIGS.corridor3Light.stateEntity;
const LIVING_ROOM_LIGHT_ENTITY = DEVICE_CONFIGS.livingRoomLight.stateEntity;
const BATHROOM_LIGHT_ENTITY = DEVICE_CONFIGS.bathroomLight.stateEntity;
const GUEST_BEDROOM_LIGHT_ENTITY = DEVICE_CONFIGS.guestBedroomLight.stateEntity;
const WATER_HEATER_ENTITY = DEVICE_CONFIGS.waterHeater.stateEntity;
const AIR_CONDITIONER_ENTITY = DEVICE_CONFIGS.airConditioner.stateEntity;
const PET_FEEDING_NUMBER = DEVICE_CONFIGS.petFeeding.controlEntity;

const app = createApp({
    data() {
        return {
            activeTab: 0,
            // 设备卡片配置
            DEVICE_CARDS: DEVICE_CARDS || [],
            // 宠物投喽数据
            petFeedingData: null,
            petFeedingError: null,
            petFeedingLoading: true,
            // 氛围灯数据
            ambientLightData: null,
            ambientLightError: null,
            ambientLightLoading: true,
            // 天气数据
            weatherData: null,
            weatherError: null,
            weatherLoading: true,
            // 主卧灯数据
            masterBedroomLightData: null,
            masterBedroomLightError: null,
            masterBedroomLightLoading: true,
            // 扫地机器人数据
            vacuumData: null,
            vacuumError: null,
            vacuumLoading: true,
            // 餐厅灯数据
            diningLightData: null,
            diningLightError: null,
            diningLightLoading: true,
            // 厨房灯数据
            kitchenLightData: null,
            kitchenLightError: null,
            kitchenLightLoading: true,
            // 次卧灯数据
            secondBedroomLightData: null,
            secondBedroomLightError: null,
            secondBedroomLightLoading: true,
            // 过道1灯数据
            corridor1LightData: null,
            corridor1LightError: null,
            corridor1LightLoading: true,
            // 过道3灯数据
            corridor3LightData: null,
            corridor3LightError: null,
            corridor3LightLoading: true,
            // 客厅灯数据
            livingRoomLightData: null,
            livingRoomLightError: null,
            livingRoomLightLoading: true,
            // 卫生间灯数据
            bathroomLightData: null,
            bathroomLightError: null,
            bathroomLightLoading: true,
            // 客卧灯数据
            guestBedroomLightData: null,
            guestBedroomLightError: null,
            guestBedroomLightLoading: true,
            // 热水器数据
            waterHeaterData: null,
            waterHeaterError: null,
            waterHeaterLoading: true,
            // 空调数据
            airConditionerData: null,
            airConditionerError: null,
            airConditionerLoading: true,
            // 连接错误信息
            connectionError: null,
            connectionStatus: null,  // 连接状态：null=未测试, true=已连接, false=未连接
            // 自动刷新配置
            autoRefreshEnabled: true,
            autoRefreshInterval: 3000,
            refreshIntervalSeconds: 3,
            autoRefreshTimer: null,
            isRefreshing: false,
            isFirstLoading: true,
            // 氛围灯计时器每秒刷新
            ambientLightTimerRefreshTimer: null,
            showDeviceGrid: false, // 控制设备网格的延迟显示
            // 背景设置
            currentBackground: localStorage.getItem('currentBackground') || 'default',
            _currentBackground: null, // 用于防止重复加载背景
            backgrounds: {
                'blue-gradient-waves': 'backgrounds/blue-gradient-waves.html',
                'particle-network': 'backgrounds/particle-network.html',
                'aurora-borealis': 'backgrounds/aurora-borealis.html',
                'starfield': 'backgrounds/starfield.html'
            },
            // 设备操作过渡状态
            deviceTransitionStates: {},
            // 智能刷新
            highRefreshUntil: null, // 高频刷新截止时间戳
            deviceStateHistory: {}, // 设备状态历史，用于检测状态稳定
            // 自动化日志
            automationLogs: [],
            // 动态设备状态存储
            deviceStates: {},
            // 设置页面数据
            haUrl: HA_CONFIG.url || 'http://192.168.4.5:8123',
            accessToken: HA_CONFIG.token || '',
            ambientLightSettingsVisible: false,
            // 氛围灯计时器数据
            ambientLightTimerData: null,
            ambientLightTimerError: null,
            ambientLightTimerLoading: true,
            // 3D打印机弹窗
            showPrinterModal: false,
            printerUrl: '',
            printerLoading: true,
            printerOnline: false,
            printerPowerOn: false,
            printerBlinking: false,
            // 3D打印机电源控制弹窗
            showPrinterPowerModal: false,
            isPrinterPowerModalOpen: false,
            isPrinterPowerModalClosing: false,
            printerPowerDevice: null,
            printerPowerAction: 'on',
            // 点击位置追踪
            modalClickX: 0,
            modalClickY: 0,
            // 背景选择弹窗
            showBackgroundModal: false,
            isBackgroundModalOpen: false,
            isBackgroundModalClosing: false,
            backgroundClickX: 0,
            backgroundClickY: 0,
            // 通用弹出卡片
            showGenericModal: false,
            isGenericModalOpen: false,
            isGenericModalClosing: false,
            genericModalTitle: '',
            genericModalSize: 'medium',
            genericModalShowFooter: true,
            genericClickX: 0,
            genericClickY: 0
        }
    },

    computed: {
        // 宠物投喂状态显示
        petFeedingStatus() {
            if (this.petFeedingLoading) return '加载中...';
            if (this.petFeedingError) return '获取失败';
            if (!this.petFeedingData) return '未知状态';

            return `${this.petFeedingData.state}次`;
        },

        // 宠物投喂状态样式类
        petFeedingClass() {
            if (this.petFeedingLoading) return 'loading';
            if (this.petFeedingError) return 'error';
            return '';
        },

        // 氛围灯状态显示
        ambientLightStatus() {
            if (this.ambientLightLoading) return '加载中...';
            if (this.ambientLightError) return '获取失败';
            if (!this.ambientLightData) return '未知状态';

            const state = this.ambientLightData.state;
            if (state === 'off') return '关闭';

            // 如果灯是开启的，检查倒计时
            if (this.ambientLightTimerData) {
                // HA timer实体返回的数据格式：{ state: 'active'/'idle'/'paused', attributes: { remaining: 1800, ... } }
                const timerState = this.ambientLightTimerData.state;
                const attributes = this.ambientLightTimerData.attributes || {};

                // 检查timer是否处于活动状态，并获取剩余时间
                if (timerState === 'active' && attributes.finishes_at) {
                    const finishesAt = new Date(attributes.finishes_at);
                    const now = new Date();
                    const remaining = Math.floor((finishesAt - now) / 1000);

                    if (remaining > 0) {
                        const minutes = Math.floor(remaining / 60);
                        const seconds = remaining % 60;
                        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    }
                }

                // 也可以尝试从attributes.remaining获取（HA版本兼容）
                if (attributes.remaining && attributes.remaining > 0) {
                    const remaining = attributes.remaining;
                    const minutes = Math.floor(remaining / 60);
                    const seconds = remaining % 60;
                    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
            }

            return '开启';
        },

        // 氛围灯状态样式类
        ambientLightClass() {
            if (this.ambientLightLoading) return 'loading';
            if (this.ambientLightError) return 'error';
            return '';
        },

        // 扫地机器人状态显示
        vacuumStatus() {
            if (this.vacuumLoading) return '加载中...';
            if (this.vacuumError) return '获取失败';
            if (!this.vacuumData) return '未知状态';

            const state = this.vacuumData.state;

            if (state === 'cleaning') {
                return '清扫中';
            } else if (state === 'docked') {
                return '已回充';
            } else if (state === 'idle') {
                return '待机中';
            } else if (state === 'paused') {
                return '已暂停';
            } else if (state === 'returning') {
                return '返回中';
            } else {
                return state;
            }
        },

        // 扫地机器人状态样式类
        vacuumClass() {
            if (this.vacuumLoading) return 'loading';
            if (this.vacuumError) return 'error';

            const state = this.vacuumData?.state;
            if (state === 'cleaning') return 'status-cleaning';
            if (state === 'docked') return 'status-docked';
            if (state === 'idle') return 'status-active';

            return '';
        },

        // 弹窗容器位置样式
        modalContainerStyles() {
            // 始终设置CSS变量,初始和关闭状态使用点击位置
            return {
                '--start-x': `${this.modalClickX}px`,
                '--start-y': `${this.modalClickY}px`
            };
        },

        // 餐厅灯状态显示
        diningLightStatus() {
            if (this.diningLightLoading) return '加载中...';
            if (this.diningLightError) return '获取失败';
            if (!this.diningLightData) return '未知状态';

            const state = this.diningLightData.state;
            return state === 'on' ? '已开启' : '已关闭';
        },

        // 餐厅灯状态样式类
        diningLightClass() {
            if (this.diningLightLoading) return 'loading';
            if (this.diningLightError) return 'error';

            const state = this.diningLightData?.state;
            if (state === 'on') return 'status-active';

            return '';
        },

        // 厨房灯状态显示
        kitchenLightStatus() {
            if (this.kitchenLightLoading) return '加载中...';
            if (this.kitchenLightError) return '获取失败';
            if (!this.kitchenLightData) return '未知状态';

            return this.kitchenLightData.state === 'on' ? '已开启' : '已关闭';
        },

        kitchenLightClass() {
            if (this.kitchenLightLoading) return 'loading';
            if (this.kitchenLightError) return 'error';
            return this.kitchenLightData?.state === 'on' ? 'status-active' : '';
        },

        // 次卧灯状态显示
        secondBedroomLightStatus() {
            if (this.secondBedroomLightLoading) return '加载中...';
            if (this.secondBedroomLightError) return '获取失败';
            if (!this.secondBedroomLightData) return '未知状态';

            return this.secondBedroomLightData.state === 'on' ? '已开启' : '已关闭';
        },

        secondBedroomLightClass() {
            if (this.secondBedroomLightLoading) return 'loading';
            if (this.secondBedroomLightError) return 'error';
            return this.secondBedroomLightData?.state === 'on' ? 'status-active' : '';
        },

        // 过道1灯状态显示
        corridor1LightStatus() {
            if (this.corridor1LightLoading) return '加载中...';
            if (this.corridor1LightError) return '获取失败';
            if (!this.corridor1LightData) return '未知状态';

            return this.corridor1LightData.state === 'on' ? '已开启' : '已关闭';
        },

        corridor1LightClass() {
            if (this.corridor1LightLoading) return 'loading';
            if (this.corridor1LightError) return 'error';
            return this.corridor1LightData?.state === 'on' ? 'status-active' : '';
        },

        // 过道3灯状态显示
        corridor3LightStatus() {
            if (this.corridor3LightLoading) return '加载中...';
            if (this.corridor3LightError) return '获取失败';
            if (!this.corridor3LightData) return '未知状态';

            return this.corridor3LightData.state === 'on' ? '已开启' : '已关闭';
        },

        corridor3LightClass() {
            if (this.corridor3LightLoading) return 'loading';
            if (this.corridor3LightError) return 'error';
            return this.corridor3LightData?.state === 'on' ? 'status-active' : '';
        },

        // 客厅灯状态显示
        livingRoomLightStatus() {
            if (this.livingRoomLightLoading) return '加载中...';
            if (this.livingRoomLightError) return '获取失败';
            if (!this.livingRoomLightData) return '未知状态';

            return this.livingRoomLightData.state === 'on' ? '已开启' : '已关闭';
        },

        livingRoomLightClass() {
            if (this.livingRoomLightLoading) return 'loading';
            if (this.livingRoomLightError) return 'error';
            return this.livingRoomLightData?.state === 'on' ? 'status-active' : '';
        },

        // 卫生间灯状态显示
        bathroomLightStatus() {
            if (this.bathroomLightLoading) return '加载中...';
            if (this.bathroomLightError) return '获取失败';
            if (!this.bathroomLightData) return '未知状态';

            return this.bathroomLightData.state === 'on' ? '已开启' : '已关闭';
        },

        bathroomLightClass() {
            if (this.bathroomLightLoading) return 'loading';
            if (this.bathroomLightError) return 'error';
            return this.bathroomLightData?.state === 'on' ? 'status-active' : '';
        },

        // 客卧灯状态显示
        guestBedroomLightStatus() {
            if (this.guestBedroomLightLoading) return '加载中...';
            if (this.guestBedroomLightError) return '获取失败';
            if (!this.guestBedroomLightData) return '未知状态';

            return this.guestBedroomLightData.state === 'on' ? '已开启' : '已关闭';
        },

        guestBedroomLightClass() {
            if (this.guestBedroomLightLoading) return 'loading';
            if (this.guestBedroomLightError) return 'error';
            return this.guestBedroomLightData?.state === 'on' ? 'status-active' : '';
        },

        // 主卧灯状态显示
        masterBedroomLightStatus() {
            if (this.masterBedroomLightLoading) return '加载中...';
            if (this.masterBedroomLightError) return '获取失败';
            if (!this.masterBedroomLightData) return '未知状态';

            return this.masterBedroomLightData.state === 'on' ? '已开启' : '已关闭';
        },

        masterBedroomLightClass() {
            if (this.masterBedroomLightLoading) return 'loading';
            if (this.masterBedroomLightError) return 'error';
            return this.masterBedroomLightData?.state === 'on' ? 'status-active' : '';
        },

        // 热水器状态显示
        waterHeaterStatus() {
            if (this.waterHeaterLoading) return '加载中...';
            if (this.waterHeaterError) return '获取失败';
            if (!this.waterHeaterData) return '未知状态';

            const state = this.waterHeaterData.state;
            return state === 'on' ? '已开启' : '已关闭';
        },

        // 热水器状态样式类
        waterHeaterClass() {
            if (this.waterHeaterLoading) return 'loading';
            if (this.waterHeaterError) return 'error';
            return this.waterHeaterData?.state === 'on' ? 'status-active' : '';
        },

        // 空调温度显示
        airConditionerTemp() {
            if (this.airConditionerLoading) return '--';
            if (this.airConditionerError) return '--';
            if (!this.airConditionerData) return '--';

            const attributes = this.airConditionerData.attributes || {};
            return attributes.current_temperature || '--';
        },

        // 空调湿度显示
        airConditionerHumidity() {
            if (this.airConditionerLoading) return '--';
            if (this.airConditionerError) return '--';
            if (!this.airConditionerData) return '--';

            const attributes = this.airConditionerData.attributes || {};
            return attributes.current_humidity || '--';
        },

        // 空调目标温度显示
        airConditionerTargetTemp() {
            if (this.airConditionerLoading) return '--';
            if (this.airConditionerError) return '--';
            if (!this.airConditionerData) return '--';

            const attributes = this.airConditionerData.attributes || {};
            return attributes.temperature || '--';
        },

        // 空调模式显示
        airConditionerMode() {
            if (this.airConditionerLoading) return '--';
            if (this.airConditionerError) return '--';
            if (!this.airConditionerData) return '--';

            const state = this.airConditionerData.state;
            return state === 'off' ? '关闭' : state;
        },

        // 天气相关计算属性
        weatherTemp() {
            if (!this.weatherData?.temp) return '--';
            return this.weatherData.temp;
        },

        weatherCondition() {
            if (!this.weatherData?.condition) return '获取中...';
            return this.weatherData.condition;
        },

        weatherIcon() {
            const condition = this.weatherData?.condition;
            const iconMap = {
                '晴': '☀️',
                '多云': '⛅',
                '阴': '☁️',
                '雨': '🌧️',
                '小雨': '🌦️',
                '中雨': '🌧️',
                '大雨': '⛈️',
                '雷阵雨': '⛈️',
                '雪': '❄️',
                '小雪': '🌨️',
                '大雪': '❄️',
                '雾': '🌫️',
                '霾': '😷',
                '沙尘': '🌪️'
            };
            return iconMap[condition] || '🌤️';
        },

        weatherCityName() {
            if (!this.weatherData?.city) return '';
            return this.weatherData.city;
        },

        // 3D打印机在线状态
        printerStatusClass() {
            return this.printerOnline ? 'online' : 'offline';
        },

        // 背景名称显示
        backgroundName() {
            const nameMap = {
                'default': '默认蓝色渐变',
                'blue-gradient-waves': '蓝色渐变波浪',
                'particle-network': '粒子网络',
                'aurora-borealis': '极光效果',
                'starfield': '星空闪烁'
            };
            return nameMap[this.currentBackground] || '默认蓝色渐变';
        },

        // 背景模态框样式
        backgroundModalStyles() {
            return {
                '--start-x': this.backgroundClickX + 'px',
                '--start-y': this.backgroundClickY + 'px'
            };
        },

        // 通用弹出卡片样式
        genericModalStyles() {
            return {
                '--start-x': this.genericClickX + 'px',
                '--start-y': this.genericClickY + 'px'
            };
        },

        // 背景名称映射
        backgroundNameMap() {
            return {
                'default': '默认蓝色渐变',
                'blue-gradient-waves': '蓝色渐变波浪',
                'particle-network': '粒子网络',
                'aurora-borealis': '极光效果',
                'starfield': '星空闪烁'
            };
        },

        // 背景描述映射
        backgroundDescMap() {
            return {
                'default': '经典蓝色主题',
                'blue-gradient-waves': '流动的蓝色波浪',
                'particle-network': '动态粒子网络',
                'aurora-borealis': '绚丽极光效果',
                'starfield': '闪烁星空背景'
            };
        }
    },

        watch: {
        currentBackground(newVal) {
            // 当背景改变时，更新body的class和iframe
            if (this._backgroundTimer) {
                clearTimeout(this._backgroundTimer);
            }
            this._backgroundTimer = setTimeout(() => {
                this.updateBackground(newVal);
            }, 100);
        },

        // 监控氛围灯状态，当开启时启动每秒刷新计时器
        'ambientLightData.state'(newState, oldState) {
            if (newState === 'on' && oldState !== 'on') {
                // 氛围灯开启，启动每秒刷新计时器
                this.startAmbientLightTimerRefresh();
            } else if (newState === 'off' && oldState !== 'off') {
                // 氛围灯关闭，停止计时器刷新
                this.stopAmbientLightTimerRefresh();
            }
        }
    },

    mounted() {
        // 初始化背景
        this._currentBackground = null; // 确保第一次会加载
        this.updateBackground(this.currentBackground);

        // 加载保存的配置并更新全局常量
        const savedUrl = localStorage.getItem('haUrl');
        const savedToken = localStorage.getItem('accessToken');
        if (savedUrl) {
            this.haUrl = savedUrl;
            window.HA_URL = savedUrl;
        }
        if (savedToken) {
            this.accessToken = savedToken;
            window.ACCESS_TOKEN = savedToken;
        }

        // 加载自定义设置（暂时禁用，使用CSS默认值）
        // this.loadCustomSettings();

        // 检测连接状态
        this.checkConnection();

        // 初始化数据
        this.initAllDeviceData();
        this.initDeviceStates();
        this.startAutoRefresh();

        // 检查氛围灯初始状态，如果已开启则启动每秒刷新
        setTimeout(() => {
            if (this.ambientLightData && this.ambientLightData.state === 'on') {
                this.startAmbientLightTimerRefresh();
            }
        }, 500); // 等待数据初始化完成

        // 获取天气数据（静默失败）
        this.fetchWeather().catch(() => {});

        // 检查3D打印机状态（静默，不显示错误）
        this.checkPrinterStatus().catch(() => {});
        this.checkPrinterPowerStatus().catch(() => {});

        // 调试：确保弹窗初始状态为 false
        this.showPrinterModal = false;
        this.showPrinterPowerModal = false;

        // 延迟显示设备网格，让顶部和底部先渲染
        setTimeout(() => {
            this.showDeviceGrid = true;
        }, 100); // 100ms后显示设备网格
    },

    beforeUnmount() {
        this.stopAutoRefresh();
        this.stopAmbientLightTimerRefresh();
        // 清理打印机状态检查定时器
        if (this.printerStatusCheckInterval) {
            clearInterval(this.printerStatusCheckInterval);
        }
    },

    methods: {
        // 更新背景
        updateBackground(background) {
            const container = document.getElementById('dynamic-bg-container');
            console.log('Updating background to:', background);

            // 检查是否已经是这个背景，避免重复加载
            if (this._currentBackground === background) {
                console.log('Background is already', background, ', skipping');
                return;
            }
            this._currentBackground = background;

            // 保存到localStorage
            localStorage.setItem('currentBackground', background);

            if (background !== 'default') {
                document.body.classList.add('has-dynamic-background');
                // 创建或更新iframe
                container.innerHTML = '';
                const iframe = document.createElement('iframe');
                iframe.src = this.backgrounds[background];
                iframe.className = 'dynamic-background';
                iframe.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border: none;
                    z-index: -1;
                    pointer-events: none;
                    display: block;
                    width: 100vw;
                    height: 100vh;
                    background: transparent;
                `;
                console.log('Created iframe with src:', iframe.src);
                container.appendChild(iframe);
            } else {
                // 默认背景：移除iframe和body的class，不重新加载页面
                document.body.classList.remove('has-dynamic-background');
                container.innerHTML = '';
            }
        },

        // 背景切换
        changeBackground() {
            // v-model已经处理了数据绑定，这个方法只用于占位
            // 实际逻辑由watch currentBackground处理
        },

        // 扫地机器人控制
        toggleVacuumControl() {
            const state = this.vacuumData?.state;
            if (state === 'cleaning') {
                this.pauseVacuum();
            } else if (state === 'paused' || state === 'idle') {
                this.startVacuumClean();
            } else if (state === 'docked') {
                this.startVacuumClean();
            } else {
                this.returnVacuumToDock();
            }
        },

        async startVacuumClean() {
            try {
                await this.callService('vacuum', 'start', { entity_id: VACUUM_ENTITY });
                vant.showToast({ message: '开始清扫', type: 'success' });
                this.silentUpdateVacuumData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async pauseVacuum() {
            try {
                await this.callService('vacuum', 'pause', { entity_id: VACUUM_ENTITY });
                vant.showToast({ message: '已暂停', type: 'success' });
                this.silentUpdateVacuumData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async returnVacuumToDock() {
            try {
                await this.callService('vacuum', 'return_to_base', { entity_id: VACUUM_ENTITY });
                vant.showToast({ message: '返回充电座', type: 'success' });
                this.silentUpdateVacuumData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async turnOnDiningLight() {
            try {
                await this.callService('light', 'turn_on', { entity_id: DINING_LIGHT_ENTITY });
                vant.showToast({ message: '餐厅灯已开启', type: 'success' });
                this.silentUpdateDiningLightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async turnOffDiningLight() {
            try {
                await this.callService('light', 'turn_off', { entity_id: DINING_LIGHT_ENTITY });
                vant.showToast({ message: '餐厅灯已关闭', type: 'success' });
                this.silentUpdateDiningLightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async toggleDiningLight() {
            try {
                const currentState = this.diningLightData?.state;
                if (currentState === 'on') {
                    await this.turnOffDiningLight();
                } else {
                    await this.turnOnDiningLight();
                }
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        // 厨房灯控制
        async turnOnKitchenLight() {
            try {
                await this.callService('light', 'turn_on', { entity_id: KITCHEN_LIGHT_ENTITY });
                vant.showToast({ message: '厨房灯已开启', type: 'success' });
                this.silentUpdateKitchenLightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async turnOffKitchenLight() {
            try {
                await this.callService('light', 'turn_off', { entity_id: KITCHEN_LIGHT_ENTITY });
                vant.showToast({ message: '厨房灯已关闭', type: 'success' });
                this.silentUpdateKitchenLightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async toggleKitchenLight() {
            const currentState = this.kitchenLightData?.state;
            if (currentState === 'on') {
                await this.turnOffKitchenLight();
            } else {
                await this.turnOnKitchenLight();
            }
        },

        // 次卧灯控制
        async turnOnSecondBedroomLight() {
            try {
                await this.callService('light', 'turn_on', { entity_id: SECOND_BEDROOM_LIGHT_ENTITY });
                vant.showToast({ message: '次卧灯已开启', type: 'success' });
                this.silentUpdateSecondBedroomLightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async turnOffSecondBedroomLight() {
            try {
                await this.callService('light', 'turn_off', { entity_id: SECOND_BEDROOM_LIGHT_ENTITY });
                vant.showToast({ message: '次卧灯已关闭', type: 'success' });
                this.silentUpdateSecondBedroomLightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async toggleSecondBedroomLight() {
            const currentState = this.secondBedroomLightData?.state;
            if (currentState === 'on') {
                await this.turnOffSecondBedroomLight();
            } else {
                await this.turnOnSecondBedroomLight();
            }
        },

        // 过道1灯控制
        async turnOnCorridor1Light() {
            try {
                await this.callService('light', 'turn_on', { entity_id: CORRIDOR1_LIGHT_ENTITY });
                vant.showToast({ message: '过道1灯已开启', type: 'success' });
                this.silentUpdateCorridor1LightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async turnOffCorridor1Light() {
            try {
                await this.callService('light', 'turn_off', { entity_id: CORRIDOR1_LIGHT_ENTITY });
                vant.showToast({ message: '过道1灯已关闭', type: 'success' });
                this.silentUpdateCorridor1LightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async toggleCorridor1Light() {
            const currentState = this.corridor1LightData?.state;
            if (currentState === 'on') {
                await this.turnOffCorridor1Light();
            } else {
                await this.turnOnCorridor1Light();
            }
        },

        // 过道3灯控制
        async turnOnCorridor3Light() {
            try {
                await this.callService('light', 'turn_on', { entity_id: CORRIDOR3_LIGHT_ENTITY });
                vant.showToast({ message: '过道3灯已开启', type: 'success' });
                this.silentUpdateCorridor3LightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async turnOffCorridor3Light() {
            try {
                await this.callService('light', 'turn_off', { entity_id: CORRIDOR3_LIGHT_ENTITY });
                vant.showToast({ message: '过道3灯已关闭', type: 'success' });
                this.silentUpdateCorridor3LightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async toggleCorridor3Light() {
            const currentState = this.corridor3LightData?.state;
            if (currentState === 'on') {
                await this.turnOffCorridor3Light();
            } else {
                await this.turnOnCorridor3Light();
            }
        },

        // 客厅灯控制
        async turnOnLivingRoomLight() {
            try {
                await this.callService('light', 'turn_on', { entity_id: LIVING_ROOM_LIGHT_ENTITY });
                vant.showToast({ message: '客厅灯已开启', type: 'success' });
                this.silentUpdateLivingRoomLightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async turnOffLivingRoomLight() {
            try {
                await this.callService('light', 'turn_off', { entity_id: LIVING_ROOM_LIGHT_ENTITY });
                vant.showToast({ message: '客厅灯已关闭', type: 'success' });
                this.silentUpdateLivingRoomLightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async toggleLivingRoomLight() {
            const currentState = this.livingRoomLightData?.state;
            if (currentState === 'on') {
                await this.turnOffLivingRoomLight();
            } else {
                await this.turnOnLivingRoomLight();
            }
        },

        // 卫生间灯控制
        async turnOnBathroomLight() {
            try {
                await this.callService('light', 'turn_on', { entity_id: BATHROOM_LIGHT_ENTITY });
                vant.showToast({ message: '卫生间灯已开启', type: 'success' });
                this.silentUpdateBathroomLightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async turnOffBathroomLight() {
            try {
                await this.callService('light', 'turn_off', { entity_id: BATHROOM_LIGHT_ENTITY });
                vant.showToast({ message: '卫生间灯已关闭', type: 'success' });
                this.silentUpdateBathroomLightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async toggleBathroomLight() {
            const currentState = this.bathroomLightData?.state;
            if (currentState === 'on') {
                await this.turnOffBathroomLight();
            } else {
                await this.turnOnBathroomLight();
            }
        },

        // 客卧灯控制
        async turnOnGuestBedroomLight() {
            try {
                await this.callService('light', 'turn_on', { entity_id: GUEST_BEDROOM_LIGHT_ENTITY });
                vant.showToast({ message: '客卧灯已开启', type: 'success' });
                this.silentUpdateGuestBedroomLightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async turnOffGuestBedroomLight() {
            try {
                await this.callService('light', 'turn_off', { entity_id: GUEST_BEDROOM_LIGHT_ENTITY });
                vant.showToast({ message: '客卧灯已关闭', type: 'success' });
                this.silentUpdateGuestBedroomLightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async toggleGuestBedroomLight() {
            const currentState = this.guestBedroomLightData?.state;
            if (currentState === 'on') {
                await this.turnOffGuestBedroomLight();
            } else {
                await this.turnOnGuestBedroomLight();
            }
        },

        // 主卧灯控制
        async turnOnMasterBedroomLight() {
            try {
                await this.callService('light', 'turn_on', { entity_id: MASTER_BEDROOM_LIGHT_ENTITY });
                vant.showToast({ message: '主卧灯已开启', type: 'success' });
                this.silentUpdateMasterBedroomLightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async turnOffMasterBedroomLight() {
            try {
                await this.callService('light', 'turn_off', { entity_id: MASTER_BEDROOM_LIGHT_ENTITY });
                vant.showToast({ message: '主卧灯已关闭', type: 'success' });
                this.silentUpdateMasterBedroomLightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async toggleMasterBedroomLight() {
            const currentState = this.masterBedroomLightData?.state;
            if (currentState === 'on') {
                await this.turnOffMasterBedroomLight();
            } else {
                await this.turnOnMasterBedroomLight();
            }
        },

        // 空调制冷
        async setAirConditionerCool() {
            try {
                await this.callService('climate', 'set_temperature', {
                    entity_id: AIR_CONDITIONER_ENTITY,
                    hvac_mode: 'cool',
                    temperature: 24
                });
                vant.showToast({ message: '空调已设置为制冷模式', type: 'success' });
                this.silentUpdateAirConditionerData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        // 空调制热
        async setAirConditionerHeat() {
            try {
                await this.callService('climate', 'set_temperature', {
                    entity_id: AIR_CONDITIONER_ENTITY,
                    hvac_mode: 'heat',
                    temperature: 26
                });
                vant.showToast({ message: '空调已设置为制热模式', type: 'success' });
                this.silentUpdateAirConditionerData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        // 获取天气数据
        async fetchWeather() {
            try {
                this.weatherLoading = true;

                // 使用免费天气API，通过JSONP方式请求避免CORS问题
                const url = `https://api.asilu.com/weather/weather/?city=${encodeURIComponent(WEATHER_API_CITY)}&callback=weatherCallback`;

                const data = await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = url;

                    window.weatherCallback = (result) => {
                        document.body.removeChild(script);
                        delete window.weatherCallback;
                        if (result && result.list && result.list.length > 0) {
                            resolve(result);
                        } else {
                            reject(new Error('天气数据格式异常'));
                        }
                    };

                    script.onerror = () => {
                        document.body.removeChild(script);
                        delete window.weatherCallback;
                        reject(new Error('天气请求失败'));
                    };

                    document.body.appendChild(script);
                });

                if (data && data.list && data.list.length > 0) {
                    const weather = data.list[0];
                    // 解析温度，去掉℃符号
                    const tempStr = weather.temp || '';
                    const tempMatch = tempStr.match(/(-?\d+)/);
                    const temp = tempMatch ? tempMatch[1] : '--';

                    this.weatherData = {
                        temp: temp,
                        condition: weather.weather,
                        city: data.city || WEATHER_API_CITY
                    };
                }
            } catch (error) {
                this.weatherError = error.message;
                this.weatherData = {
                    temp: '--',
                    condition: '获取失败',
                    city: WEATHER_API_CITY
                };
            } finally {
                this.weatherLoading = false;
            }
        },

        showAmbientLightSettings() {
            this.ambientLightSettingsVisible = true;
        },

        // 氛围灯开关控制
        async toggleAmbientLight() {
            try {
                const currentState = this.ambientLightData?.state;
                if (currentState === 'on') {
                    await this.callService('light', 'turn_off', { entity_id: AMBIENT_LIGHT_ENTITY });
                    vant.showToast({ message: '氛围灯已关闭', type: 'success' });
                } else {
                    await this.callService('light', 'turn_on', { entity_id: AMBIENT_LIGHT_ENTITY });
                    vant.showToast({ message: '氛围灯已开启', type: 'success' });
                }
                this.silentUpdateAmbientLightData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async incrementPetFeeding() {
            try {
                // 设置投喂份数为1
                await this.callService('number', 'set_value', {
                    entity_id: PET_FEEDING_NUMBER,
                    value: 1
                });

                vant.showToast({ message: '投喂成功', type: 'success' });
                this.silentUpdatePetFeedingData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async resetPetFeeding() {
            try {
                await this.callService('counter', 'reset', { entity_id: PET_FEEDING_ENTITY });
                vant.showToast({ message: '计数已重置', type: 'success' });
                this.silentUpdatePetFeedingData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        // 调用Home Assistant服务
        async callService(domain, service, data) {
            const response = await fetch(`${HA_URL}/api/services/${domain}/${service}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`服务调用失败: HTTP ${response.status}`);
            }

            return await response.json();
        },

        // 设置页面方法
        saveHaConfig() {
            localStorage.setItem('haUrl', this.haUrl);
            localStorage.setItem('accessToken', this.accessToken);
            // 更新全局变量
            window.HA_URL = this.haUrl;
            window.ACCESS_TOKEN = this.accessToken;
            vant.showToast({ message: '配置已保存', type: 'success' });
        },

        async testConnection() {
            this.connectionError = null;
            this.connectionStatus = null;  // 重置连接状态

            try {
                vant.showToast({
                    message: '正在测试连接...',
                    type: 'loading',
                    duration: 0
                });

                const testResponse = await fetch(`${HA_URL}/api/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!testResponse.ok) {
                    throw new Error(`基础连接测试失败: HTTP ${testResponse.status}`);
                }

                await testResponse.json();

                await this.initAllDeviceData();

                vant.showToast({
                    message: '连接测试成功',
                    type: 'success'
                });

                this.connectionStatus = true;  // 连接成功

            } catch (error) {
                this.connectionError = this.getDetailedErrorMessage(error);
                this.connectionStatus = false;  // 连接失败

                vant.showToast({
                    message: '连接测试失败',
                    type: 'fail'
                });
            }
        },

        async checkConnection() {
            // 默认为未连接
            this.connectionStatus = false;

            try {
                const testResponse = await fetch(`${HA_URL}/api/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (testResponse.ok) {
                    this.connectionStatus = true;  // 连接成功
                }
            } catch (error) {
                this.connectionStatus = false;  // 连接失败
            }
        },

        getDetailedErrorMessage(error) {
            let detailedMessage = `错误类型: ${error.name}\n错误信息: ${error.message}\n\n`;

            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                detailedMessage += '🔍 可能原因:\n';
                detailedMessage += '1. 网络不可达 - 请检查HA服务器是否在线\n';
                detailedMessage += '2. CORS限制 - 请检查HA的CORS配置\n';
                detailedMessage += '3. 证书问题 - 如果使用HTTPS请检查证书有效性\n';
                detailedMessage += '4. 防火墙阻止 - 请检查防火墙设置\n\n                                                                                                                                                                                                                                                                ';
                detailedMessage += '💡 建议排查步骤:\n';
                detailedMessage += '- 在浏览器中直接访问 ' + HA_URL + ' 确认HA可访问\n';
                detailedMessage += '- 检查浏览器控制台的Network标签查看详细错误\n';
                detailedMessage += '- 检查HA的configuration.yaml中的CORS配置\n';
                detailedMessage += '- 参考页面顶部的CORS配置帮助\n';
            }

            if (error.message.includes('HTTP')) {
                const statusMatch = error.message.match(/HTTP (\d+)/);
                if (statusMatch) {
                    const statusCode = statusMatch[1];
                    detailedMessage += `HTTP状态码: ${statusCode}\n`;

                    switch(statusCode) {
                        case '401':
                            detailedMessage += '🔐 未授权 - 令牌无效或已过期\n';
                            break;
                        case '404':
                            detailedMessage += '📭 未找到 - 实体或API端点不存在\n';
                            break;
                        case '403':
                            detailedMessage += '🚫 禁止访问 - 权限不足\n';
                            break;
                        case '500':
                            detailedMessage += '⚙️ 服务器内部错误\n';
                            break;
                    }
                }
            }

            return detailedMessage;
        },

        async fetchDeviceState(entityId) {
            if (!entityId) {
                return null;
            }

            try {
                const response = await fetch(`${HA_URL}/api/states/${entityId}`, {
                    headers: {
                        'Authorization': `Bearer ${ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态码: ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                throw error;
            }
        },

        async initPetFeedingData() {
            try {
                this.petFeedingLoading = true;
                this.petFeedingError = null;
                this.petFeedingData = await this.fetchDeviceState(PET_FEEDING_ENTITY);
            } catch (error) {
                this.petFeedingError = error.message;
            } finally {
                this.petFeedingLoading = false;
            }
        },

        async initAmbientLightData() {
            try {
                this.ambientLightLoading = true;
                this.ambientLightError = null;
                this.ambientLightData = await this.fetchDeviceState(AMBIENT_LIGHT_ENTITY);
            } catch (error) {
                this.ambientLightError = error.message;
            } finally {
                this.ambientLightLoading = false;
            }
        },

        async initAmbientLightTimerData() {
            try {
                this.ambientLightTimerLoading = true;
                this.ambientLightTimerError = null;
                this.ambientLightTimerData = await this.fetchDeviceState(AMBIENT_LIGHT_TIMER_ENTITY);
            } catch (error) {
                this.ambientLightTimerError = error.message;
            } finally {
                this.ambientLightTimerLoading = false;
            }
        },

        async initVacuumData() {
            try {
                this.vacuumLoading = true;
                this.vacuumError = null;
                this.vacuumData = await this.fetchDeviceState(VACUUM_ENTITY);
            } catch (error) {
                this.vacuumError = error.message;
            } finally {
                this.vacuumLoading = false;
            }
        },

        async initDiningLightData() {
            try {
                this.diningLightLoading = true;
                this.diningLightError = null;
                this.diningLightData = await this.fetchDeviceState(DINING_LIGHT_ENTITY);
            } catch (error) {
                this.diningLightError = error.message;
            } finally {
                this.diningLightLoading = false;
            }
        },

        async initKitchenLightData() {
            try {
                this.kitchenLightLoading = true;
                this.kitchenLightError = null;
                this.kitchenLightData = await this.fetchDeviceState(KITCHEN_LIGHT_ENTITY);
            } catch (error) {
                this.kitchenLightError = error.message;
            } finally {
                this.kitchenLightLoading = false;
            }
        },

        async initSecondBedroomLightData() {
            try {
                this.secondBedroomLightLoading = true;
                this.secondBedroomLightError = null;
                this.secondBedroomLightData = await this.fetchDeviceState(SECOND_BEDROOM_LIGHT_ENTITY);
            } catch (error) {
                this.secondBedroomLightError = error.message;
            } finally {
                this.secondBedroomLightLoading = false;
            }
        },

        async initCorridor1LightData() {
            try {
                this.corridor1LightLoading = true;
                this.corridor1LightError = null;
                this.corridor1LightData = await this.fetchDeviceState(CORRIDOR1_LIGHT_ENTITY);
            } catch (error) {
                this.corridor1LightError = error.message;
            } finally {
                this.corridor1LightLoading = false;
            }
        },

        async initCorridor3LightData() {
            try {
                this.corridor3LightLoading = true;
                this.corridor3LightError = null;
                this.corridor3LightData = await this.fetchDeviceState(CORRIDOR3_LIGHT_ENTITY);
            } catch (error) {
                this.corridor3LightError = error.message;
            } finally {
                this.corridor3LightLoading = false;
            }
        },

        async initLivingRoomLightData() {
            try {
                this.livingRoomLightLoading = true;
                this.livingRoomLightError = null;
                this.livingRoomLightData = await this.fetchDeviceState(LIVING_ROOM_LIGHT_ENTITY);
            } catch (error) {
                this.livingRoomLightError = error.message;
            } finally {
                this.livingRoomLightLoading = false;
            }
        },

        async initBathroomLightData() {
            try {
                this.bathroomLightLoading = true;
                this.bathroomLightError = null;
                this.bathroomLightData = await this.fetchDeviceState(BATHROOM_LIGHT_ENTITY);
            } catch (error) {
                this.bathroomLightError = error.message;
            } finally {
                this.bathroomLightLoading = false;
            }
        },

        async initGuestBedroomLightData() {
            try {
                this.guestBedroomLightLoading = true;
                this.guestBedroomLightError = null;
                this.guestBedroomLightData = await this.fetchDeviceState(GUEST_BEDROOM_LIGHT_ENTITY);
            } catch (error) {
                this.guestBedroomLightError = error.message;
            } finally {
                this.guestBedroomLightLoading = false;
            }
        },

        async initMasterBedroomLightData() {
            try {
                this.masterBedroomLightLoading = true;
                this.masterBedroomLightError = null;
                this.masterBedroomLightData = await this.fetchDeviceState(MASTER_BEDROOM_LIGHT_ENTITY);
            } catch (error) {
                this.masterBedroomLightError = error.message;
            } finally {
                this.masterBedroomLightLoading = false;
            }
        },

        async initWaterHeaterData() {
            try {
                this.waterHeaterLoading = true;
                this.waterHeaterError = null;
                this.waterHeaterData = await this.fetchDeviceState(WATER_HEATER_ENTITY);
            } catch (error) {
                this.waterHeaterError = error.message;
            } finally {
                this.waterHeaterLoading = false;
            }
        },

        async initAirConditionerData() {
            try {
                this.airConditionerLoading = true;
                this.airConditionerError = null;
                this.airConditionerData = await this.fetchDeviceState(AIR_CONDITIONER_ENTITY);
            } catch (error) {
                this.airConditionerError = error.message;
            } finally {
                this.airConditionerLoading = false;
            }
        },

        // 静默更新宠物投喂数据(不显示loading状态)
        async silentUpdatePetFeedingData() {
            try {
                const data = await this.fetchDeviceState(PET_FEEDING_ENTITY);
                if (data) {
                    this.petFeedingData = data;
                    this.petFeedingError = null;
                }
            } catch (error) {
            }
        },

        // 静默更新氛围灯数据
        async silentUpdateAmbientLightData() {
            try {
                const data = await this.fetchDeviceState(AMBIENT_LIGHT_ENTITY);
                if (data) {
                    this.ambientLightData = data;
                    this.ambientLightError = null;
                }
            } catch (error) {
            }
        },

        // 静默更新氛围灯计时器数据
        async silentUpdateAmbientLightTimerData() {
            try {
                const data = await this.fetchDeviceState(AMBIENT_LIGHT_TIMER_ENTITY);
                if (data) {
                    this.ambientLightTimerData = data;
                    this.ambientLightTimerError = null;
                }
            } catch (error) {
            }
        },

        // 静默更新扫地机器人数据
        async silentUpdateVacuumData() {
            try {
                const data = await this.fetchDeviceState(VACUUM_ENTITY);
                if (data) {
                    this.vacuumData = data;
                    this.vacuumError = null;
                }
            } catch (error) {
            }
        },

        // 静默更新餐厅灯数据
        async silentUpdateDiningLightData() {
            try {
                const data = await this.fetchDeviceState(DINING_LIGHT_ENTITY);
                if (data) {
                    this.diningLightData = data;
                    this.diningLightError = null;
                }
            } catch (error) {
            }
        },

        async silentUpdateKitchenLightData() {
            try {
                const data = await this.fetchDeviceState(KITCHEN_LIGHT_ENTITY);
                if (data) {
                    this.kitchenLightData = data;
                    this.kitchenLightError = null;
                }
            } catch (error) {
            }
        },

        async silentUpdateSecondBedroomLightData() {
            try {
                const data = await this.fetchDeviceState(SECOND_BEDROOM_LIGHT_ENTITY);
                if (data) {
                    this.secondBedroomLightData = data;
                    this.secondBedroomLightError = null;
                }
            } catch (error) {
            }
        },

        async silentUpdateCorridor1LightData() {
            try {
                const data = await this.fetchDeviceState(CORRIDOR1_LIGHT_ENTITY);
                if (data) {
                    this.corridor1LightData = data;
                    this.corridor1LightError = null;
                }
            } catch (error) {
            }
        },

        async silentUpdateCorridor3LightData() {
            try {
                const data = await this.fetchDeviceState(CORRIDOR3_LIGHT_ENTITY);
                if (data) {
                    this.corridor3LightData = data;
                    this.corridor3LightError = null;
                }
            } catch (error) {
            }
        },

        async silentUpdateLivingRoomLightData() {
            try {
                const data = await this.fetchDeviceState(LIVING_ROOM_LIGHT_ENTITY);
                if (data) {
                    this.livingRoomLightData = data;
                    this.livingRoomLightError = null;
                }
            } catch (error) {
            }
        },

        async silentUpdateBathroomLightData() {
            try {
                const data = await this.fetchDeviceState(BATHROOM_LIGHT_ENTITY);
                if (data) {
                    this.bathroomLightData = data;
                    this.bathroomLightError = null;
                }
            } catch (error) {
            }
        },

        async silentUpdateGuestBedroomLightData() {
            try {
                const data = await this.fetchDeviceState(GUEST_BEDROOM_LIGHT_ENTITY);
                if (data) {
                    this.guestBedroomLightData = data;
                    this.guestBedroomLightError = null;
                }
            } catch (error) {
            }
        },

        async silentUpdateMasterBedroomLightData() {
            try {
                const data = await this.fetchDeviceState(MASTER_BEDROOM_LIGHT_ENTITY);
                if (data) {
                    this.masterBedroomLightData = data;
                    this.masterBedroomLightError = null;
                }
            } catch (error) {
            }
        },

        async silentUpdateWaterHeaterData() {
            try {
                const data = await this.fetchDeviceState(WATER_HEATER_ENTITY);
                if (data) {
                    this.waterHeaterData = data;
                    this.waterHeaterError = null;
                }
            } catch (error) {
            }
        },

        async silentUpdateAirConditionerData() {
            try {
                const data = await this.fetchDeviceState(AIR_CONDITIONER_ENTITY);
                if (data) {
                    this.airConditionerData = data;
                    this.airConditionerError = null;
                }
            } catch (error) {
            }
        },

        // 静默更新所有设备数据
        async silentUpdateAllData() {
            await Promise.all([
                this.silentUpdatePetFeedingData(),
                this.silentUpdateAmbientLightData(),
                this.silentUpdateAmbientLightTimerData(),
                this.silentUpdateVacuumData(),
                this.silentUpdateDiningLightData(),
                this.silentUpdateKitchenLightData(),
                this.silentUpdateSecondBedroomLightData(),
                this.silentUpdateCorridor1LightData(),
                this.silentUpdateCorridor3LightData(),
                this.silentUpdateLivingRoomLightData(),
                this.silentUpdateBathroomLightData(),
                this.silentUpdateGuestBedroomLightData(),
                this.silentUpdateMasterBedroomLightData(),
                this.silentUpdateWaterHeaterData(),
                this.silentUpdateAirConditionerData()
            ]);
        },

        async initAllDeviceData() {
            this.connectionError = null;

            try {
                await Promise.all([
                    this.initPetFeedingData(),
                    this.initAmbientLightData(),
                    this.initAmbientLightTimerData(),
                    this.initVacuumData(),
                    this.initDiningLightData(),
                    this.initKitchenLightData(),
                    this.initSecondBedroomLightData(),
                    this.initCorridor1LightData(),
                    this.initCorridor3LightData(),
                    this.initLivingRoomLightData(),
                    this.initBathroomLightData(),
                    this.initGuestBedroomLightData(),
                    this.initMasterBedroomLightData(),
                    this.initWaterHeaterData(),
                    this.initAirConditionerData()
                ]);

                // 首次加载完成
                this.isFirstLoading = false;
            } catch (error) {
            }
        },

        async updateAllData() {
            // 手动刷新使用普通更新(显示loading状态)
            await this.initAllDeviceData();

            if (!this.petFeedingError && !this.ambientLightError && !this.vacuumError) {
                vant.showToast({
                    message: '数据更新成功',
                    type: 'success'
                });
            }
        },

        // 自动刷新功能
        startAutoRefresh() {
            if (!this.autoRefreshEnabled) return;

            this.stopAutoRefresh();

            this.autoRefreshTimer = setInterval(() => {
                this.autoRefreshData();
            }, this.autoRefreshInterval);
        },

        // 重启自动刷新（在改变刷新频率时使用）
        restartAutoRefresh() {
            this.stopAutoRefresh();
            this.startAutoRefresh();
        },

        stopAutoRefresh() {
            if (this.autoRefreshTimer) {
                clearInterval(this.autoRefreshTimer);
                this.autoRefreshTimer = null;
            }
        },

        // 氛围灯计时器每秒刷新
        startAmbientLightTimerRefresh() {
            this.stopAmbientLightTimerRefresh();

            this.ambientLightTimerRefreshTimer = setInterval(() => {
                this.silentUpdateAmbientLightTimerData();
            }, 1000); // 1秒刷新一次
        },

        stopAmbientLightTimerRefresh() {
            if (this.ambientLightTimerRefreshTimer) {
                clearInterval(this.ambientLightTimerRefreshTimer);
                this.ambientLightTimerRefreshTimer = null;
            }
        },

        async autoRefreshData() {
            if (this.isRefreshing) return;

            try {
                this.isRefreshing = true;

                // 检查是否需要高频刷新（通过刷新间隔判断）
                const isHighRefreshMode = this.autoRefreshInterval === 1000;

                if (isHighRefreshMode) {
                    // 高频刷新：更新所有设备状态
                    await this.silentUpdateAllData();

                    // 检查设备状态是否稳定
                    this.checkDeviceStability();
                } else {
                    // 低频刷新：只更新动态设备状态，减少网络请求
                    await this.updateAllDeviceStates();
                }
            } finally {
                this.isRefreshing = false;
            }
        },

        // 检查设备状态稳定性
        checkDeviceStability() {
            DEVICE_CARDS.forEach(device => {
                if (!device.stateEntity) return;

                const currentState = this.deviceStates[device.stateEntity]?.state;

                // 获取历史状态
                const history = this.deviceStateHistory[device.stateEntity] || [];

                // 添加当前状态到历史
                history.push(currentState);
                if (history.length > 3) {
                    history.shift(); // 只保留最近3次状态
                }

                this.deviceStateHistory = {
                    ...this.deviceStateHistory,
                    [device.stateEntity]: history
                };

                // 检查最近3次状态是否一致
                const isStable = history.length === 3 && history.every(s => s === history[0]);

                if (isStable) {
                    // 状态已稳定，可以停止高频刷新
                    // 检查是否所有设备都稳定
                    const allStable = Object.values(this.deviceStateHistory).every(
                        h => h && h.length === 3 && h.every((s, i, arr) => s === arr[0])
                    );

                    if (allStable) {
                        // 所有设备状态稳定，恢复低频刷新
                        this.autoRefreshInterval = 3000;
                        this.restartAutoRefresh();
                    }
                }
            });
        },

        applyRefreshInterval() {
            // 更新自动刷新间隔
            this.autoRefreshInterval = this.refreshIntervalSeconds * 1000;

            if (this.autoRefreshEnabled) {
                this.startAutoRefresh();
                vant.showToast({
                    message: `刷新间隔已设置为 ${this.refreshIntervalSeconds}秒`,
                    type: 'success'
                });
            }
        },

        parseIniFile(content) {
            const result = {};
            let currentSection = '';

            const lines = content.split('\n');
            lines.forEach(line => {
                line = line.trim();
                if (!line || line.startsWith(';') || line.startsWith('#')) return;

                const sectionMatch = line.match(/^\[([^\]]+)\]$/);
                if (sectionMatch) {
                    currentSection = sectionMatch[1];
                    result[currentSection] = {};
                    return;
                }

                const keyValueMatch = line.match(/^([^=]+)=(.*)$/);
                if (keyValueMatch && currentSection) {
                    const key = keyValueMatch[1].trim();
                    const value = keyValueMatch[2].trim();
                    result[currentSection][key] = value;
                }
            });

            return result;
        },

        // ==================== 动态设备卡片处理方法 ====================

        // 获取设备状态（从缓存）
        getCachedDeviceState(entityId) {
            // 如果有过渡状态，优先返回过渡状态
            if (this.deviceTransitionStates[entityId] !== undefined) {
                return this.deviceTransitionStates[entityId];
            }
            return this.deviceStates[entityId]?.state || 'off';
        },

        // 获取传感器值
        getSensorValue(entityId) {
            if (!entityId) return '--';
            const state = this.getCachedDeviceState(entityId);
            if (!state || state === 'unknown' || state === 'unavailable') return '--';
            return parseFloat(state).toFixed(1);
        },

        // 获取设备状态文本
        getDeviceStatusText(device) {
            const deviceType = device.deviceType;

            // display类型设备不需要状态文本
            if (deviceType === 'display') {
                return '';
            }

            const state = this.getCachedDeviceState(device.stateEntity);

            if (deviceType === 'vacuum') {
                const vacuumMap = {
                    'cleaning': '清扫中',
                    'paused': '已暂停',
                    'idle': '空闲',
                    'docked': '已归位',
                    'returning': '返回中'
                };
                return vacuumMap[state] || state;
            } else if (deviceType === 'feeder') {
                const deviceData = this.deviceStates[device.stateEntity];
                const count = deviceData?.attributes?.value || deviceData?.state || 0;
                return `${count}次`;
            } else {
                return state === 'on' ? '开启' : '关闭';
            }
        },

        // 获取设备状态样式类
        getDeviceStatusClass(device) {
            const deviceType = device.deviceType;

            // display类型设备不需要状态样式
            if (deviceType === 'display') {
                return '';
            }

            const state = this.getCachedDeviceState(device.stateEntity);

            if (deviceType === 'vacuum') {
                if (state === 'cleaning') return 'vacuum-cleaning';
                if (state === 'docked') return 'vacuum-docked';
                return '';
            } else if (deviceType === 'feeder') {
                return '';
            } else {
                return state === 'on' ? 'light-on' : 'light-off';
            }
        },

        // 处理设备点击
        async handleDeviceClick(device) {
            const deviceType = device.deviceType;

            // display类型设备不处理点击
            if (deviceType === 'display') {
                return;
            }

            const state = this.getCachedDeviceState(device.stateEntity);

            try {
                if (deviceType === 'light') {
                    // 灯具开关 - 使用过渡状态
                    const newState = state === 'on' ? 'off' : 'on';
                    this.deviceTransitionStates = {
                        ...this.deviceTransitionStates,
                        [device.stateEntity]: newState
                    };

                    if (state === 'on') {
                        await this.callService('light', 'turn_off', { entity_id: device.controlEntity });
                    } else {
                        await this.callService('light', 'turn_on', { entity_id: device.controlEntity });
                    }

                    // 立即清空该设备的历史状态
                    this.deviceStateHistory = {
                        ...this.deviceStateHistory,
                        [device.stateEntity]: []
                    };

                    // 启动高频刷新（1秒间隔），快速获取设备真实状态
                    this.autoRefreshInterval = 1000;
                    this.restartAutoRefresh();

                    // 延迟3秒后恢复3秒刷新，并清除过渡状态
                    setTimeout(() => {
                        this.getDeviceStateData(device.stateEntity);
                        delete this.deviceTransitionStates[device.stateEntity];
                    }, 3000);
                } else if (deviceType === 'vacuum') {
                    // 扫地机控制
                    let newState;
                    if (state === 'cleaning') {
                        newState = 'paused';
                        await this.callService('vacuum', 'pause', { entity_id: device.controlEntity });
                    } else if (state === 'paused' || state === 'idle' || state === 'docked') {
                        newState = 'cleaning';
                        await this.callService('vacuum', 'start', { entity_id: device.controlEntity });
                    } else {
                        newState = 'returning';
                        await this.callService('vacuum', 'return_to_base', { entity_id: device.controlEntity });
                    }

                    // 使用过渡状态
                    this.deviceTransitionStates = {
                        ...this.deviceTransitionStates,
                        [device.stateEntity]: newState
                    };

                    // 立即清空该设备的历史状态
                    this.deviceStateHistory = {
                        ...this.deviceStateHistory,
                        [device.stateEntity]: []
                    };

                    // 启动高频刷新（1秒间隔），快速获取设备真实状态
                    this.autoRefreshInterval = 1000;
                    this.restartAutoRefresh();

                    // 延迟3秒后恢复3秒刷新，并清除过渡状态
                    setTimeout(() => {
                        this.getDeviceStateData(device.stateEntity);
                        delete this.deviceTransitionStates[device.stateEntity];
                    }, 3000);
                } else if (deviceType === 'feeder') {
                    // 宠物投喂
                    await this.callService('number', 'set_value', {
                        entity_id: device.controlEntity,
                        value: 1
                    });
                    vant.showToast({ message: '投喂成功', type: 'success' });
                    // 立即刷新该设备状态
                    this.getDeviceStateData(device.stateEntity);
                } else if (deviceType === 'switch') {
                    // 开关控制（包括热水器等开关设备）- 使用过渡状态
                    const newState = state === 'on' ? 'off' : 'on';
                    this.deviceTransitionStates = {
                        ...this.deviceTransitionStates,
                        [device.stateEntity]: newState
                    };

                    if (state === 'on') {
                        await this.callService('switch', 'turn_off', { entity_id: device.controlEntity });
                    } else {
                        await this.callService('switch', 'turn_on', { entity_id: device.controlEntity });
                    }

                    // 延迟1.5秒后刷新状态，给设备响应时间
                    setTimeout(() => {
                        this.getDeviceStateData(device.stateEntity);
                        delete this.deviceTransitionStates[device.stateEntity];

                        // 清空该设备的历史状态
                        this.deviceStateHistory = {
                            ...this.deviceStateHistory,
                            [device.stateEntity]: []
                        };

                        // 启动高频刷新（1秒间隔），快速获取设备真实状态
                        this.autoRefreshInterval = 1000;
                        this.restartAutoRefresh();
                    }, 1500);
                } else if (deviceType === 'url') {
                    // URL链接类设备（如3D打印机等）- 打开弹窗
                    // 只有在打印机在线时才打开弹窗
                    if (this.printerOnline) {
                        this.openPrinterModal(device.controlUrl);
                    } else {
                        vant.showToast({ message: '打印机离线，无法访问', type: 'fail' });
                    }
                }
            } catch (error) {
                // 操作失败，静默处理，UI会在下次刷新时自动恢复
            }
        },

        // 初始化所有设备状态
        initDeviceStates() {
            DEVICE_CARDS.forEach(device => {
                // 跳过URL类型的设备（如3D打印机），它们不需要HA状态
                if (device.deviceType === 'url') {
                    return;
                }

                // display类型设备需要获取传感器数据
                if (device.deviceType === 'display' && device.sensors) {
                    Object.values(device.sensors).forEach(sensorEntityId => {
                        if (sensorEntityId) {
                            this.getDeviceStateData(sensorEntityId);
                        }
                    });
                    return;
                }

                // 普通设备获取stateEntity
                if (device.stateEntity) {
                    this.getDeviceStateData(device.stateEntity);
                }
            });
        },

        // 获取设备状态数据
        async getDeviceStateData(entityId) {
            if (!entityId) return;

            try {
                const data = await this.fetchDeviceState(entityId);
                if (data) {
                    // 使用 Vue.set 或直接赋值来触发响应式更新
                    this.deviceStates[entityId] = data;
                }
            } catch (error) {
                // 静默失败，不显示错误
            }
        },

        // 更新所有设备状态
        async updateAllDeviceStates() {
            const updatePromises = [];

            DEVICE_CARDS.forEach(device => {
                // 跳过URL类型的设备（如3D打印机），它们不需要HA状态
                if (device.deviceType === 'url') {
                    return;
                }

                // display类型设备需要获取传感器数据
                if (device.deviceType === 'display' && device.sensors) {
                    Object.values(device.sensors).forEach(sensorEntityId => {
                        if (sensorEntityId) {
                            updatePromises.push(this.getDeviceStateData(sensorEntityId));
                        }
                    });
                    return;
                }

                // 普通设备获取stateEntity
                if (device.stateEntity) {
                    updatePromises.push(this.getDeviceStateData(device.stateEntity));
                }
            });

            // 等待所有设备状态更新完成
            await Promise.all(updatePromises);
        },

        // ==================== 3D打印机控制方法 ====================

        // 检查3D打印机在线状态
        async checkPrinterStatus() {
            try {
                const printerUrl = 'http://192.168.4.6/?printer=98cf22853c45c005073ff07237fed9d9#/';
                await fetch(printerUrl, {
                    method: 'GET',
                    mode: 'no-cors',
                    signal: AbortSignal.timeout(5000) // 5秒超时
                });
                // 如果请求完成（即使被CORS阻止），也认为打印机在线
                this.printerOnline = true;
            } catch (error) {
                // 如果请求失败，认为打印机离线
                this.printerOnline = false;
                // 不输出错误日志，避免控制台刷屏
            }
        },

        // 检查3D打印机电源状态
        async checkPrinterPowerStatus() {
            try {
                const printerDevice = DEVICE_CARDS.find(card => card.deviceType === 'url');
                if (printerDevice && printerDevice.powerEntity) {
                    const state = await this.fetchDeviceState(printerDevice.powerEntity);
                    this.printerPowerOn = state.state === 'on';

                    // 如果电源开启但打印机离线，开始闪烁
                    if (this.printerPowerOn && !this.printerOnline) {
                        this.printerBlinking = true;
                    } else {
                        this.printerBlinking = false;
                    }
                }
            } catch (error) {
                // 静默失败，不输出错误日志
            }
        },

        // 打开3D打印机控制弹窗
        openPrinterModal(url) {
            this.printerUrl = url;
            this.showPrinterModal = true;
            this.printerLoading = true;

            // 500ms后隐藏加载动画（给一点缓冲时间让用户感知到弹窗打开）
            setTimeout(() => {
                this.printerLoading = false;
            }, 500);
        },

        // 关闭3D打印机弹窗
        closePrinterModal() {
            this.showPrinterModal = false;
            this.printerUrl = '';
            this.printerLoading = false;
        },

        // 切换3D打印机电源 - 打开确认弹窗
        async togglePrinterPower(device, event) {
            if (!device.powerEntity) {
                vant.showToast({ message: '未配置电源实体', type: 'fail' });
                return;
            }

            // 记录点击位置（直接使用点击坐标）
            if (event) {
                const rect = event.target.getBoundingClientRect();
                // 使用目标元素的中心点作为起始位置
                this.modalClickX = rect.left + rect.width / 2;
                this.modalClickY = rect.top + rect.height / 2;
            }

            try {
                // 获取当前电源状态
                const currentState = await this.fetchDeviceState(device.powerEntity);
                const isOn = currentState.state === 'on';

                // 保存设备信息和要执行的操作
                this.printerPowerDevice = device;
                this.printerPowerAction = isOn ? 'off' : 'on';

                // 重置动画状态
                this.isPrinterPowerModalOpen = false;
                this.isPrinterPowerModalClosing = false;

                // 立即显示弹窗（初始位置）
                this.showPrinterPowerModal = true;

                // 使用setTimeout确保DOM已渲染，然后触发动画
                setTimeout(() => {
                    this.isPrinterPowerModalOpen = true;
                }, 50);

            } catch (error) {
                vant.showToast({ message: '获取电源状态失败', type: 'fail' });
            }
        },

        // 关闭电源控制弹窗（带动画）
        closePrinterPowerModal() {
            this.isPrinterPowerModalClosing = true;
            this.isPrinterPowerModalOpen = false;

            // 等待动画完成后隐藏弹窗 (0.6秒动画时长)
            setTimeout(() => {
                this.showPrinterPowerModal = false;
                this.isPrinterPowerModalClosing = false;
            }, 600);
        },

        // 确认3D打印机电源操作
        async confirmPrinterPower() {
            if (!this.printerPowerDevice || !this.printerPowerDevice.powerEntity) {
                vant.showToast({ message: '配置错误', type: 'fail' });
                this.closePrinterPowerModal();
                return;
            }

            try {
                const action = this.printerPowerAction;

                // 执行电源切换
                if (action === 'on') {
                    await this.callService('switch', 'turn_on', { entity_id: this.printerPowerDevice.powerEntity });
                    vant.showToast({ message: '正在开机...', type: 'success' });

                    // 设置电源开启状态，开始闪烁
                    this.printerPowerOn = true;
                    this.printerBlinking = true;

                    // 定期检查打印机是否在线
                    this.startPrinterStatusCheck();
                } else {
                    await this.callService('switch', 'turn_off', { entity_id: this.printerPowerDevice.powerEntity });
                    vant.showToast({ message: '正在关机...', type: 'success' });

                    // 停止闪烁
                    this.printerPowerOn = false;
                    this.printerBlinking = false;
                }

                // 关闭弹窗（带动画）
                this.closePrinterPowerModal();

                // 等待2秒后重新检查打印机状态
                setTimeout(() => {
                    this.checkPrinterStatus();
                }, 2000);

            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        // 定期检查打印机状态
        startPrinterStatusCheck() {
            const checkInterval = setInterval(async () => {
                // 如果电源已关闭，停止检查
                if (!this.printerPowerOn) {
                    clearInterval(checkInterval);
                    this.printerBlinking = false;
                    return;
                }

                // 检查打印机是否在线
                await this.checkPrinterStatus();

                // 如果打印机已在线，停止闪烁
                if (this.printerOnline) {
                    this.printerBlinking = false;
                    clearInterval(checkInterval);
                }
            }, 3000);
        },

        // 打开背景选择弹窗
        openBackgroundModal(event) {
            if (event) {
                const rect = event.target.getBoundingClientRect();
                this.backgroundClickX = rect.left + rect.width / 2;
                this.backgroundClickY = rect.top + rect.height / 2;
            }

            this.isBackgroundModalOpen = false;
            this.isBackgroundModalClosing = false;
            this.showBackgroundModal = true;

            setTimeout(() => {
                this.isBackgroundModalOpen = true;
            }, 50);
        },

        // 关闭背景选择弹窗
        closeBackgroundModal() {
            this.isBackgroundModalClosing = true;
            this.isBackgroundModalOpen = false;

            setTimeout(() => {
                this.showBackgroundModal = false;
                this.isBackgroundModalClosing = false;
            }, 600);
        },

        // 选择背景
        selectBackground(backgroundKey) {
            this.currentBackground = backgroundKey;
            vant.showToast({
                message: '背景已切换',
                type: 'success'
            });
            // 关闭弹窗
            this.closeBackgroundModal();
        },

        // 打开通用弹出卡片
        openGenericModal(options) {
            const {
                title = '提示',
                size = 'medium',
                showFooter = true,
                onClick = null
            } = options;

            // 获取点击位置
            if (onClick) {
                const rect = onClick.target.getBoundingClientRect();
                this.genericClickX = rect.left + rect.width / 2;
                this.genericClickY = rect.top + rect.height / 2;
            }

            this.genericModalTitle = title;
            this.genericModalSize = size;
            this.genericModalShowFooter = showFooter;

            this.isGenericModalOpen = false;
            this.isGenericModalClosing = false;
            this.showGenericModal = true;

            setTimeout(() => {
                this.isGenericModalOpen = true;
            }, 50);
        },

        // 关闭通用弹出卡片
        closeGenericModal() {
            this.isGenericModalClosing = true;
            this.isGenericModalOpen = false;

            setTimeout(() => {
                this.showGenericModal = false;
                this.isGenericModalClosing = false;
            }, 600);
        }
    }
});

app.use(vant).mount('#app');
