class KlipperClient {
    constructor() {
        this.config = null;
        this.ws = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.retryCount = 0;
        this.currentWsPathIndex = 0;
        this.stopRetrying = false; // 标记是否停止重试
        this.printerState = {};
        this.init();
    }

    async init() {
        // 加载配置
        await this.loadConfig();
        this.bindEvents();
        this.checkAccessMethod();
        // 无论什么协议都尝试连接
        this.connect();
    }
    
    async loadConfig() {
        try {
            const response = await fetch('config/config.json');
            if (!response.ok) {
                throw new Error('加载配置文件失败');
            }
            this.config = await response.json();
        } catch (error) {
            console.error('加载配置失败:', error);
            // 使用默认配置
            this.config = {
                api: {
                    host: 'http://192.168.4.6',
                    port: 7125,
                    apiKey: '44529bba6eb145b494e234e12d87f3a9'
                },
                app: {
                    name: 'Klipper 控制',
                    version: '1.0.0',
                    description: '3D打印机控制客户端'
                },
                ui: {
                    theme: 'light',
                    language: 'zh-CN'
                },
                features: {
                    enableDebug: false,
                    enableAnalytics: false
                }
            };
        }
    }
    
    // 配置访问器
    get host() {
        return this.config.api.host;
    }
    
    get port() {
        return this.config.api.port;
    }
    
    get apiKey() {
        return this.config.api.apiKey;
    }
    
    get appName() {
        return this.config.app.name;
    }

    // 检查访问方法
    checkAccessMethod() {
        if (window.location.protocol === 'file:') {
            // 显示警告信息
            const statusElement = document.getElementById('connectionStatus');
            statusElement.className = 'connection-status disconnected';
            statusElement.innerHTML = `
                注意：直接文件路径访问
                <br><br>
                <strong>可能的问题：</strong>
                <br>
                浏览器的同源策略限制，file://协议可能无法访问http://协议的API
                <br><br>
                <strong>解决方案：</strong>
                <br>
                1. <strong>使用支持CORS的浏览器</strong>：
                <br>
                - 某些浏览器或环境可能允许跨域请求
                <br><br>
                2. <strong>启用浏览器的跨域设置</strong>：
                <br>
                - 例如，Chrome可以使用 --disable-web-security 参数启动
            `;
            console.warn('直接文件路径访问，可能无法连接到Moonraker API。请使用上述解决方案。');
        }
    }

    bindEvents() {
        // 绑定侧边栏菜单项点击事件
        document.querySelectorAll('.sidebar-menu-item').forEach(item => {
            item.addEventListener('click', () => this.switchTab(item));
        });

        // 绑定遮罩层点击事件
        document.querySelector('.sidebar-overlay').addEventListener('click', () => this.toggleSidebar());

        // 绑定顶部菜单按钮点击事件
        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // 绑定控制按钮点击事件
        document.getElementById('startPrint').addEventListener('click', () => this.startPrint());
        document.getElementById('pausePrint').addEventListener('click', () => this.pausePrint());
        document.getElementById('stopPrint').addEventListener('click', () => this.stopPrint());

        // 绑定温度设置按钮点击事件
        document.getElementById('setHotendTemp').addEventListener('click', () => this.setHotendTemp());
        document.getElementById('setBedTemp').addEventListener('click', () => this.setBedTemp());
    }

