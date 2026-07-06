/* =============================================================
 * camera.js —— 相機（縮放 / 平移 / 座標換算）
 * -------------------------------------------------------------
 * 世界座標單位是微米 (µm)。相機負責把世界座標轉成螢幕像素。
 *   screen = (world - cam) * zoom + screenCenter
 *   world  = (screen - screenCenter) / zoom + cam
 * zoom = 每微米對應的螢幕像素數。
 * 支援平滑趨近（目標值 -> 現值以 lerp 逼近），讓縮放/導覽有慣性。
 * ============================================================= */
window.MW = window.MW || {};

MW.Camera = function (canvas) {
  var cfg = MW.config;
  this.canvas = canvas;
  this.x = cfg.worldWidthUm / 2;   // 相機中心（世界座標）
  this.y = cfg.worldHeightUm / 2;
  this.zoom = cfg.startZoom;

  // 平滑目標
  this.tx = this.x;
  this.ty = this.y;
  this.tzoom = this.zoom;
  this.following = null;           // 導覽模式：鎖定某隻生物
};

MW.Camera.prototype = {
  worldToScreen: function (wx, wy) {
    var cx = this.canvas.width / 2;
    var cy = this.canvas.height / 2;
    return {
      x: (wx - this.x) * this.zoom + cx,
      y: (wy - this.y) * this.zoom + cy,
    };
  },

  screenToWorld: function (sx, sy) {
    var cx = this.canvas.width / 2;
    var cy = this.canvas.height / 2;
    return {
      x: (sx - cx) / this.zoom + this.x,
      y: (sy - cy) / this.zoom + this.y,
    };
  },

  // 以某個螢幕點為中心縮放（滾輪縮放時錨定游標）
  zoomAt: function (sx, sy, factor) {
    var cfg = MW.config;
    var before = this.screenToWorld(sx, sy);
    this.tzoom = Math.max(cfg.minZoom, Math.min(cfg.maxZoom, this.tzoom * factor));
    // 立即套用一部分，讓錨定更精準
    this.zoom = Math.max(cfg.minZoom, Math.min(cfg.maxZoom, this.zoom * factor));
    var after = this.screenToWorld(sx, sy);
    this.x += before.x - after.x;
    this.y += before.y - after.y;
    this.tx = this.x;
    this.ty = this.y;
    this.following = null;
  },

  panBy: function (dxScreen, dyScreen) {
    this.x -= dxScreen / this.zoom;
    this.y -= dyScreen / this.zoom;
    this.tx = this.x;
    this.ty = this.y;
    this.following = null;
  },

  focusOn: function (wx, wy, zoom) {
    this.tx = wx;
    this.ty = wy;
    if (zoom) this.tzoom = zoom;
  },

  follow: function (organism) {
    this.following = organism;
    if (organism) this.tzoom = organism.species.focusZoom || this.tzoom;
  },

  update: function () {
    var cfg = MW.config;
    if (this.following) {
      this.tx = this.following.x;
      this.ty = this.following.y;
    }
    // 平滑逼近
    this.x += (this.tx - this.x) * 0.12;
    this.y += (this.ty - this.y) * 0.12;
    this.zoom += (this.tzoom - this.zoom) * 0.12;

    // 邊界夾制（避免看到世界外太多空白）
    var margin = 800;
    this.x = Math.max(-margin, Math.min(cfg.worldWidthUm + margin, this.x));
    this.y = Math.max(-margin, Math.min(cfg.worldHeightUm + margin, this.y));
  },

  // 顯微鏡風格放大倍率（教學用，非嚴格光學）
  magnification: function () {
    return Math.round(this.zoom * MW.config.magReference);
  },

  // 目前畫面橫向可見的世界寬度（微米）
  fieldOfViewUm: function () {
    return this.canvas.width / this.zoom;
  },
};
