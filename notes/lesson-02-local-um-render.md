> 所有物種 draw 函式都在「本地微米座標」作畫；相機的位移/縮放/旋轉由 world.drawOrganism 統一套用。

## 確認的契約（core contract）
在 `MW.draw.<物種>(ctx, org, t)` 裡：
- 原點 `(0,0)` = 生物中心。
- `+X` 方向 = 生物前進方向（`org.angle` 已由外層 rotate 套好）。
- 單位 = **微米 (µm)**；線寬、半徑都用微米寫死即可。
- 外層 `world.drawOrganism()` 已依序做了 `translate(螢幕座標) → scale(zoom) → rotate(angle)`。

器官標籤錨點寫回 `org.partAnchors = { key: {x,y} }`（同樣是本地微米座標），
`drawPartLabels()` 會把它換算回世界座標再畫引線。

## 為什麼重要
- 這個約定讓「畫得多細」自動隨縮放變化：拉近時線寬變粗、細節浮現，不必為每個縮放級距寫不同程式。
- 若有人在 draw 裡改用「螢幕像素」單位（例如 `lineWidth = 2` 想固定 2px），會破壞契約——拉近時該生物會整團糊掉或線變超粗。**要固定螢幕像素粗細時，必須除以 `cam.zoom`**（world.js 的選取高亮圈就是這樣做：`lineWidth = 3 / cam.zoom`）。

## 新增物種時
1. 在 `config.js` 的 `SPECIES` 加資料（含 `parts[].key`）。
2. 在 `species.js` 加 `MW.draw.<id>`，回寫 `org.partAnchors`（key 要對得上 parts）。
3. 在 `config.js` 的 `spawnCounts` 與 `organism.js` 的 `baseSpeeds` 各加一筆。
4. 若要特殊游動，於 `organism.js` 的 `update()` switch 加 case。
