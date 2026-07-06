/* =============================================================
 * ui.js —— 教學介面：圖鑑、資訊面板、導覽、HUD、輸入
 * -------------------------------------------------------------
 * 對外只暴露 MW.UI(canvas, camera, world)，由 main.js 建立。
 * 事件流：
 *   滾輪   -> camera.zoomAt（錨定游標）
 *   拖曳   -> camera.panBy
 *   點擊   -> world.pick -> 選取 -> 顯示資訊面板 + 相機跟隨
 *   移動   -> hover 高亮
 *   導覽   -> 依序聚焦每種生物，自動講解
 * ============================================================= */
window.MW = window.MW || {};

MW.UI = function (canvas, camera, world) {
  this.canvas = canvas;
  this.camera = camera;
  this.world = world;
  this.selected = null;
  this.hovered = null;
  this.tour = { active: false, index: 0, timer: 0 };

  this.el = {
    mag: document.getElementById('mag'),
    fov: document.getElementById('fov'),
    depthLabel: document.getElementById('depthLabel'),
    list: document.getElementById('speciesList'),
    info: document.getElementById('infoPanel'),
    tourBtn: document.getElementById('tourBtn'),
    labelBtn: document.getElementById('labelBtn'),
    hint: document.getElementById('hint'),
  };

  this.buildSpeciesList();
  this.bindInput();
  this.showWelcome();
};

/* ---------------- 圖鑑清單 ---------------- */
MW.UI.prototype.buildSpeciesList = function () {
  var self = this;
  var html = '';
  MW.SPECIES.forEach(function (s) {
    html +=
      '<button class="sp-item" data-id="' + s.id + '">' +
      '<span class="sp-dot" style="background:' + s.color + '"></span>' +
      '<span class="sp-name">' + s.name + '</span>' +
      '<span class="sp-latin">' + s.latin + '</span>' +
      '</button>';
  });
  this.el.list.innerHTML = html;
  this.el.list.querySelectorAll('.sp-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      self.focusSpecies(btn.getAttribute('data-id'));
    });
  });
};

// 聚焦到某物種：挑最靠近畫面中心的一隻
MW.UI.prototype.focusSpecies = function (id) {
  var cam = this.camera;
  var best = null, bestD = Infinity;
  this.world.organisms.forEach(function (o) {
    if (o.id !== id) return;
    var dx = o.x - cam.x, dy = o.y - cam.y;
    var d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = o; }
  });
  if (best) this.select(best);
};

/* ---------------- 選取 / 資訊面板 ---------------- */
MW.UI.prototype.select = function (org) {
  this.selected = org;
  this.camera.follow(org);
  this.renderInfo(org);
  this.el.list.querySelectorAll('.sp-item').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-id') === org.id);
  });
};

MW.UI.prototype.renderInfo = function (org) {
  var s = org.species;
  var partsHtml = s.parts.map(function (p) {
    return '<li><b>' + p.name + '</b>：' + p.desc + '</li>';
  }).join('');
  var factsHtml = s.facts.map(function (f) { return '<li>' + f + '</li>'; }).join('');
  this.el.info.innerHTML =
    '<div class="info-head">' +
    '<h2>' + s.name + '</h2>' +
    '<div class="latin">' + s.latin + '</div>' +
    '<div class="tags"><span>' + s.group + '</span><span>' + s.kingdom + '</span></div>' +
    '</div>' +
    '<div class="info-row"><span class="k">典型大小</span><span class="v">約 ' + MW.UI.fmtSize(s.sizeUm) + '</span></div>' +
    '<div class="info-row"><span class="k">棲息地</span><span class="v">' + s.habitat + '</span></div>' +
    '<p class="summary">' + s.summary + '</p>' +
    '<p class="detail">' + s.detail + '</p>' +
    '<h3>構造（放大可見標註）</h3><ul class="parts">' + partsHtml + '</ul>' +
    '<h3>你知道嗎？</h3><ul class="facts">' + factsHtml + '</ul>';
  this.el.info.classList.add('visible');
};

MW.UI.fmtSize = function (um) {
  if (um >= 1000) return (um / 1000).toFixed(um >= 10000 ? 0 : 1) + ' 毫米';
  return um + ' 微米 (µm)';
};

MW.UI.prototype.showWelcome = function () {
  this.el.info.innerHTML =
    '<div class="welcome">' +
    '<h2>🔬 微生物的世界</h2>' +
    '<p>你正透過一台虛擬顯微鏡觀察一滴池水。</p>' +
    '<ul>' +
    '<li>🖱️ <b>滾輪</b>：拉近 / 拉遠（觀察細節到胞器）</li>' +
    '<li>✋ <b>拖曳</b>：平移視野</li>' +
    '<li>👆 <b>點擊生物</b>：鎖定並看教學解說</li>' +
    '<li>📖 左側<b>圖鑑</b>：直接跳到某種生物</li>' +
    '<li>🎬 <b>自動導覽</b>：依序參觀每種生物</li>' +
    '</ul>' +
    '<p class="tip">提示：先拉遠看整體生態，再拉近觀察單一細胞的構造。</p>' +
    '</div>';
  this.el.info.classList.add('visible');
};