    // 切换侧边栏显示/隐藏
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        const mainContent = document.querySelector('.main-content');
        
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
        mainContent.classList.toggle('with-sidebar');
    }

    // 切换标签页
    switchTab(item) {
        document.querySelectorAll('.sidebar-menu-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        item.classList.add('active');
        const tabId = item.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');

        // 在移动设备上，切换标签后关闭侧边栏
        if (window.innerWidth <= 768) {
            this.toggleSidebar();
        }

        // 如果切换到文件标签，加载文件列表
        if (tabId === 'files' && this.isConnected) {
            this.loadFiles();
        }
    }

    // 连接到Moonraker
    connect() {
        // 检查是否停止重试
        if (this.stopRetrying) {
            return;
        }
        
        // 检查是否正在连接中，避免重复连接
        if (this.isConnecting) {
            return;
        }
        
        // 检查重试次数，避免无限重试
        if (this.retryCount === undefined) {
            this.retryCount = 0;
        }
        
        if (this.retryCount >= 3) {
            console.error('连接重试次数过多，停止尝试');
            this.isConnected = false;
            this.isConnecting = false;
            this.stopRetrying = true; // 标记停止重试
            this.updateConnectionStatus('disconnected');
            // 显示停止尝试的信息
            const statusElement = document.getElementById('connectionStatus');
            statusElement.className = 'connection-status disconnected';
            statusElement.innerHTML = `
                连接失败：已尝试3次
                <br><br>
                <strong>请检查：</strong>
                <br>
                1. Moonraker服务器是否运行
                <br>
                2. 网络连接是否正常
                <br>
                3. 主机地址和端口是否正确
            `;
            return;
        }

        // 更新连接状态
        this.updateConnectionStatus('connecting');
        this.isConnecting = true;

        // 解析主机地址，提取协议和主机名
        const url = new URL(this.host);
        const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        const hostname = url.hostname;
        
        // 尝试不同的WebSocket路径
        const wsPaths = [
            '/websocket',
            '/api/websocket',
            '/ws'
        ];

        // 先测试HTTP连接
        this.testHttpConnection()
            .then(() => {
                console.log('HTTP连接测试成功');
                
                // 尝试不同的WebSocket路径
                this.tryWebSocketPaths(protocol, hostname, wsPaths);
            })
            .catch(error => {
                console.error('HTTP连接测试失败:', error);
                this.isConnected = false;
                this.isConnecting = false;
                this.updateConnectionStatus('disconnected');
                // 增加重试次数
                this.retryCount++;
                // 5秒后重试
                setTimeout(() => this.connect(), 5000);
            });
    }



    // 尝试不同的WebSocket路径
    tryWebSocketPaths(protocol, hostname, paths) {
        // 检查是否停止重试
        if (this.stopRetrying) {
            return;
        }
        
        if (this.currentWsPathIndex === undefined) {
            this.currentWsPathIndex = 0;
        }

        if (this.currentWsPathIndex >= paths.length) {
            // 所有路径都失败
            console.error('所有WebSocket路径连接失败');
            this.isConnected = false;
            this.isConnecting = false;
            this.updateConnectionStatus('disconnected');
            // 重置索引
            this.currentWsPathIndex = 0;
            // 增加重试次数
            this.retryCount++;
            
            // 检查重试次数，如果达到限制，停止尝试
            if (this.retryCount >= 3) {
                console.error('连接重试次数过多，停止尝试');
                this.stopRetrying = true; // 标记停止重试
                // 显示停止尝试的信息
                const statusElement = document.getElementById('connectionStatus');
                statusElement.className = 'connection-status disconnected';
                statusElement.innerHTML = `
                    连接失败：已尝试3次
                    <br><br>
                    <strong>请检查：</strong>
                    <br>
                    1. Moonraker服务器是否运行
                    <br>
                    2. 网络连接是否正常
                    <br>
                    3. 主机地址和端口是否正确
                `;
                return;
            }
            
            // 5秒后重试
            setTimeout(() => this.connect(), 5000);
            return;
        }

        // 获取当前尝试的路径
        const currentPath = paths[this.currentWsPathIndex];
        const wsUrl = `${protocol}//${hostname}:${this.port}${currentPath}`;
        console.log(`尝试连接到WebSocket路径 ${this.currentWsPathIndex + 1}/${paths.length}:`, wsUrl);

        // 关闭现有连接
        if (this.ws) {
            this.ws.close();
        }

        // 创建新的WebSocket连接
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket连接已建立');
            this.isConnected = true;
            this.isConnecting = false;
            this.updateConnectionStatus('connected');
            this.subscribeToPrinterState();
            // 重置索引和重试次数
            this.currentWsPathIndex = 0;
            this.retryCount = 0;
            this.stopRetrying = false; // 重置停止重试标记
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('解析消息失败:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket错误:', error);
            // 尝试下一个路径
            this.currentWsPathIndex++;
            setTimeout(() => this.tryWebSocketPaths(protocol, hostname, paths), 1000);
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket连接已关闭:', event.code, event.reason);
            if (!this.isConnected) {
                // 连接未成功建立，尝试下一个路径
                this.currentWsPathIndex++;
                setTimeout(() => this.tryWebSocketPaths(protocol, hostname, paths), 1000);
            } else {
                // 连接已成功建立后关闭，重置状态
                this.isConnected = false;
                this.isConnecting = false;
                this.updateConnectionStatus('disconnected');
                // 重置重试次数
                this.retryCount = 0;
                // 尝试重连
                setTimeout(() => this.connect(), 5000);
            }
        };
    }

    // 测试HTTP连接
    async testHttpConnection() {
        // 解析主机地址，提取协议和主机名
        const url = new URL(this.host);
        const protocol = url.protocol;
        const hostname = url.hostname;
        
        // 尝试不同的API路径
        const apiPaths = [
            '/api/server/info',
            '/server/info',
            '/api/info'
        ];
        
        for (const path of apiPaths) {
            const httpUrl = `${protocol}//${hostname}:${this.port}${path}`;
            console.log('测试HTTP连接:', httpUrl);
            try {
                const response = await fetch(httpUrl, {
                    mode: 'cors', // 允许跨域请求
                    cache: 'no-cache'
                });
                console.log('HTTP响应状态:', response.status);
                if (response.ok) {
                    const data = await response.json();
                    console.log('HTTP连接测试响应:', data);
                    return data;
                }
            } catch (error) {
                console.error('HTTP请求错误:', error);
            }
        }
        
        // 所有路径都失败，抛出错误
        throw new Error('无法连接到Moonraker API');
    }

    // 更新连接状态
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.className = 'connection-status';

        switch (status) {
            case 'connected':
                statusElement.className += ' connected';
                statusElement.textContent = '已连接';
                break;
            case 'connecting':
                statusElement.className += ' disconnected';
                statusElement.textContent = '连接中...';
                break;
            case 'disconnected':
            default:
                statusElement.className += ' disconnected';
                statusElement.textContent = '未连接';
                break;
        }
    }

    // 订阅打印机状态
    subscribeToPrinterState() {
        const subscribeMessage = {
            jsonrpc: '2.0',
            method: 'printer.objects.subscribe',
            params: {
                objects: {
                    'print_stats': null,
                    'heater_bed': null,
                    'extruder': null
                }
            },
            id: 1
        };
        this.sendMessage(subscribeMessage);
    }

    // 发送消息
    sendMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    // 处理收到的消息
    handleMessage(data) {
        if (data.method === 'notify_status_update') {
            this.updatePrinterState(data.params[0]);
        }
    }

    // 更新打印机状态
    updatePrinterState(state) {
        this.printerState = { ...this.printerState, ...state };
        this.updateDashboard();
    }

    // 更新仪表盘
    updateDashboard() {
        // 更新打印机状态
        const printStats = this.printerState.print_stats;
        if (printStats) {
            document.getElementById('printerStatus').textContent = printStats.state || '离线';
            if (printStats.progress) {
                document.getElementById('printProgress').textContent = Math.round(printStats.progress * 100) + ' %';
            }
        }

        // 更新热端温度
        const extruder = this.printerState.extruder;
        if (extruder) {
            document.getElementById('hotendTemp').textContent = extruder.temperature.toFixed(1) + ' °C';
        }

        // 更新热床温度
        const heaterBed = this.printerState.heater_bed;
        if (heaterBed) {
            document.getElementById('bedTemp').textContent = heaterBed.temperature.toFixed(1) + ' °C';
        }
    }

    // 开始打印
    startPrint() {
        const message = {
            jsonrpc: '2.0',
            method: 'printer.print.start',
            params: {},
            id: 2
        };
        this.sendMessage(message);
    }

    // 暂停打印
    pausePrint() {
        const message = {
            jsonrpc: '2.0',
            method: 'printer.print.pause',
            params: {},
            id: 3
        };
        this.sendMessage(message);
    }

    // 停止打印
    stopPrint() {
        const message = {
            jsonrpc: '2.0',
            method: 'printer.print.cancel',
            params: {},
            id: 4
        };
        this.sendMessage(message);
    }

    // 设置热端温度
    setHotendTemp() {
        const target = parseFloat(document.getElementById('hotendTarget').value);
        const message = {
            jsonrpc: '2.0',
            method: 'printer.gcode.script',
            params: {
                script: `M104 S${target}`
            },
            id: 5
        };
        this.sendMessage(message);
    }

    // 设置热床温度
    setBedTemp() {
        const target = parseFloat(document.getElementById('bedTarget').value);
        const message = {
            jsonrpc: '2.0',
            method: 'printer.gcode.script',
            params: {
                script: `M140 S${target}`
            },
            id: 6
        };
        this.sendMessage(message);
    }

    // 加载文件列表
    loadFiles() {
        const message = {
            jsonrpc: '2.0',
            method: 'server.files.list',
            params: {
                path: 'gcodes'
            },
            id: 7
        };
        this.sendMessage(message);
    }
}

window.klipperClient = new KlipperClient();

// 与容器通信的代码
// 全局函数，确保作用域正确
function handleContainerMessage(event) {
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'app-container-init':
                // 容器初始化，进入容器模式
                document.body.classList.add('app-container-mode');
                sendAppName();
                break;
            case 'menu-click':
                // 容器菜单被点击，切换侧边栏
                const client = window.klipperClient;
                if (client && client.toggleSidebar) {
                    client.toggleSidebar();
                }
                break;
        }
    }
}

// 发送应用名称给容器
function sendAppName() {
    if (window.parent && window.klipperClient) {
        window.parent.postMessage({
            type: 'set-app-name',
            name: window.klipperClient.appName
        }, '*');
    }
}

// 初始化应用容器通信
function initAppContainerCommunication() {
    // 监听容器消息
    window.addEventListener('message', handleContainerMessage, false);
    
    // 检查是否在容器中加载
    if (window.parent && window.self !== window.top) {
        // 发送初始化消息给容器
        window.parent.postMessage({
            type: 'app-container-init'
        }, '*');
    }
}

// 立即设置消息监听器，不等待DOM加载完成
initAppContainerCommunication();