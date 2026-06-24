/* ===========================================================
   js/app.js  —  主应用逻辑：全局状态、导航、听写流程、词库、错词本、自定义、PWA
   =========================================================== */

/* ---------- 全局状态 ---------- */
const store = {
  words:        loadWords(),
  errors:       loadErrors(),
  // 游戏化（由 game.js 负责初始化）
  xp:           0,
  level:        1,
  totalWords:   0,
  streak:       0,
  lastDate:     '',
  achievements: [],
  // 听写会话
  selGrade:     '1',
  selLesson:    '0',
  dictWords:    [],
  dictIdx:      0,
  correct:      0,
  wrong:        0,
  results:      [],
  isReview:     false,
  speaking:     false
};

// 确保词库有 icon
ensureIcons();
// 初始化游戏化状态
initGameState();

/* ---------- 导航 ---------- */
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const page = document.getElementById('page-' + btn.dataset.page);
    page.classList.add('active');
    updateAppBar(btn.dataset.page);
    if (btn.dataset.page === 'library')  renderLibrary();
    if (btn.dataset.page === 'custom')   renderCustom();
    if (btn.dataset.page === 'errors')   renderErrors();
  });
});

function updateAppBar(page) {
  const titles = {
    dictate: '喵喵听写', library: '📚 词库管理',
    custom: '✏️ 自定义听写', errors: '📝 错词本'
  };
  const subs = {
    dictate: '小学语文听写练习', library: '管理你的生词库',
    custom: '自由输入想听写的词', errors: '复习曾经写错的词'
  };
  document.querySelector('.app-bar h1').textContent = titles[page] || '喵喵听写';
  document.getElementById('appBarSub').textContent = subs[page] || '小学语文听写练习';
}

function updateErrorDot() {
  document.getElementById('errorDot').style.display = store.errors.length > 0 ? 'block' : 'none';
}
updateErrorDot();

/* ===========================================================
   听写页 — 年级 / 课程 / 预览
   =========================================================== */
function renderGrades() {
  const g = document.getElementById('gradeGrid'); g.innerHTML = '';
  Object.keys(store.words).forEach(k => {
    const d = document.createElement('div');
    d.className = 'grade-card' + (store.selGrade === k ? ' selected' : '');
    const icon = store.words[k].icon || '📖';
    d.innerHTML = `<span class="grade-icon">${icon}</span><span class="num">${k}</span>${store.words[k].name}`;
    d.addEventListener('click', () => selectGrade(k));
    g.appendChild(d);
  });
}

function selectGrade(k) {
  store.selGrade = k; store.selLesson = '0';
  renderGrades(); renderLessons();
}

function renderLessons() {
  const g = document.getElementById('lessonGrid'); g.innerHTML = '';
  const grade = store.words[store.selGrade]; if (!grade) return;
  grade.lessons.forEach((l, i) => {
    const d = document.createElement('div');
    d.className = 'lesson-item' + (store.selLesson == i ? ' selected' : '');
    d.textContent = l.name;
    d.addEventListener('click', () => selectLesson(i));
    g.appendChild(d);
  });
  const idx = parseInt(store.selLesson);
  const lesson = grade.lessons[idx];
  if (lesson) {
    document.getElementById('wordPreview').innerHTML = lesson.words.map(w => `<span class="word-tag">${w[0]}</span>`).join('');
    document.getElementById('wordCount').textContent = lesson.words.length + '个词';
  }
}

function selectLesson(i) {
  store.selLesson = i;
  document.querySelectorAll('.lesson-item').forEach((el, idx) => {
    el.className = 'lesson-item' + (idx == i ? ' selected' : '');
  });
  const grade = store.words[store.selGrade];
  const lesson = grade.lessons[i];
  document.getElementById('wordPreview').innerHTML = lesson.words.map(w => `<span class="word-tag">${w[0]}</span>`).join('');
  document.getElementById('wordCount').textContent = lesson.words.length + '个词';
}

/* ===========================================================
   听写流程
   =========================================================== */
