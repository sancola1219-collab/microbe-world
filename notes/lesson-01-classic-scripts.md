> 用傳統 `<script>` + 全域 `window.MW` 命名空間，而非 ES module，是為了能直接雙擊 index.html 開啟。

## 確認的做法
- `index.html` 以固定順序載入 `js/*.js`（config → species → camera → organism → world → ui → main）。
- 各檔案掛在同一個 `window.MW` 物件底下共享，不用 `import/export`。

## 為什麼重要
- 使用者的使用情境是**在檔案總管裡雙擊 `index.html`**（`file://` 協定）。
- 瀏覽器對 `file://` 下的 ES module 會套用 CORS 限制，`<script type="module">` 會**載入失敗**、整個畫面空白。
- 傳統 script 沒有這個限制，`file://` 直接可跑；要接手的人若改成 module，務必同時附上本機伺服器或建置步驟，否則會退化成「雙擊打不開」。

## 陷阱
- 因為靠載入順序共享全域，**新增檔案時要記得加進 index.html 的 `<script>` 清單**，且排在用到它的檔案之前。
