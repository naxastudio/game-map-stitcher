const $ = (selector) => document.querySelector(selector);
const fileInput = $('#files');
const thumbs = $('#thumbs');
const statusEl = $('#status');
const opencvStatusEl = $('#opencvStatus');
const stitchButton = $('#stitch');
const downloadButton = $('#download');
const editToggleButton = $('#editToggle');
const manualLayoutButton = $('#manualLayout');
const demoButton = $('#demo');
const randomDemoButton = $('#randomDemo');
const languageToggleButton = $('#languageToggle');
const preview = $('#preview');
const emptyState = $('#emptyState');
const rowsInput = $('#rows');
const colsInput = $('#cols');
const coordScaleInput = $('#coordScale');
const coordYDirectionInput = $('#coordYDirection');
const detectCoordsButton = $('#detectCoords');
const minOverlapInput = $('#minOverlap');
const maxOverlapInput = $('#maxOverlap');
const autoSortInput = $('#autoSort');
const alphaMasksInput = $('#alphaMasks');
const autoCropInput = $('#autoCrop');
const minOverlapValue = $('#minOverlapValue');
const maxOverlapValue = $('#maxOverlapValue');
const sampleStepInput = $('#sampleStep');
const matchEngineInput = $('#matchEngine');
const gridSettings = $('.grid-settings');
const coordinateSettings = $('.coordinate-settings');
const dropZone = $('.drop-zone');

let images = [];
let placements = [];
let finalCanvas = null;
let editMode = false;
let selectedIndex = -1;
let dragState = null;
let canvasOffset = { x: 0, y: 0 };
let nextImageId = 1;
let language = localStorage.getItem('mapStitcherLanguage') || 'zh';
let tesseractPromise = null;
let openCvReady = false;

