/* ===========================================================
   js/words.js  —  词库数据 & 持久化（修复版）
   =========================================================== */

/* 说明：
   - 原文件包含不完整的数组和占位符，导致语法错误并使应用在浏览器上运行失败。
   - 本文件提供一个语法正确、结构完整的默认词库（DEFAULT），并保留原有的持久化接口：loadWords/saveWords/loadErrors/saveErrors。
   - ensureIcons() 会在应用初始化后由 app.js 调用（app.js 中会先创建 store，再调用 ensureIcons）。
*/

const DEFAULT = {
  1: {
    name: "一年级",
    icon: "🌱",
    lessons: [
      { name: "第1课", words: [["一", "yī"], ["二", "èr"], ["三", "sān"], ["十", "shí"], ["木", "mù"], ["禾", "hé"], ["上", "shàng"], ["下", "xià"], ["土", "tǔ"], ["个", "gè"], ["八", "bā"], ["入", "rù"]] },
      { name: "第2课", words: [["目", "mù"], ["耳", "ěr"], ["头", "tóu"], ["米", "mǐ"], ["见", "jiàn"], ["白", "bái"], ["田", "tián"], ["电", "diàn"], ["也", "yě"], ["长", "cháng"], ["山", "shān"], ["出", "chū"]] }
    ]
  },
  2: {
    name: "二年级",
    icon: "🌿",
    lessons: [
      { name: "第1课", words: [["宜", "yí"], ["实", "shí"], ["色", "sè"], ["华", "huá"], ["谷", "gǔ"], ["金", "jīn"], ["尽", "jìn"], ["层", "céng"], ["丰", "fēng"], ["壮", "zhuàng"]] },
      { name: "第2课", words: [["于", "yú"], ["首", "shǒu"], ["枝", "zhī"], ["枫", "fēng"], ["记", "jì"], ["刘", "liú"], ["胡", "hú"], ["戏", "xì"], ["棋", "qí"], ["钢", "gāng"]] }
    ]
  },
  3: {
    name: "三年级",
    icon: "🌳",
    lessons: [
      { name: "第1课", words: [["坪坝", "píng bà"], ["穿戴", "chuān dài"], ["蝴蝶", "hú dié"], ["孔雀", "kǒng què"], ["舞蹈", "wǔ dǎo"]] },
      { name: "第2课", words: [["郊外", "jiāo wài"], ["散步", "sàn bù"], ["胸脯", "xiōng pú"], ["渣滓", "zhā zǐ"], ["诚实", "chéng shí"]] }
    ]
  },
  4: {
    name: "四年级",
    icon: "🌲",
    lessons: [
      { name: "第1课", words: [["观潮", "guān cháo"], ["横卧", "héng wò"], ["笼罩", "lǒng zhào"], ["薄雾", "bó wù"]] },
      { name: "第2课", words: [["住宅", "zhù zhái"], ["隐蔽", "yǐn bì"], ["选择", "xuǎn zé"], ["洞穴", "dòng xué"]] }
    ]
  },
  5: {
    name: "五年级",
    icon: "🏔️",
    lessons: [
      { name: "第1课", words: [["窃读记", "qiè dú jì"], ["贪婪", "tān lán"], ["饥饿", "jī è"], ["惧怕", "jù pà"]] },
      { name: "第2课", words: [["珍珠鸟", "zhēn zhū niǎo"], ["信赖", "xìn lài"], ["舒适", "shū shì"], ["淘气", "táo qì"]] }
    ]
  },
  6: {
    name: "六年级",
    icon: "🎓",
    lessons: [
      { name: "第1课", words: [["草原", "cǎo yuán"], ["清鲜", "qīng xiān"], ["明朗", "míng lǎng"], ["渲染", "xuàn rǎn"]] },
      { name: "第2课", words: [["狼牙山五壮士", "láng yá shān wǔ zhuàng shì"], ["日寇", "rì kòu"], ["险要", "xiǎn yào"], ["沉着", "chén zhuó"]] }
    ]
  }
};

/* ---------- 持久化存储 ---------- */
function loadWords()  { return JSON.parse(localStorage.getItem('dw')) || DEFAULT; }
function saveWords() { try { localStorage.setItem('dw', JSON.stringify(store.words)); } catch (e) { console.error('saveWords failed', e); } }
function loadErrors() { return JSON.parse(localStorage.getItem('de')) || []; }
function saveErrors() { try { localStorage.setItem('de', JSON.stringify(store.errors)); } catch (e) { console.error('saveErrors failed', e); } updateErrorDot(); }

/* ---------- 预置词库修复：如果某个年级缺少 icon，补上 ---------- */
function ensureIcons() {
  const icons = {1:'🌱',2:'🌿',3:'🌳',4:'🌲',5:'🏔️',6:'🎓'};
  if (typeof store === 'undefined' || !store.words) return;
  Object.keys(store.words).forEach(k => {
    if (!store.words[k].icon) store.words[k].icon = icons[k] || '📖';
  });
}
