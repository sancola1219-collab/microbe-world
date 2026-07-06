/* =============================================================
 * world.js —— 世界：生成、更新迴圈、背景氣氛、繪製
 * -------------------------------------------------------------
 * 職責：
 *   1. 依 config.spawnCounts 生成所有微生物
 *   2. 每幀更新所有生物與背景粒子
 *   3. 繪製：水體背景 → 景深浮游微粒 → 光線 → 生物 → 器官標籤
 * 相機轉換集中在 drawOrganism()：先 translate 到螢幕位置，
 * 再 scale(zoom)、rotate(angle)，之後物種 draw 以微米作畫。
 * ============================================================= */
window.MW = window.MW || {};

MW.World = function (canvas, camera) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.camera = camera;
  this.organisms = [];
  this.particles = [];
  this.time = 0;
  this.showLabels = true;

  var cfg = MW.config;
  this.lightX = cfg.worldWidthUm * 0.5;
  this.lightY = -600;               // 光源在上方（趨光用）

  this.spawn();
  this.spawnParticles();
};

MW.World.prototype.spawn = function () {
  var cfg = MW.config;
  var seedCounter = 1;
  Object.keys(cfg.spawnCounts).forEach(function (id) {
    var n = cfg.spawnCounts[id];
    for (var i = 0; i < n; i++) {
      var x = Math.random() * cfg.worldWidthUm;
      var y = Math.random() * cfg.worldHeightUm;
      this.organisms.push(new MW.Organism(id, x, y, seedCounter * 0.6180339));
      seedCounter++;
    }
  }, this);
};

MW.World.prototype.spawnParticles = function () {
  // 景深浮游微粒（碎屑/氣泡），depth 越大越模糊越慢
  var cfg = MW.config;
  for (var i = 0; i < 260; i++) {
    this.particles.push({
      x: Math.random() * cfg.worldWidthUm,
      y: Math.random() * cfg.worldHeightUm,
      r: 2 + Math.random() * 40,
      depth: Math.random(),            // 0 近 1 遠
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      hue: Math.random(),
    });
  }
};

MW.World.prototype.update = function (dt) {
  this.time += dt;
  for (var i = 0; i < this.organisms.length; i++) {
    this.organisms[i].update(dt, this.time, this);
  }
  var cfg = MW.config;
  for (var p = 0; p < this.particles.length; p++) {
    var pt = this.particles[p];
    pt.x += pt.vx * dt * (0.3 + pt.depth);
    pt.y += pt.vy * dt * (0.3 + pt.depth);
    if (pt.x < 0) pt.x += cfg.worldWidthUm;
    if (pt.x > cfg.worldWidthUm) pt.x -= cfg.worldWidthUm;
    if (pt.y < 0) pt.y += cfg.worldHeightUm;
    if (pt.y > cfg.worldHeightUm) pt.y -= cfg.worldHeightUm;
  }
};