document.getElementById('startBtn').addEventListener('click', () => {
  const g = store.words[store.selGrade];
  const l = g.lessons[parseInt(store.selLesson)];
  let words = [...l.words];
  if (document.getElementById('shuffleMode').value === '1') words = shuffle(words);
  store.dictWords = words; store.dictIdx = 0;
  store.correct = 0; store.wrong = 0; store.results = []; store.isReview = false;
  document.getElementById('dictateSetup').style.display = 'none';
  document.getElementById('dictateResult').style.display = 'none';
  document.getElementById('dictateResult').classList.add('hidden');
  const p = document.getElementById('dictateProgress');
  p.style.display = 'block'; p.classList.remove('hidden');
  document.getElementById('mascotProgress').className = 'cat-mascot thinking';
  showWord();
  checkStreak();
});

function showWord() {
  if (store.dictIdx >= store.dictWords.length) { finish(); return; }
  const w = store.dictWords[store.dictIdx];
  const t = store.dictWords.length; const i = store.dictIdx + 1;
  document.getElementById('progText').textContent = `第${i}/${t}个`;
  document.getElementById('progFill').style.width = `${(i) / t * 100}%`;
  document.getElementById('scoreText').textContent = `✅ ${store.correct} | ❌ ${store.wrong}`;
  document.getElementById('wordDisplay').textContent = '?';
  document.getElementById('wordDisplay').style.color = 'var(--txt)';
  document.getElementById('wordPinyin').textContent = '';
  document.getElementById('showAnsBtn').style.display = '';
  document.getElementById('showAnsBtn').classList.remove('hidden');
  document.getElementById('markBtns').style.display = 'none';
  document.getElementById('markBtns').classList.add('hidden');
  readWord();
}

function readWord() {
  const w = store.dictWords[store.dictIdx];
  const r = parseInt(document.getElementById('repeatCount').value);
  let c = 0;
  function go() {
    if (c >= r) return; c++;
    document.getElementById('speakerBtn').classList.add('speaking');
    speak(w[0], () => {
      document.getElementById('speakerBtn').classList.remove('speaking');
      if (c < r) setTimeout(go, 200);
      else if (document.getElementById('readPinyin').value === '1') readPinyin();
    });
  }
  go();
}

function readPinyin() {
  const w = store.dictWords[store.dictIdx];
  if (!w[1]) return;
  document.getElementById('speakerBtn').classList.add('speaking');
  speak(w[1], () => document.getElementById('speakerBtn').classList.remove('speaking'));
}

document.getElementById('speakerBtn').addEventListener('click', readWord);
document.getElementById('repeatBtn').addEventListener('click', readWord);

document.getElementById('showAnsBtn').addEventListener('click', () => {
  const w = store.dictWords[store.dictIdx];
  document.getElementById('wordDisplay').textContent = w[0];
  document.getElementById('wordDisplay').style.color = 'var(--c5)';
  document.getElementById('wordPinyin').textContent = w[1] || '';
  document.getElementById('showAnsBtn').style.display = 'none';
  document.getElementById('showAnsBtn').classList.add('hidden');
  document.getElementById('markBtns').style.display = 'flex';
  document.getElementById('markBtns').classList.remove('hidden');
});

document.getElementById('correctBtn').addEventListener('click', () => {
  store.correct++; store.results.push([store.dictWords[store.dictIdx], true]);
  sfxCorrect();
  const mascot = document.getElementById('mascotProgress');
  mascot.className = 'cat-mascot happy';
  setTimeout(() => mascot.className = 'cat-mascot thinking', 500);
  next();
});

document.getElementById('wrongBtn').addEventListener('click', () => {
  store.wrong++; const w = store.dictWords[store.dictIdx];
  store.results.push([w, false]); addErr(w);
  sfxWrong();
  const mascot = document.getElementById('mascotProgress');
  mascot.className = 'cat-mascot sad';
  setTimeout(() => mascot.className = 'cat-mascot thinking', 500);
  next();
});

document.getElementById('skipBtn').addEventListener('click', () => {
  const w = store.dictWords[store.dictIdx];
  store.results.push([w, false]); addErr(w);
  next();
});

document.getElementById('endEarlyBtn').addEventListener('click', () => {
  if (confirm('确定结束听写吗？')) finish();
});

function next() { store.dictIdx++; setTimeout(showWord, 300); }

