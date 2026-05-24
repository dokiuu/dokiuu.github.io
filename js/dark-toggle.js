/**
 * 侧边栏深色/浅色模式切换按钮
 */
document.addEventListener('DOMContentLoaded', function () {
  var sidebar = document.getElementById('l_side');
  if (!sidebar) return;

  // 创建切换按钮
  var toggleBtn = document.createElement('div');
  toggleBtn.className = 'toggle-mode-btn sidebar-toggle-mode';
  toggleBtn.setAttribute('title', '切换深色/浅色模式');
  toggleBtn.innerHTML =
    '<i class="fa-solid fa-moon"></i><i class="fa-solid fa-sun"></i>';

  // 根据当前模式更新图标
  function updateIcon() {
    var html = document.documentElement;
    var mode = html.getAttribute('color-scheme');
    var isDark;
    if (mode === 'dark') {
      isDark = true;
    } else if (mode === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    if (isDark) {
      toggleBtn.classList.add('dark');
    } else {
      toggleBtn.classList.remove('dark');
    }
  }

  updateIcon();

  // 订阅 volantis 暗色模式切换事件，切换时更新图标
  if (typeof volantis !== 'undefined' && volantis.dark && volantis.dark.push) {
    volantis.dark.push(updateIcon);
  }

  // 监听系统主题变化
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', updateIcon);

  // 插入到侧边栏顶部
  sidebar.insertBefore(toggleBtn, sidebar.firstChild);
});