/* --------------------- 繪製 --------------------- */
MW.World.prototype.render = function (selected, hovered) {
  var ctx = this.ctx, cam = this.camera;
  var W = this.canvas.width, H = this.canvas.height;

  // 1. 水體背景（依縮放略調色，越近越暗以突顯標本）
  var deep = Math.min(1, cam.zoom / 8);
  var g = ctx.createRadialGradient(W * 0.5, H * 0.35, 60, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
  g.addColorStop(0, 'rgb(' + (18 + 24 * (1 - deep)) + ',' + (46 + 30 * (1 - deep)) + ',' + (58 + 26 * (1 - deep)) + ')');
  g.addColorStop(1, 'rgb(6,18,26)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // 2. 遠景光柱（顯微鏡透光感）
  var ls = cam.worldToScreen(this.lightX, this.lightY);
  var lg = ctx.createLinearGradient(0, 0, 0, H);
  lg.addColorStop(0, 'rgba(180,220,230,0.10)');
  lg.addColorStop(0.5, 'rgba(120,180,200,0.03)');
  lg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, W, H);

  // 3. 景深浮游微粒（遠的先畫、加模糊）
  this.renderParticles();

  // 4. 生物：先遠（背景層）後近沒有分層，直接畫，但做視野裁切
  for (var i = 0; i < this.organisms.length; i++) {
    this.drawOrganism(this.organisms[i], this.organisms[i] === selected, this.organisms[i] === hovered);
  }
};

MW.World.prototype.renderParticles = function () {
  var ctx = this.ctx, cam = this.camera;
  var W = this.canvas.width, H = this.canvas.height;
  // 由遠到近
  var arr = this.particles.slice().sort(function (a, b) { return b.depth - a.depth; });
  for (var i = 0; i < arr.length; i++) {
    var p = arr[i];
    var s = cam.worldToScreen(p.x, p.y);
    var r = p.r * cam.zoom * (0.5 + p.depth);
    if (r < 0.3) continue;
    if (s.x < -r || s.x > W + r || s.y < -r || s.y > H + r) continue;
    var blur = p.depth * 8;
    ctx.save();
    if (blur > 0.5) ctx.filter = 'blur(' + blur.toFixed(1) + 'px)';
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    var alpha = 0.05 + (1 - p.depth) * 0.14;
    ctx.fillStyle = 'rgba(' + (140 + p.hue * 60) + ',' + (170 + p.hue * 40) + ',150,' + alpha + ')';
    ctx.fill();
    ctx.restore();
  }
};

MW.World.prototype.drawOrganism = function (org, isSelected, isHovered) {
  var ctx = this.ctx, cam = this.camera;
  var W = this.canvas.width, H = this.canvas.height;
  var s = cam.worldToScreen(org.x, org.y);
  var screenR = org.radiusUm() * cam.zoom;

  // 視野裁切
  if (s.x < -screenR * 2 || s.x > W + screenR * 2 || s.y < -screenR * 2 || s.y > H + screenR * 2) return;
  if (screenR < 0.6) return;        // 太小就不畫

  var drawFn = MW.draw[org.id];
  if (!drawFn) return;

  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.rotate(org.angle);

  // 選取 / 懸停高亮
  if (isSelected || isHovered) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, org.radiusUm() * 1.15, 0, Math.PI * 2);
    ctx.strokeStyle = isSelected ? 'rgba(120,230,255,0.9)' : 'rgba(255,255,255,0.4)';
    ctx.lineWidth = (isSelected ? 3 : 2) / cam.zoom;
    ctx.setLineDash(isSelected ? [] : [6 / cam.zoom, 6 / cam.zoom]);
    ctx.stroke();
    ctx.restore();
  }

  drawFn(ctx, org, this.time);
  ctx.restore();

  // 器官標籤（近看 + 開啟標籤 + 被選取）
  if (this.showLabels && isSelected && cam.zoom > (org.species.focusZoom || 3) * 0.7) {
    this.drawPartLabels(org);
  }

  // 遠看時的名稱標記（縮到很小仍給提示點）
  if (!isSelected && screenR > 3 && screenR < 26) {
    ctx.save();
    ctx.fillStyle = 'rgba(180,230,240,0.5)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(org.species.name, s.x + screenR + 3, s.y);
    ctx.restore();
  }
};

MW.World.prototype.drawPartLabels = function (org) {
  var ctx = this.ctx, cam = this.camera;
  if (!org.partAnchors) return;
  var parts = org.species.parts || [];
  ctx.save();
  ctx.font = '13px system-ui, "Noto Sans TC", sans-serif';
  parts.forEach(function (part, idx) {
    var anchor = org.partAnchors[part.key];
    if (!anchor) return;
    // 本地微米 → 世界 → 螢幕（考慮旋轉）
    var ca = Math.cos(org.angle), sa = Math.sin(org.angle);
    var wx = org.x + anchor.x * ca - anchor.y * sa;
    var wy = org.y + anchor.x * sa + anchor.y * ca;
    var s = cam.worldToScreen(wx, wy);

    // 標籤放在生物外圈，交錯左右
    var side = (idx % 2 === 0) ? 1 : -1;
    var lift = (idx - parts.length / 2) * 26;
    var lx = s.x + side * (org.radiusUm() * cam.zoom + 40);
    var ly = s.y + lift;

    // 引線
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(lx - side * 6, ly);
    ctx.strokeStyle = 'rgba(120,230,255,0.65)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120,230,255,0.9)';
    ctx.fill();

    // 文字底板
    var label = part.name;
    var tw = ctx.measureText(label).width;
    var bx = side === 1 ? lx : lx - tw - 12;
    ctx.fillStyle = 'rgba(10,30,40,0.78)';
    ctx.fillRect(bx, ly - 11, tw + 12, 22);
    ctx.strokeStyle = 'rgba(120,230,255,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, ly - 11, tw + 12, 22);
    ctx.fillStyle = 'rgba(220,245,250,0.95)';
    ctx.fillText(label, bx + 6, ly + 4);
  });
  ctx.restore();
};

// 點擊測試：回傳世界座標下命中的生物（優先最近/最小以便選中小生物）
MW.World.prototype.pick = function (wx, wy) {
  var best = null, bestD = Infinity;
  for (var i = 0; i < this.organisms.length; i++) {
    var o = this.organisms[i];
    var dx = o.x - wx, dy = o.y - wy;
    var d = Math.sqrt(dx * dx + dy * dy);
    var r = o.radiusUm() * 1.2;
    if (d < r && d < bestD) { bestD = d; best = o; }
  }
  return best;
};
