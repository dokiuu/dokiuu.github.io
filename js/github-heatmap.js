(function() {
  var username = 'dokiuu';
  var heatmapEl, statsEl;

  function loadFromCommitsAPI() {
    var allDates = [];
    fetchPages(1, allDates);
  }

  function fetchPages(page, allDates) {
    if (page > 10) { done(allDates); return; }
    fetch('https://api.github.com/search/commits?q=author:' + username + '&sort=committer-date&order=desc&per_page=100&page=' + page, {
      headers: { 'Accept': 'application/vnd.github.cloak-preview+json' }
    })
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(data) {
      if (!data || !data.items) { done(allDates); return; }
      data.items.forEach(function(item) {
        if (item.commit && item.commit.committer && item.commit.committer.date) {
          allDates.push(item.commit.committer.date.substring(0, 10));
        }
      });
      if (data.items.length === 100 && allDates.length < 1000) {
        fetchPages(page + 1, allDates);
      } else {
        done(allDates);
      }
    })
    .catch(function() { done(allDates); });
  }

  function done(allDates) {
    var commitsByDate = {};
    allDates.forEach(function(d) { commitsByDate[d] = (commitsByDate[d] || 0) + 1; });
    if (Object.keys(commitsByDate).length > 0) buildCalendarFromDates(commitsByDate);
  }

  function buildCalendarWeeks(commits) {
    var today = new Date();
    var startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    var weeks = [];
    var cur = new Date(startDate);
    while (cur <= today) {
      var week = [];
      for (var i = 0; i < 7; i++) {
        var dStr = cur.toISOString().substring(0, 10);
        week.push({ date: dStr, contributionCount: commits[dStr] || 0, weekday: i });
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push({ contributionDays: week });
    }
    return weeks;
  }

  function renderEmptyCalendar() { renderWithCommits({}); }
  function buildCalendarFromDates(commits) { renderWithCommits(commits); }

  function renderWithCommits(commits) {
    var weeks = buildCalendarWeeks(commits);
    var totalCount = 0;
    Object.values(commits).forEach(function(c) { totalCount += c; });

    var mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // === 用 table 布局保证列对齐 ===
    var html = '<table class="gh-table"><tbody>';

    // 第1行：月份标签
    html += '<tr class="gh-month-row">';
    html += '<td class="gh-month-label-cell"></td>';
    var lastMonthKey = '';
    weeks.forEach(function(wk) {
      var firstDay = wk.contributionDays[0];
      var mKey = firstDay.date.substring(5, 7);
      html += '<td class="gh-month-td">';
      if (mKey !== lastMonthKey) {
        html += '<span class="gh-month-label">' + mNames[parseInt(mKey, 10) - 1] + '</span>';
        lastMonthKey = mKey;
      }
      html += '</td>';
    });
    html += '</tr>';

    // 第2-8行：7天格子
    var dayNames = ['Mon', '', 'Wed', '', 'Fri', '', ''];
    for (var d = 0; d < 7; d++) {
      html += '<tr>';
      html += '<td class="gh-day-label-cell">' + dayNames[d] + '</td>';
      weeks.forEach(function(wk) {
        var day = wk.contributionDays[d];
        var lvl = 0;
        if (day.contributionCount >= 16) lvl = 4;
        else if (day.contributionCount >= 8) lvl = 3;
        else if (day.contributionCount >= 4) lvl = 2;
        else if (day.contributionCount >= 1) lvl = 1;
        html += '<td class="gh-cell td gh-level-' + lvl + '" title="' + day.date + ': ' + day.contributionCount + ' contributions"></td>';
      });
      html += '</tr>';
    }

    html += '</tbody></table>';

    heatmapEl.innerHTML = html;

    var totalText = Object.keys(commits).length > 0
      ? (totalCount + ' contributions in the last year')
      : 'GitHub contributions';
    statsEl.innerHTML = '<div class="gh-footer"><div class="gh-footer-left"><span class="gh-source">数据来源 <a href="https://github.com/' + username + '" target="_blank">@' + username + '</a></span><span class="gh-total-text">' + totalText + '</span></div><div class="gh-legend"><span>Less</span><span class="gh-cell gh-level-1"></span><span class="gh-cell gh-level-2"></span><span class="gh-cell gh-level-3"></span><span class="gh-cell gh-level-4"></span><span>More</span></div></div>';
  }

  function init() {
    // 只在首页（/#/ 或 /）渲染热力图
    var isHomepage = location.pathname === '/' || location.pathname === '/index.html' || location.hash === '#/';
    if (!isHomepage) return;

    var container = document.getElementById('github-heatmap');
    if (!container) return;

    heatmapEl = document.getElementById('heatmap-container');
    statsEl = document.getElementById('heatmap-stats');
    if (!heatmapEl || !statsEl) return;

    renderEmptyCalendar();
    loadFromCommitsAPI();
  }

  // 首次加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Volantis pjax 切换页面后重新初始化
  // 注意：pjax 回调执行时 DOM 可能还没完全更新，需要延迟到下一帧
  if (typeof volantis !== 'undefined' && volantis.pjax) {
    volantis.pjax.push(function() {
      window.requestAnimationFrame(function() {
        window.requestAnimationFrame(init);
      });
    }, 'github-heatmap');
  }

})();
