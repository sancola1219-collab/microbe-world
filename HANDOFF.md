# 交接手冊 HANDOFF —— 完整流程、邏輯與如何接手

> 這份文件的用途：讓**未來的你、Codex、或 Claude Code**在沒有本次對話紀錄的情況下，
> 也能完全看懂這個專案怎麼運作、怎麼安全地繼續改下去。**接手前請先讀完這一份。**

---

## 0. 一句話總覽

純前端（HTML + CSS + 原生 JS + Canvas 2D）的微生物生態教學模擬器，
沒有建置流程、沒有相依套件，雙擊 `index.html` 就能跑。

---

## 1. 整體資料流與遊戲迴圈

```
                       ┌───────────── 每一幀 (requestAnimationFrame) ─────────────┐
 使用者輸入              │                                                          │
 (滾輪/拖曳/點擊/鍵盤)   │   world.update(dt)   ← 移動所有生物、漂移背景微粒          │
   │                   │        │                                                 │
   ▼                   │        ▼                                                 │
 ui.js  ──改變──▶ camera / world 狀態                                              │
   │                   │   ui.updateTour(dt)  ← 自動導覽計時、切換聚焦             │
   │                   │        │                                                 │
   │                   │        ▼                                                 │
   │                   │   camera.update()    ← 平滑逼近目標位置/縮放、鎖定跟隨    │
   │                   │        │                                                 │
   │                   │        ▼                                                 │
   │                   │   world.render(selected, hovered)                        │
   │                   │        背景 → 光柱 → 景深微粒 → 生物 → 器官標籤            │
   │                   │        │                                                 │
   │                   │        ▼                                                 │
   └───────────────────┤   ui.updateHUD()     ← 放大倍率 / 視野 / 尺度文字         │
                       └──────────────────────────────────────────────────────────┘
```

主迴圈在 `js/main.js`。`dt` 以秒為單位並夾在 0.05 上限（避免切回分頁時暴衝）。

---

## 2. 座標系統（最重要的心智模型）

有三層座標，搞清楚就不會改壞：

1. **世界座標（微米 µm）**：生物真正的位置。世界大小在 `config.worldWidthUm/HeightUm`。
2. **螢幕座標（像素）**：畫到 canvas 上的位置。由 `camera.worldToScreen()` 換算。
3. **本地座標（微米，物種內部）**：每個 `MW.draw.<物種>` 在「以生物為中心、+X 朝前」的
   座標系作畫。外層 `world.drawOrganism()` 已幫你 `translate→scale(zoom)→rotate(angle)`。

換算公式（見 `camera.js`）：
```
screen = (world - camera) * zoom + 螢幕中心
world  = (screen - 螢幕中心) / zoom + camera
zoom   = 每微米對應多少像素
```

> ⚠️ 在物種 draw 裡要固定「螢幕像素」粗細時，一定要 `/ cam.zoom`，否則拉近會糊。
> 細節見 [notes/lesson-02](notes/lesson-02-local-um-render.md)。

---

## 3. 每個檔案的職責（單一責任）

| 檔案 | 職責 | 改這裡當你要… |
| --- | --- | --- |
| `js/config.js` | **單一事實來源**：相機參數、世界大小、10 種生物的教學資料、生成數量 | 改文字/數量/縮放參數、加新物種資料 |
| `js/species.js` | 每種生物的擬真 Canvas 繪製，回寫器官錨點 `partAnchors` | 改外觀、加新物種的畫法 |
| `js/camera.js` | 縮放、平移、跟隨、座標換算、放大倍率計算 | 改鏡頭手感、縮放範圍 |
| `js/organism.js` | 生物實例、每種的移動 AI（switch）、邊界反彈、布朗運動 | 改游動行為、速度 |
| `js/world.js` | 生成生物與背景微粒、更新、繪製整個場景、點擊命中測試 | 改背景氣氛、景深、標籤畫法、生成邏輯 |
| `js/ui.js` | 圖鑑清單、資訊面板、自動導覽、HUD、所有輸入事件 | 改介面、互動、鍵盤/觸控 |
| `js/main.js` | 建立四大物件、跑 rAF 主迴圈、掛 `MW._debug` | 幾乎不用改 |

所有模組共享同一個全域 `window.MW`（沒有 import/export，原因見 lesson-01）。

---

## 4. 一隻生物的生命週期

1. `world.spawn()` 依 `config.spawnCounts` 建立 `MW.Organism`，隨機灑在世界裡，帶一個 `seed`。
2. 每幀 `organism.update(dt, t, world)` 依 `id` 走對應的移動 case，更新 `x/y/angle`。
3. `world.drawOrganism()` 把它轉到螢幕、套縮放旋轉，呼叫 `MW.draw[id]()` 畫出來，
   draw 過程順便把器官錨點寫進 `org.partAnchors`。
4. 被選取且夠近時，`world.drawPartLabels()` 用那些錨點畫引線標籤。
5. `world.pick(wx,wy)` 做點擊命中（取最近的一隻）。

---

## 5. 常見修改（照做即可）

### 5.1 新增一種微生物（最常見）
四個地方，缺一不可：
1. `config.js` → `SPECIES` 加一筆物件（`id/name/latin/group/kingdom/sizeUm/focusZoom/color/habitat/summary/detail/parts[]/facts[]`）。
2. `config.js` → `spawnCounts` 加 `id: 數量`。
3. `species.js` → 加 `MW.draw.<id> = function(ctx, org, t){ ... org.partAnchors = {...}; }`
   （在本地微米座標畫，key 要對上 `parts[].key`）。
4. `organism.js` → `baseSpeeds` 加 `id: 速度`；若要特殊游動，在 `update()` 的 switch 加 case。

> `speciesById` 會自動建立索引；圖鑑清單、資訊面板、導覽都會自動吃到新物種，不用另外改 UI。

