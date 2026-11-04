// 預約免費轉型診斷表單：送到 Google Apps Script（寫入試算表＋Google Chat 通知）。
// 把 Apps Script 部署後的網址填進 ENDPOINT（與 checkup.js 用同一個網址）。
// 留空時，改為開啟訪客的郵件軟體，把填好的內容寄到 OWNER，資料不會遺失。
const ENDPOINT = '';
const OWNER = 'rogerwang@wiseshare.com.tw';

const LABELS = {
  name: '姓名', company: '公司名稱', title: '職稱', role: '角色', industry: '所屬產業',
  email: '電子郵件', phone: '聯絡電話', size: '公司規模', topics: '想先處理', mode: '開始方式',
  need: '目前最頭痛的問題', time: '方便聯絡時段', source: '從哪裡得知',
};

function collect(f) {
  const v = n => (f.elements[n] ? String(f.elements[n].value || '').trim() : '');
  const checked = n => [...f.querySelectorAll(`input[name="${n}"]:checked`)].map(i => i.value);
  return {
    type: 'contact',
    name: v('name'), company: v('company'), title: v('title'), role: checked('role').join(''),
    industry: v('industry'), email: v('email'), phone: v('phone'), size: checked('size').join(''),
    topics: checked('topics'), mode: checked('mode').join(''), need: v('need'),
    time: checked('time').join(''), source: checked('source').join(''),
    website: v('website'), page: location.href,
  };
}

function mailtoLink(d) {
  const lines = Object.keys(LABELS).map(k => `${LABELS[k]}：${Array.isArray(d[k]) ? d[k].join('、') : (d[k] || '')}`);
  return `mailto:${OWNER}?subject=${encodeURIComponent(`【預約免費轉型診斷】${d.company} ${d.name}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const f = document.getElementById('gf');
  const msg = document.getElementById('gf-msg');
  const say = t => { msg.textContent = t; msg.hidden = false; };

  f.addEventListener('submit', async e => {
    e.preventDefault();
    const d = collect(f);
    const miss = [];
    if (!d.name) miss.push('姓名');
    if (!d.company) miss.push('公司名稱');
    if (!/^\S+@\S+\.\S+$/.test(d.email)) miss.push('正確的電子郵件');
    if (!d.topics.length) miss.push('想先處理哪一塊（至少勾一項）');
    if (!document.getElementById('f-agree').checked) miss.push('勾選同意個資蒐集告知');
    if (miss.length) { say(`請補上：${miss.join('、')}。`); return; }
    if (d.website) return; // 機器人才會填這個隱藏欄位

    const btn = f.querySelector('button[type=submit]');
    if (!ENDPOINT) {
      window.location.href = mailtoLink(d);
      say(`已開啟您的郵件軟體，請按「傳送」把資料寄給我們。若沒有跳出視窗，請直接來信 ${OWNER}。`);
      return;
    }
    btn.disabled = true;
    say('送出中…');
    try {
      // Apps Script 不回傳跨網域標頭，用 no-cors 送出；無法讀取回應，送出即視為完成
      await fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(d) });
      f.reset();
      say('已收到您的資料，顧問將在 5 個工作天內與您聯繫。謝謝！');
    } catch (err) {
      say(`網路連線有問題，請稍後再試，或直接來信 ${OWNER}。`);
    } finally {
      btn.disabled = false;
    }
  });
});
