# AGENTS.md —— 給 Codex（及其他 AI 代理）的專案守則

微生物教學模擬器（純前端）。**接手前先讀 [HANDOFF.md](HANDOFF.md) 與 [notes/](notes/)。**

## 專案性質
- 原生 HTML + CSS + JavaScript + Canvas 2D，**無建置系統、無套件相依、無測試框架**。
- 執行方式：瀏覽器直接開 `index.html`（`file://` 即可），或 `npx serve .`。
- 模組共享全域 `window.MW`；`index.html` 依固定順序載入 `js/*.js`。

## 硬性約束（違反會弄壞專案）
1. 禁止引入 build tool / bundler / npm 相依 —— 必須維持「雙擊即開」。
2. 禁止把 `<script>` 改成 `type="module"` —— `file://` 下 CORS 會使其載入失敗。
3. 座標契約：`MW.draw.<物種>(ctx, org, t)` 在本地微米座標作畫（原點=生物中心、+X=前進方向）；
   外層已套 `translate→scale(zoom)→rotate(angle)`。固定螢幕像素粗細要 `/ cam.zoom`。
4. 新增 JS 檔案必須加入 `index.html` 的 script 清單，順序排在使用它的檔案之前。

## 加一種微生物（照四步驟）
1. `js/config.js` 的 `SPECIES` 加物件（`id,name,latin,group,kingdom,sizeUm,focusZoom,color,habitat,summary,detail,parts[],facts[]`）
2. `js/config.js` 的 `spawnCounts` 加 `id: 數量`
3. `js/species.js` 加 `MW.draw.<id>`，並回寫 `org.partAnchors`（key 需對應 parts[].key）
4. `js/organism.js` 的 `baseSpeeds` 加一筆；如需特殊游動，在 `update()` 的 switch 增加 case

## 自我驗證（不要只依賴螢幕截圖）
背景分頁會暫停 `requestAnimationFrame`。請在瀏覽器 console 手動驅動邏輯：
```js
var d = MW._debug;                 // { canvas, camera, world, ui }
d.ui.focusSpecies('paramecium');
for (var i=0;i<40;i++){ d.world.update(0.016); d.camera.update(); }
d.ui.updateHUD();
d.world.render(d.ui.selected, null);   // 必須不丟出例外
```
確認：無 console 錯誤、`camera.following` 有值、資訊面板出現中文名、`org.partAnchors` 有 key。

## 完成後
- 更新對應的 `notes/lesson-*.md`（第一行寫摘要、記錄「為什麼重要」、過時或錯誤的筆記要刪）。
- 一次只做一個明確目標，改動小而可驗證。