const i18n = {
  zh: {
    appTitle: '游戏地图拼接器', appSubtitle: '上传地图截图，自动寻找重叠区域并导出完整大图。', chooseImages: '选择截图', chooseImagesHint: '支持 PNG / JPG，可点击或拖入多张图片', stitchMode: '拼接方式', modeHorizontal: '横向', modeVertical: '纵向', modeGrid: '网格', modeRandom: '多图随机', modeCoordinate: '坐标拼接', gridSettings: '网格设置', coordinateSettings: '坐标设置', pixelsPerCoord: '每坐标像素', yAxis: 'Y 轴方向', yDown: '向下增加', yUp: '向上增加', detectCoords: '自动识别图上坐标', rows: '行数', cols: '列数', matchSettings: '匹配设置', matchEngine: '匹配引擎', enginePixel: '像素重叠', engineFeatures: '特征点匹配（SIFT/ORB）', autoSort: '自动判断截图顺序', alphaMasks: 'Alpha 蒙版融合', autoCrop: '自动裁掉边框', minOverlap: '最小重叠', maxOverlap: '最大重叠', samplePrecision: '采样精度', precisionFast: '快速', precisionBalanced: '均衡', precisionAccurate: '更准', imageOrder: '截图顺序', noImages: '还没有上传截图', generateMap: '生成地图', manualLayout: '直接手动摆放', manualAdjust: '手动微调', finishAdjust: '完成微调', downloadPng: '下载 PNG', loadDemo: '载入测试截图', randomDemo: '随机测试截图', waiting: '等待上传截图。', previewArea: '预览区域', previewHint: '上传至少两张有重叠的游戏截图后生成地图。', needTwo: '至少需要上传两张截图。', missingCoordinates: '有些截图自动识别不到坐标，需要手动补 X/Y 坐标。', matching: '正在自动拼接...', generated: (w, h) => `已生成地图：${w} x ${h}。`, reading: '正在读取截图...', filesLoaded: (n) => `已读取 ${n} 张截图。`, ocrLoading: '正在加载 OCR 识别模块...', ocrProgress: (i, n) => `正在识别坐标：${i} / ${n} 张...`, ocrDone: (f, n) => `坐标识别完成：成功识别 ${f} / ${n} 张。`, ocrUnavailable: 'OCR 加载失败，请确认网络可用。', opencvStatusLoading: 'OpenCV：加载中...', opencvStatusReady: (sift, orb, bf, ransac) => `OpenCV：已加载 | SIFT: ${sift ? '可用' : '不可用'} | ORB: ${orb ? '可用' : '不可用'} | BFMatcher: ${bf ? '可用' : '不可用'} | RANSAC: ${ransac ? '可用' : '不可用'}`
  },
  en: {
    appTitle: 'Game Map Stitcher', appSubtitle: 'Upload map screenshots, match overlapping areas, and export one complete map.', chooseImages: 'Choose screenshots', chooseImagesHint: 'PNG / JPG supported. Click or drag multiple images here.', stitchMode: 'Stitch mode', modeHorizontal: 'Horizontal', modeVertical: 'Vertical', modeGrid: 'Grid', modeRandom: 'Multi-image auto', modeCoordinate: 'Coordinates', gridSettings: 'Grid settings', coordinateSettings: 'Coordinate settings', pixelsPerCoord: 'Pixels per coord', yAxis: 'Y axis', yDown: 'Y increases down', yUp: 'Y increases up', detectCoords: 'Auto-detect on-image coords', rows: 'Rows', cols: 'Columns', matchSettings: 'Match settings', matchEngine: 'Match engine', enginePixel: 'Pixel overlap', engineFeatures: 'Feature matching (SIFT/ORB)', autoSort: 'Auto-detect order', alphaMasks: 'Alpha mask blending', autoCrop: 'Auto-crop borders', minOverlap: 'Minimum overlap', maxOverlap: 'Maximum overlap', samplePrecision: 'Sampling precision', precisionFast: 'Fast', precisionBalanced: 'Balanced', precisionAccurate: 'More accurate', imageOrder: 'Screenshot order', noImages: 'No screenshots uploaded yet', generateMap: 'Generate map', manualLayout: 'Manual layout', manualAdjust: 'Fine tune', finishAdjust: 'Finish tuning', downloadPng: 'Download PNG', loadDemo: 'Load demo screenshots', randomDemo: 'Random-order demo', waiting: 'Waiting for screenshots.', previewArea: 'Preview', previewHint: 'Upload at least two overlapping game screenshots to generate a map.', needTwo: 'Upload at least two screenshots.', missingCoordinates: 'Some screenshots still need manual X/Y coordinates because OCR could not read them.', matching: 'Auto stitching...', generated: (w, h) => `Generated map: ${w} x ${h}.`, reading: 'Reading screenshots...', filesLoaded: (n) => `${n} screenshots loaded.`, ocrLoading: 'Loading OCR module...', ocrProgress: (i, n) => `Detecting coordinates: ${i} / ${n} images...`, ocrDone: (f, n) => `Coordinate detection finished: ${f} / ${n} recognized.`, ocrUnavailable: 'OCR failed to load. Check internet access.', opencvStatusLoading: 'OpenCV: loading...', opencvStatusReady: (sift, orb, bf, ransac) => `OpenCV: loaded | SIFT: ${sift ? 'available' : 'not available'} | ORB: ${orb ? 'available' : 'not available'} | BFMatcher: ${bf ? 'available' : 'not available'} | RANSAC: ${ransac ? 'available' : 'not available'}`
  }
};

function t(key, ...args) {
  const value = i18n[language][key] || i18n.zh[key] || key;
  return typeof value === 'function' ? value(...args) : value;
}

window.onOpenCvScriptLoaded = () => {
  if (!window.cv) return;
  const ready = () => { openCvReady = true; updateOpenCvStatus(); };
  if (typeof window.cv.onRuntimeInitialized === 'function') window.cv.onRuntimeInitialized = ready;
  else ready();
};

function updateOpenCvStatus() {
  if (!opencvStatusEl) return;
  if (!window.cv || !openCvReady) {
    opencvStatusEl.textContent = t('opencvStatusLoading');
    return;
  }
  opencvStatusEl.textContent = t('opencvStatusReady', Boolean(cv.SIFT_create), Boolean(cv.ORB_create), Boolean(cv.BFMatcher), Boolean(cv.findHomography));
}

