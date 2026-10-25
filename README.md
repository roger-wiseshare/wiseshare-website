# 智享數位資通官網

網址：https://www.wiseshare.com.tw （以 GitHub Pages 架設）

## 怎麼修改

各頁的主要內容放在 `_build/pages/*.html`，共用的頁首、主選單、頁尾寫在 `_build/build.py`。改完執行：

```
python3 _build/build.py
```

會重新產生根目錄的各個 `.html` 頁面。`_build` 資料夾不會出現在網站上。

## 頁面

- `index.html` 首頁
- `services.html` 轉型領域總覽（3×3 服務矩陣）
- `services-management.html` 企業經營轉型、`services-sales.html` B2B 銷售轉型、`services-digital.html` 企業數位轉型、`services-succession.html` 接班傳承專案
- `methodology.html` 服務模式（培訓、一對一、陪跑）
- `checkup.html`＋`checkup.js` 3 分鐘企業轉型健檢（瀏覽器計分；`checkup.js` 的 `ENDPOINT` 填入 Google Apps Script 網址後，才會改為「留資料寄送完整報告」）
- `about.html` 關於我們、`team.html` 顧問團隊、`contact.html` 預約免費診斷、`privacy.html` 隱私權聲明
- `style.css` 全站共用樣式、`CNAME` 自訂網域設定

黃底的「【待填】」「【待確認】」是尚未提供或需要確認的資料。
