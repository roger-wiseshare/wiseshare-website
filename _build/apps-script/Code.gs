// 3 分鐘企業轉型健檢：收名單、寄診斷信。
// 安裝在「健檢名單」Google 試算表的 Apps Script（擴充功能 → Apps Script），部署為網頁應用程式。
// 部署步驟見同資料夾的 README.md。

const OWNER = 'rogerwang@wiseshare.com.tw';   // 收新名單通知的信箱
const SITE = 'https://www.wiseshare.com.tw';
const DIMS = ['經營與組織力', 'B2B 銷售與獲客力', '數位與 AI 賦能力', '接班與傳承力'];
const TIE_ORDER = [3, 0, 1, 2];  // 同分時優先順序：接班 > 經營 > 業務 > 數位
const FREE_MINUTES = '';         // 免費解析時長（分鐘），確定後填入，例如 '30'

const TIERS = [
  { max: 28, name: '轉型急救期', light: '紅燈',
    meaning: '公司目前高度依賴「人治」與過去的習慣，抗風險能力較低，看不見的內耗成本很高。通常最急的不是買新工具，而是先止血、把最基本的制度與流程建起來。',
    next: '建議優先從「老闆智囊（一對一輔導）」加上「駐廠盯場（轉型陪跑）」開始：先由顧問陪經營層找出最迫切的止血點，再重新建立基礎制度與標準流程。' },
  { max: 44, name: '成長高原期', light: '黃燈',
    meaning: '產品與技術很有競爭力，老闆與核心幹部也非常拚命，但成長速度明顯慢了下來。常見的原因是經驗綁在「人」身上而不是「制度」上，以及買了工具卻沒改流程，團隊多半是被動應付。',
    next: '這個階段最忌諱頭痛醫頭（例如業績不好就找講師上激勵課，或花幾百萬換新系統）。真正需要的是針對卡點做「流程梳理＋團隊實戰演練＋階段性盯場」。' },
  { max: 60, name: '卓越領先期', light: '綠燈',
    meaning: '公司體質相當健康！接下來的挑戰是把現有的成功模式快速複製放大，並導入 AI 等新工具拉開與同業的差距。',
    next: '建議採用「老闆策略共識營」或前瞻主題培訓（例如 AI 業務應用），協助團隊持續精進、挑戰更高市佔率。' },
];

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.website) return ok();                                    // 機器人
    const email = String(d.email || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return ok();
    const cache = CacheService.getScriptCache();
    if (cache.get(email)) return ok();                             // 1 分鐘內重複送出
    cache.put(email, '1', 60);

    const dims = (d.dims || []).slice(0, 4).map(n => Math.max(3, Math.min(15, Number(n) || 3)));
    const total = dims.reduce((a, b) => a + b, 0);
    const min = Math.min(...dims);
    const low = TIE_ORDER.find(i => dims[i] === min);
    const tier = TIERS.find(t => total <= t.max);
    const lead = {
      name: clean(d.name), company: clean(d.company), title: clean(d.title), email,
      total, tier, low, dims, answers: d.answers || [],
    };

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['時間', '姓名', '公司', '職稱', 'Email', '總分', '分級', '最低面向', ...DIMS, '各題分數']);
    }
    sheet.appendRow([
      new Date(), lead.name, lead.company, lead.title, email, total, tier.light + '｜' + tier.name,
      DIMS[low], ...dims, JSON.stringify(lead.answers),
    ]);

    MailApp.sendEmail({
      to: email,
      replyTo: OWNER,
      name: '智享數位資通',
      subject: `技術很好、團隊很忙，獲利卻卡關？${lead.company} 的專屬轉型健檢報告`,
      htmlBody: reportHtml(lead),
    });
    MailApp.sendEmail({
      to: OWNER,
      subject: `【健檢新名單】${lead.company} ${lead.name}｜${total} 分 ${tier.light}｜最低：${DIMS[low]}`,
      htmlBody: `<p>${lead.name}（${lead.title || '未填職稱'}）／${lead.company}／${esc(email)}</p>` +
        `<p>總分 ${total} ／ 60（${tier.light}｜${tier.name}）</p>` +
        `<p>${DIMS.map((n, i) => `${n}：${dims[i]} ／ 15`).join('<br>')}</p>` +
        `<p>完整資料已寫入試算表：${SpreadsheetApp.getActiveSpreadsheet().getUrl()}</p>`,
    });
  } catch (err) {
    console.error(err);
  }
  return ok();
}

