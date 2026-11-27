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

// 名稱比對不分大小寫；回傳該名稱所在列（排除指定玩家 ID 自己的那一列），沒有則回傳 0
function findName_(s, name, exceptPid) {
  const n = s.getLastRow(); if (n < 2) return 0;
  const rows = s.getRange(2, 1, n - 1, 3).getValues();
  const key = String(name).toLowerCase();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === key && rows[i][0] !== exceptPid) return i + 2;
  }
  return 0;
}
const okName_ = (v) => /^[A-Za-z0-9]{1,12}$/.test(String(v || ''));

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'register') return json_(register_(p));
    if (p.action === 'top') return json_(top_(p));
    if (p.action === 'check') return json_(check_(p));
    if (p.action === 'claim') return json_(claim_(p));
    if (p.action === 'load') return json_(load_(p));
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
      let serial = n < 2 ? 1 : Math.max.apply(null, s.getRange(2, 2, n - 1, 1).getValues().map(x => Number(x[0]) || 0)) + 1;
      while (findName_(s, 'Guest' + pad5_(serial), p.pid)) serial++;    // 預設名稱若已被別人認領就跳號
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
    const oldName = String(s.getRange(r, 3).getValue());
    const name = okName_(d.name) && !findName_(s, d.name, d.pid) ? String(d.name) : oldName;   // 名稱不合格或已被別人使用 → 保留原名稱
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

// 只檢查名稱能不能用（自己目前的名稱視為可用）
function check_(p) {
  if (!okPid_(p.pid) || !okName_(p.name)) return { ok: false };
  return { ok: true, available: !findName_(sheet_(), p.name, p.pid) };
}

// 認領名稱：沒有別人使用才會寫入，檢查與寫入在同一把鎖內完成，避免兩人同時搶同一個名稱
function claim_(p) {
  if (!okPid_(p.pid) || !okName_(p.name)) return { ok: false };
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const s = sheet_();
    if (findName_(s, p.name, p.pid)) return { ok: false, reason: 'taken' };
    let r = findRow_(s, p.pid);
    if (!r) { register_({ pid: p.pid }); r = findRow_(s, p.pid); if (!r) return { ok: false }; }
    s.getRange(r, 3).setValue(String(p.name));
    s.getRange(r, 11).setValue(new Date());
    return { ok: true };
  } finally { lock.releaseLock(); }
}

// 啟動時用名稱找玩家資料：存在 → 回傳積分等；不存在 → found:false
function load_(p) {
  if (!okName_(p.name)) return { ok: false };
  const s = sheet_();
  const r = findName_(s, p.name, '');
  if (!r) return { ok: true, found: false };
  const v = s.getRange(r, 1, 1, 11).getValues()[0];
  const best = {};
  KEYS.forEach((k, i) => { if (Number(v[6 + i]) > 0) best[k] = Number(v[6 + i]); });
  return { ok: true, found: true, data: { serial: Number(v[1]), name: String(v[2]), points: Number(v[3]), playSec: Number(v[4]), wins: Number(v[5]), best: best } };
}