function addErr(w) {
  if (!store.errors.some(e => e[0] === w[0])) {
    store.errors.push([...w]);
  } else {
    const e = store.errors.find(e => e[0] === w[0]);
    e[2] = (e[2] || 0) + 1;
  }
  saveErrors();
}

function finish() {
  const t = store.dictWords.length; const c = store.correct;
  const s = t > 0 ? Math.round(c / t * 100) : 0;
  document.getElementById('dictateProgress').style.display = 'none';
  document.getElementById('dictateResult').style.display = 'block';
  document.getElementById('dictateResult').classList.remove('hidden');

  /* 星星 */
  const stars = s >= 90 ? 3 : s >= 60 ? 2 : s >= 30 ? 1 : 0;
  let starsHTML = '';
  for (let i = 0; i < 3; i++) starsHTML += i < stars ? '⭐' : '<span class="star-empty">⭐</span>';
  document.getElementById('starsRow').innerHTML = starsHTML;

  const sd = document.getElementById('scoreDisplay');
  sd.textContent = s + '分';
  sd.className = 'score-display ' + (s >= 90 ? 'great' : s >= 70 ? 'good' : s >= 50 ? 'ok' : 'bad');

  document.getElementById('resCorrect').textContent = c;
  document.getElementById('resWrong').textContent = store.wrong;
  document.getElementById('resTotal').textContent = t;

  /* 经验值 */
  const xp = c * 2 + stars * 10;
  document.getElementById('xpGain').textContent = `✨ +${xp} 经验值`;
  addXP(xp);
  store.totalWords += c;
  saveGame();
  checkAchievements();

  /* 猫咪表情 */
  const mascot = document.getElementById('mascotResult');
  mascot.className = s >= 90 ? 'cat-mascot happy' : s >= 60 ? 'cat-mascot thinking' : 'cat-mascot sad';
  if (s >= 90) { sfxComplete(); launchConfetti(); }

  /* 结果列表 */
  const rl = document.getElementById('resultList'); rl.innerHTML = '';
  store.results.forEach(([w, ok]) => {
    const d = document.createElement('div');
    d.className = 'result-item ' + (ok ? 'correct' : 'wrong');
    d.innerHTML = `<span class="word">${w[0]} <span style="font-weight:400;color:var(--txt3);font-size:12px">${w[1]||''}</span></span><span>${ok?'✅':'❌'}</span>`;
    rl.appendChild(d);
  });

  const rb = document.getElementById('reviewErrorBtn');
  if (store.wrong > 0) {
    rb.style.display = ''; rb.classList.remove('hidden');
    rb.onclick = reviewErrors;
  } else {
    rb.style.display = 'none'; rb.classList.add('hidden');
  }
}

function reviewErrors() {
  const w = store.results.filter(r => !r[1]).map(r => r[0]);
  if (!w.length) return;
  if (document.getElementById('shuffleMode').value === '1') shuffle(w);
  store.dictWords = w.map(a => [...a]); store.dictIdx = 0;
  store.correct = 0; store.wrong = 0; store.results = []; store.isReview = true;
  document.getElementById('dictateResult').style.display = 'none';
  document.getElementById('dictateResult').classList.add('hidden');
  document.getElementById('dictateProgress').style.display = 'block';
  document.getElementById('dictateProgress').classList.remove('hidden');
  document.getElementById('mascotProgress').className = 'cat-mascot thinking';
  showWord();
}

document.getElementById('retryBtn').addEventListener('click', () => {
  document.getElementById('dictateResult').style.display = 'none';
  document.getElementById('dictateResult').classList.add('hidden');
  document.getElementById('dictateSetup').style.display = 'block';
});
document.getElementById('backHomeBtn').addEventListener('click', () => {
  document.getElementById('dictateResult').style.display = 'none';
  document.getElementById('dictateResult').classList.add('hidden');
  document.getElementById('dictateSetup').style.display = 'block';
});

/* ===========================================================
   词库管理
   =========================================================== */
function renderLibrary() {
  const gs = document.getElementById('libGrade');
  const cv = gs.value || store.selGrade;
  gs.innerHTML = '';
  Object.keys(store.words).forEach(k => {
    const o = document.createElement('option');
    o.value = k; o.textContent = `${k}年级`;
    if (k == cv) o.selected = true;
    gs.appendChild(o);
  });
  renderLibLessons();
}