/* ---------------- 輸入 ---------------- */
MW.UI.prototype.bindInput = function () {
  var self = this, cv = this.canvas, cam = this.camera;
  var dragging = false, lastX = 0, lastY = 0, moved = 0;

  cv.addEventListener('wheel', function (e) {
    e.preventDefault();
    var rect = cv.getBoundingClientRect();
    var factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    cam.zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
    self.stopTour();
  }, { passive: false });

  cv.addEventListener('mousedown', function (e) {
    dragging = true; moved = 0;
    lastX = e.clientX; lastY = e.clientY;
  });
  window.addEventListener('mousemove', function (e) {
    var rect = cv.getBoundingClientRect();
    if (dragging) {
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      cam.panBy(dx, dy);
      lastX = e.clientX; lastY = e.clientY;
      self.stopTour();
    } else {
      // hover 偵測
      var w = cam.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      self.hovered = self.world.pick(w.x, w.y);
      cv.style.cursor = self.hovered ? 'pointer' : 'grab';
    }
  });
  window.addEventListener('mouseup', function (e) {
    if (dragging && moved < 6) {
      var rect = cv.getBoundingClientRect();
      var w = cam.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      var hit = self.world.pick(w.x, w.y);
      if (hit) self.select(hit);
    }
    dragging = false;
  });

  // 觸控（單指平移，雙指縮放）
  var pinch = null;
  cv.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) { lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; moved = 0; }
    else if (e.touches.length === 2) pinch = self.touchDist(e);
  }, { passive: false });
  cv.addEventListener('touchmove', function (e) {
    e.preventDefault();
    var rect = cv.getBoundingClientRect();
    if (e.touches.length === 1) {
      var dx = e.touches[0].clientX - lastX, dy = e.touches[0].clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      cam.panBy(dx, dy);
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2 && pinch) {
      var d = self.touchDist(e);
      var mid = self.touchMid(e, rect);
      cam.zoomAt(mid.x, mid.y, d / pinch);
      pinch = d;
    }
    self.stopTour();
  }, { passive: false });
  cv.addEventListener('touchend', function (e) {
    if (moved < 8 && e.changedTouches.length) {
      var rect = cv.getBoundingClientRect();
      var w = cam.screenToWorld(e.changedTouches[0].clientX - rect.left, e.changedTouches[0].clientY - rect.top);
      var hit = self.world.pick(w.x, w.y);
      if (hit) self.select(hit);
    }
    pinch = null;
  });

  // 按鈕
  document.getElementById('zoomIn').addEventListener('click', function () {
    cam.zoomAt(cv.width / 2, cv.height / 2, 1.35); self.stopTour();
  });
  document.getElementById('zoomOut').addEventListener('click', function () {
    cam.zoomAt(cv.width / 2, cv.height / 2, 1 / 1.35); self.stopTour();
  });
  document.getElementById('resetBtn').addEventListener('click', function () {
    cam.following = null; cam.tx = MW.config.worldWidthUm / 2; cam.ty = MW.config.worldHeightUm / 2;
    cam.tzoom = MW.config.startZoom; self.selected = null; self.showWelcome(); self.stopTour();
  });
  this.el.labelBtn.addEventListener('click', function () {
    self.world.showLabels = !self.world.showLabels;
    self.el.labelBtn.classList.toggle('on', self.world.showLabels);
  });
  this.el.tourBtn.addEventListener('click', function () { self.toggleTour(); });

  // 鍵盤
  window.addEventListener('keydown', function (e) {
    if (e.key === '+' || e.key === '=') cam.zoomAt(cv.width / 2, cv.height / 2, 1.2);
    if (e.key === '-') cam.zoomAt(cv.width / 2, cv.height / 2, 1 / 1.2);
    if (e.key === 'l' || e.key === 'L') self.el.labelBtn.click();
    if (e.key === 't' || e.key === 'T') self.toggleTour();
    if (e.key === 'Escape') { self.selected = null; self.showWelcome(); }
  });
};

MW.UI.prototype.touchDist = function (e) {
  var dx = e.touches[0].clientX - e.touches[1].clientX;
  var dy = e.touches[0].clientY - e.touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
};
MW.UI.prototype.touchMid = function (e, rect) {
  return {
    x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left,
    y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top,
  };
};

/* ---------------- 自動導覽 ---------------- */
MW.UI.prototype.toggleTour = function () {
  if (this.tour.active) this.stopTour();
  else { this.tour.active = true; this.tour.index = -1; this.tour.timer = 0; this.el.tourBtn.classList.add('on'); }
};
MW.UI.prototype.stopTour = function () {
  if (!this.tour.active) return;
  this.tour.active = false;
  this.el.tourBtn.classList.remove('on');
};
MW.UI.prototype.updateTour = function (dt) {
  if (!this.tour.active) return;
  this.tour.timer -= dt;
  if (this.tour.timer <= 0) {
    this.tour.index = (this.tour.index + 1) % MW.SPECIES.length;
    this.focusSpecies(MW.SPECIES[this.tour.index].id);
    this.tour.timer = 7;   // 每種停留 7 秒
  }
};

/* ---------------- HUD 更新（每幀） ---------------- */
MW.UI.prototype.updateHUD = function () {
  var cam = this.camera;
  this.el.mag.textContent = MW.UI.fmtMag(cam.magnification());
  var fov = cam.fieldOfViewUm();
  this.el.fov.textContent = '視野 ' + MW.UI.fmtSize(Math.round(fov));
  // 深度描述
  var label;
  if (cam.zoom < 0.3) label = '一滴池水（生態全景）';
  else if (cam.zoom < 1) label = '群落尺度';
  else if (cam.zoom < 5) label = '單一生物';
  else if (cam.zoom < 14) label = '細胞構造';
  else label = '胞器 / 細菌尺度';
  this.el.depthLabel.textContent = label;
};

MW.UI.fmtMag = function (m) {
  if (m >= 1000) return '×' + (m / 1000).toFixed(1) + 'k';
  return '×' + m;
};
