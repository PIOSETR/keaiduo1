/* ===========================================================
   js/game.js  —  等级 / 经验 / 成就 / 打卡 / 游戏化系统
   =========================================================== */

/* ---------- 经验值 & 等级 ---------- */
function xpForLevel(lv) { return lv * lv * 50; }

function updateLevelBadge() {
  document.getElementById('levelBadge').textContent = `🌟 Lv.${store.level}`;
}

function addXP(amount) {
  store.xp += amount;
  const needed = xpForLevel(store.level);
  if (store.xp >= needed) {
    store.xp -= needed;
    store.level++;
    showAchievement('🎉', '升级了！', `恭喜达到 Lv.${store.level}！继续加油喵~`);
  }
  saveGame();
}

/* ---------- 每日打卡 ---------- */
function checkStreak() {
  const today = new Date().toLocaleDateString('zh-CN');
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('zh-CN');
  if (store.lastDate === today) return;
  if (store.lastDate === yesterday) { store.streak++; }
  else if (store.lastDate !== '') { store.streak = 0; }
  store.lastDate = today;
  saveGame();
  updateStreakUI();
}

function updateStreakUI() {
  document.getElementById('streakDays').textContent = store.streak;
  const today = new Date().toLocaleDateString('zh-CN');
  document.getElementById('streakToday').textContent =
    store.lastDate === today ? '✅ 今日已打卡' : '📌 今日未打卡';
}

/* ---------- 成就徽章 ---------- */
function checkAchievements() {
  const newAch = [];
  const ach = store.achievements;
  if (store.totalWords >= 10  && !ach.includes('10words'))  { ach.push('10words');  newAch.push('📝 听写新手'); }
  if (store.totalWords >= 50  && !ach.includes('50words'))  { ach.push('50words');  newAch.push('🌟 听写达人'); }
  if (store.totalWords >= 100 && !ach.includes('100words')) { ach.push('100words'); newAch.push('🏆 听写大师'); }
  if (store.totalWords >= 500 && !ach.includes('500words')) { ach.push('500words'); newAch.push('👑 听写王者'); }
  if (store.streak >= 3      && !ach.includes('3day'))      { ach.push('3day');     newAch.push('🔥 三日打卡'); }
  if (store.streak >= 7      && !ach.includes('7day'))      { ach.push('7day');     newAch.push('💪 七日坚持'); }
  if (store.streak >= 30     && !ach.includes('30day'))     { ach.push('30day');    newAch.push('🎯 月度冠军'); }
  if (store.level >= 5       && !ach.includes('lv5'))       { ach.push('lv5');      newAch.push('⭐ 五级学霸'); }
  if (store.level >= 10      && !ach.includes('lv10'))      { ach.push('lv10');     newAch.push('💎 十级大神'); }
  saveGame();
  if (newAch.length > 0) showAchievement('🏆', '成就解锁！', newAch[0]);
}

function showAchievement(icon, title, desc) {
  document.getElementById('achIcon').textContent = icon;
  document.getElementById('achTitle').textContent = title;
  document.getElementById('achDesc').textContent = desc;
  document.getElementById('achievePopup').classList.add('show');
  setTimeout(() => document.getElementById('achievePopup').classList.remove('show'), 2500);
}

function saveGame() {
  localStorage.setItem('xp',  store.xp);
  localStorage.setItem('lv',  store.level);
  localStorage.setItem('tw',  store.totalWords);
  localStorage.setItem('st',  store.streak);
  localStorage.setItem('ld',  store.lastDate);
  localStorage.setItem('ach', JSON.stringify(store.achievements));
  updateLevelBadge();
}

/* ---------- 初始化游戏状态 ---------- */
function initGameState() {
  store.xp          = parseInt(localStorage.getItem('xp'))  || 0;
  store.level       = parseInt(localStorage.getItem('lv'))  || 1;
  store.totalWords  = parseInt(localStorage.getItem('tw'))  || 0;
  store.streak      = parseInt(localStorage.getItem('st'))  || 0;
  store.lastDate    = localStorage.getItem('ld') || '';
  store.achievements = JSON.parse(localStorage.getItem('ach')) || [];
}