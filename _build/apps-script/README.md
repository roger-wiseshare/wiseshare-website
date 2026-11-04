# 官網名單收件設定（Google Apps Script）

一個程式、一個網址，同時處理官網兩張表單，全部免費：

| 表單 | 寫入試算表分頁 | 通知 |
|---|---|---|
| 3 分鐘企業健檢（checkup.html） | 健檢 | 寄診斷報告給訪客、寄通知信給 rogerwang@wiseshare.com.tw |
| 預約免費轉型診斷（contact.html） | 預約診斷 | 寄通知信給 rogerwang@wiseshare.com.tw（含全部欄位，直接回覆即寄給客戶）；試算表有「已聯絡」勾選欄方便追蹤 |

免費額度（[Google 配額表](https://developers.google.com/apps-script/guides/services/quotas)）：寄信每天 100 位（個人 Gmail）或 1,500 位（Google Workspace）收件者。健檢每筆寄 2 封、預約每筆寄 1 封。

請用 **rogerwang@wiseshare.com.tw** 登入 Google 操作，約需 10 分鐘。

## 一、建立試算表與程式

1. 開啟 Google 雲端硬碟裡的「官網名單」試算表（若還沒有，到 https://sheets.new 建立一份並命名為「官網名單」）。
2. 上方選單點「擴充功能」→「Apps Script」，會開啟程式編輯器。
3. 刪掉編輯器裡原本的內容，把同資料夾 `Code.gs` 的全部內容貼上，按「儲存」（磁碟圖示）。
4. 測試預約表單：上方函式選單選 `testContact`，按「執行」。第一次會要求授權，依序點「審查權限」→ 選您的帳號 →「進階」→「前往（不安全）」→「允許」。（這是您自己寫給自己用的程式，Google 才會顯示這個警告。）完成後試算表會多一個「預約診斷」分頁和一列測試資料，rogerwang@wiseshare.com.tw 會收到一封通知信。測完可刪掉那一列。
5. 測試健檢：函式選單選 `testRun`，按「執行」。rogerwang@wiseshare.com.tw 會收到兩封信，試算表會多一個「健檢」分頁。

## 二、部署

1. 右上角「部署」→「新增部署作業」→ 齒輪圖示選「網頁應用程式」。
   - 說明：官網名單
   - 執行身分：**我**
   - 誰可以存取：**所有人**
2. 按「部署」，複製出現的「網頁應用程式網址」（以 `https://script.google.com/macros/s/` 開頭），貼給 Claude。這個網址只能送資料進來、不能讀資料，可以公開。

收到網址後，Claude 會把它填進網站 `contact.js` 與 `checkup.js` 的 `ENDPOINT`。在那之前，預約表單送出後會在頁面上列出填好的內容，讓訪客複製後寄信到 rogerwang@wiseshare.com.tw。

## 日常使用

- 收到通知信後直接按「回覆」，就會寄給填表的客戶。
- 聯絡完客戶後，可在「預約診斷」分頁勾選該列的「已聯絡」，方便追蹤。

## 之後修改程式

改完 `Code.gs` 後，要到「部署」→「管理部署作業」→ 鉛筆圖示 →「版本」選「新版本」→「部署」，網址不變。
