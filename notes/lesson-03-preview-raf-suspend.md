> 在背景（沒被聚焦）的預覽分頁裡，瀏覽器會凍結 requestAnimationFrame，導致主迴圈與截圖都停住——這不是程式的錯。

## 觀察到的現象（修正一個誤判）
- 用預覽工具截圖會 timeout；`world.time` 一直停在 0；HUD 停在 `×—`。
- 一度以為是效能爆掉或 render 卡死，**這是誤判**。
- 實測 `world.render()` 只花 ~12ms/frame（約 84fps），手動呼叫 `world.update()` 一切正常。

## 真正原因
- 瀏覽器對**背景分頁**會暫停 `requestAnimationFrame`（省電機制）。預覽面板的分頁沒被聚焦，rAF 就不跑。
- 使用者在檔案總管雙擊、用**前景分頁**開啟時完全正常。

## 為什麼重要（給後續除錯者）
- 在預覽/無頭環境要驗證 canvas 動畫，**別依賴截圖或等 rAF 自己跑**。
- 改用手動驅動來驗證邏輯：
  ```js
  var d = MW._debug;                 // main.js 有把 canvas/camera/world/ui 掛上去
  for (var i=0;i<40;i++){ d.world.update(0.016); d.camera.update(); }
  d.ui.updateHUD();
  ```
- 這樣能測「選取→跟隨→縮放收斂→資訊面板→器官標籤」整條路徑，不受 rAF 凍結影響。