function ok() {
  return ContentService.createTextOutput('ok');
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function clean(s) {
  return esc(String(s || '').trim().slice(0, 80));
}

function bar(v) {
  const w = Math.round((v / 15) * 200);
  return `<table cellpadding="0" cellspacing="0" style="display:inline-table;vertical-align:middle"><tr>` +
    `<td style="width:${w}px;height:10px;background:#17325c"></td><td style="width:${200 - w}px;height:10px;background:#e3e7ee"></td></tr></table>`;
}

function reportHtml(l) {
  const lowName = DIMS[l.low];
  const minutes = FREE_MINUTES ? ` ${FREE_MINUTES} 分鐘的` : '的';
  const succ = l.dims[3] <= 7
    ? `<p>另外，您的「接班與傳承力」得分偏低。無論總分落在哪一級，都建議及早規劃交棒，可以參考<a href="${SITE}/services-succession.html">接班傳承專案</a>。</p>` : '';
  return `<div style="font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif;font-size:15px;line-height:1.8;color:#1b2433;max-width:620px">
<p>${l.name} ${l.title} 您好：</p>
<p>感謝您抽空完成《2027 企業轉型 3 分鐘線上健檢》。</p>
<p>根據您的作答，${l.company} 總分為 <b>${l.total} 分</b>（滿分 60 分），屬於<b>【${l.tier.light}｜${l.tier.name}】</b>。</p>
<p>各面向得分（每項滿分 15 分）：</p>
<table cellpadding="4" cellspacing="0">${DIMS.map((n, i) => `<tr><td>${n}</td><td>${bar(l.dims[i])}</td><td><b>${l.dims[i]}</b></td></tr>`).join('')}</table>
<h3 style="font-size:17px;margin:24px 0 8px">這個分數代表什麼</h3>
<p>${l.tier.meaning}</p>
<p>得分最低的「${lowName}」，是貴公司未來半年到一年最容易出狀況、也最值得優先投資的地方。</p>
<h3 style="font-size:17px;margin:24px 0 8px">給 ${l.company} 的下一步</h3>
<p>${l.tier.next}</p>
${succ}
<p>完成健檢的企業，可以免費預約一次${minutes}一對一健檢解析。顧問不會推銷套裝課程，而是直接幫您：</p>
<ol><li>拆解「${lowName}」背後的真正原因。</li><li>分享相近產業或規模企業的實戰做法。</li><li>評估下一季最省力、最見效的第一步。</li></ol>
<p><a href="${SITE}/contact.html" style="display:inline-block;background:#b8862f;color:#fff;padding:10px 22px;border-radius:4px;text-decoration:none;font-weight:700">預約免費解析</a></p>
<p>若近期行程較滿，也可以直接回覆這封信，告訴我們您最頭痛的一個問題，顧問會先用信件給您建議。</p>
<p>祝 商祺</p>
<p>智享數位資通 顧問團隊 敬上<br><a href="${SITE}">www.wiseshare.com.tw</a>｜${OWNER}</p>
<p style="font-size:12px;color:#5a6578">此信因您在本站完成健檢而寄送。若不希望再收到我們的信件，請直接回信告知。</p>
</div>`;
}

// 部署前可在編輯器執行這個函式，確認寄信與寫入試算表都正常（會寄一封測試信給 OWNER）。
function testRun() {
  doPost({ postData: { contents: JSON.stringify({
    name: '測試', company: '測試公司', title: '總經理', email: OWNER,
    dims: [9, 7, 11, 5], answers: [3, 3, 3, 1, 3, 3, 5, 3, 3, 1, 3, 1],
  }) } });
}
