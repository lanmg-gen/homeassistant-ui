/**
 * 桌面端自由布局逻辑
 */
console.log('桌面布局脚本开始执行...');

if (!window.DesktopLayout) {
    window.DesktopLayout = {
        // 配置
        config: {
            gridSize: 20,
            snapToGrid: true,
            minComponentWidth: 400,
            minComponentHeight: 300
        },

        // 状态
        state: {
            isEditMode: false,
            components: [],
            nextComponentId: 1,
            selectedComponent: null
        },

        // DOM 元素
        elements: {},

        // 初始化
        init(retryCount = 0) {
            this.cacheElements();
            if (!this.elements.canvas) {
                if (retryCount < 50) {
                    setTimeout(() => this.init(retryCount + 1), 50);
                    return;
                }
            }
            // 清空画布，避免重复添加组件
            this.elements.canvas.innerHTML = '';
            this.state.components = [];
            
            // 检查 HA 连接状态
            console.log('桌面布局初始化，检查 HA 连接状态...');
            if (window.haConnection) {
                console.log('HA 连接对象存在');
                if (window.haConnection.isConnected && window.haConnection.isConnected()) {
                    console.log('HA 连接已建立');
                } else {
                    console.warn('HA 连接未建立，设备控制可能无法工作');
                }
            } else {
                console.error('HA 连接对象未加载，请确保 app/ha-connection.js 已正确加载');
            }
            
            this.bindEvents();
            this.loadLayout();
        },

        // 缓存 DOM 元素
        cacheElements() {
            this.elements = {
                canvas: document.getElementById('freeLayoutCanvas'),
                contextMenu: document.getElementById('desktopContextMenu'),
                componentContextMenu: document.getElementById('componentContextMenu'),
                editToolbar: document.getElementById('editToolbar'),
                editToolbarHeader: document.getElementById('editToolbarHeader'),
                closeEditToolbarBtn: document.getElementById('closeEditToolbar'),
                floorplanTemplate: document.getElementById('floorplanComponentTemplate'),
                analogClockTemplate: document.getElementById('analogClockComponentTemplate'),
                digitalClockTemplate: document.getElementById('digitalClockComponentTemplate'),
                flipClockTemplate: document.getElementById('flipClockComponentTemplate'),
                lightTemplate: document.getElementById('lightComponentTemplate')
            };
        },

        // 绑定事件
        bindEvents() {
            const { canvas, editToolbar, editToolbarHeader, closeEditToolbarBtn } = this.elements;

            if (!canvas) return;

            // 画布右键菜单
            canvas.addEventListener('contextmenu', (e) => {
                if (e.target.closest('.layout-component')) return;
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY);
            });

            // 监听来自 iframe 的消息
            window.addEventListener('message', (e) => {
                this.handleIframeMessage(e);
            });

            // 点击其他地方关闭菜单和释放选择
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.desktop-context-menu') &&
                    !e.target.closest('.component-context-menu')) {
                    this.hideContextMenu();
                    this.hideComponentContextMenu();
                }

                // 点击空白处或非组件区域，释放选择
                if (!e.target.closest('.layout-component') &&
                    !e.target.closest('.edit-toolbar') &&
                    !e.target.closest('.context-menu')) {
                    this.state.selectedComponent = null;
                    this.highlightSelectedComponent(null);
                    this.updateEditToolbar();
                }
            });

            // 关闭编辑工具栏
            if (closeEditToolbarBtn) {
                closeEditToolbarBtn.addEventListener('click', () => {
                    this.hideEditToolbar();
                });
            }

            // 编辑工具栏拖拽
            if (editToolbarHeader && editToolbar) {
                let isDragging = false;
                let offset = { x: 0, y: 0 };

                editToolbarHeader.addEventListener('mousedown', (e) => {
                    if (e.target.closest('.close-btn')) return;
                    isDragging = true;
                    offset.x = e.clientX - editToolbar.offsetLeft;
                    offset.y = e.clientY - editToolbar.offsetTop;
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    editToolbar.style.left = `${e.clientX - offset.x}px`;
                    editToolbar.style.top = `${e.clientY - offset.y}px`;
                });

                document.addEventListener('mouseup', () => {
                    isDragging = false;
                });
            }

            // 全局拖拽事件 - 处理组件拖拽
            document.addEventListener('mousemove', (e) => {
                const draggingComponent = this.state.components.find(c => c.dataset.isDragging === 'true');
                if (!draggingComponent || !draggingComponent.dataset) return;

                const startPos = JSON.parse(draggingComponent.dataset.startPos || '{}');
                const startOffset = JSON.parse(draggingComponent.dataset.startOffset || '{}');
                const dx = e.clientX - startPos.x;
                const dy = e.clientY - startPos.y;
                draggingComponent.style.left = `${startOffset.x + dx}px`;
                draggingComponent.style.top = `${startOffset.y + dy}px`;
            });

            document.addEventListener('mouseup', () => {
                const draggingComponent = this.state.components.find(c => c.dataset.isDragging === 'true');
                if (draggingComponent) {
                    draggingComponent.dataset.isDragging = 'false';
                    draggingComponent.classList.remove('dragging');
                }
            });
        },

        // ==================== 菜单管理 ====================
        showContextMenu(x, y) {
            const menu = this.elements.contextMenu;
            if (!menu) return;
            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
            menu.classList.add('show');
        },

        hideContextMenu() {
            this.elements.contextMenu?.classList.remove('show');
        },

        showComponentContextMenu(x, y) {
            const menu = this.elements.componentContextMenu;
            if (!menu) return;
            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
            menu.classList.add('show');
        },

        hideComponentContextMenu() {
            this.elements.componentContextMenu?.classList.remove('show');
        },

        // ==================== 编辑工具栏 ====================
        showEditToolbar() {
            this.elements.editToolbar?.classList.add('show');
            this.hideContextMenu();
            // 打开编辑工具栏时自动进入编辑模式
            this.state.isEditMode = true;
            this.elements.canvas.classList.add('edit-mode');
        },

        hideEditToolbar() {
            this.elements.editToolbar?.classList.remove('show');
            // 关闭编辑工具栏时退出编辑模式
            this.state.isEditMode = false;
            this.elements.canvas.classList.remove('edit-mode');

            // 只移除编辑区域和配置表单
            const content = this.elements.editToolbar?.querySelector('.edit-toolbar-content');
            if (content) {
                const editSection = content.querySelector('.component-edit-section');
                if (editSection) editSection.remove();
            }
        },



        // 切换分类展开/收起
        toggleCategory(header) {
            const category = header.closest('.category');
            const categoryItems = category.querySelector('.category-items');
            const arrow = header.querySelector('.category-arrow');

            category.classList.toggle('collapsed');
            arrow.style.transform = category.classList.contains('collapsed') ? 'rotate(-90deg)' : 'rotate(0deg)';
        },

        toggleEditMode() {
            this.state.isEditMode = !this.state.isEditMode;
            this.elements.canvas.classList.toggle('edit-mode', this.state.isEditMode);
            this.updateEditToolbar();
        },

        // 更新编辑工具栏内容
        updateEditToolbar() {
            const content = this.elements.editToolbar?.querySelector('.edit-toolbar-content');
            if (!content) return;

            // 移除旧的编辑区域（但保留配置表单）
            const oldEditSection = content.querySelector('.component-edit-section');
            const configForm = content.querySelector('.light-config-form');

            if (oldEditSection) {
                oldEditSection.remove();
            }

            // 如果选中了组件，显示编辑选项
            if (this.state.selectedComponent) {
                const editSection = document.createElement('div');
                editSection.className = 'toolbar-section component-edit-section';

                const componentType = this.state.selectedComponent.dataset.componentType;

                // 标题
                editSection.innerHTML = `<h4>编辑组件</h4>`;

                // 删除按钮
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'toolbar-btn';
                deleteBtn.innerHTML = '<span class="btn-icon">🗑️</span><span class="btn-text">删除组件</span>';
                deleteBtn.onclick = () => this.deleteSelectedComponent();
                editSection.appendChild(deleteBtn);

                // 如果是时钟组件，添加缩放选项
                if (componentType === 'analogClock' || componentType === 'digitalClock' || componentType === 'flipClock') {
                    const scaleLabel = document.createElement('label');
                    scaleLabel.className = 'scale-control';
                    const currentScale = this.state.selectedComponent.dataset.scale || 1;
                    scaleLabel.innerHTML = `
                        <span>缩放:</span>
                        <input type="range" id="scaleRange" min="0.5" max="2" step="0.1" value="${currentScale}">
                        <span id="scaleValue">${parseFloat(currentScale).toFixed(1)}x</span>
                    `;
                    editSection.appendChild(scaleLabel);

                    const scaleRange = scaleLabel.querySelector('#scaleRange');
                    const scaleValue = scaleLabel.querySelector('#scaleValue');

                    scaleRange.addEventListener('input', (e) => {
                        const scale = parseFloat(e.target.value);
                        scaleValue.textContent = `${scale.toFixed(1)}x`;
                        this.scaleSelectedComponent(scale);
                    });
                }

                // 如果是灯组件，添加编辑配置按钮
                if (componentType === 'light') {
                    const configBtn = document.createElement('button');
                    configBtn.className = 'toolbar-btn';
                    configBtn.innerHTML = '<span class="btn-icon">⚙️</span><span class="btn-text">编辑配置</span>';
                    configBtn.onclick = () => {
                        console.log('点击编辑配置按钮');
                        this.showLightConfigForm();
                    };
                    editSection.appendChild(configBtn);
                }

                // 插入到第一个 toolbar-section 之后
                const sections = content.querySelectorAll('.toolbar-section');
                if (sections.length > 0) {
                    content.insertBefore(editSection, sections[1]);
                } else {
                    content.appendChild(editSection);
                }
            }
        },

        // 缩放选中的组件
        scaleSelectedComponent(scale) {
            if (!this.state.selectedComponent) return;
            this.state.selectedComponent.style.transform = `scale(${scale})`;
            // 保存缩放值到 dataset
            this.state.selectedComponent.dataset.scale = scale;
        },

        // 显示灯组件配置表单
        showLightConfigForm() {
            console.log('showLightConfigForm 被调用');

            // 获取当前内容
            const content = this.elements.editToolbar?.querySelector('.edit-toolbar-content');
            console.log('编辑工具栏内容:', content ? '有内容' : '为空');

            // 隐藏所有其他内容，只显示配置表单
            const allSections = content.querySelectorAll('.toolbar-section');
            allSections.forEach(section => {
                section.style.display = 'none';
            });

            // 移除旧的配置表单
            const oldConfigForm = content.querySelector('.light-config-form');
            if (oldConfigForm) {
                console.log('移除旧的配置表单');
                oldConfigForm.remove();
            }

            // 创建配置表单容器
            const configForm = document.createElement('div');
            configForm.className = 'light-config-form';

            // 获取当前配置
            const iframe = this.state.selectedComponent.querySelector('iframe');
            console.log('iframe dataset.config:', iframe.dataset.config);
            const currentConfig = JSON.parse(iframe.dataset.config || '{}');
            console.log('parsed currentConfig:', currentConfig);
            console.log('currentConfig.showName:', currentConfig.showName, 'currentConfig.showSwitch:', currentConfig.showSwitch);

            // 设置表单内容
            configForm.innerHTML = `
                        <h4>灯组件配置</h4>
                        <div class="config-row">
                            <label>控制实体:</label>
                            <input type="text" class="config-input" id="controlEntity" value="${currentConfig.controlEntity || ''}" placeholder="例如: light.living_room">
                        </div>
                        <div class="config-row">
                            <label>显示实体:</label>
                            <input type="text" class="config-input" id="displayEntity" value="${currentConfig.displayEntity || currentConfig.controlEntity || ''}" placeholder="可选，默认使用控制实体">
                        </div>
                        <div class="config-row">
                            <label>图标类型:</label>
                            <select class="config-select" id="iconType">
                                <option value="emoji" ${currentConfig.iconType === 'emoji' ? 'selected' : ''}>Emoji</option>
                                <option value="ico" ${currentConfig.iconType === 'ico' ? 'selected' : ''}>ICO 文件</option>
                            </select>
                        </div>
                        <div class="config-row" id="iconValueRow">
                            <label>图标:</label>
                            <input type="text" class="config-input" id="iconValue" value="${currentConfig.icon || '💡'}" placeholder="💡">
                        </div>
                        <div class="config-row">
                            <label>设备名称:</label>
                            <input type="text" class="config-input" id="deviceName" value="${currentConfig.name || '灯光'}" placeholder="灯光">
                        </div>
                        <div class="config-row">
                            <label>宽度 (px):</label>
                            <input type="number" class="config-input" id="width" value="${currentConfig.width || 100}" min="50" max="500" step="10">
                        </div>
                        <div class="config-row">
                            <label>高度 (px):</label>
                            <input type="number" class="config-input" id="height" value="${currentConfig.height || 160}" min="50" max="500" step="10">
                        </div>
                        <div class="config-row">
                            <label>透明度:</label>
                            <input type="range" class="config-input" id="opacity" value="${currentConfig.opacity !== undefined ? currentConfig.opacity : 1.0}" min="0" max="1" step="0.1">
                            <span id="opacityValue">${currentConfig.opacity !== undefined ? currentConfig.opacity : 1.0}</span>
                        </div>
                        <div class="config-row">
                            <label class="toggle-label">
                                <input type="checkbox" id="showName" ${currentConfig.showName !== false ? 'checked' : ''}>
                                <span>显示设备名称</span>
                            </label>
                        </div>
                        <div class="config-row">
                            <label class="toggle-label">
                                <input type="checkbox" id="showSwitch" ${currentConfig.showSwitch !== false ? 'checked' : ''}>
                                <span>显示开关状态</span>
                            </label>
                        </div>
                        <div class="config-buttons">
                            <button class="config-btn save" id="saveLightConfigBtn">保存</button>
                            <button class="config-btn cancel" id="cancelLightConfigBtn">取消</button>
                        </div>
                    `;

            // 添加配置表单到现有内容
            content.appendChild(configForm);
            
            // 绑定按钮事件
            const saveBtn = configForm.querySelector('#saveLightConfigBtn');
            const cancelBtn = configForm.querySelector('#cancelLightConfigBtn');
            
            saveBtn.addEventListener('click', () => this.saveLightConfig());
            cancelBtn.addEventListener('click', () => this.hideConfigForm());
            
            // 绑定透明度滑块事件
            const opacitySlider = configForm.querySelector('#opacity');
            const opacityValue = configForm.querySelector('#opacityValue');
            if (opacitySlider && opacityValue) {
                opacitySlider.addEventListener('input', (e) => {
                    opacityValue.textContent = e.target.value;
                });
            }
            
            // 绑定图标类型变化事件
            const iconTypeSelect = configForm.querySelector('#iconType');
            const iconValueRow = configForm.querySelector('#iconValueRow');
            if (iconTypeSelect && iconValueRow) {
                iconTypeSelect.addEventListener('change', (e) => {
                    const iconValueInput = iconValueRow.querySelector('#iconValue');
                    if (e.target.value === 'emoji') {
                        iconValueInput.placeholder = '💡';
                        if (!iconValueInput.value || iconValueInput.value.includes('.ico') || iconValueInput.value.includes('.png')) {
                            iconValueInput.value = '💡';
                        }
                    } else if (e.target.value === 'ico') {
                        iconValueInput.placeholder = '/icons/light.ico';
                        if (iconValueInput.value === '💡') {
                            iconValueInput.value = '';
                        }
                    }
                });
            }
            
            console.log('配置表单已添加，当前内容长度:', content.children.length);
        },

        // 保存灯组件配置
        saveLightConfig() {
            const configForm = document.querySelector('.light-config-form');
            if (!configForm) return;

            const controlEntity = configForm.querySelector('#controlEntity').value.trim();
            const displayEntity = configForm.querySelector('#displayEntity').value.trim();
            const iconType = configForm.querySelector('#iconType').value;
            const iconValue = configForm.querySelector('#iconValue').value.trim();
            const deviceName = configForm.querySelector('#deviceName').value.trim();
            const width = parseInt(configForm.querySelector('#width').value) || 100;
            const height = parseInt(configForm.querySelector('#height').value) || 120;
            const opacity = parseFloat(configForm.querySelector('#opacity').value) || 1.0;
            const showName = configForm.querySelector('#showName').checked;
            const showSwitch = configForm.querySelector('#showSwitch').checked;
            
            console.log('saveLightConfig - showName:', showName, 'showSwitch:', showSwitch);

            if (!controlEntity) {
                alert('请填写控制实体');
                return;
            }

            // 更新组件配置
            const config = {
                controlEntity,
                displayEntity: displayEntity || controlEntity,
                iconType,
                icon: iconValue || '💡',
                name: deviceName || '灯光',
                width,
                height,
                opacity,
                showName,
                showSwitch
            };
            
            console.log('config to save:', config);

            // 更新 iframe 的配置数据
            const iframe = this.state.selectedComponent.querySelector('iframe');
            iframe.dataset.config = JSON.stringify(config);

            // 通知组件更新
            iframe.contentWindow.postMessage({
                type: 'updateConfig',
                config: config
            }, '*');

            // 调整组件尺寸以适应新配置
            this.adjustIframeSize(this.state.selectedComponent);

            // 隐藏配置表单并返回编辑工具栏
            this.hideConfigForm();
        },

        // 隐藏配置表单并返回编辑工具栏
        hideConfigForm() {
            const content = this.elements.editToolbar?.querySelector('.edit-toolbar-content');
            if (!content) return;

            // 移除配置表单
            const configForm = content.querySelector('.light-config-form');
            if (configForm) {
                configForm.remove();
            }

            // 恢复显示所有工具栏内容
            const allSections = content.querySelectorAll('.toolbar-section');
            allSections.forEach(section => {
                section.style.display = '';
            });

            // 更新编辑工具栏内容
            this.updateEditToolbar();
        },



        // 恢复编辑工具栏
        restoreEditToolbar() {
            const configForm = document.querySelector('.light-config-form');
            if (configForm) {
                configForm.remove();
            }

            // 只显示工具栏
            this.elements.editToolbar.classList.add('show');
        },





        // ==================== 组件管理 ====================
        addComponent(type, x, y, config = null) {
            const template = this.elements[`${type}Template`];
            if (!template) {
                console.error(`组件类型 ${type} 的模板不存在`);
                return null;
            }

            const clone = template.content.cloneNode(true);
            const component = clone.querySelector('.layout-component');

            // 设置组件 ID
            component.dataset.componentId = `component-${this.state.nextComponentId++}`;
            component.dataset.componentType = type;

            // 如果是灯组件，设置配置
            if (type === 'light') {
                const iframe = component.querySelector('iframe');
                // 默认配置（与灯光组件内部默认配置保持一致）
                const defaultLightConfig = {
                    controlEntity: '',
                    displayEntity: '',
                    icon: '💡',
                    iconType: 'emoji',
                    name: '灯光',
                    width: 120,
                    height: 180,
                    opacity: 1.0,
                    showName: true,
                    showSwitch: true
                };
                
                // 如果提供了配置，合并；否则使用默认配置
                const finalConfig = config ? { ...defaultLightConfig, ...config } : defaultLightConfig;
                const configStr = encodeURIComponent(JSON.stringify(finalConfig));
                iframe.src = `cards/desktop/devices/simple/light.html?config=${configStr}`;
                iframe.dataset.config = JSON.stringify(finalConfig);
            }

            // 默认位置
            const rect = this.elements.canvas.getBoundingClientRect();
            const posX = x || rect.width / 2 - 200;
            const posY = y || rect.height / 2 - 150;

            component.style.left = `${posX}px`;
            component.style.top = `${posY}px`;

            // 绑定组件事件
            this.bindComponentEvents(component);

            this.elements.canvas.appendChild(component);
            this.state.components.push(component);

            this.hideContextMenu();

            // 调整 iframe 尺寸以适应内容
            this.adjustIframeSize(component);

            return component;
        },

        // 添加灯组件（自动添加默认组件并进入编辑模式）
        addLight() {
            // 添加默认灯光组件
            const component = this.addComponent('light', null, null);
            if (component) {
                // 选中新组件
                this.state.selectedComponent = component;
                this.highlightSelectedComponent(component);
                
                // 显示编辑工具栏
                this.elements.editToolbar.classList.add('show');
                
                // 直接显示配置表单
                this.showLightConfigForm();
                
                console.log('灯光组件已添加并进入配置模式');
            }
        },

        // 灯组件配置对话框（保留用于兼容性，但不再使用）
        promptLightConfig() {
            console.warn('promptLightConfig已弃用，请使用编辑工具栏进行配置');
            return null;
        },

        // 调整 iframe 尺寸以适应内容
        adjustIframeSize(component) {
            const iframe = component.querySelector('iframe');
            if (!iframe) return;

            const adjustSize = () => {
                try {
                    // 对于灯光组件，优先使用配置的尺寸
                    const componentType = component.dataset.componentType;
                    if (componentType === 'light' && iframe.dataset.config) {
                        const config = JSON.parse(iframe.dataset.config);
                        if (config.width && config.height) {
                            console.log('使用配置的灯光组件尺寸:', config.width, config.height);
                            component.style.width = `${config.width}px`;
                            component.style.height = `${config.height}px`;
                            return;
                        }
                    }
                    
                    // 默认行为：直接访问 iframe 内容获取精确尺寸
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    const body = iframeDoc.body;

                    const width = body.scrollWidth || body.offsetWidth;
                    const height = body.scrollHeight || body.offsetHeight;

                    console.log('组件尺寸:', component.dataset.componentId, width, height);

                    component.style.width = `${width}px`;
                    component.style.height = `${height}px`;
                } catch (e) {
                    // 调整 iframe 尺寸失败，静默处理
                }
            };

            // 如果 iframe 已经加载，直接调整尺寸
            if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
                adjustSize();
            } else {
                // 否则等待加载完成
                iframe.onload = adjustSize;
            }
        },

        bindComponentEvents(component) {
            // 组件选择和右键菜单 - 绑定到专门的点击层
            const clickLayer = component.querySelector('.component-click-layer');
            if (clickLayer) {
                clickLayer.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    this.state.selectedComponent = component;
                    this.highlightSelectedComponent(component);
                    this.updateEditToolbar();
                });

                // 特殊处理灯光组件点击事件
                clickLayer.addEventListener('click', (e) => {
                    const componentType = component.dataset.componentType;
                    console.log('点击层被点击，组件类型:', componentType);
                    
                    if (componentType === 'light') {
                        console.log('尝试控制灯光...');
                        // 获取配置
                        const iframe = component.querySelector('iframe');
                        if (iframe && iframe.dataset.config) {
                            try {
                                const config = JSON.parse(iframe.dataset.config);
                                console.log('灯光配置:', config);
                                
                                if (config.controlEntity) {
                                    // 创建消息对象，模拟从iframe接收的消息
                                    const message = {
                                        type: 'controlEntity',
                                        entityId: config.controlEntity,
                                        action: 'toggle'
                                    };
                                    // 调用灯光控制处理
                                    this.handleLightControl(message, { source: iframe.contentWindow });
                                } else {
                                    console.warn('灯光控制实体未配置');
                                }
                            } catch (parseError) {
                                console.error('解析配置失败:', parseError);
                            }
                        }
                    }
                });

                clickLayer.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // 如果是 iframe 内部，让 iframe 自己处理右键菜单
                    if (e.target.closest('iframe')) {
                        return;
                    }

                    this.state.selectedComponent = component;
                    this.highlightSelectedComponent(component);
                    this.showComponentContextMenu(e.clientX, e.clientY);
                });
            }

            // 拖拽层 - 在编辑模式下，通过 dragLayer 来处理拖拽
            const dragLayer = component.querySelector('.component-drag-layer');
            if (dragLayer) {
                dragLayer.addEventListener('mousedown', (e) => {
                    if (!this.state.isEditMode) return;
                    e.stopPropagation();

                    // 先选中组件
                    this.state.selectedComponent = component;
                    this.highlightSelectedComponent(component);
                    this.updateEditToolbar();

                    // 然后设置拖拽状态
                    component.dataset.isDragging = 'true';
                    component.dataset.startPos = JSON.stringify({ x: e.clientX, y: e.clientY });
                    component.dataset.startOffset = JSON.stringify({
                        x: parseInt(component.style.left) || 0,
                        y: parseInt(component.style.top) || 0
                    });
                    component.classList.add('dragging');
                });
            }
        },

        deleteSelectedComponent() {
            if (this.state.selectedComponent) {
                const index = this.state.components.indexOf(this.state.selectedComponent);
                if (index > -1) {
                    this.state.components.splice(index, 1);
                }
                this.state.selectedComponent.remove();
                this.state.selectedComponent = null;
            }
            this.hideComponentContextMenu();
        },

        bringToFront() {
            if (this.state.selectedComponent) {
                this.state.selectedComponent.style.zIndex = Math.max(...this.state.components.map(c => parseInt(c.style.zIndex) || 0)) + 1;
            }
            this.hideComponentContextMenu();
        },

        sendToBack() {
            if (this.state.selectedComponent) {
                this.state.selectedComponent.style.zIndex = Math.min(...this.state.components.map(c => parseInt(c.style.zIndex) || 0)) - 1;
            }
            this.hideComponentContextMenu();
        },

        highlightSelectedComponent(component) {
            // 移除之前选中的组件的高亮
            this.state.components.forEach(comp => {
                comp.classList.remove('component-selected');
            });
            // 高亮当前选中的组件
            if (component) {
                component.classList.add('component-selected');
            }
        },

        clearCanvas() {
            this.state.components.forEach(comp => comp.remove());
            this.state.components = [];
            this.state.selectedComponent = null;
            this.hideContextMenu();
        },

        // ==================== 布局保存/加载 ====================
        saveLayout() {
            const layout = {
                components: this.state.components.map(comp => {
                    const config = {
                        id: comp.dataset.componentId,
                        type: comp.dataset.componentType,
                        x: comp.style.left,
                        y: comp.style.top,
                        zIndex: comp.style.zIndex || 1,
                        scale: comp.dataset.scale || 1
                    };

                    // 如果是灯组件，保存配置
                    if (comp.dataset.componentType === 'light') {
                        const iframe = comp.querySelector('iframe');
                        if (iframe && iframe.dataset.config) {
                            try {
                                config.config = JSON.parse(iframe.dataset.config);
                            } catch (e) {
                                // 解析失败，忽略
                            }
                        }
                    }

                    return config;
                })
            };
            localStorage.setItem('desktopLayout', JSON.stringify(layout));
            alert('布局已保存');
        },

        loadLayout() {
            const saved = localStorage.getItem('desktopLayout');
            if (!saved) return;

            try {
                const layout = JSON.parse(saved);
                this.clearCanvas();

                layout.components.forEach(compConfig => {
                    const component = this.addComponent(compConfig.type);
                    if (component) {
                        component.dataset.componentId = compConfig.id;
                        component.style.left = compConfig.x;
                        component.style.top = compConfig.y;
                        component.style.zIndex = compConfig.zIndex || 1;
                        if (compConfig.scale) {
                            component.style.transform = `scale(${compConfig.scale})`;
                            component.dataset.scale = compConfig.scale;
                        }

                        // 如果是灯组件，恢复配置
                        if (compConfig.type === 'light' && compConfig.config) {
                            const iframe = component.querySelector('iframe');
                            if (iframe) {
                                iframe.dataset.config = JSON.stringify(compConfig.config);
                                const configStr = encodeURIComponent(JSON.stringify(compConfig.config));
                                iframe.src = `cards/desktop/devices/simple/light.html?config=${configStr}`;
                            }
                        }
                    }
                });

                // 更新 nextComponentId
                if (layout.components.length > 0) {
                    const maxId = Math.max(...layout.components.map(c => {
                        const match = c.id.match(/component-(\d+)/);
                        return match ? parseInt(match[1]) : 0;
                    }));
                    this.state.nextComponentId = maxId + 1;
                }
            } catch (e) {
                // 加载布局失败，静默处理
            }
        },

        // ==================== iframe 消息处理 ====================
        handleIframeMessage(e) {
            const { data } = e;
            if (!data) return;
            console.log('收到iframe消息: 来源=', e.origin, '数据=', data, '完整事件=', e);

            try {
                // 解析消息：可能是字符串化的 JSON 也可能是对象
                const message = typeof data === 'string' ? JSON.parse(data) : data;

                if (message.type === 'requestContextMenu') {
                    this.state.selectedComponent = this.state.components.find(c =>
                        c.querySelector('iframe') === e.source.frameElement
                    );
                    if (this.state.selectedComponent) {
                        this.highlightSelectedComponent(this.state.selectedComponent);
                        this.showComponentContextMenu(message.x, message.y);
                    }
                } else if (message.type === 'requestSave') {
                    // 处理 iframe 请求保存
                    this.saveFloorplanConfig(message.data);
                } else if (message.type === 'controlEntity') {
                    // 处理灯组件控制请求
                    this.handleLightControl(message, e);
                }
            } catch (err) {
                // 不是有效的 JSON 消息，忽略
            }
        },

        // 处理灯组件控制
        async handleLightControl(message, event) {
            console.log('开始处理灯控制请求...');
            console.log('消息内容:', message);
            
            if (!message || !message.entityId) {
                console.error('灯控制消息无效或缺少 entityId:', message);
                return;
            }

            const entityId = message.entityId;
            console.log('目标实体ID:', entityId);

            // 检查关键依赖是否加载
            console.log('检查依赖...');
            console.log('window.haConnection:', window.haConnection ? '已加载' : '未加载');
            console.log('window.DeviceController:', window.DeviceController ? '已加载' : '未加载');
            console.log('window.app:', window.app ? '已加载' : '未加载');

            // 检查 HA 连接状态
            let isHAConnected = false;
            if (window.haConnection) {
                if (typeof window.haConnection.isConnected === 'function') {
                    isHAConnected = window.haConnection.isConnected();
                } else if (typeof window.haConnection.isConnected === 'boolean') {
                    isHAConnected = window.haConnection.isConnected;
                }
            }
            console.log('HA连接状态:', isHAConnected ? '已连接' : '未连接');

            if (!isHAConnected) {
                console.warn('Home Assistant 未连接，无法控制设备');
                
                // 尝试重新初始化 HA 连接
                if (window.getHAConfig && window.haConnection) {
                    try {
                        const haConfig = window.getHAConfig();
                        console.log('尝试重新初始化 HA 连接，配置:', haConfig);
                        if (haConfig && haConfig.enabled && haConfig.url && haConfig.token) {
                            window.haConnection.init(haConfig.url, haConfig.token);
                            console.log('HA 连接重新初始化请求已发送');
                        }
                    } catch (initError) {
                        console.error('重新初始化 HA 连接失败:', initError);
                    }
                }

                // 提供模拟反馈
                try {
                    const component = this.state.components.find(c => {
                        const iframe = c.querySelector('iframe');
                        return iframe && iframe.contentWindow === event.source;
                    });
                    
                    if (component) {
                        const iframe = component.querySelector('iframe');
                        if (iframe && iframe.contentWindow) {
                            iframe.contentWindow.postMessage({
                                type: 'updateState',
                                state: 'toggled'
                            }, '*');
                            console.log('发送模拟状态切换消息');
                        }
                    }
                } catch (simError) {
                    console.error('发送模拟状态失败:', simError);
                }
                
                return;
            }

            // 创建完整的设备配置对象
            const deviceConfig = {
                name: '桌面灯光',
                controlEntity: entityId,
                stateEntity: entityId, // 与移动端保持一致
                deviceType: 'light'
            };

            console.log('设备配置对象:', deviceConfig);
            console.log('开始调用设备控制...');

            let controlSuccess = false;
            let controlError = null;

            // 优先使用 DeviceController
            if (window.DeviceController && typeof window.DeviceController.handleDeviceClick === 'function') {
                try {
                    console.log('调用 DeviceController.handleDeviceClick...');
                    await window.DeviceController.handleDeviceClick(deviceConfig);
                    controlSuccess = true;
                    console.log('设备控制请求通过 DeviceController 发送成功');
                } catch (dcError) {
                    controlError = dcError;
                    console.error('DeviceController 控制失败:', dcError);
                }
            }

            // 如果 DeviceController 失败或未加载，尝试使用 window.app
            if (!controlSuccess && window.app && typeof window.app.handleDeviceClick === 'function') {
                try {
                    console.log('尝试使用 window.app.handleDeviceClick...');
                    await window.app.handleDeviceClick(deviceConfig);
                    controlSuccess = true;
                    console.log('设备控制请求通过 window.app 发送成功');
                } catch (appError) {
                    controlError = appError;
                    console.error('window.app 控制失败:', appError);
                }
            }

            // 如果两种方式都失败
            if (!controlSuccess) {
                console.error('所有设备控制方式均失败，最后错误:', controlError);
                // 尝试提供基本的错误提示
                if (window.vant && window.vant.Toast) {
                    window.vant.Toast.fail('设备控制失败，请检查连接和配置');
                }
                return;
            }

            // 控制成功后，更新设备状态显示
            console.log('设备控制成功，开始更新状态显示...');
            
            const component = this.state.components.find(c => {
                const iframe = c.querySelector('iframe');
                return iframe && iframe.contentWindow === event.source;
            });

            if (!component) {
                console.warn('未找到对应的组件，无法更新状态显示');
                return;
            }

            console.log('找到对应组件，准备获取最新设备状态...');

            // 等待设备状态更新，然后通知 iframe
            setTimeout(async () => {
                try {
                    const iframe = component.querySelector('iframe');
                    if (!iframe || !iframe.contentWindow) {
                        console.warn('iframe 不存在或未加载完成');
                        return;
                    }

                    if (!window.haConnection) {
                        console.error('HA 连接对象已丢失');
                        return;
                    }

                    console.log('获取设备状态...');
                    const state = await window.haConnection.getDeviceState(entityId);
                    console.log('设备状态获取成功:', entityId, '=', state);

                    iframe.contentWindow.postMessage({
                        type: 'updateState',
                        state: state
                    }, '*');
                    
                    console.log('状态更新消息已发送给 iframe');
                } catch (stateError) {
                    console.error('获取或发送设备状态失败:', stateError);
                }
            }, 800); // 稍微长一点的延迟，确保设备有足够时间响应
        },

        saveFloorplanConfig(config) {
            if (this.state.selectedComponent) {
                this.state.selectedComponent.dataset.floorplanConfig = JSON.stringify(config);
            }
        }
    };

        // 立即初始化（页面动态加载时，DOM 已经准备好了）
    setTimeout(() => {
        window.DesktopLayout.init();
    }, 50);

    // 监听页面切换事件
    window.addEventListener('page-change', (e) => {
        if (e.detail.page === 'home') {
            // 延迟一下，确保 DOM 已经更新
            setTimeout(() => {
                window.DesktopLayout.init();
            }, 100);
        }
    });
}