function applyLanguage() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  languageToggleButton.textContent = language === 'zh' ? 'EN' : '中文';
  editToggleButton.textContent = editMode ? t('finishAdjust') : t('manualAdjust');
  if (!images.length) thumbs.textContent = t('noImages');
  updateOpenCvStatus();
}

function setStatus(message, warn = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('warn', warn);
}

function getMode() { return document.querySelector('input[name="mode"]:checked').value; }
function getOptions() {
  return {
    minOverlap: Number(minOverlapInput.value) / 100,
    maxOverlap: Number(maxOverlapInput.value) / 100,
    sampleStep: Number(sampleStepInput.value),
    rows: Number(rowsInput.value),
    cols: Number(colsInput.value),
    coordScale: Number(coordScaleInput.value),
    coordYDirection: coordYDirectionInput.value,
    autoSort: autoSortInput.checked,
    alphaMasks: alphaMasksInput.checked,
    autoCrop: autoCropInput.checked
  };
}

function updateOverlapLabels() {
  minOverlapValue.textContent = `${minOverlapInput.value}%`;
  maxOverlapValue.textContent = `${maxOverlapInput.value}%`;
}

fileInput.addEventListener('change', async (event) => handleFiles(Array.from(event.target.files || [])));
languageToggleButton.addEventListener('click', () => { language = language === 'zh' ? 'en' : 'zh'; localStorage.setItem('mapStitcherLanguage', language); applyLanguage(); });
[minOverlapInput, maxOverlapInput].forEach((input) => input.addEventListener('input', updateOverlapLabels));

document.querySelectorAll('input[name="mode"]').forEach((input) => {
  input.addEventListener('change', () => {
    const mode = getMode();
    gridSettings.hidden = mode !== 'grid';
    coordinateSettings.hidden = mode !== 'coordinate';
    if (mode === 'random') autoSortInput.checked = true;
  });
});

['dragenter', 'dragover'].forEach((name) => dropZone.addEventListener(name, (event) => {
  event.preventDefault();
  dropZone.classList.add('drag-over');
}));
['dragleave', 'drop'].forEach((name) => dropZone.addEventListener(name, (event) => {
  event.preventDefault();
  dropZone.classList.remove('drag-over');
}));
dropZone.addEventListener('drop', (event) => handleFiles(Array.from(event.dataTransfer.files || []).filter((file) => file.type.startsWith('image/'))));

