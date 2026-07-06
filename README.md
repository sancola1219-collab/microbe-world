# 🔬 微生物的世界 · 虛擬顯微鏡

一個純瀏覽器、可自由縮放的**微生物生態教學模擬器**。從「一滴池水」的生態全景，
一路拉近到單一細胞的胞器，點任何一隻生物都會出現中文教學解說與構造標註。

![no build needed](https://img.shields.io/badge/build-none-brightgreen) ![vanilla js](https://img.shields.io/badge/stack-vanilla%20JS%20%2B%20Canvas2D-blue)

## ▶️ 如何執行

**最簡單**：直接用瀏覽器打開 `index.html`（在檔案總管雙擊即可，不需安裝任何東西）。

> 想用本機伺服器預覽也行：`npx serve .` 然後開 `http://localhost:3000`。
> （為什麼雙擊就能跑？見 [notes/lesson-01](notes/lesson-01-classic-scripts.md)）

## 🎮 操作

| 動作 | 效果 |
| --- | --- |
| 滑鼠滾輪 | 以游標為中心拉近／拉遠 |
| 拖曳 | 平移視野 |
| 點擊生物 | 鎖定＋顯示教學解說＋鏡頭跟隨 |
| 左側圖鑑 | 直接跳到某種生物 |
| `＋ / －`、`L`、`T`、`Esc` | 縮放、切換標籤、自動導覽、取消選取 |
| 觸控 | 單指平移、雙指縮放、點選 |

## 🧫 內容

10 種常見微生物，含中文名、學名、分類、棲息地、構造標註與冷知識：

草履蟲、變形蟲、眼蟲、球菌、桿菌、螺旋菌、矽藻、團藻、輪蟲、水綿。

每種都有**擬真程序繪製**（半透明細胞、擺動的纖毛／鞭毛、流動的偽足、螺旋葉綠體…）
與**專屬游動行為**（草履蟲迴避、眼蟲趨光、細菌跑動翻滾、變形蟲爬行…）。

## 📁 專案結構

```
微生物的世界/
├─ index.html            進入點（依序載入 js/*）
├─ css/style.css         顯微鏡實驗室風格 UI
├─ js/
│  ├─ config.js          全域設定 + 物種教學資料（單一事實來源）
│  ├─ species.js         各物種擬真繪製（本地微米座標）
│  ├─ camera.js          相機：縮放/平移/座標換算
│  ├─ organism.js        生物實例 + 移動 AI
│  ├─ world.js           生成/更新/背景氣氛/繪製
│  ├─ ui.js              圖鑑/資訊面板/導覽/輸入
│  └─ main.js            啟動 + 主迴圈
├─ notes/                開發筆記（每檔一則教訓，見 notes/README）
├─ HANDOFF.md            ★ 完整流程與邏輯 + 交接指南（先讀這個）
├─ CLAUDE.md             給 Claude Code 的專案守則
└─ AGENTS.md             給 Codex 的專案守則
```

## 🔧 想改東西？

- **加一種微生物 / 調整參數 / 換視覺** → 看 [HANDOFF.md](HANDOFF.md) 的「常見修改」章節。
- **交給 Codex 或 Claude Code 接手** → 看 [HANDOFF.md](HANDOFF.md) 的「交接」章節。
