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
 *
 * 寫實技巧（見檔案上方 helper）：
 *   - 細胞體用「徑向漸層」營造次表面透光的立體感
 *   - specular() 濕潤高光反射，讓細胞看起來有膜、有水感
 *   - cytoplasm() 灑細胞質顆粒，營造活體質感
 *   - 細胞膜用內外雙線描邊（外深、內亮）
 * ============================================================= */
window.MW = window.MW || {};

MW.draw = {};

/* 小工具：由種子產生穩定亂數 0..1 */
function rnd(seed) {
  var s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/* 濕潤高光：柔和的白色反光點，讓細胞看起來立體有膜 */
function specular(ctx, x, y, r, strength) {
  var g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, 'rgba(255,255,255,' + (strength || 0.55) + ')');
  g.addColorStop(0.5, 'rgba(255,255,255,' + (strength || 0.55) * 0.25 + ')');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
}

/* 細胞質顆粒：在橢圓範圍內灑大小不一的半透明小點 */
function cytoplasm(ctx, seed, rx, ry, count, color, maxR) {
  for (var i = 0; i < count; i++) {
    var a = rnd(seed + i) * Math.PI * 2;
    var rr = Math.sqrt(rnd(seed + i * 1.7)) * 0.92;
    var gx = Math.cos(a) * rx * rr;
    var gy = Math.sin(a) * ry * rr;
    var pr = 0.8 + rnd(seed + i * 3.1) * (maxR || 3);
    ctx.beginPath();
    ctx.arc(gx, gy, pr, 0, Math.PI * 2);
    ctx.fillStyle = color.replace('A', (0.12 + rnd(seed + i * 5) * 0.28).toFixed(2));
    ctx.fill();
  }
}

/* 細胞核：帶核仁與核膜的立體核 */
function nucleus(ctx, x, y, rx, ry, tint) {
  var g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 0, x, y, rx);
  g.addColorStop(0, tint.light);
  g.addColorStop(1, tint.dark);
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = tint.edge;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // 核仁
  ctx.beginPath();
  ctx.arc(x + rx * 0.2, y + ry * 0.15, Math.min(rx, ry) * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = tint.nucleolus;
  ctx.fill();
}

