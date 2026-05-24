/**
 * 深色/浅色模式切换按钮 —— 悬浮在页面左下角
 * 依赖 volantis 主题的 darkmode 系统（volantis.dark.toggle()）
 */
(function () {
  var btn = null;

  // 根据当前模式更新图标
  function updateIcon() {
    if (!btn) return;
    var mode = document.documentElement.getAttribute('color-scheme');
    var isDark = mode === 'dark';
    btn.classList.toggle('dark', isDark);
    btn.setAttribute('title', isDark ? '切换到浅色模式' : '切换到深色模式');
  }

  // 订阅 volantis darkmode 变化事件
  function subscribeVolantis() {
    try {
      if (typeof volantis !== 'undefined' && volantis.dark && volantis.dark.push) {
        volantis.dark.push(updateIcon);
      }
    } catch (e) {
      // volantis 尚未初始化，稍后重试
      setTimeout(subscribeVolantis, 200);
    }
  }

  // 监听系统主题变化（跟随系统时自动更新）
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', updateIcon);

  // 初始化
  function init() {
    if (btn) return;

    // 创建悬浮按钮
    btn = document.createElement('button');
    btn.className = 'float-theme-toggle';
    btn.setAttribute('aria-label', '切换深色/浅色模式');
    btn.innerHTML =
      '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>' +
      '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';

    // 点击切换
    btn.addEventListener('click', function () {
      try {
        if (typeof volantis !== 'undefined' && volantis.dark && volantis.dark.toggle) {
          volantis.dark.toggle();
        }
      } catch (e) {
        console.warn('volantis.dark.toggle() 不可用', e);
      }
    });

    // 插入到 body 末尾
    document.body.appendChild(btn);

    // 初始图标
    updateIcon();

    // 订阅 volantis 事件
    setTimeout(subscribeVolantis, 100);
  }

  // volantis 主题有时通过 pjax 切换页面，需要在每次 pjax 后确保按钮存在
  document.addEventListener('DOMContentLoaded', init);
  // pjax 完成后重新初始化（延迟确保 volantis 已就绪）
  setTimeout(function () {
    try {
      if (typeof volantis !== 'undefined' && volantis.pjax && volantis.pjax.push) {
        volantis.pjax.push(function () {
          setTimeout(init, 50);
        });
      }
    } catch (e) {}
  }, 500);
})();
