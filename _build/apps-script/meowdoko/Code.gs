/** @OnlyCurrentDoc */
// ↑ 限制這支程式只能存取它所在的這一份試算表。
// 喵數獨（Meowdoko）玩家資料與排行榜：
//   - 玩家第一次開啟遊戲 → register：配發流水號（Guest00001、Guest00002…）
//   - 遊戲過程中 → sync：更新名稱、累積積分、總遊戲時長、各難度最短通關時間
//   - 排行榜 → top：回傳積分前 10 名（只回傳名稱與積分，不含玩家 ID）
// 安裝方式見同資料夾的 README.md。

const SHEET = '玩家';
const HEAD = ['玩家ID', '流水號', '名稱', '累積積分', '總遊戲時長(秒)', '通關盤數', '最短_容易(秒)', '最短_一般(秒)', '最短_困難(秒)', '最短_極難(秒)', '最後更新'];
const KEYS = ['easy', 'normal', 'hard', 'extreme'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(SHEET);
  if (!s) { s = ss.insertSheet(SHEET); s.appendRow(HEAD); s.setFrozenRows(1); }
  return s;
}
const json_ = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const okPid_ = (p) => /^[A-Za-z0-9-]{8,64}$/.test(String(p || ''));
const num_ = (v, lo, hi) => { v = Math.round(Number(v)); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo; };
const pad5_ = (n) => ('00000' + n).slice(-5);

function findRow_(s, pid) {
  const n = s.getLastRow(); if (n < 2) return 0;
  const ids = s.getRange(2, 1, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === pid) return i + 2;
  return 0;
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'register') return json_(register_(p));
    if (p.action === 'top') return json_(top_(p));
  } catch (err) { console.error(err); }
  return json_({ ok: false });
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.action === 'sync') sync_(d);
  } catch (err) { console.error(err); }
  return json_({ ok: true });
}

function register_(p) {
  if (!okPid_(p.pid)) return { ok: false };
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const s = sheet_();
    let r = findRow_(s, p.pid);
    if (!r) {
      const n = s.getLastRow();
      const serial = n < 2 ? 1 : Math.max.apply(null, s.getRange(2, 2, n - 1, 1).getValues().map(x => Number(x[0]) || 0)) + 1;
      s.appendRow([p.pid, serial, 'Guest' + pad5_(serial), 0, 0, 0, '', '', '', '', new Date()]);
      return { ok: true, serial: serial };
    }
    return { ok: true, serial: Number(s.getRange(r, 2).getValue()) };
  } finally { lock.releaseLock(); }
}

function sync_(d) {
  if (!okPid_(d.pid)) return;
  const cache = CacheService.getScriptCache();
  if (cache.get('s:' + d.pid)) return;           // 同一玩家 3 秒內只收一次
  cache.put('s:' + d.pid, '1', 3);
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const s = sheet_();
    let r = findRow_(s, d.pid);
    if (!r) { register_({ pid: d.pid }); r = findRow_(s, d.pid); if (!r) return; }
    const serial = Number(s.getRange(r, 2).getValue());
    const name = /^[A-Za-z0-9]{1,12}$/.test(String(d.name || '')) ? String(d.name) : 'Guest' + pad5_(serial);
    const best = d.best || {};
    const row = [d.pid, serial, name, num_(d.points, -100000, 1000000), num_(d.playSec, 0, 100000000), num_(d.wins, 0, 1000000)]
      .concat(KEYS.map(k => (best[k] ? num_(best[k], 1, 86400) : '')))
      .concat([new Date()]);
    s.getRange(r, 1, 1, row.length).setValues([row]);
  } finally { lock.releaseLock(); }
}

function top_(p) {
  const s = sheet_(), n = s.getLastRow();
  if (n < 2) return { ok: true, top: [], me: null };
  const rows = s.getRange(2, 1, n - 1, 11).getValues()
    .filter(r => Number(r[3]) > 0)
    .sort((a, b) => (b[3] - a[3]) || (new Date(a[10]) - new Date(b[10])));   // 積分高者在前；同分先達成者在前
  const out = rows.slice(0, 10).map((r, i) => ({ rank: i + 1, name: String(r[2]), points: Number(r[3]), mine: r[0] === p.pid }));
  let me = null;
  if (okPid_(p.pid)) {
    const i = rows.findIndex(r => r[0] === p.pid);
    if (i >= 0) me = { rank: i + 1, name: String(rows[i][2]), points: Number(rows[i][3]) };
  }
  return { ok: true, top: out, me: me };
}