/* ---------------- 草履蟲 ---------------- */
MW.draw.paramecium = function (ctx, org, t) {
  var L = 250, W = 92;               // 長、寬（微米）
  var anchors = {};

  // 身體輪廓：鞋底狀（前端寬、後端略尖），供多層填色共用
  function bodyPath() {
    ctx.beginPath();
    ctx.moveTo(-L / 2, 6);
    ctx.bezierCurveTo(-L * 0.3, -W / 2, L * 0.15, -W / 2, L / 2, -6);
    ctx.bezierCurveTo(L * 0.42, W / 2 - 4, -L * 0.2, W / 2, -L / 2, 6);
    ctx.closePath();
  }

  // 外圈柔光暈（細胞膜的散射感）
  bodyPath();
  ctx.save();
  ctx.shadowColor = 'rgba(150,220,180,0.5)';
  ctx.shadowBlur = 14;
  ctx.fillStyle = 'rgba(150,220,180,0.10)';
  ctx.fill();
  ctx.restore();

  // 主體：徑向漸層（中央透亮、邊緣濃）
  bodyPath();
  var grad = ctx.createRadialGradient(-20, -10, 10, 0, 0, L * 0.55);
  grad.addColorStop(0, 'rgba(224,248,232,0.60)');
  grad.addColorStop(0.55, 'rgba(168,222,190,0.48)');
  grad.addColorStop(1, 'rgba(104,168,138,0.55)');
  ctx.fillStyle = grad;
  ctx.fill();

  // 細胞質顆粒
  ctx.save();
  bodyPath();
  ctx.clip();
  cytoplasm(ctx, org.seed, L * 0.44, W * 0.42, 60, 'rgba(96,150,118,A)', 3.5);

  // 表膜斜格紋（pellicle，草履蟲的招牌紋理）
  ctx.strokeStyle = 'rgba(120,180,150,0.18)';
  ctx.lineWidth = 0.6;
  for (var d = -L; d < L; d += 11) {
    ctx.beginPath();
    ctx.moveTo(d, -W); ctx.lineTo(d + W * 1.4, W);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(d, W); ctx.lineTo(d + W * 1.4, -W);
    ctx.stroke();
  }
  ctx.restore();

  // 膜：內外雙線
  bodyPath();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = 'rgba(78,140,110,0.8)';
  ctx.stroke();
  bodyPath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(210,245,225,0.5)';
  ctx.stroke();

  // 濕潤高光
  specular(ctx, -L * 0.22, -W * 0.22, 46, 0.4);

  // 纖毛：兩層（底層密短 + 動態擺動），沿輪廓
  ctx.save();
  var n = 58;
  for (var i = 0; i < n; i++) {
    var a = (i / n) * Math.PI * 2;
    var ex = Math.cos(a) * (L / 2 - 6);
    var ey = Math.sin(a) * (W / 2 - 3);
    var nx = Math.cos(a), ny = Math.sin(a);
    var beat = Math.sin(t * 10 + i * 0.7 + org.phase) * 4.5;
    var len = 8 + Math.abs(Math.sin(t * 10 + i * 0.7 + org.phase)) * 3;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.quadraticCurveTo(
      ex + nx * len * 0.6 + ny * beat * 0.6, ey + ny * len * 0.6 - nx * beat * 0.6,
      ex + nx * len + ny * beat, ey + ny * len - nx * beat);
    ctx.strokeStyle = 'rgba(196,236,214,0.7)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
  ctx.restore();

  // 口溝：凹槽 + 陰影
  ctx.beginPath();
  ctx.moveTo(L * 0.30, -14);
  ctx.quadraticCurveTo(L * 0.05, 6, -L * 0.05, 22);
  ctx.lineWidth = 11;
  ctx.strokeStyle = 'rgba(60,110,86,0.30)';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(40,86,64,0.35)';
  ctx.stroke();
  anchors.oralGroove = { x: L * 0.12, y: 6 };

  // 大核（立體）
  nucleus(ctx, -6, 0, 28, 17, {
    light: 'rgba(196,150,120,0.62)', dark: 'rgba(120,84,62,0.5)',
    edge: 'rgba(96,64,46,0.5)', nucleolus: 'rgba(90,58,42,0.55)'
  });
  anchors.macronucleus = { x: -6, y: 0 };

  // 兩個伸縮泡（週期收縮 + 星狀收集管 + 透亮）
  var pulse = (Math.sin(t * 2 + org.phase) * 0.5 + 0.5);
  [[-L * 0.28, -20, 0], [L * 0.28, 18, Math.PI]].forEach(function (p) {
    var r = 8 + (0.5 + 0.5 * Math.sin(t * 2 + org.phase + p[2])) * 8;
    var vg = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
    vg.addColorStop(0, 'rgba(235,255,248,0.5)');
    vg.addColorStop(1, 'rgba(200,240,225,0.05)');
    ctx.beginPath();
    ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
    ctx.fillStyle = vg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    for (var k = 0; k < 7; k++) {
      var aa = k / 7 * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(p[0] + Math.cos(aa) * r, p[1] + Math.sin(aa) * r);
      ctx.lineTo(p[0] + Math.cos(aa) * (r + 8), p[1] + Math.sin(aa) * (r + 8));
      ctx.strokeStyle = 'rgba(220,250,240,0.35)';
      ctx.stroke();
    }
  });
  anchors.vacuole = { x: -L * 0.28, y: -20 };

  // 食物泡：立體小球
  for (var f = 0; f < 6; f++) {
    var fx = (rnd(org.seed + f) - 0.5) * L * 0.5;
    var fy = (rnd(org.seed + f * 3) - 0.5) * W * 0.5;
    var fr = 5 + rnd(org.seed + f) * 5;
    var fg = ctx.createRadialGradient(fx - fr * 0.3, fy - fr * 0.3, 0, fx, fy, fr);
    fg.addColorStop(0, 'rgba(120,170,140,0.5)');
    fg.addColorStop(1, 'rgba(70,120,92,0.35)');
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fillStyle = fg;
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
  function bodyPath() {
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
  }

  // 柔光暈
  bodyPath();
  ctx.save();
  ctx.shadowColor = 'rgba(220,205,160,0.5)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = 'rgba(220,205,160,0.10)';
  ctx.fill();
  ctx.restore();

  // 外質（透明外層）
  bodyPath();
  var g = ctx.createRadialGradient(-20, -20, 20, 0, 0, R * 1.35);
  g.addColorStop(0, 'rgba(244,236,208,0.5)');
  g.addColorStop(0.55, 'rgba(224,210,170,0.42)');
  g.addColorStop(1, 'rgba(202,188,150,0.22)');
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  bodyPath();
  ctx.clip();
  // 內質（顆粒濃密的內層）
  ctx.beginPath();
  ctx.ellipse(-10, 6, R * 0.72, R * 0.6, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(206,184,138,0.28)';
  ctx.fill();
  cytoplasm(ctx, org.seed, R * 0.8, R * 0.66, 70, 'rgba(150,126,86,A)', 4);
  // 流動紋（細胞質流）
  ctx.strokeStyle = 'rgba(180,158,112,0.15)';
  ctx.lineWidth = 2;
  for (var s = 0; s < 4; s++) {
    ctx.beginPath();
    var yy = -R * 0.4 + s * R * 0.28;
    ctx.moveTo(-R, yy);
    ctx.quadraticCurveTo(0, yy + Math.sin(t + s) * 20, R, yy);
    ctx.stroke();
  }
  ctx.restore();

  // 膜：雙線
  bodyPath();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = 'rgba(168,150,110,0.7)';
  ctx.stroke();
  bodyPath();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = 'rgba(248,240,210,0.4)';
  ctx.stroke();

  specular(ctx, -R * 0.35, -R * 0.35, R * 0.5, 0.28);
  anchors.pseudopod = { x: R * 0.95, y: 0 };
  anchors.ectoplasm = { x: -R * 0.7, y: -R * 0.3 };

  // 細胞核（立體）
  nucleus(ctx, -20, 10, 30, 22, {
    light: 'rgba(200,160,128,0.62)', dark: 'rgba(122,96,70,0.5)',
    edge: 'rgba(100,80,60,0.55)', nucleolus: 'rgba(94,70,50,0.55)'
  });
  anchors.nucleus = { x: -20, y: 10 };

  // 伸縮泡
  var pr = 14 + Math.sin(t * 1.5 + org.phase) * 7;
  var vg = ctx.createRadialGradient(40, -30, 0, 40, -30, Math.max(6, pr));
  vg.addColorStop(0, 'rgba(245,255,252,0.5)');
  vg.addColorStop(1, 'rgba(220,240,232,0.04)');
  ctx.beginPath();
  ctx.arc(40, -30, Math.max(6, pr), 0, Math.PI * 2);
  ctx.fillStyle = vg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  anchors.vacuole = { x: 40, y: -30 };
  org.partAnchors = anchors;
};

/* ---------------- 眼蟲（裸藻） ---------------- */
MW.draw.euglena = function (ctx, org, t) {
  var L = 100, W = 30;
  var anchors = {};
  var wob = Math.sin(t * 3 + org.phase) * 3;    // 眼蟲式扭動
  function bodyPath() {
    ctx.beginPath();
    ctx.moveTo(-L / 2, 0);
    ctx.quadraticCurveTo(-L * 0.1, -W / 2 + wob, L * 0.32, -W / 2 + 4);
    ctx.quadraticCurveTo(L / 2, 0, L * 0.32, W / 2 - 4);
    ctx.quadraticCurveTo(-L * 0.1, W / 2 + wob, -L / 2, 0);
    ctx.closePath();
  }
  // 柔光暈
  bodyPath();
  ctx.save();
  ctx.shadowColor = 'rgba(120,220,110,0.6)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = 'rgba(120,220,110,0.12)';
  ctx.fill();
  ctx.restore();

  bodyPath();
  var g = ctx.createRadialGradient(-8, -6, 4, 0, 0, L * 0.5);
  g.addColorStop(0, 'rgba(180,240,150,0.75)');
  g.addColorStop(0.6, 'rgba(120,200,100,0.66)');
  g.addColorStop(1, 'rgba(64,150,64,0.6)');
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  bodyPath();
  ctx.clip();
  // 螺旋表膜紋
  ctx.strokeStyle = 'rgba(70,150,66,0.3)';
  ctx.lineWidth = 0.7;
  for (var st = -L / 2; st < L / 2; st += 6) {
    ctx.beginPath();
    ctx.moveTo(st, -W); ctx.lineTo(st + 10, W);
    ctx.stroke();
  }
  // 葉綠體：立體綠盤
  for (var c = 0; c < 7; c++) {
    var cx = -L * 0.3 + c * (L * 0.095);
    var cy = (rnd(org.seed + c) - 0.5) * W * 0.55;
    var cg = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, 7);
    cg.addColorStop(0, 'rgba(90,190,80,0.85)');
    cg.addColorStop(1, 'rgba(30,120,40,0.8)');
    ctx.beginPath();
    ctx.ellipse(cx, cy, 6.5, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = cg;
    ctx.fill();
  }
  // 副澱粉粒（白色顆粒）
  for (var pp = 0; pp < 4; pp++) {
    ctx.beginPath();
    ctx.arc(-L * 0.1 + pp * 8, (rnd(org.seed + pp * 9) - 0.5) * W * 0.4, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(240,255,235,0.55)';
    ctx.fill();
  }
  ctx.restore();
  anchors.chloroplast = { x: 0, y: 0 };

  // 膜雙線
  bodyPath();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(56,140,58,0.8)';
  ctx.stroke();
  specular(ctx, -L * 0.15, -W * 0.2, 16, 0.4);

  // 細胞核
  nucleus(ctx, -L * 0.2, 0, 8, 8, {
    light: 'rgba(220,245,200,0.7)', dark: 'rgba(120,170,110,0.6)',
    edge: 'rgba(90,150,90,0.5)', nucleolus: 'rgba(80,140,80,0.6)'
  });
  anchors.nucleus = { x: -L * 0.2, y: 0 };

  // 眼點（前端紅點，帶暈）
  var eg = ctx.createRadialGradient(L * 0.33, -5, 0, L * 0.33, -5, 5);
  eg.addColorStop(0, 'rgba(255,90,60,1)');
  eg.addColorStop(1, 'rgba(200,40,30,0.2)');
  ctx.beginPath();
  ctx.arc(L * 0.33, -5, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = eg;
  ctx.fill();
  anchors.eyespot = { x: L * 0.33, y: -5 };

  // 鞭毛：前端波動長鞭（漸細）
  ctx.beginPath();
  ctx.moveTo(L * 0.45, 0);
  for (var s2 = 0; s2 <= 24; s2++) {
    var u = s2 / 24;
    var fx = L * 0.45 + u * L * 1.0;
    var fy = Math.sin(u * 11 - t * 13 + org.phase) * (7 * u);
    ctx.lineTo(fx, fy);
  }
  ctx.strokeStyle = 'rgba(150,220,140,0.9)';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.stroke();
  anchors.flagellum = { x: L * 1.0, y: 0 };
  org.partAnchors = anchors;
};

/* 細菌共用：立體膠囊感 + 高光 */
function bacteriaFill(ctx, pathFn, hiX, hiY, hiR, cLight, cDark) {
  pathFn();
  ctx.save();
  ctx.shadowColor = cLight;
  ctx.shadowBlur = 3;
  ctx.fillStyle = 'rgba(200,225,255,0.12)';
  ctx.fill();
  ctx.restore();
  pathFn();
  var g = ctx.createRadialGradient(hiX, hiY, 0, 0, 0, hiR);
  g.addColorStop(0, cLight);
  g.addColorStop(1, cDark);
  ctx.fillStyle = g;
  ctx.fill();
}

/* ---------------- 球菌（葡萄狀小群） ---------------- */
MW.draw.coccus = function (ctx, org, t) {
  var r = 3.4;
  var count = 4 + Math.floor(rnd(org.seed) * 4);
  var anchors = {};
  for (var i = 0; i < count; i++) {
    var a = i * 2.4 + org.seed;
    var dist = r * (0.9 + rnd(org.seed + i));
    var cx = Math.cos(a) * dist;
    var cy = Math.sin(a) * dist;
    // 柔暈
    ctx.save();
    ctx.shadowColor = 'rgba(150,180,255,0.6)';
    ctx.shadowBlur = 2;
    var g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 0.3, cx, cy, r);
    g.addColorStop(0, 'rgba(226,236,255,0.98)');
    g.addColorStop(0.7, 'rgba(150,178,240,0.9)');
    g.addColorStop(1, 'rgba(104,134,220,0.85)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(74,104,196,0.7)';
    ctx.lineWidth = 0.35;
    ctx.stroke();
    // 濕潤高光
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();
  }
  anchors.wall = { x: r, y: -r };
  anchors.nucleoid = { x: 0, y: 0 };
  org.partAnchors = anchors;
};

/* ---------------- 桿菌 ---------------- */
MW.draw.bacillus = function (ctx, org, t) {
  var L = 9, W = 3.4;
  var anchors = {};
  // 尾端鞭毛
  ctx.beginPath();
  ctx.moveTo(-L / 2, 0);
  for (var s = 0; s <= 18; s++) {
    var u = s / 18;
    var fx = -L / 2 - u * L * 1.7;
    var fy = Math.sin(u * 9 - t * 14 + org.phase) * 2.6 * u;
    ctx.lineTo(fx, fy);
  }
  ctx.strokeStyle = 'rgba(160,205,245,0.85)';
  ctx.lineWidth = 0.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  var rc = W / 2;
  function bodyPath() {
    ctx.beginPath();
    ctx.moveTo(-L / 2 + rc, -W / 2);
    ctx.lineTo(L / 2 - rc, -W / 2);
    ctx.arc(L / 2 - rc, 0, rc, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-L / 2 + rc, W / 2);
    ctx.arc(-L / 2 + rc, 0, rc, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
  }
  bacteriaFill(ctx, bodyPath, -L * 0.2, -W * 0.3, L * 0.6,
    'rgba(214,236,255,0.97)', 'rgba(120,172,226,0.86)');
  bodyPath();
  ctx.strokeStyle = 'rgba(84,134,196,0.75)';
  ctx.lineWidth = 0.35;
  ctx.stroke();
  // 擬核
  ctx.beginPath();
  ctx.ellipse(0, 0, L * 0.22, W * 0.24, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(74,114,176,0.4)';
  ctx.fill();
  // 高光
  ctx.beginPath();
  ctx.ellipse(-L * 0.1, -W * 0.22, L * 0.28, W * 0.16, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();
  anchors.wall = { x: 0, y: -W / 2 };
  anchors.flagellum = { x: -L, y: 0 };
  anchors.nucleoid = { x: 0, y: 0 };
  org.partAnchors = anchors;
};

/* ---------------- 螺旋菌 ---------------- */
MW.draw.spirillum = function (ctx, org, t) {
  var L = 28, amp = 4.5, turns = 3;
  var anchors = {};
  // 底層粗光暈
  ctx.save();
  ctx.shadowColor = 'rgba(140,210,225,0.7)';
  ctx.shadowBlur = 3;
  ctx.beginPath();
  for (var s0 = 0; s0 <= 44; s0++) {
    var u0 = s0 / 44;
    var x0 = -L / 2 + u0 * L;
    var y0 = Math.sin(u0 * Math.PI * 2 * turns + t * 2 + org.phase) * amp;
    if (s0 === 0) ctx.moveTo(x0, y0); else ctx.lineTo(x0, y0);
  }
  ctx.strokeStyle = 'rgba(150,215,232,0.9)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
  // 亮芯
  ctx.beginPath();
  for (var s = 0; s <= 44; s++) {
    var u = s / 44;
    var x = -L / 2 + u * L;
    var y = Math.sin(u * Math.PI * 2 * turns + t * 2 + org.phase) * amp;
    if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(220,248,255,0.55)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // 端生鞭毛
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = 'rgba(160,220,235,0.7)';
  [-1, 1].forEach(function (dir) {
    ctx.beginPath();
    var bx = dir * L / 2;
    ctx.moveTo(bx, 0);
    for (var k = 0; k <= 12; k++) {
      var uu = k / 12;
      ctx.lineTo(bx + dir * uu * 11, Math.sin(uu * 8 - t * 16) * 2 * uu);
    }
    ctx.stroke();
  });
  anchors.body = { x: 0, y: 0 };
  anchors.flagella = { x: L / 2 + 6, y: 0 };
  org.partAnchors = anchors;
};

/* ---------------- 矽藻（羽紋狀，玻璃質） ---------------- */
MW.draw.diatom = function (ctx, org, t) {
  var L = 62, W = 24;
  var anchors = {};
  function bodyPath() {
    ctx.beginPath();
    ctx.moveTo(-L / 2, 0);
    ctx.quadraticCurveTo(0, -W / 2, L / 2, 0);
    ctx.quadraticCurveTo(0, W / 2, -L / 2, 0);
    ctx.closePath();
  }
  // 玻璃光暈
  bodyPath();
  ctx.save();
  ctx.shadowColor = 'rgba(230,215,150,0.7)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = 'rgba(235,220,160,0.14)';
  ctx.fill();
  ctx.restore();

  bodyPath();
  var g = ctx.createLinearGradient(0, -W / 2, 0, W / 2);
  g.addColorStop(0, 'rgba(240,232,185,0.62)');
  g.addColorStop(0.5, 'rgba(206,186,116,0.42)');
  g.addColorStop(1, 'rgba(240,232,185,0.6)');
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  bodyPath();
  ctx.clip();
  // 葉綠體（黃褐立體）
  [-L * 0.2, L * 0.2].forEach(function (cx) {
    var cg = ctx.createRadialGradient(cx - 2, -2, 0, cx, 0, 11);
    cg.addColorStop(0, 'rgba(190,158,64,0.6)');
    cg.addColorStop(1, 'rgba(140,110,36,0.5)');
    ctx.beginPath();
    ctx.ellipse(cx, 0, 11, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = cg;
    ctx.fill();
  });
  // 花紋孔（striae）：對稱橫紋
  ctx.strokeStyle = 'rgba(150,120,58,0.5)';
  ctx.lineWidth = 0.5;
  for (var i = 1; i < 22; i++) {
    var x = -L / 2 + (i / 22) * L;
    var h = (W / 2) * (1 - Math.pow((x) / (L / 2), 2));
    ctx.beginPath();
    ctx.moveTo(x, -h); ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.restore();

  // 中線（縫 raphe）
  ctx.beginPath();
  ctx.moveTo(-L / 2 + 4, 0);
  ctx.lineTo(L / 2 - 4, 0);
  ctx.strokeStyle = 'rgba(140,108,50,0.7)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // 殼緣雙線
  bodyPath();
  ctx.strokeStyle = 'rgba(176,142,72,0.85)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // 玻璃高光（斜長條）
  ctx.save();
  bodyPath();
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(-L * 0.3, -W * 0.4);
  ctx.lineTo(L * 0.1, -W * 0.1);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.stroke();
  ctx.restore();
  anchors.frustule = { x: 0, y: -W / 2 };
  anchors.striae = { x: L * 0.3, y: -W * 0.3 };
  anchors.chloroplast = { x: -L * 0.2, y: 0 };
  org.partAnchors = anchors;
};

/* ---------------- 團藻 ---------------- */
MW.draw.volvox = function (ctx, org, t) {
  var R = 200;
  var anchors = {};
  // 膠質大球（玻璃球感）
  ctx.save();
  ctx.shadowColor = 'rgba(150,230,150,0.5)';
  ctx.shadowBlur = 18;
  var g = ctx.createRadialGradient(-R * 0.32, -R * 0.32, R * 0.05, 0, 0, R);
  g.addColorStop(0, 'rgba(228,255,228,0.28)');
  g.addColorStop(0.72, 'rgba(150,220,150,0.12)');
  g.addColorStop(0.95, 'rgba(120,205,120,0.26)');
  g.addColorStop(1, 'rgba(150,235,150,0.36)');
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(120,200,120,0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // 大玻璃高光
  specular(ctx, -R * 0.4, -R * 0.4, R * 0.5, 0.3);

  // 表面細胞（連成六角網感的點陣）+ 鞭毛
  for (var i = 0; i < 130; i++) {
    var a = rnd(org.seed + i) * Math.PI * 2;
    var rr = R * (0.84 + rnd(org.seed + i * 2) * 0.15);
    var cx = Math.cos(a) * rr;
    var cy = Math.sin(a) * rr;
    var cg = ctx.createRadialGradient(cx - 1, cy - 1, 0, cx, cy, 3.4);
    cg.addColorStop(0, 'rgba(120,220,120,0.95)');
    cg.addColorStop(1, 'rgba(46,150,60,0.85)');
    ctx.beginPath();
    ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = cg;
    ctx.fill();
    var beat = Math.sin(t * 8 + i + org.phase) * 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 7 + beat * 0.3, cy + Math.sin(a) * 7);
    ctx.strokeStyle = 'rgba(140,220,140,0.45)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  // 子群體（立體小綠球）
  [[-R * 0.3, R * 0.2, R * 0.28], [R * 0.35, -R * 0.15, R * 0.22], [R * 0.1, R * 0.4, R * 0.18]]
    .forEach(function (d) {
      var dg = ctx.createRadialGradient(d[0] - d[2] * 0.3, d[1] - d[2] * 0.3, 0, d[0], d[1], d[2]);
      dg.addColorStop(0, 'rgba(150,230,150,0.4)');
      dg.addColorStop(1, 'rgba(70,175,80,0.28)');
      ctx.beginPath();
      ctx.arc(d[0], d[1], d[2], 0, Math.PI * 2);
      ctx.fillStyle = dg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(70,175,80,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      for (var k = 0; k < 18; k++) {
        var aa = k / 18 * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(d[0] + Math.cos(aa) * d[2] * 0.85, d[1] + Math.sin(aa) * d[2] * 0.85, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56,160,66,0.8)';
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
  var L = 200, W = 72;
  var anchors = {};
  function bodyPath() {
    ctx.beginPath();
    ctx.moveTo(L * 0.5, -W * 0.5);
    ctx.quadraticCurveTo(L * 0.1, -W * 0.5, -L * 0.1, -W * 0.25);
    ctx.quadraticCurveTo(-L * 0.45, -W * 0.12, -L * 0.5, 0);
    ctx.quadraticCurveTo(-L * 0.45, W * 0.12, -L * 0.1, W * 0.25);
    ctx.quadraticCurveTo(L * 0.1, W * 0.5, L * 0.5, W * 0.5);
    ctx.quadraticCurveTo(L * 0.35, 0, L * 0.5, -W * 0.5);
    ctx.closePath();
  }
  // 柔光暈（透明體）
  bodyPath();
  ctx.save();
  ctx.shadowColor = 'rgba(250,220,190,0.5)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = 'rgba(250,225,200,0.10)';
  ctx.fill();
  ctx.restore();

  bodyPath();
  var g = ctx.createRadialGradient(L * 0.1, -W * 0.2, 10, 0, 0, L * 0.55);
  g.addColorStop(0, 'rgba(255,238,218,0.55)');
  g.addColorStop(0.6, 'rgba(238,206,170,0.5)');
  g.addColorStop(1, 'rgba(214,178,138,0.5)');
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  bodyPath();
  ctx.clip();
  // 內部器官感（消化道陰影）
  ctx.beginPath();
  ctx.moveTo(L * 0.2, 0);
  ctx.quadraticCurveTo(-L * 0.1, W * 0.1, -L * 0.35, 0);
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(190,150,110,0.25)';
  ctx.lineCap = 'round';
  ctx.stroke();
  cytoplasm(ctx, org.seed, L * 0.3, W * 0.35, 24, 'rgba(200,160,120,A)', 3);
  ctx.restore();

  // 膜雙線
  bodyPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(206,166,124,0.75)';
  ctx.stroke();
  bodyPath();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = 'rgba(255,244,224,0.4)';
  ctx.stroke();
  specular(ctx, L * 0.05, -W * 0.22, 28, 0.3);

  // 纖毛冠（頭端兩葉，擺動）
  [-1, 1].forEach(function (sgn) {
    for (var i = 0; i < 16; i++) {
      var u = i / 16;
      var bx = L * 0.5;
      var by = sgn * (W * 0.5) * (0.15 + u * 0.95);
      var beat = Math.sin(t * 11 + i + org.phase) * 6;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + 9, by + sgn * 2, bx + 16 + beat, by + sgn * 5);
      ctx.strokeStyle = 'rgba(255,240,220,0.85)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  });
  anchors.corona = { x: L * 0.58, y: 0 };

  // 咀嚼囊（立體）
  var mg = ctx.createRadialGradient(L * 0.2 - 3, -3, 0, L * 0.2, 0, 13);
  mg.addColorStop(0, 'rgba(180,140,105,0.6)');
  mg.addColorStop(1, 'rgba(120,88,62,0.55)');
  ctx.beginPath();
  ctx.arc(L * 0.2, 0, 12, 0, Math.PI * 2);
  ctx.fillStyle = mg;
  ctx.fill();
  anchors.mastax = { x: L * 0.2, y: 0 };

  // 趾
  ctx.strokeStyle = 'rgba(206,166,124,0.8)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
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
  var cellL = 120, W = 62, cells = 5;
  var totalL = cellL * cells;
  var anchors = {};
  ctx.save();
  ctx.translate(-totalL / 2, 0);
  for (var c = 0; c < cells; c++) {
    var x0 = c * cellL;
    // 細胞壁（長方形，玻璃透明 + 膠質）
    ctx.beginPath();
    ctx.rect(x0, -W / 2, cellL, W);
    var g = ctx.createLinearGradient(0, -W / 2, 0, W / 2);
    g.addColorStop(0, 'rgba(214,244,214,0.34)');
    g.addColorStop(0.5, 'rgba(196,236,196,0.22)');
    g.addColorStop(1, 'rgba(214,244,214,0.34)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(96,178,96,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // 高光條
    ctx.beginPath();
    ctx.moveTo(x0 + 4, -W * 0.34);
    ctx.lineTo(x0 + cellL - 4, -W * 0.34);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // 螺旋帶狀葉綠體（立體：底暗 + 亮芯）
    function ribbon(width, color) {
      ctx.beginPath();
      for (var s = 0; s <= 44; s++) {
        var u = s / 44;
        var px = x0 + u * cellL;
        var py = Math.sin(u * Math.PI * 4 + org.phase) * (W * 0.32);
        if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    ribbon(8, 'rgba(30,120,36,0.85)');
    ribbon(3, 'rgba(120,210,110,0.6)');
    // 蛋白核（pyrenoid，帶上澱粉粒）
    for (var pn = 0; pn < 3; pn++) {
      var pu = 0.2 + pn * 0.3;
      var px2 = x0 + pu * cellL;
      var py2 = Math.sin(pu * Math.PI * 4 + org.phase) * (W * 0.32);
      ctx.beginPath();
      ctx.arc(px2, py2, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(230,255,225,0.7)';
      ctx.fill();
    }
    // 細胞核（中央，懸浮）
    nucleus(ctx, x0 + cellL / 2, 0, 7, 7, {
      light: 'rgba(224,250,220,0.75)', dark: 'rgba(130,190,120,0.6)',
      edge: 'rgba(96,168,96,0.5)', nucleolus: 'rgba(86,158,86,0.6)'
    });
  }
  ctx.restore();
  anchors.chloroplast = { x: -totalL / 2 + cellL * 0.5, y: -W * 0.2 };
  anchors.wall = { x: 0, y: -W / 2 };
  anchors.nucleus = { x: cellL / 2, y: 0 };
  org.partAnchors = anchors;
};