function renderLibLessons() {
  const gs = document.getElementById('libGrade');
  const ls = document.getElementById('libLesson');
  const g = store.words[gs.value]; ls.innerHTML = '';
  if (!g) return;
  g.lessons.forEach((l, i) => {
    const o = document.createElement('option');
    o.value = i; o.textContent = l.name + (l.words.length > 0 ? `(${l.words.length}词)` : '');
    ls.appendChild(o);
  });
  renderLibWords();
}

function renderLibWords() {
  const gs = document.getElementById('libGrade');
  const ls = document.getElementById('libLesson');
  const g = store.words[gs.value]; if (!g) return;
  const l = g.lessons[parseInt(ls.value)]; if (!l) return;
  const el = document.getElementById('libWordList'); el.innerHTML = '';
  l.words.forEach(([w, p], i) => {
    const d = document.createElement('div'); d.className = 'word-mgr-item';
    d.innerHTML = `<div><span class="w">${w}</span> <span class="p">${p}</span></div>
      <div class="acts"><button class="play-btn" data-w="${w}">🔊</button><button class="del-btn" data-i="${i}">✕</button></div>`;
    el.appendChild(d);
  });
  el.querySelectorAll('.play-btn').forEach(b => b.addEventListener('click', () => speak(b.dataset.w)));
  el.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', () => {
    if (confirm('确定删除？')) { l.words.splice(parseInt(b.dataset.i), 1); saveWords(); renderLibWords(); toast('已删除'); }
  }));
}

document.getElementById('libGrade').addEventListener('change', renderLibLessons);
document.getElementById('libLesson').addEventListener('change', renderLibWords);

document.getElementById('addWordBtn').addEventListener('click', () => {
  document.getElementById('modalTitle').textContent = '✏️ 添加生词';
  document.getElementById('modalWord').value = '';
  document.getElementById('modalPinyin').value = '';
  document.getElementById('modalEditIdx').value = '-1';
  document.getElementById('wordModal').classList.add('show');
  setTimeout(() => document.getElementById('modalWord').focus(), 300);
});

document.getElementById('modalCancel').addEventListener('click', () => {
  document.getElementById('wordModal').classList.remove('show');
});

document.getElementById('modalConfirm').addEventListener('click', () => {
  const w = document.getElementById('modalWord').value.trim();
  const p = document.getElementById('modalPinyin').value.trim();
  const ei = parseInt(document.getElementById('modalEditIdx').value);
  if (!w) { toast('请输入汉字'); return; }
  const g = store.words[document.getElementById('libGrade').value];
  const l = g.lessons[parseInt(document.getElementById('libLesson').value)];
  if (ei >= 0) { l.words[ei] = [w, p]; toast('已修改'); }
  else { l.words.push([w, p]); toast('已添加'); }
  saveWords();
  document.getElementById('wordModal').classList.remove('show');
  renderLibWords();
});

/* 批量导入 */
document.getElementById('batchBtn').addEventListener('click', () => {
  const t = document.getElementById('batchInput').value.trim();
  if (!t) { toast('请输入内容'); return; }
  const g = store.words[document.getElementById('libGrade').value];
  const l = g.lessons[parseInt(document.getElementById('libLesson').value)];
  let c = 0;
  t.split('\n').forEach(line => {
    line = line.trim(); if (!line) return;
    const m = line.match(/^(.+?)\s+(.+)$/);
    if (m) { l.words.push([m[1].trim(), m[2].trim()]); c++; }
    else if (line.length > 0) { l.words.push([line, '']); c++; }
  });
  if (c > 0) { saveWords(); renderLibWords(); document.getElementById('batchInput').value = ''; toast(`成功导入${c}个词`); }
  else toast('没有识别到有效内容');
});

/* ===========================================================
   错词本
   =========================================================== */
