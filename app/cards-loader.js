/**
 * 卡片组件统一加载器
 * 文件：app/cards-loader.js
 *
 * 用途：
 *   根据 config.js 中的 AppConfig.cards 配置，自动注入各卡片的 CSS/JS，
 *   全部加载完成后再加载 index.js。新增卡片时只需在 config.js 的 cards 里加一项，
 *   无需修改 index.html 或各页面的注册代码。
 *
 * 依赖：必须先加载 config/config.js，且 AppConfig.cards 为数组。
 *
 * 约定：
 *   - 每项配置为 { id, name, tag }
 *   - 路径自动拼为：cards/{id}/css/{id}-card.css、cards/{id}/js/{id}-component.js
 *   - 卡片脚本需将组件挂到 window[name]（如 window.Card1x1Component）
 */

(function () {
    'use strict';

    var config = window.AppConfig && window.AppConfig.cards;
    if (!Array.isArray(config) || config.length === 0) {
        // AppConfig.cards 未配置或为空，跳过卡片加载
        loadMain();
        return;
    }

    // 注入所有卡片的 CSS（并行插入 <link>，不阻塞）
    var cssLoadCount = 0;
    var cssTotal = config.filter(function (c) { return c.id; }).length;

    config.forEach(function (card) {
        var id = card.id;
        if (!id) return;
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'cards/' + id + '/css/' + id + '-card.css';

        // CSS 加载完成后计数，全部加载完成则显示页面
        link.onload = function () {
            cssLoadCount++;
            if (cssLoadCount >= cssTotal) {
                showPage();
            }
        };
        link.onerror = function () {
            console.error('[cards-loader] CSS 加载失败: ' + link.href);
            cssLoadCount++;
            if (cssLoadCount >= cssTotal) {
                showPage();
            }
        };

        document.head.appendChild(link);
    });

    // 如果没有 CSS 需要加载，直接显示页面
    if (cssTotal === 0) {
        showPage();
    }

    // 按配置顺序依次加载卡片 JS，全部 onload 后再加载入口脚本
    loadScripts(0);

    /**
     * 递归加载第 idx 个卡片的 JS；全部加载完后执行 loadMain。
     * 保证 index.js 在卡片脚本之后执行。
     */
    function loadScripts(idx) {
        if (idx >= config.length) {
            loadMain();
            return;
        }
        var card = config[idx];
        var id = card.id;
        if (!id) {
            loadScripts(idx + 1);
            return;
        }
        var script = document.createElement('script');
        script.src = 'cards/' + id + '/js/' + id + '-component.js';
        script.onload = function () { loadScripts(idx + 1); };
        script.onerror = function () {
            console.error('[cards-loader] 加载失败: ' + script.src);
            loadScripts(idx + 1);
        };
        document.body.appendChild(script);
    }

    /**
     * 动态插入 index.js，作为入口脚本。
     */
    function loadMain() {
        var script = document.createElement('script');
        script.src = 'index.js';
        document.body.appendChild(script);
    }

    /**
     * 显示页面，添加 .loaded 类到 body
     */
    function showPage() {
        document.body.classList.add('loaded');
    }
})();
