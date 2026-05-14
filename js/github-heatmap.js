(function() {
  var container = document.getElementById('github-heatmap');
  if (!container) return;

  var username = 'dokiuu';
  var heatmapEl = document.getElementById('heatmap-container');
  var statsEl = document.getElementById('heatmap-stats');

  // 立即渲染空格子
  renderEmptyCalendar();

  // 使用 Search Commits API 获取真实贡献数据
  loadFromCommitsAPI();

  function loadFromCommitsAPI() {
    var allDates = [];

    fetchPages(1, allDates);
  }

  function fetchPages(page, allDates) {
    if (page > 10) {
      done(allDates);
      return;
    }

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
    allDates.forEach(function(d) {
      commitsByDate[d] = (commitsByDate[d] || 0) + 1;
    });
    if (Object.keys(commitsByDate).length > 0) {
      buildCalendarFromDates(commitsByDate);
    }
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

  function renderEmptyCalendar() {
    renderWithCommits({});
  }

  function buildCalendarFromDates(commits) {
    renderWithCommits(commits);
  }

  function renderWithCommits(commits) {
    var today = new Date();
    var startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    var weeks = buildCalendarWeeks(commits);

    var totalCount = 0;
    Object.values(commits).forEach(function(c) { totalCount += c; });

    var mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // === 整体布局：相对定位容器包裹月份+网格 ===
    var wrapperHtml = '<div class="gh-grid-wrapper">';

    // 月份行 - 绝对定位，渲染后由 JS 设置位置
    wrapperHtml += '<div class="gh-months" id="gh-month-row"></div>';

    // 网格主体
    var gridHtml = '<div class="gh-body">';
    gridHtml += '<div class="gh-day-labels"><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span></span></div>';
    gridHtml += '<div class="gh-weeks" id="gh-weeks-el">';

    weeks.forEach(function(wk, wi) {
      gridHtml += '<div class="gh-week" data-wi="' + wi + '">';
      wk.contributionDays.forEach(function(day) {
        var lvl = 0;
        if (day.contributionCount >= 16) lvl = 4;
        else if (day.contributionCount >= 8) lvl = 3;
        else if (day.contributionCount >= 4) lvl = 2;
        else if (day.contributionCount >= 1) lvl = 1;
        gridHtml += '<span class="gh-cell gh-level-' + lvl + '" title="' + day.date + ': ' + day.contributionCount + ' contributions"></span>';
      });
      gridHtml += '</div>';
    });

    gridHtml += '</div></div>';
    wrapperHtml += gridHtml + '</div>';

    heatmapEl.innerHTML = wrapperHtml;

    // 渲染后定位月份标签到对应列
    setTimeout(function() { positionMonthLabels(weeks); }, 0);

    var totalText = Object.keys(commits).length > 0
      ? (totalCount + ' contributions in the last year')
      : 'GitHub contributions';
    statsEl.innerHTML = '<div class="gh-footer"><span class="gh-total-text">' + totalText + '</span><div class="gh-legend"><span>Less</span><span class="gh-cell gh-level-1"></span><span class="gh-cell gh-level-2"></span><span class="gh-cell gh-level-3"></span><span class="gh-cell gh-level-4"></span><span>More</span></div></div>';
  }

  // 根据实际 DOM 列位置定位月份标签
  function positionMonthLabels(weeks) {
    var monthRow = document.getElementById('gh-month-row');
    var weekEl = document.getElementById('gh-weeks-el');
    if (!monthRow || !weekEl) return;

    var mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var lastMonthKey = '';
    var weekColumns = weekEl.querySelectorAll('.gh-week');
    // gh-weeks 左侧有 gh-day-labels(约32px)，月份标签的 left 需要加上这个偏移
    var weekLeftOffset = weekEl.offsetLeft;

    weeks.forEach(function(wk, wi) {
      var firstDay = wk.contributionDays[0];
      var mKey = firstDay.date.substring(5, 7);
      if (mKey !== lastMonthKey && wi < weekColumns.length) {
        var col = weekColumns[wi];
        // 列相对于 gh-grid-wrapper 的位置 = gh-weeks 的 offsetLeft + 该列在 gh-weeks 内的 offsetLeft
        var left = weekLeftOffset + col.offsetLeft;
        var label = document.createElement('span');
        label.className = 'gh-month-label';
        label.textContent = mNames[parseInt(mKey, 10) - 1];
        label.style.left = left + 'px';
        monthRow.appendChild(label);
        lastMonthKey = mKey;
      }
    });
  }
})();