function renderErrors() {
  document.getElementById('errCount').textContent = `(${store.errors.length}个)`;
  const el = document.getElementById('errorList');
  if (!store.errors.length) {
    el.innerHTML = '<div class="empty-state"><span class="icon">🎉</span><p>太棒了！还没有错词记录 🎈</p></div>';
    return;
  }
  el.innerHTML = '';
  store.errors.forEach(([w, p, cnt]) => {
    const d = document.createElement('div'); d.className = 'error-item';
    d.innerHTML = `<span class="ew">${w} <span style="font-size:12px;color:var(--txt3)">${p||''}</span> <span style="font-size:11px;color:var(--txt3)">(错${cnt||1}次)</span></span>
      <button class="play-btn" data-w="${w}" style="background:none;border:none;font-size:16px;cursor:pointer">🔊</button>`;
    el.appendChild(d);
  });
  el.querySelectorAll('.play-btn').forEach(b => b.addEventListener('click', () => speak(b.dataset.w)));
}

document.getElementById('reviewErrBtn').addEventListener('click', () => {
  if (!store.errors.length) { toast('错词本为空🎉'); return; }
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelector('[data-page="dictate"]').classList.add('active');
  document.getElementById('page-dictate').classList.add('active');
  updateAppBar('dictate');
  let words = [...store.errors.map(e => [e[0], e[1]])];
  if (document.getElementById('shuffleMode').value === '1') words = shuffle(words);
  store.dictWords = words; store.dictIdx = 0;
  store.correct = 0; store.wrong = 0; store.results = []; store.isReview = true;
  document.getElementById('dictateSetup').style.display = 'none';
  document.getElementById('dictateResult').style.display = 'none';
  document.getElementById('dictateResult').classList.add('hidden');
  document.getElementById('dictateProgress').style.display = 'block';
  document.getElementById('dictateProgress').classList.remove('hidden');
  document.getElementById('mascotProgress').className = 'cat-mascot thinking';
  showWord();
});

document.getElementById('clearErrBtn').addEventListener('click', () => {
  if (!store.errors.length) { toast('已经是空的'); return; }
  if (confirm('清空错词本？')) { store.errors = []; saveErrors(); renderErrors(); toast('已清空'); }
});

/* ===========================================================
   自定义听写
   =========================================================== */
let customLists = JSON.parse(localStorage.getItem('dl')) || [];

function saveCustomLists() { localStorage.setItem('dl', JSON.stringify(customLists)); renderCustomLists(); }

function parseCustomInput(text) {
  const words = []; let count = 0;
  text.split('\n').forEach(line => {
    line = line.trim(); if (!line) return;
    const m = line.match(/^(.+?)\s+(.+)$/);
    if (m) { words.push([m[1].trim(), m[2].trim()]); count++; }
    else if (line.length > 0) { words.push([line, '']); count++; }
  });
  return { words, count };
}

function updateCustomWordCount() {
  const text = document.getElementById('customInput').value;
  const { count } = parseCustomInput(text);
  document.getElementById('customWordCount').textContent = `已输入 ${count} 个词`;
}

document.getElementById('customInput').addEventListener('input', updateCustomWordCount);

document.getElementById('customParseBtn').addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    document.getElementById('customInput').value = text;
    updateCustomWordCount();
    toast('📋 已从剪贴板导入');
  } catch { toast('⚠️ 无法读取剪贴板，请手动粘贴'); }
});

document.getElementById('customClearBtn').addEventListener('click', () => {
  document.getElementById('customInput').value = '';
  updateCustomWordCount();
  toast('已清空');
});

document.getElementById('customStartBtn').addEventListener('click', () => {
  const text = document.getElementById('customInput').value.trim();
  if (!text) { toast('请先输入要听写的词'); return; }
  const { words, count } = parseCustomInput(text);
  if (count === 0) { toast('没有识别到有效内容'); return; }
  const saveName = prompt(`共识别到 ${count} 个词\n给这个词列表起个名字保存吧（留空则不保存）：`, `自定义听写 ${new Date().toLocaleDateString()}`);
  if (saveName && saveName.trim()) {
    customLists.unshift({ name: saveName.trim(), words, time: Date.now() });
    saveCustomLists();
    toast(`💾 已保存「${saveName.trim()}」`);
  }
  let finalWords = [...words];
  if (document.getElementById('shuffleMode').value === '1') finalWords = shuffle(finalWords);
  store.dictWords = finalWords; store.dictIdx = 0;
  store.correct = 0; store.wrong = 0; store.results = []; store.isReview = true;
  document.getElementById('dictateSetup').style.display = 'none';
  document.getElementById('dictateResult').style.display = 'none';
  document.getElementById('dictateResult').classList.add('hidden');
  document.getElementById('dictateProgress').style.display = 'block';
  document.getElementById('dictateProgress').classList.remove('hidden');
  document.getElementById('mascotProgress').className = 'cat-mascot thinking';
  checkStreak();
  showWord();
});

