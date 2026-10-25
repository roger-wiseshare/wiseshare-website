// 3 分鐘企業轉型健檢：在瀏覽器計分，不需要伺服器。
// 寄送完整報告：把 Google Apps Script 部署後的網址填進 ENDPOINT。留空時，結果會直接全部顯示在頁面上。
const ENDPOINT = '';

const DIMS = ['經營與組織力', 'B2B 銷售與獲客力', '數位與 AI 賦能力', '接班與傳承力'];
// 同分時，依這個順序決定「最該優先處理的面向」：接班 > 經營 > 業務 > 數位
const TIE_ORDER = [3, 0, 1, 2];

const QUESTIONS = [
  [0, '當公司制定了年度營收與策略目標後，各部門通常如何執行？', [
    '只有老闆在急，底下部門依然照舊習慣做事，年底才發現目標沒達成。',
    '部門主管有分配任務，但跨部門常互踢皮球，需要老闆親自出面協調。',
    '各部門能將公司目標拆解為具體的季度／月度行動指標，並定期主動追蹤檢討。']],
  [0, '如果公司的核心幹部或中階主管突然請長假或離職，會發生什麼事？', [
    '該部門業務幾乎癱瘓，許多流程與關鍵資訊只有他腦袋裡有。',
    '運作會明顯變慢，需要老闆或其他主管花大量時間救火交接。',
    '公司有完整的 SOP 與代理制度，新人或代理人能依據標準文件快速接手。']],
  [0, '目前的績效考核與獎金制度，對員工的激勵效果如何？', [
    '幾乎是大鍋飯或憑老闆主觀印象發放，優秀人才覺得不公平、留不住。',
    '有基本的 KPI 考核，但員工常為了個人數字而損害團隊利益，或標準流於形式。',
    '獎酬制度與公司獲利、策略目標高度掛鉤，能有效驅動員工主動創造價值。']],
  [1, '公司目前的 B2B 新客戶與業績主要來源為何？', [
    '超過 80% 依賴老客戶自然回購、老闆個人人脈，或少數 1～2 位王牌業務。',
    '有業務團隊在跑，但各自土法煉鋼，成交率不穩定，月底很難預測下個月業績。',
    '有標準化的開發新客與大客戶攻堅流程，新進業務也能在 3～6 個月內穩定開單。']],
  [1, '當業務團隊面對客戶「比價、砍價」時，通常的應對狀況是？', [
    '業務回來拜託老闆降價，認為「只要價格夠低就能拿到單」，毛利越來越薄。',
    '業務會介紹產品規格優勢，但遇到採購強勢施壓時，仍經常被迫讓利。',
    '業務懂得挖掘客戶深層的經營痛點，能用「總體價值與投資報酬」說服客戶，守住毛利。']],
  [1, '身為管理者，您如何掌握業務團隊手上的商機進度？', [
    '只能等業務自己回報，或開會時聽業務說「快簽了、還在談」，經常突然掉單。',
    '有要求業務填週報或 Excel，但階段定義模糊，難以判斷哪些案子該優先支援。',
    '明確定義商機的每個推進階段與檢核點，管理者能隨時看清卡在哪裡並給予指導。']],
  [2, '公司目前對於 ERP、CRM 等管理系統或數位工具的使用狀況為何？', [
    '幾乎仰賴紙本、LINE 群組交辦與個人 Excel，找一份歷史資料要花大半天。',
    '有花錢買系統，但員工覺得難用、配合度低，系統裡的數據不準，還是得靠人工對帳。',
    '系統流程與實際工作緊密結合，能自動產出管理報表，大幅減少重複的行政作業。']],
  [2, '當老闆需要做重要決策（例如砍掉哪個低效產品、主攻哪個客群）時，依據是什麼？', [
    '完全憑老闆多年的市場直覺與經驗。',
    '需要請助理或財務花好幾天，從不同表格東拼西湊出歷史數據來參考。',
    '有即時、看得懂的經營數據儀表板，能隨時調閱各產品線、各通路的真實獲利。']],
  [2, '面對生成式 AI 與自動化工具，團隊目前的應用程度如何？', [
    '完全沒接觸，或擔心資安與出錯而禁止使用，工作方式與五年前沒有差別。',
    '少數年輕員工會零星用來寫文案或查資料，但沒有變成團隊的標準做法。',
    '已將 AI 或自動化工具導入核心流程（如提案撰寫、客戶資料整理、內部知識庫），人力效率明顯提升。']],
  [3, '如果老闆明天開始休假一個月，公司的重大決策由誰來做？', [
    '沒人敢做決定，大小事都等老闆回來。',
    '有指定代理人，但重要的事還是要打電話請示老闆。',
    '接班人或經營團隊有明確的授權範圍，能自己決策、事後報告。']],
  [3, '公司對接班（或下一任總經理）的安排是？', [
    '還沒想過，或家裡有人選但從沒正式談過。',
    '已有人選在公司歷練，但沒有明確的培養計畫與交棒時間表。',
    '有書面的接班計畫，包含培養路徑、交棒時程與權責移轉步驟。']],
  [3, '接班人（或二代）在公司推動新做法時，老幹部的反應通常是？', [
    '表面配合、私下照舊，接班人常要老闆出面背書。',
    '部分老幹部支持，但遇到核心部門仍有明顯阻力。',
    '接班人已建立自己的管理威信與核心團隊，新做法能順利推動。']],
];
const POINTS = [1, 3, 5];

