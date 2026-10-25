# 健檢寄信設定（Google Apps Script）

讓「3 分鐘企業健檢」在訪客留下資料後，自動做三件事：寫入 Google 試算表、寄診斷報告給訪客、寄新名單通知給 rogerwang@wiseshare.com.tw。全部免費；每天可寄 100 位（個人 Gmail）或 1,500 位（Google Workspace）收件者（[Google 配額表](https://developers.google.com/apps-script/guides/services/quotas)）。

請用 **rogerwang@wiseshare.com.tw** 登入 Google 操作，信件就會從這個信箱寄出。約需 10 分鐘。

## 步驟

1. 開啟 https://sheets.new ，建立一份新試算表，命名為「健檢名單」。
2. 上方選單點「擴充功能」→「Apps Script」，會開啟程式編輯器。
3. 刪掉編輯器裡原本的內容，把同資料夾 `Code.gs` 的全部內容貼上，按「儲存」（磁碟圖示）。
4. （建議）免費解析時長確定後，把程式中 `const FREE_MINUTES = '';` 改成例如 `'30'`。
5. 先測試：上方函式選單選 `testRun`，按「執行」。第一次會要求授權，依序點「審查權限」→ 選您的帳號 →「進階」→「前往（不安全）」→「允許」。（這是您自己寫給自己用的程式，Google 才會顯示這個警告。）
6. 執行完成後，rogerwang@wiseshare.com.tw 應該會收到兩封信（一封測試報告、一封新名單通知），試算表也會多一列資料。
7. 部署：右上角「部署」→「新增部署作業」→ 齒輪圖示選「網頁應用程式」。
   - 說明：健檢寄信
   - 執行身分：**我**
   - 誰可以存取：**所有人**
8. 按「部署」，複製出現的「網頁應用程式網址」（以 `https://script.google.com/macros/s/` 開頭），貼給 Claude。

收到網址後，Claude 會把它填進網站 `checkup.js` 的 `ENDPOINT`，健檢就會改成「留資料寄送完整報告」。

## 之後修改程式

改完 `Code.gs` 後，要到「部署」→「管理部署作業」→ 鉛筆圖示 →「版本」選「新版本」→「部署」，網址不變。
