/* =============================================================
 * config.js —— 全域設定與物種教學資料
 * -------------------------------------------------------------
 * 這個檔案是「單一事實來源 (single source of truth)」：
 *   - 相機/縮放參數
 *   - 世界尺度（以微米 µm 為單位）
 *   - 所有微生物的教學內容（名稱、分類、器官、知識）
 * 新增一種微生物 = 在 SPECIES 陣列加一筆資料，並在 species.js
 * 提供對應的繪製函式（用 id 對應）。
 * ============================================================= */

window.MW = window.MW || {};

MW.config = {
  // 世界尺寸（微米）。相機在這個範圍內移動。
  worldWidthUm: 6000,
  worldHeightUm: 4000,

  // 縮放：zoom = 每微米對應多少螢幕像素。
  minZoom: 0.12,   // 遠看：一滴池水，視野約數千微米
  maxZoom: 26,     // 近看：單一細胞的胞器
  startZoom: 0.35,

  // 顯微鏡風格：把 zoom 換算成「有效放大倍率」給使用者看。
  // 這是為了教學感受，非嚴格光學計算。
  magReference: 38,

  // 每種微生物的初始數量（會依世界大小自動增減）。
  spawnCounts: {
    coccus: 60,
    bacillus: 34,
    spirillum: 14,
    paramecium: 5,
    amoeba: 3,
    euglena: 8,
    diatom: 10,
    volvox: 3,
    rotifer: 3,
    spirogyra: 4,
  },
};

/* -------------------------------------------------------------
 * 物種教學資料
 * sizeUm      ：典型長度（微米），用來決定畫面大小與縮放建議
 * focusZoom   ：導覽模式聚焦到這隻生物時使用的縮放
 * parts       ：可標註的構造（近看時顯示引線標籤）
 * ----------------------------------------------------------- */