const TIERS = [
  { max: 28, light: 'red', name: '紅燈｜轉型急救期：系統重塑',
    analysis: '公司目前高度依賴「人治」與過去的習慣，抗風險能力較低，看不見的內耗成本很高。',
    plan: '建議優先從「老闆智囊（一對一輔導）」加上「駐廠盯場（轉型陪跑）」開始：先由顧問陪經營層找出最迫切的止血點，再重新建立基礎制度與標準流程。' },
  { max: 44, light: 'yellow', name: '黃燈｜成長高原期：破局賦能',
    analysis: '公司已有基本架構，但部門各做各的、計畫與執行有落差，制度與方法還沒有真正變成獲利。',
    plan: '最適合導入「帶兵練功（實戰培訓工作坊）」加上「階段性陪跑」，針對得分最低的面向，做團隊能力升級與流程改造。' },
  { max: 60, light: 'green', name: '綠燈｜卓越領先期：加速擴張',
    analysis: '公司體質相當健康！接下來的挑戰是把現有的成功模式快速複製放大，並導入 AI 等新工具拉開與同業的差距。',
    plan: '建議採用「老闆策略共識營」或前瞻主題培訓（例如 AI 業務應用），協助團隊持續精進、挑戰更高市佔率。' },
];

const FOCUS_LINK = ['services-management.html', 'services-sales.html', 'services-digital.html', 'services-succession.html'];

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function render() {
  const list = document.getElementById('q-list');
  let html = '';
  let lastDim = -1;
  QUESTIONS.forEach(([dim, text, opts], qi) => {
    if (dim !== lastDim) { html += `<h2 class="q-dim">${dim + 1}．${DIMS[dim]}</h2>`; lastDim = dim; }
    const order = shuffle([0, 1, 2]);
    html += `<fieldset class="q" id="q${qi}"><legend><span class="q-no">${qi + 1}</span>${text}</legend>` +
      order.map(oi => `<label><input type="radio" name="q${qi}" value="${POINTS[oi]}"><span>${opts[oi]}</span></label>`).join('') +
      '</fieldset>';
  });
  list.innerHTML = html;
}

function answered() {
  return QUESTIONS.map((_, qi) => {
    const el = document.querySelector(`input[name="q${qi}"]:checked`);
    return el ? Number(el.value) : null;
  });
}

function updateProgress() {
  const n = answered().filter(v => v !== null).length;
  document.getElementById('q-count').textContent = `已作答 ${n} ／ ${QUESTIONS.length} 題`;
  document.getElementById('q-bar').style.width = `${(n / QUESTIONS.length) * 100}%`;
}

function score(ans) {
  const dims = [0, 0, 0, 0];
  ans.forEach((v, qi) => { dims[QUESTIONS[qi][0]] += v; });
  const total = dims.reduce((a, b) => a + b, 0);
  const min = Math.min(...dims);
  const low = TIE_ORDER.find(d => dims[d] === min);
  const tier = TIERS.find(t => total <= t.max);
  return { dims, total, low, tier };
}

