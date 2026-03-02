/**
 * 场景 - 桌面端逻辑
 */

// 避免重复声明
if (!window.ScenesPageDesktop) {
    window.ScenesPageDesktop = {
        // 场景数据
        scenes: [
            { id: 'home', name: '回家模式', icon: '🌅', description: '开启常用设备' },
            { id: 'away', name: '离家模式', icon: '🌙', description: '关闭所有设备' },
            { id: 'cinema', name: '影院模式', icon: '🎬', description: '调暗灯光，开启电视' },
            { id: 'music', name: '音乐模式', icon: '🎵', description: '播放背景音乐' },
            { id: 'reading', name: '阅读模式', icon: '📚', description: '柔和灯光' },
            { id: 'sleep', name: '睡眠模式', icon: '😴', description: '关闭所有灯光' }
        ],
        
        // 初始化
        init() {
            this.bindEvents();
        },
        
        // 绑定事件
        bindEvents() {
            const sceneCards = document.querySelectorAll('.scene-card');
            sceneCards.forEach(card => {
                card.addEventListener('click', () => this.handleSceneClick(card));
            });
        },
        
        // 处理场景点击
        handleSceneClick(card) {
            const sceneName = card.querySelector('h3').textContent;
            
            // 触发场景点击事件
            window.dispatchEvent(new CustomEvent('scene-activate', {
                detail: { name: sceneName }
            }));
            
            // 显示提示
            if (window.showToast) {
                window.showToast(`已激活: ${sceneName}`);
            }
        }
    };
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ScenesPageDesktop.init();
        });
    } else {
        window.ScenesPageDesktop.init();
    }
}
