/* =============================================================
 * organism.js —— 微生物實例與行為（移動 AI）
 * -------------------------------------------------------------
 * 每隻生物有世界座標 (x,y)、朝向 angle、種子 seed、動畫相位 phase。
 * update() 依物種給出不同的游動方式：
 *   - 草履蟲 / 眼蟲：直線螺旋前進，偶爾轉向（眼蟲趨光）
 *   - 變形蟲：極慢隨機爬行
 *   - 細菌：跑動與翻滾（run-and-tumble）
 *   - 團藻：緩慢滾動漂移
 *   - 輪蟲：短距衝刺後停頓
 * ============================================================= */
window.MW = window.MW || {};

MW.Organism = function (speciesId, x, y, seed) {
  this.species = MW.speciesById[speciesId];
  this.id = speciesId;
  this.x = x;
  this.y = y;
  this.seed = seed;
  this.phase = seed * 6.283;
  this.angle = seed * 6.283;
  this.speed = 0;             // µm/秒
  this.turn = 0;             // 目前轉向速率
  this.timer = 0;
  this.partAnchors = {};
  this.baseSpeed = MW.Organism.baseSpeeds[speciesId] || 20;
};

// 各物種基礎速度（µm/秒），刻意誇大以便觀察
MW.Organism.baseSpeeds = {
  paramecium: 120,
  amoeba: 8,
  euglena: 90,
  coccus: 14,
  bacillus: 55,
  spirillum: 140,
  diatom: 6,
  volvox: 30,
  rotifer: 70,
  spirogyra: 3,
};

MW.Organism.prototype.update = function (dt, t, world) {
  var id = this.id;
  this.timer -= dt;

  switch (id) {
    case 'paramecium':
      // 直線+微螺旋，計時到就轉向（模擬迴避反應）
      if (this.timer <= 0) {
        this.turn = (Math.random() - 0.5) * 1.2;
        this.timer = 1.5 + Math.random() * 2;
      }
      this.angle += this.turn * dt + Math.sin(t * 2 + this.phase) * 0.15 * dt;
      this.speed = this.baseSpeed;
      break;

    case 'euglena':
      // 趨光：朝世界中央上方的「光源」偏轉
      var lx = world.lightX, ly = world.lightY;
      var desired = Math.atan2(ly - this.y, lx - this.x);
      var diff = Math.atan2(Math.sin(desired - this.angle), Math.cos(desired - this.angle));
      this.angle += diff * 0.4 * dt + Math.sin(t * 4 + this.phase) * 0.3 * dt;
      this.speed = this.baseSpeed;
      break;

    case 'amoeba':
      if (this.timer <= 0) {
        this.angle += (Math.random() - 0.5) * 1.5;
        this.timer = 3 + Math.random() * 4;
      }
      this.speed = this.baseSpeed * (0.5 + 0.5 * Math.sin(t + this.phase));
      break;

    case 'coccus':
      this.speed = this.baseSpeed * 0.3;
      this.angle += (Math.random() - 0.5) * dt;
      break;

    case 'bacillus':
    case 'spirillum':
      // run-and-tumble
      if (this.timer <= 0) {
        this.angle += (Math.random() - 0.5) * 3;
        this.timer = 0.4 + Math.random() * 1.2;
      }
      this.speed = this.baseSpeed;
      break;

    case 'volvox':
      this.speed = this.baseSpeed;
      this.angle += 0.2 * dt;
      break;

    case 'rotifer':
      // 衝刺-停頓
      if (this.timer <= 0) {
        this.dashing = !this.dashing;
        this.timer = this.dashing ? (0.6 + Math.random()) : (0.8 + Math.random());
        if (this.dashing) this.angle += (Math.random() - 0.5) * 1.5;
      }
      this.speed = this.dashing ? this.baseSpeed : 4;
      break;

    case 'diatom':
    case 'spirogyra':
      // 幾乎不動，只隨水流微漂
      this.speed = this.baseSpeed;
      this.angle += Math.sin(t * 0.3 + this.phase) * 0.1 * dt;
      break;

    default:
      this.speed = this.baseSpeed;
  }

  // 布朗運動微擾（越小的生物越明顯）
  var brown = (this.species.sizeUm < 20) ? 30 : 4;
  this.x += Math.cos(this.angle) * this.speed * dt + (Math.random() - 0.5) * brown * dt;
  this.y += Math.sin(this.angle) * this.speed * dt + (Math.random() - 0.5) * brown * dt;

  // 世界邊界：碰到就轉回
  var cfg = MW.config;
  if (this.x < 0) { this.x = 0; this.angle = Math.PI - this.angle; }
  if (this.x > cfg.worldWidthUm) { this.x = cfg.worldWidthUm; this.angle = Math.PI - this.angle; }
  if (this.y < 0) { this.y = 0; this.angle = -this.angle; }
  if (this.y > cfg.worldHeightUm) { this.y = cfg.worldHeightUm; this.angle = -this.angle; }
};

// 生物的「畫面半徑」（微米），供點擊判定與畫面裁切
MW.Organism.prototype.radiusUm = function () {
  return this.species.sizeUm * 0.6;
};