function renderCustom() {
  document.getElementById('customInput').value = '';
  updateCustomWordCount();
  renderCustomLists();
}

function renderCustomLists() {
  const el = document.getElementById('customSavedLists');
  document.getElementById('savedListCount').textContent = customLists.length + '个';
  if (!customLists.length) {
    el.innerHTML = '<div class="empty-state"><span class="icon">📝</span><p>还没有保存的词列表<br>输入自定义词后开始听写即可保存 ✨</p></div>';
    return;
  }
  el.innerHTML = '';
  customLists.forEach((list, i) => {
    const card = document.createElement('div'); card.className = 'custom-list-card';
    card.innerHTML = `
      <div class="list-header"><span class="list-name">${list.name}</span><span class="list-meta">${list.words.length}个词 · ${new Date(list.time).toLocaleDateString()}</span></div>
      <div class="list-tags">${list.words.slice(0,10).map(w=>`<span class="list-tag">${w[0]}</span>`).join('')}${list.words.length>10?`<span class="list-tag">+${list.words.length-10}</span>`:''}</div>
      <div style="display:flex;gap:4px">
        <button class="btn btn-primary btn-sm" style="flex:1;padding:6px;font-size:12px" onclick="loadCustomList(${i})">📖 使用</button>
        <button class="btn btn-warning btn-sm" style="flex:1;padding:6px;font-size:12px" onclick="previewCustomList(${i})">👀 预览</button>
        <button class="btn btn-outline btn-sm" style="padding:6px;font-size:12px" onclick="deleteCustomList(${i})">✕</button>
      </div>`;
    el.appendChild(card);
  });
}

function loadCustomList(i) {
  const list = customLists[i];
  document.getElementById('customInput').value = list.words.map(w => `${w[0]} ${w[1]}`).join('\n');
  updateCustomWordCount();
  toast(`📖 已加载「${list.name}」`);
}

function previewCustomList(i) {
  const list = customLists[i];
  const preview = list.words.map((w,j) => `${j+1}. ${w[0]} ${w[1]||''}`).join('\n');
  alert(`「${list.name}」(${list.words.length}个词)\n\n${preview}`);
}

function deleteCustomList(i) {
  if (confirm(`确定删除「${customLists[i].name}」吗？`)) {
    customLists.splice(i, 1); saveCustomLists(); toast('已删除');
  }
}

/* ===========================================================
   键盘快捷键
   =========================================================== */
document.addEventListener('keydown', e => {
  if (document.getElementById('dictateProgress').style.display === 'block') {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const sb = document.getElementById('showAnsBtn');
      if (sb.style.display !== 'none') sb.click();
      else if (document.getElementById('markBtns').style.display === 'flex' && e.key === 'Enter')
        document.getElementById('correctBtn').click();
    }
    if (e.key === 'r' || e.key === 'R') document.getElementById('repeatBtn').click();
  }
});

/* ===========================================================
   PWA 注册 & 安装提示
   =========================================================== */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferredPrompt = e;
  const banner = document.getElementById('installBanner');
  if (!localStorage.getItem('pwa_installed')) {
    banner.classList.add('show');
    banner.addEventListener('click', () => {
      banner.classList.remove('show');
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        localStorage.setItem('pwa_installed', '1');
        deferredPrompt = null;
      });
    });
  }
  document.getElementById('installClose').addEventListener('click', e2 => {
    e2.stopPropagation(); banner.classList.remove('show');
  });
});

window.addEventListener('appinstalled', () => {
  localStorage.setItem('pwa_installed', '1');
  toast('✅ 安装成功！');
});

/* ===========================================================
   启动
   =========================================================== */
renderGrades();
renderLessons();
updateLevelBadge();
updateStreakUI();
checkStreak();