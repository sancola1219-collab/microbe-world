# CLAUDE.md —— 給 Claude Code 的專案守則

微生物教學模擬器（純前端）。**接手前先讀 [HANDOFF.md](HANDOFF.md) 與 [notes/](notes/)。**

## 這是什麼
- 原生 HTML + CSS + JavaScript + Canvas 2D，**無建置、無 npm 相依**。
- 執行：直接雙擊 `index.html`（`file://`）即可，或 `npx serve .`。
- 所有模組共享全域 `window.MW`，由 `index.html` 依序載入 `js/*.js`。

## 動手前必記的鐵則
1. **不要引入建置工具或套件**，會破壞「雙擊即開」。
2. **不要把 `<script>` 改成 ES module** —— `file://` 下會載入失敗（見 notes/lesson-01）。
3. **座標契約**：物種 `MW.draw.*` 在「本地微米座標」作畫（原點=中心、+X=朝前）；
   要固定螢幕像素粗細時必須 `/ cam.zoom`（見 notes/lesson-02）。
4. 新增檔案要加進 `index.html` 的 `<script>` 清單，且排在使用它的檔案之前。

## 常見任務：新增一種微生物（四步驟，缺一不可）
1. `js/config.js` → `SPECIES` 加資料（含 `parts[].key`）
2. `js/config.js` → `spawnCounts` 加數量
3. `js/species.js` → 加 `MW.draw.<id>`，回寫 `org.partAnchors`（key 對上 parts）
4. `js/organism.js` → `baseSpeeds` 加一筆；需要特殊游動時在 `update()` switch 加 case

## 驗證（別只截圖）
背景分頁會凍結 `requestAnimationFrame`（見 notes/lesson-03）。用 console 手動驅動：
```js
var d = MW._debug;
d.ui.focusSpecies('paramecium');
for (var i=0;i<40;i++){ d.world.update(0.016); d.camera.update(); }
d.world.render(d.ui.selected, null);   // 應不丟錯
```

## 收尾
- 改完更新對應的 `notes/lesson-*.md`（第一行摘要、記為什麼重要、錯的就刪）。
- 跨 session 都成立的新事實 → 更新本檔或你的記憶系統。