MW.SPECIES = [
  {
    id: 'paramecium',
    name: '草履蟲',
    latin: 'Paramecium',
    group: '纖毛蟲（原生動物）',
    kingdom: '原生生物界',
    sizeUm: 250,
    focusZoom: 3.2,
    color: '#bfe9cf',
    habitat: '淡水池塘、稻田水、腐草浸液',
    summary: '全身覆滿纖毛、外形像鞋底的單細胞獵食者，靠纖毛划水前進並旋轉。',
    detail:
      '草履蟲是最常用的教學原生動物。體表數千根纖毛協同擺動，使牠一邊前進一邊沿長軸旋轉。' +
      '口溝把水流與細菌掃入胞口，形成食物泡進行消化；伸縮泡則負責排出多餘水分（滲透調節）。',
    parts: [
      { name: '纖毛', key: 'cilia', desc: '覆蓋全身的細短毛，划水推進並感覺環境。' },
      { name: '口溝', key: 'oralGroove', desc: '凹陷的進食通道，把食物掃向胞口。' },
      { name: '大核', key: 'macronucleus', desc: '控制日常代謝的細胞核。' },
      { name: '伸縮泡', key: 'vacuole', desc: '週期性收縮排水，維持水分平衡。' },
      { name: '食物泡', key: 'foodVacuole', desc: '包住吞入細菌並消化的小泡。' },
    ],
    facts: [
      '游動時每秒可移動約 1–2 毫米，是體長的數千倍。',
      '有兩種細胞核：大核管代謝、小核管遺傳。',
      '碰到障礙會倒退再換方向，稱「迴避反應」。',
    ],
  },
  {
    id: 'amoeba',
    name: '變形蟲',
    latin: 'Amoeba',
    group: '肉足蟲（原生動物）',
    kingdom: '原生生物界',
    sizeUm: 400,
    focusZoom: 2.6,
    color: '#e7dcc0',
    habitat: '池底腐泥、淡水沉積物表面',
    summary: '沒有固定形狀的單細胞生物，靠伸出偽足緩慢流動並包裹食物。',
    detail:
      '變形蟲的細胞質不斷向前流動，推出「偽足」改變形狀與移動方向。' +
      '遇到食物時偽足包圍並吞入，形成食物泡（吞噬作用）。外層較透明為外質，內部顆粒狀為內質。',
    parts: [
      { name: '偽足', key: 'pseudopod', desc: '暫時伸出的細胞質突起，用來移動與捕食。' },
      { name: '細胞核', key: 'nucleus', desc: '橢圓形，控制細胞活動。' },
      { name: '伸縮泡', key: 'vacuole', desc: '排出多餘水分。' },
      { name: '外質／內質', key: 'ectoplasm', desc: '外層透明、內層顆粒狀的細胞質。' },
    ],
    facts: [
      '移動速度極慢，每分鐘僅數微米到數十微米。',
      '用「吞噬作用」把整個獵物包進細胞裡消化。',
      '形狀時刻改變，沒有前後左右之分。',
    ],
  },
  {
    id: 'euglena',
    name: '眼蟲（裸藻）',
    latin: 'Euglena',
    group: '鞭毛藻（介於動植物之間）',
    kingdom: '原生生物界',
    sizeUm: 90,
    focusZoom: 6,
    color: '#7fd66b',
    habitat: '有機質豐富的靜水、水華表面',
    summary: '有葉綠體能行光合作用，也能靠鞭毛游泳、感光趨光的綠色單細胞。',
    detail:
      '眼蟲同時具備植物與動物特徵：綠色葉綠體讓牠能光合自養，紅色眼點能感光，' +
      '前端一條長鞭毛擺動推進，並朝光源游動（趨光性）。缺光時可改吃有機物。',
    parts: [
      { name: '鞭毛', key: 'flagellum', desc: '前端長鞭，擺動推進。' },
      { name: '眼點', key: 'eyespot', desc: '紅色感光構造，協助趨光。' },
      { name: '葉綠體', key: 'chloroplast', desc: '綠色，進行光合作用。' },
      { name: '細胞核', key: 'nucleus', desc: '位於細胞中後段。' },
    ],
    facts: [
      '會朝光游動，這叫「趨光性」。',
      '有葉綠體卻沒有細胞壁，身體柔軟能變形（眼蟲式運動）。',
      '常被當作「動植物界線模糊」的代表生物。',
    ],
  },
  {
    id: 'coccus',
    name: '球菌',
    latin: 'Coccus',
    group: '細菌',
    kingdom: '細菌界（原核）',
    sizeUm: 1.2,
    focusZoom: 22,
    color: '#9fb7ff',
    habitat: '幾乎無所不在：水、土壤、皮膚',
    summary: '球形的細菌，常成對、成串或成團排列。',
    detail:
      '球菌是最小、最簡單的一類生物之一，屬原核細胞，沒有細胞核。' +
      '依排列方式命名：成串叫鏈球菌、成團叫葡萄球菌、成對叫雙球菌。',
    parts: [
      { name: '細胞壁', key: 'wall', desc: '堅硬外殼，維持形狀。' },
      { name: '擬核', key: 'nucleoid', desc: '沒有核膜包被的 DNA 區域。' },
    ],
    facts: [
      '直徑約 1 微米，約是草履蟲的兩百分之一。',
      '沒有細胞核，屬於「原核生物」。',
      '分裂繁殖極快，條件好時 20 分鐘可分裂一次。',
    ],
  },
  {
    id: 'bacillus',
    name: '桿菌',
    latin: 'Bacillus',
    group: '細菌',
    kingdom: '細菌界（原核）',
    sizeUm: 3,
    focusZoom: 16,
    color: '#a7d8ff',
    habitat: '土壤、水、動物腸道',
    summary: '棒狀的細菌，許多種類尾端有鞭毛可游動。',
    detail:
      '桿菌呈長棒狀，部分具鞭毛能游泳。有些種類在惡劣環境會形成耐久的「內孢子」。',
    parts: [
      { name: '細胞壁', key: 'wall', desc: '維持棒狀外形。' },
      { name: '鞭毛', key: 'flagellum', desc: '尾端細長，旋轉推進。' },
      { name: '擬核', key: 'nucleoid', desc: '無核膜的 DNA 區。' },
    ],
    facts: [
      '許多桿菌靠一或多條鞭毛「跑動與翻滾」交替前進。',
      '可形成內孢子，耐高溫乾燥數十年。',
    ],
  },
  {
    id: 'spirillum',
    name: '螺旋菌',
    latin: 'Spirillum',
    group: '細菌',
    kingdom: '細菌界（原核）',
    sizeUm: 12,
    focusZoom: 9,
    color: '#8fd0e6',
    habitat: '停滯淡水、淤泥',
    summary: '身體呈螺旋彈簧狀，兩端鞭毛旋轉像螺絲一樣鑽水前進。',
    detail:
      '螺旋菌的細胞呈剛硬的螺旋狀，兩端常有成束鞭毛，旋轉時像開瓶器般高速穿行。',
    parts: [
      { name: '螺旋菌體', key: 'body', desc: '剛硬的螺旋外形。' },
      { name: '端生鞭毛', key: 'flagella', desc: '兩端成束的鞭毛。' },
    ],
    facts: [
      '游動速度在細菌中名列前茅。',
      '螺旋形有助於在黏稠的水中鑽行。',
    ],
  },
  {
    id: 'diatom',
    name: '矽藻',
    latin: 'Diatom',
    group: '單細胞藻類',
    kingdom: '原生生物界',
    sizeUm: 60,
    focusZoom: 7,
    color: '#cbb76a',
    habitat: '海水與淡水，浮游或附著',
    summary: '披著精緻玻璃質外殼、幾何對稱的光合藻類，是水中重要的產氧者。',
    detail:
      '矽藻的細胞壁由二氧化矽（玻璃質）構成，稱為「殼瓣」，帶有精細對稱的花紋。' +
      '牠們行光合作用，是水域食物鏈的基礎，也貢獻地球大量氧氣。',
    parts: [
      { name: '矽質殼', key: 'frustule', desc: '玻璃質外殼，兩片如培養皿相扣。' },
      { name: '葉綠體', key: 'chloroplast', desc: '黃褐色，行光合作用。' },
      { name: '花紋孔', key: 'striae', desc: '殼上排列規則的細孔，用於物質交換。' },
    ],
    facts: [
      '外殼是玻璃（二氧化矽）做的，死後沉積成矽藻土。',
      '地球約每五口氧氣就有一口來自矽藻等浮游藻。',
    ],
  },
  {
    id: 'volvox',
    name: '團藻',
    latin: 'Volvox',
    group: '群體綠藻',
    kingdom: '原生生物界',
    sizeUm: 500,
    focusZoom: 2.4,
    color: '#8fe08a',
    habitat: '陽光充足的淡水池塘',
    summary: '成千上百個帶鞭毛的細胞排成中空綠色球體，一起滾動游泳。',
    detail:
      '團藻是介於單細胞與多細胞之間的群體：數百到數千個細胞鑲在球面上，' +
      '各自兩條鞭毛協調擺動，使整個球體滾動前進。球內常見正在發育的子群體。',
    parts: [
      { name: '群體細胞', key: 'cells', desc: '球面上帶鞭毛的個別細胞。' },
      { name: '子群體', key: 'daughter', desc: '球內正在發育的下一代小球。' },
      { name: '膠質球體', key: 'sphere', desc: '包住所有細胞的透明膠質。' },
    ],
    facts: [
      '被視為研究「多細胞起源」的模式生物。',
      '球內的小綠球是正在長大的下一代。',
    ],
  },
  {
    id: 'rotifer',
    name: '輪蟲',
    latin: 'Rotifer',
    group: '微型多細胞動物',
    kingdom: '動物界',
    sizeUm: 300,
    focusZoom: 3,
    color: '#f0d0b0',
    habitat: '淡水、苔蘚間、潮濕土壤',
    summary: '頭部有兩圈旋轉般擺動的纖毛冠，像小輪子一樣捲水進食的微型動物。',
    detail:
      '輪蟲是真正的多細胞動物，卻只有數百到上千個細胞。頭端的「纖毛冠」擺動時看似轉動的輪子，' +
      '製造水流把食物送入口中，並由咀嚼囊（有咀嚼器）磨碎。尾端有趾可附著。',
    parts: [
      { name: '纖毛冠', key: 'corona', desc: '頭部旋轉狀纖毛環，取食兼游泳。' },
      { name: '咀嚼囊', key: 'mastax', desc: '內含咀嚼器，磨碎食物。' },
      { name: '趾', key: 'foot', desc: '尾端附著構造。' },
    ],
    facts: [
      '有些輪蟲乾掉數年後遇水仍能復活。',
      '雖是動物，體型卻和單細胞的草履蟲差不多。',
    ],
  },
  {
    id: 'spirogyra',
    name: '水綿',
    latin: 'Spirogyra',
    group: '絲狀綠藻',
    kingdom: '原生生物界',
    sizeUm: 900,
    focusZoom: 2.2,
    color: '#86d982',
    habitat: '靜止或緩流的淡水，成團漂浮',
    summary: '細胞排成長絲、葉綠體呈螺旋帶狀的綠藻，摸起來滑滑的一團綠絲。',
    detail:
      '水綿由許多相同的長方形細胞首尾相連成絲，每個細胞內有一至數條螺旋帶狀葉綠體，是牠最好認的特徵。' +
      '行光合作用，表面覆有黏滑膠質，常在池面形成綠色棉絮狀漂浮團。',
    parts: [
      { name: '螺旋葉綠體', key: 'chloroplast', desc: '帶狀螺旋排列，行光合作用。' },
      { name: '細胞壁', key: 'wall', desc: '長方形細胞的外壁，首尾相接成絲。' },
      { name: '細胞核', key: 'nucleus', desc: '懸在中央，由細胞質絲牽住。' },
    ],
    facts: [
      '螺旋帶狀的葉綠體是水綿最好認的招牌。',
      '摸起來滑滑的，因為表面有一層膠質。',
    ],
  },
];

/* 依 id 快速查詢 */
MW.speciesById = {};
MW.SPECIES.forEach(function (s) { MW.speciesById[s.id] = s; });