function radar(dims) {
  const svg = document.getElementById('r-radar');
  const c = 160, R = 110;
  // 四個軸：上、右、下、左
  const pt = (i, v) => {
    const a = -Math.PI / 2 + i * Math.PI / 2;
    const r = (v / 15) * R;
    return [c + r * Math.cos(a), c + r * Math.sin(a)];
  };
  const poly = vals => vals.map((v, i) => pt(i, v).map(n => n.toFixed(1)).join(',')).join(' ');
  let s = `<title id="r-radar-t">四面向得分雷達圖</title>`;
  [5, 10, 15].forEach(v => { s += `<polygon class="rg" points="${poly([v, v, v, v])}"/>`; });
  for (let i = 0; i < 4; i++) { const [x, y] = pt(i, 15); s += `<line class="rg" x1="${c}" y1="${c}" x2="${x}" y2="${y}"/>`; }
  s += `<polygon class="rv" points="${poly(dims)}"/>`;
  dims.forEach((v, i) => { const [x, y] = pt(i, v); s += `<circle class="rd" cx="${x}" cy="${y}" r="4"/>`; });
  const lab = [[c, 26, 'middle'], [312, c - 12, 'end'], [c, 306, 'middle'], [8, c - 12, 'start']];
  const short = ['經營', '業務', '數位', '接班'];
  lab.forEach(([x, y, anchor], i) => { s += `<text x="${x}" y="${y}" text-anchor="${anchor}">${short[i]} ${dims[i]}</text>`; });
  svg.innerHTML = s;

  document.getElementById('r-bars').innerHTML = dims.map((v, i) =>
    `<li><span>${DIMS[i]}</span><span class="rb"><i style="width:${(v / 15) * 100}%"></i></span><b>${v} ／ 15</b></li>`).join('');
}

function showFull(r) {
  radar(r.dims);
  document.getElementById('r-plan').textContent = r.tier.plan;
  const succ = document.getElementById('r-succ');
  if (r.dims[3] <= 7) {
    succ.innerHTML = '您的「接班與傳承力」得分偏低。無論總分落在哪一級，都建議及早規劃交棒，可以參考<a href="services-succession.html">接班傳承專案</a>。';
    succ.hidden = false;
  } else { succ.hidden = true; }
  document.getElementById('r-gate').hidden = true;
  document.getElementById('r-full').hidden = false;
}

let last = null;

function showResult(r) {
  last = r;
  document.getElementById('r-total').textContent = r.total;
  document.getElementById('r-tier').textContent = r.tier.name;
  document.getElementById('r-light').className = `light ${r.tier.light}`;
  document.getElementById('r-analysis').textContent = r.tier.analysis;
  document.getElementById('r-low').innerHTML = `<a href="${FOCUS_LINK[r.low]}">${DIMS[r.low]}</a>（${r.dims[r.low]} ／ 15 分）`;
  document.getElementById('quiz').hidden = true;
  const box = document.getElementById('result');
  box.hidden = false;
  if (ENDPOINT) {
    document.getElementById('r-gate').hidden = false;
    document.getElementById('r-full').hidden = true;
  } else {
    showFull(r);
  }
  box.focus();
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  const quiz = document.getElementById('quiz');
  quiz.addEventListener('change', () => { updateProgress(); document.getElementById('q-msg').hidden = true; });
  quiz.addEventListener('submit', e => {
    e.preventDefault();
    const ans = answered();
    const miss = ans.findIndex(v => v === null);
    if (miss !== -1) {
      document.getElementById('q-msg').hidden = false;
      document.getElementById(`q${miss}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    showResult(score(ans));
  });

  document.getElementById('lead').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    const msg = document.getElementById('l-msg');
    const name = f.elements.name.value.trim(), company = f.elements.company.value.trim(), email = f.elements.email.value.trim();
    if (!name || !company || !/^\S+@\S+\.\S+$/.test(email) || !document.getElementById('l-agree').checked) {
      msg.textContent = '請填寫姓名、公司名稱、正確的電子郵件，並勾選同意個資蒐集告知。';
      msg.hidden = false;
      return;
    }
    if (f.elements.website.value) return; // 機器人才會填這個隱藏欄位
    const payload = {
      name, company, email, title: f.elements.title.value.trim(),
      total: last.total, tier: last.tier.name, low: DIMS[last.low],
      dims: last.dims, answers: answered(), page: location.href,
    };
    msg.textContent = '送出中…';
    msg.hidden = false;
    try {
      // Apps Script 不回傳跨網域標頭，用 no-cors 送出；無法讀取回應，送出即視為完成
      await fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      msg.hidden = true;
      showFull(last);
      const done = document.createElement('p');
      done.className = 'form-msg';
      done.textContent = `完整報告已寄到 ${email}，若幾分鐘內沒收到，請看一下垃圾郵件匣。`;
      document.getElementById('r-full').prepend(done);
    } catch (err) {
      msg.textContent = '網路連線有問題，請稍後再試，或直接來信 rogerwang@wiseshare.com.tw。';
    }
  });

  document.getElementById('r-printbtn').addEventListener('click', () => window.print());
  document.getElementById('r-again').addEventListener('click', () => {
    document.getElementById('result').hidden = true;
    quiz.hidden = false;
    quiz.reset();
    render();
    updateProgress();
    quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
