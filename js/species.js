/* =============================================================
 * species.js —— 各物種的擬真繪製
 * -------------------------------------------------------------
 * 每個 draw 函式都在「局部微米座標」作畫：
 *   - 原點 = 生物中心
 *   - +X 方向 = 生物前進 / 長軸方向
 *   - 單位 = 微米 (µm)，相機的縮放與旋轉已由 renderer 套用
 * 因此線寬、半徑都用微米，會隨縮放自然變化（越近越清楚）。
 *
 * 參數：
 *   ctx  ：畫布 context（已 translate/scale/rotate 到生物本地座標）
 *   org  ：Organism 實例（含 seed、phase 等）
 *   t    ：全域時間（秒），用於動畫
 *
 * 每個 draw 也可回傳器官錨點座標（本地微米），供標籤引線使用：
 *   org.partAnchors = { key: {x,y}, ... }
 * ============================================================= */
window.MW = window.MW || {};

MW.draw = {};

/* 小工具：由種子產生穩定亂數 0..1 */
function rnd(seed) {
  var s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/* ---------------- 草履蟲 ---------------- */
MW.draw.paramecium = function (ctx, org, t) {
  var L = 250, W = 92;               // 長、寬（微米）
  var anchors = {};

  // 身體：鞋底狀（前端寬、後端略尖）
  ctx.beginPath();
  ctx.moveTo(-L / 2, 6);
  ctx.bezierCurveTo(-L * 0.3, -W / 2, L * 0.15, -W / 2, L / 2, -6);
  ctx.bezierCurveTo(L * 0.42, W / 2 - 4, -L * 0.2, W / 2, -L / 2, 6);
  ctx.closePath();

  var grad = ctx.createLinearGradient(0, -W / 2, 0, W / 2);
  grad.addColorStop(0, 'rgba(210,240,220,0.55)');
  grad.addColorStop(0.5, 'rgba(150,205,175,0.42)');
  grad.addColorStop(1, 'rgba(110,170,140,0.5)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = 'rgba(90,150,120,0.75)';
  ctx.stroke();

  // 纖毛：沿輪廓密佈短毛，隨時間擺動
  ctx.save();
  ctx.strokeStyle = 'rgba(180,225,200,0.7)';
  ctx.lineWidth = 1.1;
  var n = 46;
  for (var i = 0; i < n; i++) {
    var a = (i / n) * Math.PI * 2;
    var ex = Math.cos(a) * (L / 2 - 8);
    var ey = Math.sin(a) * (W / 2 - 4);
    var beat = Math.sin(t * 9 + i * 0.9 + org.phase) * 4;
    var nx = Math.cos(a), ny = Math.sin(a);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex + nx * 9 + ny * beat, ey + ny * 9 - nx * beat);
    ctx.stroke();
  }
  ctx.restore();

  // 口溝：從前端斜向中央的凹槽
  ctx.beginPath();
  ctx.moveTo(L * 0.30, -14);
  ctx.quadraticCurveTo(L * 0.05, 6, -L * 0.05, 20);
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(70,120,95,0.35)';
  ctx.stroke();
  anchors.oralGroove = { x: L * 0.12, y: 4 };

  // 大核
  ctx.beginPath();
  ctx.ellipse(-6, 0, 26, 16, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(120,90,70,0.45)';
  ctx.fill();
  anchors.macronucleus = { x: -6, y: 0 };

  // 兩個伸縮泡（週期收縮）
  var pulse = (Math.sin(t * 2 + org.phase) * 0.5 + 0.5);
  [[-L * 0.28, -20], [L * 0.28, 18]].forEach(function (p, idx) {
    var r = 10 + pulse * (idx === 0 ? 6 : -0) + (idx ? (1 - pulse) * 6 : 0);
    ctx.beginPath();
    ctx.arc(p[0], p[1], Math.max(4, r), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // 放射狀收集管
    for (var k = 0; k < 6; k++) {
      var aa = k / 6 * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(p[0] + Math.cos(aa) * r, p[1] + Math.sin(aa) * r);
      ctx.lineTo(p[0] + Math.cos(aa) * (r + 7), p[1] + Math.sin(aa) * (r + 7));
      ctx.stroke();
    }
  });
  anchors.vacuole = { x: -L * 0.28, y: -20 };

  // 食物泡：幾顆內含物
  for (var f = 0; f < 5; f++) {
    var fx = (rnd(org.seed + f) - 0.5) * L * 0.5;
    var fy = (rnd(org.seed + f * 3) - 0.5) * W * 0.5;
    ctx.beginPath();
    ctx.arc(fx, fy, 5 + rnd(org.seed + f) * 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(90,140,110,0.35)';
    ctx.fill();
  }
  anchors.foodVacuole = { x: L * 0.2, y: -10 };
  anchors.cilia = { x: 0, y: -W / 2 };
  org.partAnchors = anchors;
};

/* ---------------- 變形蟲 ---------------- */
MW.draw.amoeba = function (ctx, org, t) {
  var R = 150;
  var anchors = {};
  var lobes = 9;
  // 動態偽足輪廓
  ctx.beginPath();
  for (var i = 0; i <= lobes; i++) {
    var a = (i / lobes) * Math.PI * 2;
    var ext = 1 + 0.5 * Math.sin(t * 0.8 + i * 1.7 + org.phase) + 0.3 * rnd(org.seed + i);
    var rr = R * (0.7 + 0.5 * ext * (0.5 + rnd(org.seed + i * 2)));
    var px = Math.cos(a) * rr;
    var py = Math.sin(a) * rr * 0.8;
    if (i === 0) ctx.moveTo(px, py);
    else {
      var pa = ((i - 0.5) / lobes) * Math.PI * 2;
      ctx.quadraticCurveTo(Math.cos(pa) * rr * 1.15, Math.sin(pa) * rr * 0.95, px, py);
    }
  }
  ctx.closePath();
  var g = ctx.createRadialGradient(0, 0, 20, 0, 0, R * 1.3);
  g.addColorStop(0, 'rgba(235,225,195,0.5)');
  g.addColorStop(0.7, 'rgba(215,200,160,0.4)');
  g.addColorStop(1, 'rgba(200,185,150,0.28)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(160,145,110,0.6)';
  ctx.stroke();
  anchors.pseudopod = { x: R * 0.95, y: 0 };
  anchors.ectoplasm = { x: -R * 0.7, y: -R * 0.3 };

  // 內質顆粒
  for (var p = 0; p < 40; p++) {
    var gx = (rnd(org.seed + p) - 0.5) * R * 1.4;
    var gy = (rnd(org.seed + p * 5) - 0.5) * R * 1.1;
    if (gx * gx + gy * gy > R * R) continue;
    ctx.beginPath();
    ctx.arc(gx, gy, 2 + rnd(org.seed + p) * 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(150,130,95,0.35)';
    ctx.fill();
  }

  // 細胞核
  ctx.beginPath();
  ctx.ellipse(-20, 10, 30, 22, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(120,95,70,0.4)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(100,80,60,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  anchors.nucleus = { x: -20, y: 10 };

  // 伸縮泡
  var pr = 16 + Math.sin(t * 1.5 + org.phase) * 6;
  ctx.beginPath();
  ctx.arc(40, -30, Math.max(6, pr), 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  anchors.vacuole = { x: 40, y: -30 };
  org.partAnchors = anchors;
};

/* ---------------- 眼蟲（裸藻） ---------------- */
MW.draw.euglena = function (ctx, org, t) {
  var L = 90, W = 26;
  var anchors = {};
  var wob = Math.sin(t * 3 + org.phase) * 3;    // 眼蟲式扭動
  ctx.beginPath();
  ctx.moveTo(-L / 2, 0);
  ctx.quadraticCurveTo(-L * 0.1, -W / 2 + wob, L * 0.35, -W / 2 + 4);
  ctx.quadraticCurveTo(L / 2, 0, L * 0.35, W / 2 - 4);
  ctx.quadraticCurveTo(-L * 0.1, W / 2 + wob, -L / 2, 0);
  ctx.closePath();
  var g = ctx.createLinearGradient(0, -W / 2, 0, W / 2);
  g.addColorStop(0, 'rgba(150,220,120,0.7)');
  g.addColorStop(1, 'rgba(70,160,70,0.6)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,140,60,0.8)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // 葉綠體：數個綠盤
  for (var c = 0; c < 6; c++) {
    var cx = -L * 0.3 + c * (L * 0.11);
    var cy = (rnd(org.seed + c) - 0.5) * W * 0.6;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 6, 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(40,130,45,0.75)';
    ctx.fill();
  }
  anchors.chloroplast = { x: 0, y: 0 };

  // 細胞核
  ctx.beginPath();
  ctx.arc(-L * 0.18, 0, 7, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(200,235,190,0.6)';
  ctx.fill();
  anchors.nucleus = { x: -L * 0.18, y: 0 };

  // 眼點（前端紅點）
  ctx.beginPath();
  ctx.arc(L * 0.34, -5, 3.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(220,60,40,0.95)';
  ctx.fill();
  anchors.eyespot = { x: L * 0.34, y: -5 };

  // 鞭毛：前端波動長鞭
  ctx.beginPath();
  ctx.moveTo(L * 0.45, 0);
  for (var s = 0; s <= 20; s++) {
    var u = s / 20;
    var fx = L * 0.45 + u * L * 0.9;
    var fy = Math.sin(u * 10 - t * 12 + org.phase) * (6 * u);
    ctx.lineTo(fx, fy);
  }
  ctx.strokeStyle = 'rgba(120,200,120,0.85)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  anchors.flagellum = { x: L * 0.9, y: 0 };
  org.partAnchors = anchors;
};

/* ---------------- 球菌（葡萄狀小群） ---------------- */
MW.draw.coccus = function (ctx, org, t) {
  var r = 3.2;
  var count = 4 + Math.floor(rnd(org.seed) * 4);
  var anchors = {};
  for (var i = 0; i < count; i++) {
    var a = i * 2.4 + org.seed;
    var dist = r * (0.9 + rnd(org.seed + i));
    var cx = Math.cos(a) * dist;
    var cy = Math.sin(a) * dist;
    var g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0.5, cx, cy, r);
    g.addColorStop(0, 'rgba(210,225,255,0.95)');
    g.addColorStop(1, 'rgba(120,150,230,0.8)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,110,200,0.7)';
    ctx.lineWidth = 0.4;
    ctx.stroke();
  }
  anchors.wall = { x: r, y: -r };
  anchors.nucleoid = { x: 0, y: 0 };
  org.partAnchors = anchors;
};

/* ---------------- 桿菌 ---------------- */
MW.draw.bacillus = function (ctx, org, t) {
  var L = 8, W = 3;
  var anchors = {};
  // 尾端鞭毛
  ctx.beginPath();
  ctx.moveTo(-L / 2, 0);
  for (var s = 0; s <= 16; s++) {
    var u = s / 16;
    var fx = -L / 2 - u * L * 1.6;
    var fy = Math.sin(u * 9 - t * 14 + org.phase) * 2.4 * u;
    ctx.lineTo(fx, fy);
  }
  ctx.strokeStyle = 'rgba(150,200,240,0.8)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // 棒狀身體（圓角）
  var rc = W / 2;
  ctx.beginPath();
  ctx.moveTo(-L / 2 + rc, -W / 2);
  ctx.lineTo(L / 2 - rc, -W / 2);
  ctx.arc(L / 2 - rc, 0, rc, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(-L / 2 + rc, W / 2);
  ctx.arc(-L / 2 + rc, 0, rc, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  var g = ctx.createLinearGradient(0, -W / 2, 0, W / 2);
  g.addColorStop(0, 'rgba(200,230,255,0.95)');
  g.addColorStop(1, 'rgba(130,180,230,0.85)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(90,140,200,0.75)';
  ctx.lineWidth = 0.4;
  ctx.stroke();
  // 擬核
  ctx.beginPath();
  ctx.ellipse(0, 0, L * 0.22, W * 0.22, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(80,120,180,0.4)';
  ctx.fill();
  anchors.wall = { x: 0, y: -W / 2 };
  anchors.flagellum = { x: -L, y: 0 };
  anchors.nucleoid = { x: 0, y: 0 };
  org.partAnchors = anchors;
};

/* ---------------- 螺旋菌 ---------------- */
MW.draw.spirillum = function (ctx, org, t) {
  var L = 26, amp = 4, turns = 3;
  var anchors = {};
  ctx.beginPath();
  for (var s = 0; s <= 40; s++) {
    var u = s / 40;
    var x = -L / 2 + u * L;
    var y = Math.sin(u * Math.PI * 2 * turns + t * 2 + org.phase) * amp;
    if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(140,205,225,0.9)';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.stroke();
  // 端生鞭毛
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = 'rgba(150,210,225,0.7)';
  [-1, 1].forEach(function (dir) {
    ctx.beginPath();
    var bx = dir * L / 2;
    ctx.moveTo(bx, 0);
    for (var k = 0; k <= 12; k++) {
      var u = k / 12;
      ctx.lineTo(bx + dir * u * 10, Math.sin(u * 8 - t * 16) * 2 * u);
    }
    ctx.stroke();
  });
  anchors.body = { x: 0, y: 0 };
  anchors.flagella = { x: L / 2 + 6, y: 0 };
  org.partAnchors = anchors;
};

/* ---------------- 矽藻（羽紋狀） ---------------- */
MW.draw.diatom = function (ctx, org, t) {
  var L = 60, W = 22;
  var anchors = {};
  // 玻璃質外殼：舟形
  ctx.beginPath();
  ctx.moveTo(-L / 2, 0);
  ctx.quadraticCurveTo(0, -W / 2, L / 2, 0);
  ctx.quadraticCurveTo(0, W / 2, -L / 2, 0);
  ctx.closePath();
  var g = ctx.createLinearGradient(0, -W / 2, 0, W / 2);
  g.addColorStop(0, 'rgba(225,215,160,0.55)');
  g.addColorStop(0.5, 'rgba(200,180,110,0.4)');
  g.addColorStop(1, 'rgba(225,215,160,0.55)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(180,150,80,0.85)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // 中線（縫）
  ctx.beginPath();
  ctx.moveTo(-L / 2 + 4, 0);
  ctx.lineTo(L / 2 - 4, 0);
  ctx.strokeStyle = 'rgba(150,120,60,0.7)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // 花紋孔（striae）：對稱橫紋
  ctx.strokeStyle = 'rgba(160,130,70,0.55)';
  ctx.lineWidth = 0.5;
  for (var i = 1; i < 18; i++) {
    var x = -L / 2 + (i / 18) * L;
    var h = (W / 2) * (1 - Math.pow((x) / (L / 2), 2));
    ctx.beginPath();
    ctx.moveTo(x, -h);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  // 葉綠體
  ctx.beginPath();
  ctx.ellipse(-L * 0.18, 0, 10, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(L * 0.18, 0, 10, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(150,120,40,0.5)';
  ctx.fill();
  anchors.frustule = { x: 0, y: -W / 2 };
  anchors.striae = { x: L * 0.3, y: -W * 0.3 };
  anchors.chloroplast = { x: -L * 0.18, y: 0 };
  org.partAnchors = anchors;
};

/* ---------------- 團藻 ---------------- */
MW.draw.volvox = function (ctx, org, t) {
  var R = 200;
  var anchors = {};
  // 膠質大球
  var g = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R);
  g.addColorStop(0, 'rgba(220,255,220,0.25)');
  g.addColorStop(0.75, 'rgba(150,220,150,0.16)');
  g.addColorStop(1, 'rgba(120,200,120,0.30)');
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(110,190,110,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // 表面細胞（點陣）
  for (var i = 0; i < 120; i++) {
    var a = rnd(org.seed + i) * Math.PI * 2;
    var rr = R * (0.86 + rnd(org.seed + i * 2) * 0.14);
    var cx = Math.cos(a) * rr;
    var cy = Math.sin(a) * rr;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(60,160,70,0.85)';
    ctx.fill();
    // 鞭毛微動
    var beat = Math.sin(t * 8 + i + org.phase) * 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 6 + beat * 0.3, cy + Math.sin(a) * 6);
    ctx.strokeStyle = 'rgba(120,210,120,0.5)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  // 子群體
  [[-R * 0.3, R * 0.2, R * 0.28], [R * 0.35, -R * 0.15, R * 0.22], [R * 0.1, R * 0.4, R * 0.18]]
    .forEach(function (d) {
      ctx.beginPath();
      ctx.arc(d[0], d[1], d[2], 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(90,190,100,0.28)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(70,170,80,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      for (var k = 0; k < 16; k++) {
        var aa = k / 16 * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(d[0] + Math.cos(aa) * d[2] * 0.85, d[1] + Math.sin(aa) * d[2] * 0.85, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(60,160,70,0.8)';
        ctx.fill();
      }
    });
  anchors.sphere = { x: 0, y: -R };
  anchors.cells = { x: R * 0.7, y: -R * 0.5 };
  anchors.daughter = { x: -R * 0.3, y: R * 0.2 };
  org.partAnchors = anchors;
};

/* ---------------- 輪蟲 ---------------- */
MW.draw.rotifer = function (ctx, org, t) {
  var L = 200, W = 70;
  var anchors = {};
  // 身體：喇叭/花瓶狀（頭在 +X）
  ctx.beginPath();
  ctx.moveTo(L * 0.5, -W * 0.5);
  ctx.quadraticCurveTo(L * 0.1, -W * 0.5, -L * 0.1, -W * 0.25);
  ctx.quadraticCurveTo(-L * 0.45, -W * 0.12, -L * 0.5, 0);   // 尾
  ctx.quadraticCurveTo(-L * 0.45, W * 0.12, -L * 0.1, W * 0.25);
  ctx.quadraticCurveTo(L * 0.1, W * 0.5, L * 0.5, W * 0.5);
  ctx.quadraticCurveTo(L * 0.35, 0, L * 0.5, -W * 0.5);
  ctx.closePath();
  var g = ctx.createLinearGradient(0, -W / 2, 0, W / 2);
  g.addColorStop(0, 'rgba(250,225,200,0.55)');
  g.addColorStop(1, 'rgba(225,190,150,0.5)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,160,120,0.75)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 纖毛冠（頭端兩葉，擺動）
  ctx.strokeStyle = 'rgba(255,235,210,0.85)';
  ctx.lineWidth = 1.2;
  [-1, 1].forEach(function (sgn) {
    for (var i = 0; i < 14; i++) {
      var u = i / 14;
      var bx = L * 0.5;
      var by = sgn * (W * 0.5) * (0.2 + u * 0.9);
      var beat = Math.sin(t * 10 + i + org.phase) * 5;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + 14 + beat, by + sgn * 4);
      ctx.stroke();
    }
  });
  anchors.corona = { x: L * 0.55, y: 0 };

  // 咀嚼囊
  ctx.beginPath();
  ctx.arc(L * 0.2, 0, 12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(150,110,80,0.5)';
  ctx.fill();
  anchors.mastax = { x: L * 0.2, y: 0 };

  // 趾（尾端兩趾）
  ctx.strokeStyle = 'rgba(200,160,120,0.8)';
  ctx.lineWidth = 3;
  [-1, 1].forEach(function (sgn) {
    ctx.beginPath();
    ctx.moveTo(-L * 0.5, 0);
    ctx.lineTo(-L * 0.62, sgn * 10);
    ctx.stroke();
  });
  anchors.foot = { x: -L * 0.6, y: 0 };
  org.partAnchors = anchors;
};

/* ---------------- 水綿（絲狀） ---------------- */
MW.draw.spirogyra = function (ctx, org, t) {
  var cellL = 120, W = 60, cells = 5;
  var totalL = cellL * cells;
  var anchors = {};
  ctx.save();
  ctx.translate(-totalL / 2, 0);
  for (var c = 0; c < cells; c++) {
    var x0 = c * cellL;
    // 細胞壁（長方形）
    ctx.beginPath();
    ctx.rect(x0, -W / 2, cellL, W);
    ctx.fillStyle = 'rgba(200,240,200,0.30)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,170,90,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // 螺旋帶狀葉綠體
    ctx.beginPath();
    for (var s = 0; s <= 40; s++) {
      var u = s / 40;
      var px = x0 + u * cellL;
      var py = Math.sin(u * Math.PI * 4 + org.phase) * (W * 0.32);
      if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(45,150,50,0.85)';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.stroke();
    // 細胞核（中央）
    ctx.beginPath();
    ctx.arc(x0 + cellL / 2, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(210,240,205,0.7)';
    ctx.fill();
  }
  ctx.restore();
  anchors.chloroplast = { x: -totalL / 2 + cellL * 0.5, y: -W * 0.2 };
  anchors.wall = { x: 0, y: -W / 2 };
  anchors.nucleus = { x: cellL / 2, y: 0 };
  org.partAnchors = anchors;
};