async function handleFiles(files) {
  const imageFiles = files.filter((file) => file.type.startsWith('image/'));
  if (!imageFiles.length) return;
  setStatus(t('reading'));
  images = [];
  placements = [];
  finalCanvas = null;
  matchCache.clear?.();
  for (const file of imageFiles) images.push(await readImageFile(file));
  renderThumbs();
  manualLayoutButton.disabled = false;
  detectCoordsButton.disabled = false;
  downloadButton.disabled = true;
  editToggleButton.disabled = true;
  emptyState.hidden = false;
  setStatus(t('filesLoaded', images.length));
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const parsed = parseCoords(file.name);
      const item = { id: nextImageId++, file, name: file.name, img, url, width: img.naturalWidth, height: img.naturalHeight, coordX: parsed?.x, coordY: parsed?.y };
      if (autoCropInput.checked) cropBorders(item);
      resolve(item);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function cropBorders(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width; canvas.height = image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image.img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const sample = (x, y) => {
    const i = (y * canvas.width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const edge = sample(0, 0);
  const similar = (x, y) => {
    const c = sample(x, y);
    return Math.abs(c[0] - edge[0]) + Math.abs(c[1] - edge[1]) + Math.abs(c[2] - edge[2]) < 42;
  };
  let left = 0, right = canvas.width - 1, top = 0, bottom = canvas.height - 1;
  while (left < right && Array.from({ length: canvas.height }, (_, y) => similar(left, y)).filter(Boolean).length > canvas.height * 0.86) left++;
  while (right > left && Array.from({ length: canvas.height }, (_, y) => similar(right, y)).filter(Boolean).length > canvas.height * 0.86) right--;
  while (top < bottom && Array.from({ length: canvas.width }, (_, x) => similar(x, top)).filter(Boolean).length > canvas.width * 0.86) top++;
  while (bottom > top && Array.from({ length: canvas.width }, (_, x) => similar(x, bottom)).filter(Boolean).length > canvas.width * 0.86) bottom--;
  if (left + top + (canvas.width - 1 - right) + (canvas.height - 1 - bottom) < 8) return;
  const cropped = document.createElement('canvas');
  cropped.width = right - left + 1; cropped.height = bottom - top + 1;
  cropped.getContext('2d').drawImage(canvas, left, top, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
  const newImg = new Image();
  newImg.src = cropped.toDataURL('image/png');
  image.img = newImg; image.width = cropped.width; image.height = cropped.height; image.canvas = cropped;
}

function parseCoords(name) {
  const patterns = [/x(-?\d+(?:\.\d+)?)_?y(-?\d+(?:\.\d+)?)/i, /(-?\d+(?:\.\d+)?)[,，_](-?\d+(?:\.\d+)?)/];
  for (const pattern of patterns) {
    const m = name.match(pattern);
    if (m) return { x: Number(m[1]), y: Number(m[2]) };
  }
  return null;
}

function renderThumbs() {
  thumbs.innerHTML = '';
  thumbs.classList.toggle('empty', !images.length);
  if (!images.length) { thumbs.textContent = t('noImages'); return; }
  images.forEach((image, index) => {
    const row = document.createElement('div');
    row.className = 'thumb'; row.draggable = true; row.dataset.index = index;
    row.innerHTML = `<img src="${image.url}" alt=""><div><strong>${index + 1}. ${image.name}</strong><span>${image.width} x ${image.height}</span><div class="coord-inputs"><label>X <input type="number" value="${Number.isFinite(image.coordX) ? image.coordX : ''}" data-axis="x"></label><label>Y <input type="number" value="${Number.isFinite(image.coordY) ? image.coordY : ''}" data-axis="y"></label></div></div><div class="move-buttons"><button type="button" data-move="-1">↑</button><button type="button" data-move="1">↓</button></div>`;
    row.querySelectorAll('input[data-axis]').forEach((input) => input.addEventListener('input', () => {
      const value = input.value === '' ? NaN : Number(input.value);
      if (input.dataset.axis === 'x') image.coordX = value; else image.coordY = value;
    }));
    row.querySelectorAll('[data-move]').forEach((button) => button.addEventListener('click', () => moveImage(index, Number(button.dataset.move))));
    row.addEventListener('dragstart', (event) => event.dataTransfer.setData('text/plain', String(index)));
    row.addEventListener('dragover', (event) => event.preventDefault());
    row.addEventListener('drop', (event) => { event.preventDefault(); reorderImage(Number(event.dataTransfer.getData('text/plain')), index); });
    thumbs.append(row);
  });
}

function moveImage(index, delta) { reorderImage(index, Math.max(0, Math.min(images.length - 1, index + delta))); }
function reorderImage(from, to) {
  if (from === to || from < 0 || to < 0) return;
  const [item] = images.splice(from, 1);
  images.splice(to, 0, item);
  renderThumbs();
}

stitchButton.addEventListener('click', async () => {
  if (images.length < 2) { setStatus(t('needTwo'), true); return; }
  try {
    stitchButton.disabled = true; downloadButton.disabled = true; setStatus(t('matching'));
    const mode = getMode(); const options = getOptions();
    if (mode === 'coordinate' && images.some((img) => !Number.isFinite(img.coordX) || !Number.isFinite(img.coordY))) {
      await detectCoordinates(false); renderThumbs();
    }
    placements = buildPlacements(mode, options);
    finalCanvas = drawComposite(placements, options.alphaMasks);
    showCanvas(finalCanvas);
    downloadButton.disabled = false; editToggleButton.disabled = false;
    setStatus(t('generated', finalCanvas.width, finalCanvas.height));
    document.querySelector('.workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) { setStatus(error.message, true); }
  finally { stitchButton.disabled = false; }
});

function buildPlacements(mode, options) {
  if (mode === 'coordinate') return placeByCoordinates(options);
  if (mode === 'grid') return placeGrid(options);
  if (mode === 'vertical') return placeLine('vertical', options);
  if (mode === 'random') return placeAuto(options);
  return placeLine('horizontal', options);
}

function placeGrid(options) {
  return images.map((image, i) => ({ image, x: (i % options.cols) * image.width * 0.75, y: Math.floor(i / options.cols) * image.height * 0.75 }));
}

function placeByCoordinates(options) {
  if (images.some((image) => !Number.isFinite(image.coordX) || !Number.isFinite(image.coordY))) throw new Error(t('missingCoordinates'));
  const sign = options.coordYDirection === 'up' ? -1 : 1;
  return images.map((image) => ({ image, x: image.coordX * options.coordScale - image.width / 2, y: image.coordY * options.coordScale * sign - image.height / 2 }));
}

function placeLine(direction, options) {
  const ordered = options.autoSort ? sortLine(direction, options) : [...images];
  let x = 0, y = 0;
  return ordered.map((image, index) => {
    const placement = { image, x, y };
    if (index < ordered.length - 1) {
      const next = ordered[index + 1];
      const overlap = bestOverlap(image, next, direction, options).overlap;
      if (direction === 'horizontal') x += image.width - overlap; else y += image.height - overlap;
    }
    return placement;
  });
}

function sortLine(direction, options) {
  const remaining = [...images];
  const ordered = [remaining.shift()];
  while (remaining.length) {
    const last = ordered[ordered.length - 1];
    let best = { index: 0, score: Infinity };
    remaining.forEach((img, index) => {
      const score = bestOverlap(last, img, direction, options).score;
      if (score < best.score) best = { index, score };
    });
    ordered.push(remaining.splice(best.index, 1)[0]);
  }
  return ordered;
}

function placeAuto(options) {
  const placed = [{ image: images[0], x: 0, y: 0 }];
  const remaining = images.slice(1);
  while (remaining.length) {
    let best = { r: 0, p: 0, side: 'right', score: Infinity, overlap: 0, offset: 0 };
    remaining.forEach((img, r) => placed.forEach((base, p) => ['right', 'left', 'bottom', 'top'].forEach((side) => {
      const match = bestNeighbor(base.image, img, side, options);
      if (match.score < best.score) best = { r, p, side, ...match };
    })));
    const image = remaining.splice(best.r, 1)[0];
    const base = placed[best.p];
    const point = pointForSide(base, image, best);
    placed.push({ image, x: point.x, y: point.y });
  }
  return placed;
}

function pointForSide(base, image, match) {
  if (match.side === 'right') return { x: base.x + base.image.width - match.overlap, y: base.y + match.offset };
  if (match.side === 'left') return { x: base.x - image.width + match.overlap, y: base.y + match.offset };
  if (match.side === 'bottom') return { x: base.x + match.offset, y: base.y + base.image.height - match.overlap };
  return { x: base.x + match.offset, y: base.y - image.height + match.overlap };
}

function bestNeighbor(a, b, side, options) {
  const horizontal = side === 'right' || side === 'left';
  const direction = horizontal ? 'horizontal' : 'vertical';
  const match = bestOverlap(a, b, direction, options);
  return { side, overlap: match.overlap, offset: 0, score: match.score };
}

function bestOverlap(a, b, direction, options) {
  const ca = toSmallCanvas(a), cb = toSmallCanvas(b);
  const size = direction === 'horizontal' ? Math.min(ca.width, cb.width) : Math.min(ca.height, cb.height);
  const min = Math.max(8, Math.round(size * options.minOverlap));
  const max = Math.max(min + 1, Math.round(size * options.maxOverlap));
  let best = { overlap: min, score: Infinity };
  for (let overlap = min; overlap <= max; overlap += options.sampleStep) {
    const score = direction === 'horizontal' ? scoreHorizontal(ca, cb, overlap, options.sampleStep) : scoreVertical(ca, cb, overlap, options.sampleStep);
    if (score < best.score) best = { overlap, score };
  }
  return { overlap: Math.round(best.overlap / ca.scale), score: best.score };
}

function toSmallCanvas(image) {
  if (image.small) return image.small;
  const max = 420;
  const scale = Math.min(1, max / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
  canvas.getContext('2d', { willReadFrequently: true }).drawImage(image.img, 0, 0, canvas.width, canvas.height);
  image.small = { canvas, width: canvas.width, height: canvas.height, scale };
  return image.small;
}

function scoreHorizontal(a, b, overlap, step) {
  const width = overlap, height = Math.min(a.height, b.height);
  const da = a.canvas.getContext('2d', { willReadFrequently: true }).getImageData(a.width - overlap, 0, width, height).data;
  const db = b.canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, width, height).data;
  return scoreData(da, db, width, height, step);
}

function scoreVertical(a, b, overlap, step) {
  const width = Math.min(a.width, b.width), height = overlap;
  const da = a.canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, a.height - overlap, width, height).data;
  const db = b.canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, width, height).data;
  return scoreData(da, db, width, height, step);
}

function scoreData(a, b, width, height, step) {
  let total = 0, count = 0;
  for (let y = 0; y < height; y += step) for (let x = 0; x < width; x += step) {
    const i = (y * width + x) * 4;
    total += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    count++;
  }
  return total / Math.max(1, count);
}

function drawComposite(input, alphaBlend) {
  const normalized = normalize(input);
  const bounds = getBounds(normalized);
  canvasOffset = { x: -bounds.minX, y: -bounds.minY };
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(bounds.maxX - bounds.minX); canvas.height = Math.ceil(bounds.maxY - bounds.minY);
  const ctx = canvas.getContext('2d');
  normalized.forEach((p) => {
    ctx.globalAlpha = alphaBlend && normalized.length > 1 && !editMode ? 0.92 : 1;
    ctx.drawImage(p.image.img, Math.round(p.x - bounds.minX), Math.round(p.y - bounds.minY));
  });
  ctx.globalAlpha = 1;
  if (editMode) drawOutlines(ctx, normalized, bounds);
  placements = normalized;
  return canvas;
}

function normalize(input) {
  const bounds = getBounds(input);
  return input.map((p) => ({ ...p, x: Math.round(p.x - bounds.minX), y: Math.round(p.y - bounds.minY) }));
}

function getBounds(input) {
  return input.reduce((box, p) => ({ minX: Math.min(box.minX, p.x), minY: Math.min(box.minY, p.y), maxX: Math.max(box.maxX, p.x + p.image.width), maxY: Math.max(box.maxY, p.y + p.image.height) }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
}

function drawOutlines(ctx, input, bounds) {
  input.forEach((p, i) => {
    ctx.lineWidth = i === selectedIndex ? 6 : 2;
    ctx.strokeStyle = i === selectedIndex ? '#1f7a68' : 'rgba(255,255,255,0.8)';
    ctx.strokeRect(p.x - bounds.minX + 1, p.y - bounds.minY + 1, p.image.width - 2, p.image.height - 2);
  });
}

function showCanvas(canvas) {
  preview.width = canvas.width; preview.height = canvas.height;
  preview.getContext('2d').clearRect(0, 0, preview.width, preview.height);
  preview.getContext('2d').drawImage(canvas, 0, 0);
  emptyState.hidden = true;
}

manualLayoutButton.addEventListener('click', () => {
  placements = images.map((image, i) => ({ image, x: (i % 4) * image.width * 0.75, y: Math.floor(i / 4) * image.height * 0.75 }));
  editMode = true; selectedIndex = 0; editToggleButton.disabled = false; downloadButton.disabled = false;
  finalCanvas = drawComposite(placements, false); showCanvas(finalCanvas); editToggleButton.textContent = t('finishAdjust'); preview.classList.add('editing');
});

editToggleButton.addEventListener('click', () => {
  if (!placements.length) return;
  editMode = !editMode; selectedIndex = editMode ? 0 : -1;
  editToggleButton.textContent = editMode ? t('finishAdjust') : t('manualAdjust'); preview.classList.toggle('editing', editMode);
  finalCanvas = drawComposite(placements, alphaMasksInput.checked); showCanvas(finalCanvas);
});

preview.addEventListener('pointerdown', (event) => {
  if (!editMode) return;
  const point = canvasPoint(event);
  selectedIndex = [...placements].reverse().findIndex((p) => point.x >= p.x && point.x <= p.x + p.image.width && point.y >= p.y && point.y <= p.y + p.image.height);
  if (selectedIndex === -1) return;
  selectedIndex = placements.length - 1 - selectedIndex;
  const p = placements[selectedIndex];
  dragState = { id: event.pointerId, x: point.x, y: point.y, px: p.x, py: p.y };
  preview.setPointerCapture(event.pointerId);
});
preview.addEventListener('pointermove', (event) => {
  if (!dragState) return;
  const point = canvasPoint(event), p = placements[selectedIndex];
  p.x = Math.round(dragState.px + point.x - dragState.x); p.y = Math.round(dragState.py + point.y - dragState.y);
  finalCanvas = drawComposite(placements, false); showCanvas(finalCanvas);
});
preview.addEventListener('pointerup', () => { dragState = null; });
preview.addEventListener('pointercancel', () => { dragState = null; });

document.addEventListener('keydown', (event) => {
  if (!editMode || selectedIndex < 0 || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
  const p = placements[selectedIndex], step = event.shiftKey ? 10 : 1;
  if (event.key === 'ArrowLeft') p.x -= step; if (event.key === 'ArrowRight') p.x += step; if (event.key === 'ArrowUp') p.y -= step; if (event.key === 'ArrowDown') p.y += step;
  finalCanvas = drawComposite(placements, false); showCanvas(finalCanvas); event.preventDefault();
});

function canvasPoint(event) {
  const rect = preview.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * preview.width / rect.width - canvasOffset.x, y: (event.clientY - rect.top) * preview.height / rect.height - canvasOffset.y };
}

downloadButton.addEventListener('click', () => {
  if (!finalCanvas) return;
  const link = document.createElement('a');
  link.download = `game-map-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
  link.href = finalCanvas.toDataURL('image/png'); link.click();
});

detectCoordsButton.addEventListener('click', async () => {
  try { detectCoordsButton.disabled = true; const found = await detectCoordinates(true); renderThumbs(); setStatus(t('ocrDone', found, images.length), found === 0); }
  catch { setStatus(t('ocrUnavailable'), true); }
  finally { detectCoordsButton.disabled = !images.length; }
});

async function detectCoordinates(force) {
  setStatus(t('ocrLoading'));
  await loadTesseract();
  let found = 0;
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    if (!force && Number.isFinite(image.coordX) && Number.isFinite(image.coordY)) continue;
    setStatus(t('ocrProgress', i + 1, images.length));
    const coords = await recognizeCoords(image);
    if (coords) { image.coordX = coords.x; image.coordY = coords.y; found++; }
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return found;
}

function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (tesseractPromise) return tesseractPromise;
  tesseractPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'; script.async = true;
    script.onload = () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error('Tesseract unavailable'));
    script.onerror = reject; document.head.append(script);
  });
  return tesseractPromise;
}

async function recognizeCoords(image) {
  const regions = ocrRegions(image);
  for (const canvas of regions) {
    const result = await Tesseract.recognize(canvas, 'eng', { tessedit_char_whitelist: '0123456789-.,:;=XYxy坐标位置 ' });
    const coords = parseOcrText(result?.data?.text || '');
    if (coords) return coords;
  }
  return null;
}

function ocrRegions(image) {
  const source = imageCanvas(image), w = source.width, h = source.height;
  const boxes = [{ x: 0, y: h * 0.7, w, h: h * 0.3 }, { x: 0, y: 0, w: w * 0.45, h: h * 0.28 }, { x: w * 0.55, y: 0, w: w * 0.45, h: h * 0.28 }, { x: w * 0.5, y: h * 0.65, w: w * 0.5, h: h * 0.35 }];
  return boxes.flatMap((box) => ['raw', 'light', 'dark'].map((variant) => cropOcr(source, box, variant)));
}

function cropOcr(source, box, variant) {
  const scale = 2, canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(box.w * scale)); canvas.height = Math.max(1, Math.round(box.h * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false; ctx.drawImage(source, box.x, box.y, box.w, box.h, 0, 0, canvas.width, canvas.height);
  if (variant !== 'raw') {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height), data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const text = variant === 'light' ? lum > 150 : lum < 120; const v = text ? 0 : 255;
      data[i] = v; data[i + 1] = v; data[i + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
  }
  return canvas;
}

function parseOcrText(text) {
  const cleaned = text.replace(/\s+/g, ' ');
  const patterns = [/x\s*[:=]?\s*(-?\d+(?:\.\d+)?).*?y\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i, /坐标\s*[:：]?\s*(-?\d+(?:\.\d+)?)[,，\s]+(-?\d+(?:\.\d+)?)/i, /位置\s*[:：]?\s*(-?\d+(?:\.\d+)?)[,，\s]+(-?\d+(?:\.\d+)?)/i, /(-?\d+(?:\.\d+)?)\s*[,，]\s*(-?\d+(?:\.\d+)?)/];
  for (const pattern of patterns) { const m = cleaned.match(pattern); if (m) return { x: Number(m[1]), y: Number(m[2]) }; }
  const nums = cleaned.match(/-?\d+(?:\.\d+)?/g);
  return nums?.length === 2 ? { x: Number(nums[0]), y: Number(nums[1]) } : null;
}

function imageCanvas(image) {
  if (image.canvas) return image.canvas;
  const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
  canvas.getContext('2d').drawImage(image.img, 0, 0); image.canvas = canvas; return canvas;
}

demoButton.addEventListener('click', () => makeDemo(false));
randomDemoButton.addEventListener('click', () => makeDemo(true));
async function makeDemo(randomize) {
  images = await createDemoImages();
  if (randomize) images.sort(() => Math.random() - 0.5);
  document.querySelector(`input[name="mode"][value="${randomize ? 'random' : 'horizontal'}"]`).checked = true;
  gridSettings.hidden = true; coordinateSettings.hidden = true; renderThumbs(); manualLayoutButton.disabled = false; detectCoordsButton.disabled = false; setStatus(t('filesLoaded', images.length));
}

function createDemoImages() {
  const base = document.createElement('canvas'); base.width = 980; base.height = 420;
  const ctx = base.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, base.height); sky.addColorStop(0, '#9fd4d9'); sky.addColorStop(1, '#e4f1dc'); ctx.fillStyle = sky; ctx.fillRect(0, 0, base.width, base.height);
  ctx.fillStyle = '#2f6f52'; ctx.fillRect(0, 260, base.width, 160); ctx.fillStyle = '#7c5a43'; ctx.fillRect(0, 320, base.width, 28);
  for (let i = 0; i < 9; i++) drawTree(ctx, 80 + i * 100, 230 + (i % 3) * 12, 32);
  ctx.fillStyle = '#4da8b7'; ctx.beginPath(); ctx.ellipse(570, 318, 120, 32, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '700 28px Segoe UI'; ctx.fillText('TEST MAP', 36, 56);
  return Promise.all([0, 240, 480, 700].map((x, i) => cropDemo(base, x, 40, 320, 310, i + 1)));
}
function drawTree(ctx, x, y, size) { ctx.fillStyle = '#64482f'; ctx.fillRect(x - 4, y, 8, size); ctx.fillStyle = '#1f6f4a'; ctx.beginPath(); ctx.arc(x, y, size * 0.72, 0, Math.PI * 2); ctx.fill(); }
function cropDemo(base, x, y, w, h, n) {
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; canvas.getContext('2d').drawImage(base, x, y, w, h, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob), img = new Image();
    img.onload = () => resolve({ id: nextImageId++, file: new File([blob], `demo-${n}.png`, { type: 'image/png' }), name: `demo-${n}.png`, img, url, width: w, height: h });
    img.src = url;
  }, 'image/png'));
}

const matchCache = new Map();
updateOverlapLabels();
applyLanguage();
setStatus(t('waiting'));
setTimeout(updateOpenCvStatus, 1000);
