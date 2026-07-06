# 筆記規範（notes/）

這個資料夾是「開發筆記」，給任何接手的人（你自己、Codex、Claude Code）快速吸收
**非顯而易見**的決策與教訓。規則如下：

1. **每個檔案只記一件事**，檔名用 `lesson-XX-主題.md`。
2. **開頭第一行是一句摘要**（用 `> ` 引言格式），讓人一眼看懂這則筆記在講什麼。
3. **修正（correction）與確認（confirmed）的做法都要記**，並附上**為什麼重要**。
4. **已經寫在程式碼、README 或對話紀錄裡的事不要重複抄**——只記「看不出來的原因與脈絡」。
5. **優先更新既有筆記**，而不是又開一個新檔講同一件事。
6. **發現某則筆記是錯的，就刪掉它**（別留著誤導後人）。

## 目前的筆記
- [lesson-01-classic-scripts.md](lesson-01-classic-scripts.md) —— 為何用傳統 script 而非 ES module
- [lesson-02-local-um-render.md](lesson-02-local-um-render.md) —— 繪製座標契約：本地微米空間
- [lesson-03-preview-raf-suspend.md](lesson-03-preview-raf-suspend.md) —— 預覽分頁會凍結 requestAnimationFrame
- [lesson-04-perf-blur-cost.md](lesson-04-perf-blur-cost.md) —— 效能：逐粒子 canvas blur 是主要成本
