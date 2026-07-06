/* =============================================================
 * main.js —— 啟動與主迴圈
 * -------------------------------------------------------------
 * 建立 canvas / camera / world / ui，然後用 requestAnimationFrame
 * 跑「更新 -> 繪製」迴圈。dt 以毫秒轉秒並夾制，避免分頁切回時暴衝。
 * ============================================================= */
(function () {
  var canvas = document.getElementById('stage');
  var ctx = canvas.getContext('2d');

  function resize() {
    // 以裝置像素比繪製，畫面清晰
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  var camera = new MW.Camera(canvas);
  var world = new MW.World(canvas, camera);
  var ui = new MW.UI(canvas, camera, world);

  var last = null;
  function frame(now) {
    if (last === null) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);   // 夾制 dt
    last = now;

    world.update(dt);
    ui.updateTour(dt);
    camera.update();

    world.render(ui.selected, ui.hovered);
    ui.updateHUD();

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // 開發用：把主要物件掛到全域，方便在 console 檢查
  MW._debug = { canvas: canvas, camera: camera, world: world, ui: ui };
})();
