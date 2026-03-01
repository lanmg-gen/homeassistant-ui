class GrocyClient {
    constructor() {
        this.config = null;
        this.isConnected = false;
        // 存储原始库存数据
        this.stockData = null;
        this.unitMap = null;
        this.locationMap = null;
        this.init();
    }

    async init() {
        // 加载配置
        await this.loadConfig();
        this.bindEvents();
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
                    baseUrl: 'http://192.168.4.13:8080',
                    apiKey: 'rt2zKUzNmpBbchT2ZUwszoXdILuKzPudthRPqbq9oWY621unaU'
                },
                app: {
                    name: '库存管理',
                    version: '1.0.0',
                    description: 'Grocy库存管理客户端'
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
    get baseUrl() {
        return this.config.api.baseUrl;
    }
    
    get apiKey() {
        return this.config.api.apiKey;
    }
    
    get appName() {
        return this.config.app.name;
    }

    bindEvents() {
        document.getElementById('addItemBtn').addEventListener('click', () => this.addShoppingItem());

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

        // 绑定库存搜索事件
        const stockSearch = document.getElementById('stockSearch');
        if (stockSearch) {
            stockSearch.addEventListener('input', (e) => this.filterStock(e.target.value));
        }
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

        if (this.isConnected) {
            this.loadTabContent(tabId);
        }
    }

    connect() {
        this.testConnection()
            .then(() => {
                this.isConnected = true;
                // 去掉连接成功的提示
                this.loadTabContent('stock');
            })
            .catch(error => {
                this.showMessage('离线', 'error');
            });
    }

    async testConnection() {
        try {
            // 设置5秒超时
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.baseUrl}/api/system/info`, {
                headers: {
                    'GROCY-API-KEY': this.apiKey,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP 错误: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            throw error;
        }
    }

    async loadTabContent(tabId) {
        switch (tabId) {
            case 'stock':
                await this.loadStock();
                break;
            case 'shopping':
                await this.loadShoppingList();
                break;
            case 'recipes':
                await this.loadRecipes();
                break;
            case 'tasks':
                await this.loadTasks();
                break;
        }
    }

    async loadStock() {
        try {
            // 首先获取单位字典
            const unitsResponse = await fetch(`${this.baseUrl}/api/objects/quantity_units`, {
                headers: {
                    'GROCY-API-KEY': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!unitsResponse.ok) {
                throw new Error(`HTTP 错误: ${unitsResponse.status}`);
            }

            const units = await unitsResponse.json();
            console.log('单位字典:', units);

            // 创建单位映射
            const unitMap = new Map();
            units.forEach(unit => {
                unitMap.set(unit.id, unit.name);
            });

            // 获取存放位置
            const locationsResponse = await fetch(`${this.baseUrl}/api/objects/locations`, {
                headers: {
                    'GROCY-API-KEY': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!locationsResponse.ok) {
                throw new Error(`HTTP 错误: ${locationsResponse.status}`);
            }

            const locations = await locationsResponse.json();
            console.log('存放位置:', locations);

            // 创建存放位置映射
            const locationMap = new Map();
            locations.forEach(location => {
                locationMap.set(location.id, location.name);
            });

            // 获取库存信息
            const stockResponse = await fetch(`${this.baseUrl}/api/stock`, {
                headers: {
                    'GROCY-API-KEY': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!stockResponse.ok) {
                throw new Error(`HTTP 错误: ${stockResponse.status}`);
            }

            const stockData = await stockResponse.json();
            console.log('库存信息:', stockData);

            // 渲染库存信息，传入单位映射和存放位置映射
            this.renderStock(stockData, unitMap, locationMap);
        } catch (error) {
            this.showMessage(`加载库存失败: ${error.message}`, 'error');
        }
    }

    async loadShoppingList() {
        try {
            // 首先获取产品列表
            const productsResponse = await fetch(`${this.baseUrl}/api/objects/products`, {
                headers: {
                    'GROCY-API-KEY': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!productsResponse.ok) {
                throw new Error(`HTTP 错误: ${productsResponse.status}`);
            }

            const products = await productsResponse.json();
            console.log('产品列表:', products);

            // 创建产品映射
            const productMap = new Map();
            products.forEach(product => {
                productMap.set(product.id, product.name);
            });

            // 尝试使用 GET 方法获取购物清单
            const response = await fetch(`${this.baseUrl}/api/objects/shopping_list`, {
                method: 'GET',
                headers: {
                    'GROCY-API-KEY': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // 如果 GET 方法失败，尝试使用 POST 方法
                const postResponse = await fetch(`${this.baseUrl}/api/objects/shopping_list`, {
                    method: 'POST',
                    headers: {
                        'GROCY-API-KEY': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({})
                });

                if (!postResponse.ok) {
                    throw new Error(`HTTP 错误: ${postResponse.status}`);
                }

                const data = await postResponse.json();
                console.log('购物清单数据 (POST):', data);
                this.renderShoppingList(data, productMap);
            } else {
                const data = await response.json();
                console.log('购物清单数据 (GET):', data);
                this.renderShoppingList(data, productMap);
            }
        } catch (error) {
            this.showMessage(`加载购物清单失败: ${error.message}`, 'error');
        }
    }

    async loadRecipes() {
        try {
            const response = await fetch(`${this.baseUrl}/api/objects/recipes`, {
                headers: {
                    'GROCY-API-KEY': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP 错误: ${response.status}`);
            }

            const data = await response.json();
            this.renderRecipes(data);
        } catch (error) {
            this.showMessage(`加载食谱失败: ${error.message}`, 'error');
        }
    }

    async loadTasks() {
        try {
            const response = await fetch(`${this.baseUrl}/api/objects/tasks`, {
                headers: {
                    'GROCY-API-KEY': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP 错误: ${response.status}`);
            }

            const data = await response.json();
            this.renderTasks(data);
        } catch (error) {
            this.showMessage(`加载任务失败: ${error.message}`, 'error');
        }
    }

    async addShoppingItem() {
        const itemName = document.getElementById('newItem').value;
        if (!itemName) {
            this.showMessage('请输入物品名称', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/shoppinglist/add`, {
                method: 'POST',
                headers: {
                    'GROCY-API-KEY': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    product_id: null,
                    amount: 1,
                    note: '',
                    name: itemName
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP 错误: ${response.status}`);
            }

            document.getElementById('newItem').value = '';
            this.showMessage('物品添加成功！', 'success');
            await this.loadShoppingList();
        } catch (error) {
            this.showMessage(`添加物品失败: ${error.message}`, 'error');
        }
    }

    renderStock(stockData, unitMap, locationMap) {
        // 存储原始数据，用于搜索
        this.stockData = stockData;
        this.unitMap = unitMap;
        this.locationMap = locationMap;

        // 渲染库存
        this.renderFilteredStock(stockData);
    }

    // 渲染过滤后的库存
    renderFilteredStock(stockData) {
        const stockList = document.getElementById('stockList');
        stockList.innerHTML = '';

        if (!stockData || stockData.length === 0) {
            stockList.innerHTML = '<p>没有库存物品</p>';
            return;
        }

        // 按存放位置分组
        const itemsByLocation = {};
        stockData.forEach(item => {
            // 查找存放位置
            let locationName = '未知';
            if (item.location_id) {
                locationName = this.locationMap.get(item.location_id) || '未知';
            } else if (item.product && item.product.location_id) {
                locationName = this.locationMap.get(item.product.location_id) || '未知';
            }

            if (!itemsByLocation[locationName]) {
                itemsByLocation[locationName] = [];
            }
            itemsByLocation[locationName].push(item);
        });

        // 渲染每个位置的物品
        Object.entries(itemsByLocation).forEach(([locationName, items]) => {
            // 创建位置分组
            const locationGroup = document.createElement('div');
            locationGroup.className = 'location-group';
            
            // 创建位置标题
            const locationTitle = document.createElement('h3');
            locationTitle.className = 'location-title collapsed';
            locationTitle.textContent = locationName;
            
            // 创建内容容器
            const locationContent = document.createElement('div');
            locationContent.className = 'location-content collapsed';
            
            // 渲染该位置的物品
            items.forEach(item => {
                console.log('库存项:', item);
                console.log('产品信息:', item.product);
                const stockItem = document.createElement('div');
                stockItem.className = 'stock-item';
                const productName = item.product ? item.product.name : '未命名';
                // 根据 qu_id_stock 查找单位名称
                let unitName = '个';
                if (item.product && item.product.qu_id_stock) {
                    unitName = this.unitMap.get(item.product.qu_id_stock) || '个';
                } else if (item.quantity_unit) {
                    unitName = item.quantity_unit;
                }
                stockItem.innerHTML = `
                    <h4>${productName}</h4>
                    <div class="stock-info">
                        <p>库存: ${item.amount || 0}</p>
                        <p>单位: ${unitName}</p>
                    </div>
                `;
                locationContent.appendChild(stockItem);
            });
            
            // 添加点击事件监听器
            locationTitle.addEventListener('click', () => {
                locationTitle.classList.toggle('collapsed');
                locationContent.classList.toggle('collapsed');
            });
            
            // 组装位置分组
            locationGroup.appendChild(locationTitle);
            locationGroup.appendChild(locationContent);
            
            stockList.appendChild(locationGroup);
        });
    }

    // 过滤库存
    filterStock(keyword) {
        if (!this.stockData) return;

        let filteredData = this.stockData;
        
        if (keyword) {
            keyword = keyword.toLowerCase();
            filteredData = this.stockData.filter(item => {
                const productName = item.product ? item.product.name.toLowerCase() : '';
                return productName.includes(keyword);
            });
        }
        
        this.renderFilteredStock(filteredData);
    }

    renderShoppingList(items, productMap) {
        const shoppingList = document.getElementById('shoppingList');
        shoppingList.innerHTML = '';

        if (!items || items.length === 0) {
            shoppingList.innerHTML = '<p>购物清单为空</p>';
            return;
        }

        items.forEach(item => {
            console.log('购物清单项:', item);
            const shoppingItem = document.createElement('div');
            shoppingItem.className = 'shopping-item';
            // 根据 product_id 查找产品名称
            let itemName = '未命名';
            if (item.product_id) {
                itemName = productMap.get(item.product_id) || '未命名';
            } else if (item.name) {
                itemName = item.name;
            } else if (item.product_name) {
                itemName = item.product_name;
            }
            const itemAmount = item.amount || item.quantity || 1;
            const isDone = item.done || item.completed || false;
            const itemNote = item.note || '';
            shoppingItem.innerHTML = `
                <input type="checkbox" class="item-checkbox" ${isDone ? 'checked' : ''}>
                <div class="item-name">${itemName}</div>
                <div class="item-quantity">${itemAmount}</div>
                ${itemNote ? `<div class="item-note">${itemNote}</div>` : ''}
            `;
            shoppingList.appendChild(shoppingItem);
        });
    }

    renderRecipes(recipes) {
        const recipesList = document.getElementById('recipesList');
        recipesList.innerHTML = '';

        if (!recipes || recipes.length === 0) {
            recipesList.innerHTML = '<p>没有食谱</p>';
            return;
        }

        recipes.forEach(recipe => {
            const item = document.createElement('div');
            item.className = 'stock-item';
            item.innerHTML = `
                <h3>${recipe.name || '未命名'}</h3>
                <div class="stock-info">
                    <p>准备时间: ${recipe.preparation_time || 0} 分钟</p>
                    <p>烹饪时间: ${recipe.cook_time || 0} 分钟</p>
                </div>
            `;
            recipesList.appendChild(item);
        });
    }

    renderTasks(tasks) {
        const tasksList = document.getElementById('tasksList');
        tasksList.innerHTML = '';

        if (!tasks || tasks.length === 0) {
            tasksList.innerHTML = '<p>没有任务</p>';
            return;
        }

        tasks.forEach(task => {
            const item = document.createElement('div');
            item.className = 'stock-item';
            item.innerHTML = `
                <h3>${task.name || '未命名'}</h3>
                <div class="stock-info">
                    <p>状态: ${task.done ? '已完成' : '未完成'}</p>
                    <p>截止日期: ${task.due_date || '无'}</p>
                </div>
            `;
            tasksList.appendChild(item);
        });
    }

    showMessage(message, type) {
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.style.display = 'block';

        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 3000);
    }
}

window.grocyClient = new GrocyClient();

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
                // 直接操作DOM来切换侧边栏，不依赖于grocyClient
                const sidebar = document.querySelector('.sidebar');
                const overlay = document.querySelector('.sidebar-overlay');
                const mainContent = document.querySelector('.main-content');
                if (sidebar) {
                    sidebar.classList.toggle('open');
                    if (overlay) {
                        overlay.classList.toggle('show');
                    }
                    if (mainContent) {
                        mainContent.classList.toggle('with-sidebar');
                    }
                }
                break;
        }
    }
}

// 发送应用名称给容器
function sendAppName() {
    if (window.parent && window.grocyClient) {
        window.parent.postMessage({
            type: 'set-app-name',
            name: window.grocyClient.appName
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