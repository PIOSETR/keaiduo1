/* ===========================================================
   js/audio.js  —  TTS 朗读 / 音效 / 撒花动画
   =========================================================== */

/* ---------- TTS 朗读 ---------- */
function speak(text, cb) {
  if (store.speaking) { window.speechSynthesis.cancel(); }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN'; u.rate = 0.85; u.pitch = 1.1;
  store.speaking = true;
  u.onend = () => { store.speaking = false; if (cb) cb(); };
  u.onerror = () => { store.speaking = false; if (cb) cb(); };
  window.speechSynthesis.speak(u);
}

/* ---------- 简易音效（Web Audio API） ---------- */
function playBeep(freq, type, vol, dur) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type; osc.frequency.value = freq; gain.gain.value = vol;
    osc.connect(gain); gain.connect(ctx.destination);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur);
  } catch (e) { /* 静默失败 */ }
}

function sfxCorrect()  { playBeep(800, 'sine', 0.15, 0.15); setTimeout(() => playBeep(1200, 'sine', 0.12, 0.15), 100); }
function sfxWrong()    { playBeep(200, 'sawtooth', 0.1, 0.3); }
function sfxComplete() { playBeep(523, 'sine', 0.15, 0.15); setTimeout(() => playBeep(659, 'sine', 0.15, 0.15), 120); setTimeout(() => playBeep(784, 'sine', 0.2, 0.25), 240); }

/* ---------- 撒花动画 ---------- */
function launchConfetti() {
  const container = document.getElementById('confettiContainer');
  const colors = ['#FF7B42','#FFB347','#FF6B6B','#4ECDC4','#A78BFA','#FBBF24','#34D399','#F472B6'];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.top = -(Math.random() * 40 + 10) + 'px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (Math.random() * 8 + 6) + 'px';
    piece.style.height = (Math.random() * 8 + 6) + 'px';
    piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
    piece.style.animationDelay = Math.random() * 1 + 's';
    frag.appendChild(piece);
  }
  container.appendChild(frag);
  setTimeout(() => { container.innerHTML = ''; }, 4000);
}

/* ---------- Toast ---------- */
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

/* ---------- 工具 ---------- */
function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}