### 5.2 調整手感/數量
- 縮放範圍、起始縮放：`config.minZoom / maxZoom / startZoom`。
- 放大倍率顯示：`config.magReference`（純教學觀感，非光學）。
- 世界大小：`config.worldWidthUm / worldHeightUm`。
- 生物移動速度：`organism.js` 的 `baseSpeeds`。

### 5.3 改視覺氣氛
- 背景水色、暗角：`world.render()` 開頭的漸層 + `css` 的 `.scope-vignette`。
- 景深微粒：`world.spawnParticles()` / `renderParticles()`（效能注意 lesson-04）。

---

## 6. 如何驗證改動（重要）

因為是 canvas 動畫，**別只靠截圖**（背景分頁會凍結 rAF，見 lesson-03）。用手動驅動測邏輯：

```js
// 開啟頁面後在瀏覽器 console：
var d = MW._debug;                     // { canvas, camera, world, ui }
d.ui.focusSpecies('paramecium');       // 模擬點選草履蟲
for (var i=0;i<40;i++){ d.world.update(0.016); d.camera.update(); }
d.ui.updateHUD();
console.log(d.camera.following.id, d.camera.zoom, d.ui.selected.id);
d.world.render(d.ui.selected, null);   // 確認繪製不丟錯
```

檢查清單：
- [ ] `MW` 有載入、`MW._debug.world.organisms.length` 合理
- [ ] console 沒有紅字錯誤
- [ ] 選一種生物 → `camera.following` 有值、`tzoom` 變到該物種 `focusZoom`
- [ ] 資訊面板出現該生物中文名
- [ ] 拉到夠近時器官標籤有畫出來（`org.partAnchors` 有 key）

---

## 7. 交接：如何交給 Codex 或 Claude Code 繼續改

### 7.1 兩者都適用的準備
- 專案沒有相依套件、沒有建置，clone/複製資料夾就能開。
- **接手第一步**：讀這份 `HANDOFF.md` → 讀 `notes/` 全部 → 再讀 `config.js` 與要改的檔案。
- 守則檔已備好：Claude Code 讀 `CLAUDE.md`，Codex 讀 `AGENTS.md`（兩者內容一致、格式各自對應）。

### 7.2 交給 **Claude Code**
1. 在專案資料夾開 `claude`。
2. 它會自動讀 `CLAUDE.md`。第一次可先說：「請先讀 HANDOFF.md 和 notes/，再開始。」
3. 派工時用「一次一個明確目標」，例如：
   > 「依 HANDOFF.md 5.1 的四步驟，新增一種『鐘形蟲 Vorticella』，畫成有柄、頭端纖毛冠的樣子。」
4. 改完請它照 HANDOFF.md 第 6 節驗證，並**更新 notes/**（見下方工作流程）。

### 7.3 交給 **Codex**
1. Codex 會自動讀專案根目錄的 `AGENTS.md`。
2. 開場提示建議：
   > 「先讀 AGENTS.md、HANDOFF.md、notes/。這是無建置的原生 JS + Canvas 專案，
   >  改動後用 HANDOFF.md 第 6 節的 console 方法自我驗證。」
3. 同樣「一次一個目標」，並要求它遵守座標契約（第 2 節）與四步驟加物種（5.1）。

### 7.4 給接手 AI 的黃金守則（貼給它）
- 不要引入建置工具或 npm 套件（會破壞「雙擊即開」）。
- 不要把 `<script>` 改成 ES module（`file://` 會壞，見 lesson-01）。
- 遵守本地微米座標契約（第 2 節 / lesson-02）。
- 新增檔案要記得加進 `index.html` 的 script 清單，且排在使用者之前。
- 改完更新對應的 `notes/lesson-*.md`；發現舊筆記錯了就刪掉。

---

## 8. 記憶與筆記工作流程（讓你能一直改下去）

這個專案用**兩層記憶**，缺一個都會讓下一次接手變吃力：

### 第一層：`notes/`（專案內、跟著 repo 走）
- 規範見 [notes/README.md](notes/README.md)。
- **每次做完一件非顯而易見的決定或踩到坑**，就新增/更新一則 `lesson-*.md`：
  - 第一行一句摘要（`> ...`）。
  - 記「確認的做法」或「修正」，**都要寫為什麼重要**。
  - 已經寫在程式碼/README 的事不要重抄；優先更新既有筆記；錯的筆記直接刪。

### 第二層：AI 助理的長期記憶（跨對話）
- 若用 Claude Code：把「這是無建置原生 JS 專案、雙擊即開、座標契約、加物種四步驟」
  這類**跨 session 都成立的事實**存進它的記憶系統（`MEMORY.md` + memory 檔）。
- 若用 Codex：這些長期事實就靠 `AGENTS.md` 承載（它每次都會讀）。

### 每次工作的固定節奏（建議照這個循環）
```
1. 讀 HANDOFF.md 相關章節 + 相關 notes
2. 一次做一個明確小目標
3. 用第 6 節的 console 方法驗證（別只截圖）
4. 更新 notes/：新增或修正 lesson，刪掉過時的
5. 若有跨 session 的新事實 → 更新 CLAUDE.md / AGENTS.md（或 AI 記憶）
```

照這個節奏，無論之後是你自己、Codex 還是 Claude Code 接手，都能無縫改下去。

---

## 9. 已知限制 / 未來可做

- 生物之間沒有互動（沒有真的捕食/繁殖），純視覺與教學導向。想加生態模擬可從 `organism.update` 著手。
- 景深 blur 是最大效能成本（lesson-04），大幅增量前先優化。
- 目前 10 種生物；資料與繪製解耦，擴充很容易（5.1）。
- 無音效、無存檔；如需求可再加。
