class SiYuanClient {
    constructor() {
        this.config = null;
        this.state = {
            authMethod: null,
            notebooks: [],
            currentNotebook: null,
            currentDocument: null,
            documentTree: {},
            expandedFolders: new Set(),
            isEditing: false,
            originalContent: '',
            originalTitle: ''
        };
        
        this.init();
    }
    
    async init() {
        // 加载配置
        await this.loadConfig();
        
        // 初始化时隐藏编辑按钮和保存按钮
        const editButton = document.getElementById('editButton');
        const saveButton = document.getElementById('saveButton');
        if (editButton) {
            editButton.style.display = 'none';
        }
        if (saveButton) {
            saveButton.style.display = 'none';
        }
        
        // 初始化时确保侧边栏是隐藏的
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (sidebar) {
            sidebar.classList.remove('open');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('show');
        }
        
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
                    serverUrl: 'http://192.168.4.13:6806',
                    apiToken: 'kynm8bx11zmhgdst',
                    authPrefix: 'Token'
                },
                app: {
                    name: '思源笔记',
                    version: '1.0.0',
                    description: '思源笔记客户端'
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
    get serverUrl() {
        return this.config.api.serverUrl;
    }
    
    get apiToken() {
        return this.config.api.apiToken;
    }
    
    get authPrefix() {
        return this.config.api.authPrefix;
    }
    
    get appName() {
        return this.config.app.name;
    }
    
    bindEvents() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterContent(e.target.value);
        });
        
        // 菜单切换按钮事件
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
        
        // 背景遮罩层事件
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
        
        // 编辑按钮事件
        const editButton = document.getElementById('editButton');
        if (editButton) {
            editButton.addEventListener('click', () => {
                this.toggleEditMode();
            });
        }
        
        // 保存按钮事件
        const saveButton = document.getElementById('saveButton');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.saveContent();
            });
        }
    }
    
    // 切换侧边栏显示/隐藏
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) {
            sidebar.classList.toggle('open');
            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle('show');
            }
        }
    }
    
    // 切换编辑模式
    toggleEditMode() {
        const contentBody = document.getElementById('contentBody');
        const editButton = document.getElementById('editButton');
        const saveButton = document.getElementById('saveButton');
        const contentTitle = document.getElementById('contentTitle');
        const noteBody = contentBody.querySelector('.note-body');
        
        if (!noteBody) {
            this.showState('没有可编辑的内容', false);
            return;
        }
        
        this.state.isEditing = !this.state.isEditing;
        
        if (this.state.isEditing) {
            // 进入编辑模式
            this.state.originalContent = noteBody.innerHTML;
            this.state.originalTitle = contentTitle.textContent;
            noteBody.contentEditable = true;
            noteBody.classList.add('editing');
            editButton.style.display = 'none';
            saveButton.style.display = 'flex';
            contentTitle.innerHTML = `${this.state.originalTitle} <span style="font-size: 14px; color: var(--primary); font-weight: normal;">(编辑中)</span>`;
        } else {
            // 退出编辑模式
            noteBody.contentEditable = false;
            noteBody.classList.remove('editing');
            editButton.style.display = 'flex';
            saveButton.style.display = 'none';
            // 恢复原始标题
            contentTitle.textContent = this.state.originalTitle;
        }
    }
    
    // 保存内容
    async saveContent() {
        const contentBody = document.getElementById('contentBody');
        const noteBody = contentBody.querySelector('.note-body');
        
        if (!noteBody || !this.state.currentDocument) {
            this.showState('没有可保存的内容', false);
            return;
        }
        
        this.showState('正在保存内容...', true);
        
        try {
            // 获取编辑后的HTML内容
            const editedHtml = noteBody.innerHTML;
            // 将HTML转换为Markdown
            const editedMarkdown = this.htmlToMarkdown(editedHtml);
            
            // 调用思源笔记API保存修改
            const headers = this.getAuthHeaders();
            const response = await fetch(`${this.serverUrl}/api/block/updateBlock`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    id: this.state.currentDocument,
                    dataType: 'markdown',
                    data: editedMarkdown
                }),

            });
            
            if (!response.ok) {
                throw new Error(`保存失败：${response.status}`);
            }
            
            const responseText = await response.text();
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                throw new Error('服务器返回非JSON格式数据');
            }
            
            if (data.code !== 0) {
                throw new Error(`保存失败：${data.msg || '未知错误'}`);
            }
            
            // 保存成功，退出编辑模式
            this.state.isEditing = false;
            noteBody.contentEditable = false;
            noteBody.classList.remove('editing');
            document.getElementById('editButton').style.display = 'flex';
            document.getElementById('saveButton').style.display = 'none';
            // 恢复原始标题
            document.getElementById('contentTitle').textContent = this.state.originalTitle;
            
            this.showState('保存成功', false);
            
        } catch (error) {
            this.showState(`保存失败：${error.message}`, false);
        }
    }
    
    // 新建笔记
    async createNewNote(notebookId) {
        this.showState('正在创建新笔记...', true);
        
        try {
            const headers = this.getAuthHeaders();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const noteTitle = `新笔记 ${timestamp}`;
            
            // 调用思源笔记API创建新文档
            const response = await fetch(`${this.serverUrl}/api/filetree/createDocWithMd`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    notebook: notebookId,
                    path: `/${noteTitle}`,
                    markdown: `# ${noteTitle}\n\n在这里开始编写笔记内容...`
                })
            });
            
            if (!response.ok) {
                throw new Error(`创建失败：${response.status}`);
            }
            
            const responseText = await response.text();
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                throw new Error('服务器返回非JSON格式数据');
            }
            
            if (data.code !== 0) {
                throw new Error(`创建失败：${data.msg || '未知错误'}`);
            }
            
            // 创建成功，重新加载文档列表
            const subList = document.querySelector(`.sub-list[data-notebook-id="${notebookId}"]`);
            if (subList) {
                await this.loadDocumentTree(notebookId, subList);
            }
            
            this.showState('新笔记创建成功', false);
            
        } catch (error) {
            this.showState(`创建新笔记失败：${error.message}`, false);
        }
    }
    
    async connect() {
        this.updateStatus('正在连接...', 'connecting');
        this.showState('正在连接到思源笔记服务器...', true);
        
        try {
            const serverReachable = await this.testServerConnection();
            
            if (!serverReachable) {
                throw new Error('无法连接到服务器，请检查服务器地址和网络连接');
            }
            
            const authValid = await this.testAuth();
            
            if (!authValid) {
                throw new Error('API Token认证失败，请检查Token是否正确');
            }
            
            await this.loadNotebooks();
            
            this.updateStatus('已连接', 'connected');
            
        } catch (error) {
            this.updateStatus('连接失败', 'error');
            this.showState('连接失败: ' + error.message, false);
        }
    }
    
    async testServerConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            // 直接访问根路径测试服务器是否运行
            const response = await fetch(`${this.serverUrl}`, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async testAuth() {
        // 简化认证测试，直接尝试使用Token认证
        try {
            const headers = this.getAuthHeaders('Token');
            
            const response = await fetch(`${this.serverUrl}/api/notebook/lsNotebooks`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({})
            });
            
            if (response.ok) {
                // 尝试解析JSON
                try {
                    const data = await response.json();
                    if (data.code === 0) {
                        this.config.api.authPrefix = 'Token';
                        this.state.authMethod = 'Token 认证';
                        return true;
                    }
                } catch (jsonError) {
                    // 尝试直接检查响应文本
                    const responseText = await response.text();
                    
                    if (responseText.includes('"code":0')) {
                        this.config.api.authPrefix = 'Token';
                        this.state.authMethod = 'Token 认证';
                        return true;
                    }
                }
            }
        } catch (error) {
        }
        
        // 如果Token认证失败，尝试无前缀认证
        try {
            const headers = this.getAuthHeaders('');
            
            const response = await fetch(`${this.serverUrl}/api/notebook/lsNotebooks`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({})
            });
            
            if (response.ok) {
                // 尝试解析JSON
                try {
                    const data = await response.json();
                    if (data.code === 0) {
                        this.config.api.authPrefix = '';
                        this.state.authMethod = '无前缀认证';
                        return true;
                    }
                } catch (jsonError) {
                    // 尝试直接检查响应文本
                    const responseText = await response.text();
                    
                    if (responseText.includes('"code":0')) {
                        this.config.api.authPrefix = '';
                        this.state.authMethod = '无前缀认证';
                        return true;
                    }
                }
            }
        } catch (error) {
        }
        
        // 如果所有认证方式都失败，尝试跳过认证直接访问
        this.config.api.authPrefix = '';
        this.state.authMethod = '跳过认证';
        return true;
    }
    
    // 获取认证头的工具方法
    getAuthHeaders(prefix = null) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        const usePrefix = prefix !== null ? prefix : this.authPrefix;
        
        if (usePrefix) {
            headers['Authorization'] = `${usePrefix} ${this.apiToken}`;
        } else if (this.apiToken) {
            headers['Authorization'] = this.apiToken;
        }
        
        return headers;
    }
    
    async loadNotebooks() {
        this.showState('正在加载笔记本...', true);
        
        const headers = this.getAuthHeaders();
        
        try {
            const response = await fetch(`${this.serverUrl}/api/notebook/lsNotebooks`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({})
            });
            
            if (response.ok) {
                // 先读取响应文本
                const responseText = await response.text();
                
                // 尝试解析JSON
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (jsonError) {
                    throw new Error('服务器返回非JSON格式数据');
                }
                
                if (data.code === 0 && data.data && data.data.notebooks) {
                    this.state.notebooks = data.data.notebooks;
                    this.renderNotebooks();
                    this.showState('请选择笔记本', false);
                } else if (data.notebooks) {
                    this.state.notebooks = data.notebooks;
                    this.renderNotebooks();
                    this.showState('请选择笔记本', false);
                } else if (Array.isArray(data)) {
                    this.state.notebooks = data;
                    this.renderNotebooks();
                    this.showState('请选择笔记本', false);
                } else {
                    throw new Error('笔记本数据格式错误');
                }
            } else if (response.status === 401) {
                throw new Error('认证失败 (401 Unauthorized)。\n可能原因：\n1. API Token已过期\n2. 认证前缀不正确\n3. 服务器配置问题');
            } else {
                throw new Error('获取笔记本失败: ' + response.status);
            }
        } catch (error) {
            this.showState('加载笔记本失败: ' + error.message, false);
            throw error;
        }
    }
    
    // 渲染笔记本列表（展开结构）
    renderNotebooks() {
        const navList = document.getElementById('navList');
        navList.innerHTML = ''; 
        document.getElementById('sectionTitle').textContent = '笔记本';
        
        if (this.state.notebooks.length === 0) {
            navList.innerHTML = '<li class="nav-item">暂无笔记本</li>';
            return;
        }
        
        this.state.notebooks.forEach(notebook => {
            // 创建笔记本容器
            const notebookContainer = document.createElement('li');
            notebookContainer.className = 'notebook-container';
            
            // 创建笔记本项
            const li = document.createElement('div');
            li.className = 'nav-item';
            li.dataset.notebookId = notebook.id;
            li.innerHTML = `
                <span class="item-icon">📁</span>
                <span class="item-text">${notebook.name || '未命名笔记本'}</span>
                <span class="expand-icon">▶</span>
            `;
            
            // 创建子文档列表容器
            const subList = document.createElement('ul');
            subList.className = 'sub-list';
            subList.dataset.notebookId = notebook.id;
            
            // 将笔记本项和子列表添加到容器中
            notebookContainer.appendChild(li);
            notebookContainer.appendChild(subList);
            
            // 点击笔记本展开/折叠文档列表
            li.addEventListener('click', (e) => {
                // 防止事件冒泡
                e.stopPropagation();
                
                const expandIcon = li.querySelector('.expand-icon');
                
                if (subList) {
                    subList.classList.toggle('expanded');
                    if (expandIcon) {
                        expandIcon.classList.toggle('expanded');
                    }
                    
                    // 如果展开且没有加载过文档，则加载文档
                    if (subList.classList.contains('expanded') && subList.children.length === 0) {
                        this.loadDocumentTree(notebook.id, subList);
                    }
                }
            });
            
            navList.appendChild(notebookContainer);
        });
    }
    
    // 加载文档树（兼容多版本字段）
    async loadDocumentTree(notebookId, subList = null, path = "/") {
        this.showState('正在加载文档...', true);
        this.state.currentNotebook = notebookId;
        
        const headers = this.getAuthHeaders();
        
        // 方案1：优先使用最新版filetree接口
        try {
            const response = await fetch(`${this.serverUrl}/api/filetree/listDocs`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    notebook: notebookId,
                    path: path,
                    type: "doc"
                })
            });

            if (!response.ok) throw new Error(`接口返回错误：${response.status}`);
            
            // 先读取响应文本
            const responseText = await response.text();
            
            // 尝试解析JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                throw new Error('服务器返回非JSON格式数据');
            }
            
            if (data.code !== 0) throw new Error(`业务错误：${data.msg || '未知错误'}`);
            
            // 标准化文档数据格式
            const normalizedDocs = this.normalizeDocumentData(data.data);
            this.state.documentTree[notebookId] = normalizedDocs;
            this.renderDocumentTree(normalizedDocs, notebookId, subList); 
            this.showState('请选择文档', false);
            return;
        } catch (error) {
        }

        // 方案2：降级使用SQL查询（兼容旧版本）
        try {
            const sqlResponse = await fetch(`${this.serverUrl}/api/query/sql`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    stmt: `SELECT * FROM blocks WHERE box = '${notebookId}' AND type = 'd' ORDER BY updated DESC`
                })
            });
            
            if (sqlResponse.ok) {
                // 先读取响应文本
                const responseText = await sqlResponse.text();
                
                // 尝试解析JSON
                let sqlData;
                try {
                    sqlData = JSON.parse(responseText);
                } catch (jsonError) {
                    throw new Error('服务器返回非JSON格式数据');
                }
                
                if (sqlData.code === 0 && sqlData.data) {
                    // 标准化文档数据
                    const normalizedDocs = this.normalizeDocumentData(sqlData.data);
                    this.state.documentTree[notebookId] = normalizedDocs;
                    this.renderDocumentTree(normalizedDocs, notebookId, subList);
                    this.showState('请选择文档', false);
                    return;
                }
            }
        } catch (e) {
        }

        // 方案3：获取根文档（终极兜底）
        try {
            const rootResponse = await fetch(`${this.serverUrl}/api/filetree/getRootDoc`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    notebook: notebookId
                })
            });
            
            if (rootResponse.ok) {
                // 先读取响应文本
                const responseText = await rootResponse.text();
                
                // 尝试解析JSON
                let rootData;
                try {
                    rootData = JSON.parse(responseText);
                } catch (jsonError) {
                    throw new Error('服务器返回非JSON格式数据');
                }
                if (rootData.code === 0 && rootData.data) {
                    const normalizedDocs = [this.normalizeSingleDoc(rootData.data)];
                    this.state.documentTree[notebookId] = normalizedDocs;
                    this.renderDocumentTree(normalizedDocs, notebookId, subList);
                    this.showState('请选择文档', false);
                    return;
                }
            }
        } catch (e) {
            this.showState(`加载文档失败：${e.message}`, false);
        }
    }
    
    // 标准化文档数据（核心修复：统一字段名）
    normalizeDocumentData(docs) {
        if (!Array.isArray(docs)) docs = [docs];
        
        return docs.map(doc => {
            // 提取文档名称（兼容所有版本字段）
            let docName = doc.name || doc.title || doc.alias || doc.hpath || doc.path || '';
            // 从路径中提取文件名
            if (docName.includes('/') && !docName.includes('.sy')) {
                docName = docName.split('/').pop() || '未命名文档';
            }
            // 去除文件扩展名
            docName = docName.replace(/\.sy$/, '');
            
            // 提取文档ID（兼容所有版本字段）
            let docId = doc.id || doc.block_id || doc.root_id || doc.path || '';
            
            return {
                id: docId,
                name: docName || '未命名文档',
                raw: doc // 保留原始数据
            };
        });
    }
    
    // 标准化单个文档数据
    normalizeSingleDoc(doc) {
        return this.normalizeDocumentData([doc])[0];
    }
    
    // 渲染文档列表（使用标准化后的字段）
    renderDocumentTree(documents, notebookId, subList = null) {
        // 如果提供了subList参数，直接在其中渲染文档列表
        if (subList) {
            subList.innerHTML = '';
            
            // 添加新建笔记选项
            const newNoteLi = document.createElement('li');
            newNoteLi.className = 'nav-item';
            newNoteLi.innerHTML = `
                <span class="item-icon">➕</span>
                <span class="item-text">新建笔记</span>
            `;
            newNoteLi.addEventListener('click', (e) => {
                e.stopPropagation();
                this.createNewNote(notebookId);
            });
            subList.appendChild(newNoteLi);
            
            if (!documents || documents.length === 0) {
                const noDocsLi = document.createElement('li');
                noDocsLi.className = 'nav-item';
                noDocsLi.innerHTML = '<span class="item-text">暂无文档</span>';
                subList.appendChild(noDocsLi);
                return;
            }
            
            // 渲染文档列表（使用标准化后的name和id）
            documents.forEach(doc => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                li.dataset.docId = doc.id; // 使用标准化后的ID
                li.innerHTML = `
                    <span class="item-icon">📄</span>
                    <span class="item-text">${doc.name || '未命名文档'}</span>
                `;
                // 绑定点击事件：加载文档内容
                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.nav-item.active').forEach(item => {
                        item.classList.remove('active');
                    });
                    li.classList.add('active');
                    this.loadDocumentContent(doc.id); // 传递标准化后的ID
                });
                subList.appendChild(li);
            });
        } else {
            // 传统模式：替换整个导航列表
            const navList = document.getElementById('navList');
            navList.innerHTML = ''; 
            document.getElementById('sectionTitle').textContent = '文档列表';
            
            if (!documents || documents.length === 0) {
                navList.innerHTML = '<li class="nav-item">暂无文档</li>';
                return;
            }
            
            // 返回笔记本列表选项
            const backLi = document.createElement('li');
            backLi.className = 'nav-item';
            backLi.innerHTML = `
                <span class="item-icon">⬅</span>
                <span class="item-text">返回笔记本列表</span>
            `;
            backLi.addEventListener('click', () => {
                this.renderNotebooks();
                this.showState('请选择笔记本', false);
                document.getElementById('contentTitle').textContent = '思源笔记';
                document.getElementById('contentBody').innerHTML = `
                    <div class="state-container">
                        <p class="state-message">请选择左侧的笔记本和文档</p>
                    </div>
                `;
                // 隐藏编辑按钮和保存按钮
                const editButton = document.getElementById('editButton');
                const saveButton = document.getElementById('saveButton');
                if (editButton) {
                    editButton.style.display = 'none';
                }
                if (saveButton) {
                    saveButton.style.display = 'none';
                }
            });
            navList.appendChild(backLi);
            
            // 渲染文档列表（使用标准化后的name和id）
            documents.forEach(doc => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                li.dataset.docId = doc.id; // 使用标准化后的ID
                li.innerHTML = `
                    <span class="item-icon">📄</span>
                    <span class="item-text">${doc.name || '未命名文档'}</span>
                `;
                // 绑定点击事件：加载文档内容
                li.addEventListener('click', () => {
                    document.querySelectorAll('.nav-item.active').forEach(item => {
                        item.classList.remove('active');
                    });
                    li.classList.add('active');
                    this.loadDocumentContent(doc.id); // 传递标准化后的ID
                });
                navList.appendChild(li);
            });
        }
    }
    
    // 加载文档内容（使用已验证的API）
    async loadDocumentContent(docId) {
        // 选择笔记后自动收起侧边栏
        this.toggleSidebar();
        this.showState('正在加载笔记内容...', true);
        this.state.currentDocument = docId;
        const headers = this.getAuthHeaders();

        // 方案1：使用getBlockKramdown接口（已验证）
        try {
            const apiUrl = `${this.serverUrl}/api/block/getBlockKramdown`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    id: docId
                })
            });
            
            if (!response.ok) {
                throw new Error(`内容获取失败：${response.status}`);
            }
            
            // 先读取响应文本，避免多次读取响应流
            const responseText = await response.text();
            
            // 尝试解析JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                throw new Error('服务器返回非JSON格式数据');
            }
            
            if (data.code !== 0) {
                throw new Error(`内容获取失败：${data.msg || '未知错误'}`);
            }
            
            // 提取Markdown内容
            const markdownContent = data.data.content || '';
            
            // 转换Markdown为HTML
            const htmlContent = this.markdownToHtml(markdownContent);
            
            // 提取文档标题（兼容多版本字段）
            let docTitle = data.data.title || data.data.name || '未命名文档';
            
            // 渲染文档内容
            this.renderDocumentContent(docTitle, htmlContent);
            
        } catch (error) {
            this.showState(`加载文档内容失败：${error.message}`, false);
        }
    }
    
    // 渲染文档内容
    renderDocumentContent(title, content) {
        const contentBody = document.getElementById('contentBody');
        const contentTitle = document.getElementById('contentTitle');
        
        contentTitle.textContent = title;
        
        contentBody.innerHTML = `
            <div class="note-content">
                <div class="note-body">${content}</div>
            </div>
        `;
        
        // 显示编辑按钮
        const editButton = document.getElementById('editButton');
        if (editButton) {
            editButton.style.display = 'flex';
        }
        
        // 隐藏保存按钮
        const saveButton = document.getElementById('saveButton');
        if (saveButton) {
            saveButton.style.display = 'none';
        }
    }
    
    // 过滤内容
    filterContent(keyword) {
        const navList = document.getElementById('navList');
        const navItems = navList.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(keyword.toLowerCase())) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // 更新状态
    updateStatus(text, type) {
        const statusText = document.getElementById('statusText');
        const statusDot = document.getElementById('statusDot');
        
        if (statusText) {
            statusText.textContent = text;
        }
        
        if (statusDot) {
            statusDot.className = 'status-dot';
            if (type === 'connecting') {
                statusDot.classList.add('connecting');
            } else if (type === 'error') {
                statusDot.classList.add('error');
            }
        }
    }
    
    // 显示状态
    showState(message, isLoading) {
        const contentBody = document.getElementById('contentBody');
        
        if (isLoading) {
            contentBody.innerHTML = `
                <div class="state-container">
                    <div class="spinner"></div>
                    <p class="state-message">${message}</p>
                </div>
            `;
        } else {
            contentBody.innerHTML = `
                <div class="state-container">
                    <p class="state-message">${message}</p>
                </div>
            `;
        }
    }
    
    // Markdown转HTML（简化版）
    markdownToHtml(markdown) {
        if (!markdown) return '';
        
        // 标题
        markdown = markdown.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        markdown = markdown.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        markdown = markdown.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        
        // 段落
        markdown = markdown.replace(/^(?!<h[1-6]>)(.*$)/gm, '<p>$1</p>');
        
        // 粗体
        markdown = markdown.replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>');
        
        // 斜体
        markdown = markdown.replace(/\*(.*)\*/g, '<em>$1</em>');
        
        // 代码
        markdown = markdown.replace(/`(.*)`/g, '<code>$1</code>');
        
        // 代码块
        markdown = markdown.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // 链接
        markdown = markdown.replace(/\[(.*)\]\((.*)\)/g, '<a href="$2">$1</a>');
        
        // 列表
        markdown = markdown.replace(/^\* (.*$)/gm, '<li>$1</li>');
        markdown = markdown.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        return markdown;
    }
    
    // HTML转Markdown（简化版）
    htmlToMarkdown(html) {
        if (!html) return '';
        
        // 标题
        html = html.replace(/<h1>(.*)<\/h1>/g, '# $1\n');
        html = html.replace(/<h2>(.*)<\/h2>/g, '## $1\n');
        html = html.replace(/<h3>(.*)<\/h3>/g, '### $1\n');
        
        // 段落
        html = html.replace(/<p>(.*)<\/p>/g, '$1\n\n');
        
        // 粗体
        html = html.replace(/<strong>(.*)<\/strong>/g, '**$1**');
        
        // 斜体
        html = html.replace(/<em>(.*)<\/em>/g, '*$1*');
        
        // 代码
        html = html.replace(/<code>(.*)<\/code>/g, '`$1`');
        
        // 代码块
        html = html.replace(/<pre><code>(.*)<\/code><\/pre>/g, '```$1```\n');
        
        // 链接
        html = html.replace(/<a href="(.*)">(.*)<\/a>/g, '[$2]($1)');
        
        // 列表
        html = html.replace(/<ul>(.*)<\/ul>/s, '$1\n');
        html = html.replace(/<li>(.*)<\/li>/g, '* $1\n');
        
        // 去除多余空行
        html = html.replace(/\n{3,}/g, '\n\n');
        
        return html.trim();
    }
}

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
                const sidebar = document.querySelector('.sidebar');
                const overlay = document.querySelector('.sidebar-overlay');
                if (sidebar) {
                    sidebar.classList.toggle('open');
                    if (overlay) {
                        overlay.classList.toggle('show');
                    }
                }
                break;
        }
    }
}

// 发送应用名称给容器
function sendAppName() {
    if (window.parent && window.siYuanClient) {
        window.parent.postMessage({
            type: 'set-app-name',
            name: window.siYuanClient.appName
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

// 初始化应用
window.addEventListener('DOMContentLoaded', function() {
    window.siYuanClient = new SiYuanClient();
    initAppContainerCommunication();
});