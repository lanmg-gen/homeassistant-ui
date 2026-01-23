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
const AMBIENT_LIGHT_TIMER = STATUS_CONFIGS.ambientLight.timerEntity;
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
            // 氛围灯定时器数据
            ambientLightTimerData: null,
            ambientLightTimerError: null,
            ambientLightTimerLoading: true,
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
            autoRefreshInterval: 1000,
            refreshIntervalSeconds: 1,
            autoRefreshTimer: null,
            isRefreshing: false,
            isFirstLoading: true,
            // 自动化日志
            automationLogs: [],
            // 动态设备状态存储
            deviceStates: {},
            // 设置页面数据
            haUrl: HA_CONFIG.url || 'http://192.168.4.5:8123',
            accessToken: HA_CONFIG.token || '',
            timerDuration: 1800,
            ambientLightSettingsVisible: false,
            // 自定义设置
            customSettings: {
                cardOpacity: 15,
                borderWidth: 1,
                borderRadius: 12,
                gridColumns: 3,
                cardGap: 12
            },
            showCustomSettings: false,
            // 3D打印机弹窗
            showPrinterModal: false,
            printerUrl: '',
            printerLoading: true,
            printerOnline: false,
            printerPowerOn: false,
            printerBlinking: false,
            // 3D打印机电源控制弹窗
            showPrinterPowerModal: false,
            printerPowerDevice: null,
            printerPowerAction: 'on'
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
            if (this.ambientLightTimerLoading) return '加载中...';
            if (this.ambientLightTimerError) return '获取失败';
            if (!this.ambientLightTimerData) return '未知状态';

            const state = this.ambientLightTimerData.state;
            const attributes = this.ambientLightTimerData.attributes || {};

            // 如果定时器运行中,显示剩余时间
            if (state === 'active') {
                if (attributes.finishes_at) {
                    // 将finishes_at换算成本地时间并计算剩余时间
                    const localTime = new Date(attributes.finishes_at);
                    const now = new Date();
                    const endTime = localTime.getTime();
                    const currentTime = now.getTime();
                    const remainingSeconds = Math.max(0, Math.floor((endTime - currentTime) / 1000));
                    const minutes = Math.floor(remainingSeconds / 60);
                    const seconds = remainingSeconds % 60;
                    const remainingTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    return remainingTime;
                } else if (attributes.remaining !== undefined && attributes.remaining !== null) {
                    return attributes.remaining;
                } else if (attributes.duration) {
                    return `${attributes.duration}s`;
                }
                return '运行中';
            } else if (state === 'idle') {
                return '未启动';
            } else if (state === 'paused') {
                return '已暂停';
            } else {
                return state;
            }
        },

        // 氛围灯状态样式类
        ambientLightClass() {
            if (this.ambientLightTimerLoading) return 'loading';
            if (this.ambientLightTimerError) return 'error';
            if (this.ambientLightTimerData?.state === 'active') {
                return 'status-cleaning';
            }
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
        }
    },

        mounted() {
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

        // 获取天气数据
        this.fetchWeather();

        // 检查3D打印机状态
        this.checkPrinterStatus();
        this.checkPrinterPowerStatus();
    },

    beforeUnmount() {
        this.stopAutoRefresh();
        // 清理打印机状态检查定时器
        if (this.printerStatusCheckInterval) {
            clearInterval(this.printerStatusCheckInterval);
        }
    },

    methods: {
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

        async startAmbientLightTimer() {
            try {
                await this.callService('timer', 'start', { entity_id: AMBIENT_LIGHT_TIMER });
                vant.showToast({ message: '定时器已启动', type: 'success' });
                this.silentUpdateAmbientLightTimerData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
            }
        },

        async stopAmbientLightTimer() {
            try {
                await this.callService('timer', 'cancel', { entity_id: AMBIENT_LIGHT_TIMER });
                vant.showToast({ message: '定时器已停止', type: 'success' });
                this.silentUpdateAmbientLightTimerData();
            } catch (error) {
                vant.showToast({ message: '操作失败', type: 'fail' });
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

        async applyTimerDuration() {
            try {
                await this.callService('timer', 'start', {
                    entity_id: AMBIENT_LIGHT_TIMER,
                    duration: this.timerDuration
                });
                vant.showToast({ message: '定时器设置已应用', type: 'success' });
                this.silentUpdateAmbientLightTimerData();
            } catch (error) {
                vant.showToast({ message: '应用失败', type: 'fail' });
            }
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
                console.warn('fetchDeviceState: entityId is undefined');
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
                console.error(`fetchDeviceState error for ${entityId}:`, error);
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
                this.ambientLightTimerData = await this.fetchDeviceState(AMBIENT_LIGHT_TIMER);
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

        // 静默更新氛围灯定时器数据
        async silentUpdateAmbientLightTimerData() {
            try {
                const data = await this.fetchDeviceState(AMBIENT_LIGHT_TIMER);
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

        stopAutoRefresh() {
            if (this.autoRefreshTimer) {
                clearInterval(this.autoRefreshTimer);
                this.autoRefreshTimer = null;
            }
        },

        async autoRefreshData() {
            if (this.isRefreshing) return;

            try {
                this.isRefreshing = true;
                // 使用静默更新,避免闪烁
                await this.silentUpdateAllData();
                // 更新动态设备状态
                this.updateAllDeviceStates();
            } finally {
                this.isRefreshing = false;
            }
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

        openCustomSettings() {
            // 打开自定义设置弹窗
            this.showCustomSettings = true;
        },

        saveCustomSettings() {
            // 保存自定义设置到localStorage和配置文件
            localStorage.setItem('customSettings', JSON.stringify(this.customSettings));

            vant.showToast({
                message: '设置已保存',
                type: 'success'
            });
            this.showCustomSettings = false;
            this.applyCustomSettings();
        },

        applyCustomSettings() {
            // 应用自定义设置到页面样式
            const settings = this.customSettings || {};

            // 应用卡片样式
            const cards = document.querySelectorAll('.device-grid-card, .automation-log, .automation-conditions, .settings-card');
            cards.forEach(card => {
                if (card.style) {
                    const cardOpacity = settings.cardOpacity !== undefined ? settings.cardOpacity : 15;
                    const borderWidth = settings.borderWidth !== undefined ? settings.borderWidth : 1;
                    const borderRadius = settings.borderRadius !== undefined ? settings.borderRadius : 12;

                    card.style.setProperty('--card-opacity', cardOpacity / 100);
                    card.style.background = `rgba(255, 255, 255, ${cardOpacity / 100})`;
                    card.style.border = `${borderWidth}px solid rgba(255, 255,255, 0.3)`;
                    card.style.borderRadius = `${borderRadius}px`;
                }
            });

            // 应用网格布局
            const grid = document.querySelector('.device-grid');
            if (grid) {
                const gridColumns = settings.gridColumns !== undefined ? settings.gridColumns : 3;
                const cardGap = settings.cardGap !== undefined ? settings.cardGap : 12;

                grid.style.gridTemplateColumns = `repeat(${gridColumns}, 1fr)`;
                grid.style.gap = `${cardGap}px`;
            }
        },

        loadCustomSettings() {
            // 从localStorage加载自定义设置
            const savedSettings = localStorage.getItem('customSettings');
            if (savedSettings) {
                try {
                    const parsed = JSON.parse(savedSettings);
                    this.customSettings = { ...this.customSettings, ...parsed };
                } catch (error) {
                }
            }
            // 应用设置到DOM
            this.applyCustomSettings();
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
                    // 灯具开关
                    if (state === 'on') {
                        await this.callService('light', 'turn_off', { entity_id: device.controlEntity });
                    } else {
                        await this.callService('light', 'turn_on', { entity_id: device.controlEntity });
                    }
                } else if (deviceType === 'vacuum') {
                    // 扫地机控制
                    if (state === 'cleaning') {
                        await this.callService('vacuum', 'pause', { entity_id: device.controlEntity });
                    } else if (state === 'paused' || state === 'idle' || state === 'docked') {
                        await this.callService('vacuum', 'start', { entity_id: device.controlEntity });
                    } else {
                        await this.callService('vacuum', 'return_to_base', { entity_id: device.controlEntity });
                    }
                } else if (deviceType === 'feeder') {
                    // 宠物投喂
                    await this.callService('number', 'set_value', {
                        entity_id: device.controlEntity,
                        value: 1
                    });
                    vant.showToast({ message: '投喂成功', type: 'success' });
                } else if (deviceType === 'switch') {
                    // 开关控制（包括热水器等开关设备）
                    if (state === 'on') {
                        await this.callService('switch', 'turn_off', { entity_id: device.controlEntity });
                    } else {
                        await this.callService('switch', 'turn_on', { entity_id: device.controlEntity });
                    }
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
                vant.showToast({ message: '操作失败', type: 'fail' });
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
            try {
                const data = await this.fetchDeviceState(entityId);
                this.deviceStates = {
                    ...this.deviceStates,
                    [entityId]: data
                };
            } catch (error) {
            }
        },

        // 更新所有设备状态
        updateAllDeviceStates() {
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
                console.error('检查打印机电源状态失败:', error);
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
        async togglePrinterPower(device) {
            if (!device.powerEntity) {
                vant.showToast({ message: '未配置电源实体', type: 'fail' });
                return;
            }

            try {
                // 获取当前电源状态
                const currentState = await this.fetchDeviceState(device.powerEntity);
                const isOn = currentState.state === 'on';

                // 保存设备信息和要执行的操作
                this.printerPowerDevice = device;
                this.printerPowerAction = isOn ? 'off' : 'on';

                // 打开确认弹窗
                this.showPrinterPowerModal = true;

            } catch (error) {
                vant.showToast({ message: '获取电源状态失败', type: 'fail' });
            }
        },

        // 确认3D打印机电源操作
        async confirmPrinterPower() {
            if (!this.printerPowerDevice || !this.printerPowerDevice.powerEntity) {
                vant.showToast({ message: '配置错误', type: 'fail' });
                this.showPrinterPowerModal = false;
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

                // 关闭弹窗
                this.showPrinterPowerModal = false;

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
                    clearInterval(checkInterval);
                    this.printerBlinking = false;
                }
            }, 3000); // 每3秒检查一次

            // 将定时器保存到实例上，方便清理
            this.printerStatusCheckInterval = checkInterval;
        }
    }
});

app.use(vant).mount('#app');
