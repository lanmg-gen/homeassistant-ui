/**
 * 移动端顶部页眉逻辑
 */

// 避免重复声明
if (!window.MobileHeaderbar) {
    window.MobileHeaderbar = {
        weatherData: null,
        weatherLoading: true,
        weatherConfig: null,

        // 初始化
        init() {
            this.loadConfig();
            this.loadTitleFromConfig();
            this.applyWeatherConfig();
            this.fetchWeather();
            this.initDeviceStatus();
            this.startStatusUpdater();
        },

        // 加载配置
        loadConfig() {
            if (window.getWeatherConfig) {
                this.weatherConfig = window.getWeatherConfig();
            } else {
                // 默认配置
                this.weatherConfig = {
                    enabled: true,
                    position: { gridStart: 4, span: 3 },
                    city: '达拉特旗',
                    iconSize: 28,
                    tempSize: 22,
                    citySize: 12,
                    gap: 8,
                    alignRight: true
                };
            }
        },

        // 应用天气配置到 DOM
        applyWeatherConfig() {
            if (!this.weatherConfig || !this.weatherConfig.enabled) {
                const weatherContainer = document.querySelector('.weather-container');
                if (weatherContainer) {
                    weatherContainer.style.display = 'none';
                }
                return;
            }

            // 设置天气容器的位置
            const weatherContainer = document.querySelector('.weather-container');
            if (weatherContainer) {
                weatherContainer.style.gridColumn = `span ${this.weatherConfig.position.span}`;
                weatherContainer.style.gap = `${this.weatherConfig.gap}px`;
                weatherContainer.style.justifyContent = this.weatherConfig.alignRight ? 'flex-end' : 'flex-start';

                // 设置元素大小
                const iconEl = document.querySelector('.weather-icon');
                if (iconEl) {
                    iconEl.style.fontSize = `${this.weatherConfig.iconSize}px`;
                }

                const tempEl = document.querySelector('.weather-temp');
                if (tempEl) {
                    tempEl.style.fontSize = `${this.weatherConfig.tempSize}px`;
                }

                const cityEl = document.querySelector('.weather-city');
                if (cityEl) {
                    cityEl.style.fontSize = `${this.weatherConfig.citySize}px`;
                }
            }
        },

        // 从配置加载标题
        loadTitleFromConfig() {
            if (window.getHeaderbarTitle) {
                const title = window.getHeaderbarTitle();
                const titleCells = document.querySelectorAll('.headerbar-title-cell');
                if (titleCells && titleCells.length > 0) {
                    titleCells.forEach(cell => {
                        cell.textContent = title;
                    });
                }
            }
        },

        // 获取天气数据
        async fetchWeather() {
            if (!this.weatherConfig || !this.weatherConfig.enabled) {
                return;
            }

            try {
                this.weatherLoading = true;
                this.updateWeatherDisplay();

                // 使用配置中的城市名称
                const city = this.weatherConfig.city || '达拉特旗';

                // 使用免费天气API，通过JSONP方式请求避免CORS问题
                const url = `https://api.asilu.com/weather/weather/?city=${encodeURIComponent(city)}&callback=weatherCallback`;

                await new Promise((resolve, reject) => {
                    window.weatherCallback = (result) => {
                        try {
                            delete window.weatherCallback;

                            // 检查返回数据的格式（这个API直接返回数据，没有status和data包装）
                            if (!result || !result.list || !Array.isArray(result.list) || result.list.length === 0) {
                                // console.error('Invalid weather response:', result);
                                reject(new Error('天气数据格式异常'));
                                return;
                            }

                            // API直接返回包含list的响应
                            const data = result;

                            // 尝试多种可能的天气数据格式
                            let weather = null;
                            let temp = '--';
                            let condition = '未知';

                            if (Array.isArray(data.list) && data.list.length > 0) {
                                weather = data.list[0];
                                temp = weather.temp || weather.temperature || '--';
                                condition = weather.weather || weather.condition || weather.type || '未知';
                            } else if (data.temp !== undefined) {
                                temp = data.temp;
                                condition = data.weather || data.condition || '未知';
                            } else {
                                // 如果还是找不到，尝试其他可能的字段
                                console.warn('Weather data structure unexpected, trying to parse...');
                                for (const key in data) {
                                    if (typeof data[key] === 'object' && data[key].temp) {
                                        temp = data[key].temp;
                                        condition = data[key].weather || data[key].condition || '未知';
                                        break;
                                    }
                                }
                            }

                            // 解析温度（可能是字符串如 "15℃" 或数字 15）
                            if (typeof temp === 'string') {
                                temp = parseInt(temp.replace(/[^\d-]/g, '')) || temp;
                            }

                            this.weatherData = {
                                temp: temp,
                                condition: condition,
                                city: data.city || WEATHER_API_CITY
                            };

                            resolve();
                        } catch (error) {
                            delete window.weatherCallback;
                            // console.error('Weather parsing error:', error);
                            reject(new Error('天气数据解析失败'));
                        }
                    };

                    // 创建script标签发起JSONP请求
                    const script = document.createElement('script');
                    script.src = url;
                    script.onerror = () => {
                        delete window.weatherCallback;
                        reject(new Error('天气请求失败'));
                    };
                    document.head.appendChild(script);
                });

                this.weatherLoading = false;
                this.updateWeatherDisplay();
            } catch (error) {
                // console.error('Failed to fetch weather:', error);
                this.weatherError = error.message;
                this.weatherData = {
                    temp: '--',
                    condition: '获取失败',
                    city: WEATHER_API_CITY
                };
                this.weatherLoading = false;
                this.updateWeatherDisplay();
            }
        },

        // 更新天气显示
        updateWeatherDisplay() {
            const tempEl = document.getElementById('weatherTemp');
            const conditionEl = document.getElementById('weatherCondition');
            const iconEl = document.getElementById('weatherIcon');
            const cityEl = document.getElementById('weatherCity');

            if (tempEl) {
                tempEl.textContent = this.weatherLoading ? '--' : `${this.weatherData?.temp ?? '--'}℃`;
            }

            if (conditionEl) {
                conditionEl.textContent = this.weatherLoading ? '加载中...' : (this.weatherData?.condition ?? '--');
            }

            if (iconEl) {
                iconEl.textContent = this.weatherLoading ? '☀' : this.getWeatherIcon(this.weatherData?.condition);
            }

            if (cityEl) {
                cityEl.textContent = this.weatherData?.city ?? (this.weatherConfig?.city ?? '达拉特旗');
            }
        },

        // 根据天气状况获取图标
        getWeatherIcon(condition) {
            if (!condition) return '☀️';

            const cond = condition.toLowerCase();
            if (cond.includes('晴') || cond.includes('sunny') || cond.includes('clear')) {
                return '☀️';
            } else if (cond.includes('云') || cond.includes('多云') || cond.includes('cloudy')) {
                return '⛅';
            } else if (cond.includes('雨') || cond.includes('rain')) {
                return '🌧️';
            } else if (cond.includes('雪') || cond.includes('snow')) {
                return '❄️';
            } else if (cond.includes('雷') || cond.includes('thunder')) {
                return '⛈️';
            } else if (cond.includes('雾') || cond.includes('fog') || cond.includes('mist')) {
                return '🌫️';
            } else if (cond.includes('阴') || cond.includes('overcast')) {
                return '☁️';
            }
            return '☀️';
        },

        /**
         * 初始化设备状态显示
         * 监听全局设备状态更新事件，更新页眉中的设备状态
         */
        initDeviceStatus() {
            // 监听设备状态更新事件
            window.addEventListener('device-state-update', this.handleDeviceStateUpdate.bind(this));

            // 监听HA就绪事件
            window.addEventListener('ha-ready', () => {
                setTimeout(() => this.updateAllDeviceStatus(), 1000);
            });
        },

        /**
         * 启动定时更新设备状态
         * 每30秒更新一次设备状态
         */
        startStatusUpdater() {
            // 初始更新
            setTimeout(() => this.updateAllDeviceStatus(), 2000);

            // 定时更新（30秒）
            setInterval(() => {
                this.updateAllDeviceStatus();
            }, 30000);
        },

        /**
         * 处理设备状态更新事件
         * @param {Event} event - 设备状态更新事件
         */
        handleDeviceStateUpdate(event) {
            if (!event.detail) return;

            const entityId = event.detail.entityId;
            const state = event.detail.state;

            this.updateSingleDeviceStatus(entityId, state);
        },

        /**
         * 更新所有设备状态
         */
        async updateAllDeviceStatus() {
            if (!window.haConnection || !window.DEVICE_CARDS) {
                return;
            }

            // 更新扫地机状态
            this.updateVacuumStatus();

            // 更新投喂器状态
            this.updateFeederStatus();

            // 更新空调状态
            this.updateACStatus();
        },

        /**
         * 更新扫地机状态
         */
        async updateVacuumStatus() {
            const vacuumDevice = window.DEVICE_CARDS.find(d => d.deviceType === 'vacuum');
            if (!vacuumDevice || !window.haConnection) return;

            try {
                const state = await window.haConnection.getDeviceState(vacuumDevice.stateEntity);
                const statusEl = document.getElementById('vacuumStatus');
                if (statusEl) {
                    const statusMap = {
                        'cleaning': '清扫中',
                        'returning': '返回中',
                        'docked': '已回充',
                        'idle': '待机',
                        'paused': '已暂停',
                        'error': '错误'
                    };
                    statusEl.textContent = statusMap[state] || state || '--';
                }
            } catch (error) {
                // console.error('获取扫地机状态失败:', error);
            }
        },

        /**
         * 更新投喂器状态
         */
        async updateFeederStatus() {
            const feederDevice = window.DEVICE_CARDS.find(d => d.deviceType === 'feeder');
            if (!feederDevice || !window.haConnection) return;

            try {
                const state = await window.haConnection.getDeviceState(feederDevice.stateEntity);
                const statusEl = document.getElementById('feederStatus');
                if (statusEl) {
                    // 投喂器状态显示投喂次数
                    statusEl.textContent = state ? `${state}次` : '--';
                }
            } catch (error) {
                // console.error('获取投喂器状态失败:', error);
            }
        },

        /**
         * 更新空调状态
         */
        async updateACStatus() {
            const acDevice = window.DEVICE_CARDS.find(d => d.deviceType === 'climate');
            if (!acDevice || !window.haConnection) return;

            try {
                const stateObj = await window.haConnection.getDeviceState(acDevice.stateEntity);
                const statusEl = document.getElementById('acStatus');
                if (statusEl) {
                    // 空调状态可能是字符串或对象
                    let stateVal = 'off';
                    let temp = '--';
                    let humidity = '--';
                    
                    if (typeof stateObj === 'object' && stateObj !== null) {
                        stateVal = stateObj.state || 'off';
                        temp = stateObj.attributes?.temperature || stateObj.attributes?.current_temperature || '--';
                        humidity = stateObj.attributes?.humidity || stateObj.attributes?.current_humidity || '--';
                    } else if (typeof stateObj === 'string') {
                        stateVal = stateObj;
                    }
                    
                    const statusMap = {
                        'off': '已关',
                        'idle': '待机',
                        'cooling': '制冷',
                        'heating': '制热',
                        'fan_only': '送风',
                        'dry': '干燥'
                    };
                    
                    // 显示温度和湿度
                    if (stateVal === 'off') {
                        statusEl.textContent = '已关';
                    } else {
                        statusEl.textContent = `${temp}℃ ${humidity}%`;
                    }
                }
            } catch (error) {
                // console.error('获取空调状态失败:', error);
            }
        },

        /**
         * 更新单个设备状态
         * @param {string} entityId - 设备实体ID
         * @param {string} state - 设备状态
         */
        updateSingleDeviceStatus(entityId, state) {
            // 找到对应的设备
            const device = window.DEVICE_CARDS.find(d => d.stateEntity === entityId);
            if (!device) return;

            // 根据设备类型更新对应的显示
            if (device.deviceType === 'vacuum') {
                this.updateVacuumStatus();
            } else if (device.deviceType === 'feeder') {
                this.updateFeederStatus();
            } else if (device.deviceType === 'climate') {
                this.updateACStatus();
            }
        }
    };

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.MobileHeaderbar.init();
        });
    } else {
        window.MobileHeaderbar.init();
    }
}


