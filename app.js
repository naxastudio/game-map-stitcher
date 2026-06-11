const fileInput = document.querySelector("#files");
const thumbs = document.querySelector("#thumbs");
const statusEl = document.querySelector("#status");
const opencvStatusEl = document.querySelector("#opencvStatus");
const stitchButton = document.querySelector("#stitch");
const downloadButton = document.querySelector("#download");
const editToggleButton = document.querySelector("#editToggle");
const manualLayoutButton = document.querySelector("#manualLayout");
const demoButton = document.querySelector("#demo");
const randomDemoButton = document.querySelector("#randomDemo");
const languageToggleButton = document.querySelector("#languageToggle");
const preview = document.querySelector("#preview");
const emptyState = document.querySelector("#emptyState");
const rowsInput = document.querySelector("#rows");
const colsInput = document.querySelector("#cols");
const coordScaleInput = document.querySelector("#coordScale");
const coordYDirectionInput = document.querySelector("#coordYDirection");
const detectCoordsButton = document.querySelector("#detectCoords");
const minOverlapInput = document.querySelector("#minOverlap");
const maxOverlapInput = document.querySelector("#maxOverlap");
const autoSortInput = document.querySelector("#autoSort");
const alphaMasksInput = document.querySelector("#alphaMasks");
const autoCropInput = document.querySelector("#autoCrop");
const minOverlapValue = document.querySelector("#minOverlapValue");
const maxOverlapValue = document.querySelector("#maxOverlapValue");
const sampleStepInput = document.querySelector("#sampleStep");
const matchEngineInput = document.querySelector("#matchEngine");
const gridSettings = document.querySelector(".grid-settings");
const coordinateSettings = document.querySelector(".coordinate-settings");
const dropZone = document.querySelector(".drop-zone");

let images = [];
let finalCanvas = null;
let currentPlacements = [];
let editMode = false;
let selectedPlacementIndex = -1;
let dragState = null;
let canvasOffset = { x: 0, y: 0 };
let nextImageId = 1;
let matchCache = new Map();
let featureCache = new Map();
let openCvReady = false;
let lastRenderOptions = { alphaMasks: true };
let tesseractLoadPromise = null;
const ANALYSIS_MAX_SIZE = 320;
let language = localStorage.getItem("mapStitcherLanguage") || "zh";

const translations = {
  zh: {
    appTitle: "游戏地图拼接器",
    appSubtitle: "上传地图截图，自动寻找重叠区域并导出完整大图。",
    chooseImages: "选择截图",
    chooseImagesHint: "支持 PNG / JPG，可点击或拖入多张图片",
    stitchMode: "拼接方式",
    modeHorizontal: "横向",
    modeVertical: "纵向",
    modeGrid: "网格",
    modeRandom: "多图随机",
    modeCoordinate: "坐标拼接",
    gridSettings: "网格设置",
    coordinateSettings: "坐标设置",
    pixelsPerCoord: "每坐标像素",
    yAxis: "Y 轴方向",
    yDown: "向下增加",
    yUp: "向上增加",
    detectCoords: "自动识别图上坐标",
    rows: "行数",
    cols: "列数",
    matchSettings: "匹配设置",
    matchEngine: "匹配引擎",
    enginePixel: "像素重叠",
    engineFeatures: "特征点匹配（SIFT/ORB）",
    autoSort: "自动判断截图顺序",
    alphaMasks: "Alpha 蒙版融合",
    autoCrop: "自动裁掉边框",
    minOverlap: "最小重叠",
    maxOverlap: "最大重叠",
    samplePrecision: "采样精度",
    precisionFast: "快速",
    precisionBalanced: "均衡",
    precisionAccurate: "更准",
    imageOrder: "截图顺序",
    noImages: "还没有上传截图",
    generateMap: "生成地图",
    manualLayout: "直接手动摆放",
    manualAdjust: "手动微调",
    finishAdjust: "完成微调",
    downloadPng: "下载 PNG",
    loadDemo: "载入测试截图",
    randomDemo: "随机测试截图",
    waiting: "等待上传截图。",
    previewArea: "预览区域",
    previewHint: "上传至少两张有重叠的游戏截图后生成地图。",
    needTwo: "至少需要上传两张截图。",
    overlapInvalid: "最大重叠需要大于最小重叠。",
    matching: "正在匹配重叠区域...",
    generatedAuto: (width, height) => `已自动排序并生成：${width} x ${height}。`,
    generatedManual: (width, height) => `已按当前顺序生成：${width} x ${height}。`,
    manualLayoutStatus: "手动摆放模式：拖动图片调整位置。方向键微调 1 像素，Shift + 方向键微调 10 像素。",
    editOn: "微调模式：在预览图上拖动单张截图调整位置。",
    editOff: "已退出微调模式，可下载 PNG。",
    demoBuilding: "正在生成测试截图...",
    randomDemoBuilding: "正在生成随机顺序测试截图...",
    demoResult: (passed, randomize, count, width, height) => `${passed ? "测试通过" : "测试完成但尺寸异常"}：${randomize ? "随机顺序也已自动排序，" : ""}已用 ${count} 张模拟截图拼成 ${width} x ${height} 地图。`,
    noImageFiles: "没有检测到图片文件。",
    reading: "正在读取截图...",
    filesLoaded: (count) => `已读取 ${count} 张截图。可拖动缩略图排序，或直接生成地图。`,
    moveAdjusted: "顺序已调整，请重新生成地图。",
    dragAdjusted: "顺序已拖动调整，请重新生成地图。",
    aiAnalyzing: "AI式自动拼图：正在分析所有图片之间的位置关系...",
    noReliableOverlap: "没有找到可靠的重叠关系。请确认截图之间有明显重叠。",
    missingCoordinates: "有些截图自动识别不到坐标，需要手动补 X/Y 坐标。",
    ocrLoading: "正在加载 OCR 识别模块...",
    ocrProgress: (index, total) => `正在识别坐标：${index} / ${total} 张...`,
    ocrDone: (found, total) => `坐标识别完成：成功识别 ${found} / ${total} 张。`,
    ocrUnavailable: "OCR 模块加载失败。请确认电脑可以访问网络，或之后改成本地 OCR 文件。",
    aiPlaced: (placed, total) => `AI式自动拼图：已定位 ${placed} / ${total} 张...`,
    aiPartial: (placed, unplaced) => `AI式自动拼图：自动定位 ${placed} 张，${unplaced} 张放在右侧待微调。`,
    aiComparing: (index, total) => `AI式自动拼图：正在比较第 ${index} / ${total} 张...`,
    autoSorting: (count, total) => `自动排序中：${count} / ${total} 张...`,
    siftUnavailable: "当前 OpenCV.js 没有检测到 SIFT 或 ORB 特征点接口，已改用像素重叠算法。",
    siftReady: "特征点匹配已开启。",
    opencvLoaded: "OpenCV.js 已加载。",
    opencvStatusLoading: "OpenCV：加载中...",
    opencvStatusReady: (sift, orb, bf, ransac) => `OpenCV：已加载 | SIFT: ${sift ? "可用" : "不可用"} | ORB: ${orb ? "可用" : "不可用"} | BFMatcher: ${bf ? "可用" : "不可用"} | RANSAC: ${ransac ? "可用" : "不可用"}`,
    moveUp: "向前",
    moveDown: "向后"
  },
  en: {
    appTitle: "Game Map Stitcher",
    appSubtitle: "Upload map screenshots, match overlapping areas, and export one complete map.",
    chooseImages: "Choose screenshots",
    chooseImagesHint: "PNG / JPG supported. Click or drag multiple images here.",
    stitchMode: "Stitch mode",
    modeHorizontal: "Horizontal",
    modeVertical: "Vertical",
    modeGrid: "Grid",
    modeRandom: "Multi-image auto",
    modeCoordinate: "Coordinates",
    gridSettings: "Grid settings",
    coordinateSettings: "Coordinate settings",
    pixelsPerCoord: "Pixels per coord",
    yAxis: "Y axis",
    yDown: "Y increases down",
    yUp: "Y increases up",
    detectCoords: "Auto-detect on-image coords",
    rows: "Rows",
    cols: "Columns",
    matchSettings: "Match settings",
    matchEngine: "Match engine",
    enginePixel: "Pixel overlap",
    engineFeatures: "Feature matching (SIFT/ORB)",
    autoSort: "Auto-detect order",
    alphaMasks: "Alpha mask blending",
    autoCrop: "Auto-crop borders",
    minOverlap: "Minimum overlap",
    maxOverlap: "Maximum overlap",
    samplePrecision: "Sampling precision",
    precisionFast: "Fast",
    precisionBalanced: "Balanced",
    precisionAccurate: "More accurate",
    imageOrder: "Screenshot order",
    noImages: "No screenshots uploaded yet",
    generateMap: "Generate map",
    manualLayout: "Manual layout",
    manualAdjust: "Fine tune",
    finishAdjust: "Finish tuning",
    downloadPng: "Download PNG",
    loadDemo: "Load demo screenshots",
    randomDemo: "Random-order demo",
    waiting: "Waiting for screenshots.",
    previewArea: "Preview",
    previewHint: "Upload at least two overlapping game screenshots to generate a map.",
    needTwo: "Upload at least two screenshots.",
    overlapInvalid: "Maximum overlap must be greater than minimum overlap.",
    matching: "Matching overlapping areas...",
    generatedAuto: (width, height) => `Auto-sorted and generated: ${width} x ${height}.`,
    generatedManual: (width, height) => `Generated in current order: ${width} x ${height}.`,
    manualLayoutStatus: "Manual layout mode: drag images to position them. Arrow keys move 1 px; Shift + arrow moves 10 px.",
    editOn: "Fine-tune mode: drag a screenshot in the preview to adjust its position.",
    editOff: "Fine-tune mode off. PNG is ready to download.",
    demoBuilding: "Generating demo screenshots...",
    randomDemoBuilding: "Generating random-order demo screenshots...",
    demoResult: (passed, randomize, count, width, height) => `${passed ? "Test passed" : "Test finished, but size looks off"}: ${randomize ? "Random order was auto-sorted. " : ""}${count} demo screenshots stitched into a ${width} x ${height} map.`,
    noImageFiles: "No image files detected.",
    reading: "Reading screenshots...",
    filesLoaded: (count) => `${count} screenshots loaded. Drag thumbnails to reorder, or generate the map directly.`,
    moveAdjusted: "Order changed. Generate the map again.",
    dragAdjusted: "Order changed by dragging. Generate the map again.",
    aiAnalyzing: "AI-style auto stitch: analyzing relative positions between all images...",
    noReliableOverlap: "No reliable overlap found. Make sure screenshots have clear overlapping areas.",
    missingCoordinates: "Some screenshots still need manual X/Y coordinates because OCR could not read them.",
    ocrLoading: "Loading OCR module...",
    ocrProgress: (index, total) => `Detecting coordinates: ${index} / ${total} images...`,
    ocrDone: (found, total) => `Coordinate detection finished: ${found} / ${total} recognized.`,
    ocrUnavailable: "OCR module failed to load. Check internet access, or switch to local OCR files later.",
    aiPlaced: (placed, total) => `AI-style auto stitch: positioned ${placed} / ${total} images...`,
    aiPartial: (placed, unplaced) => `AI-style auto stitch: positioned ${placed} images. ${unplaced} images were placed on the right for tuning.`,
    aiComparing: (index, total) => `AI-style auto stitch: comparing image ${index} / ${total}...`,
    autoSorting: (count, total) => `Auto-sorting: ${count} / ${total} images...`,
    siftUnavailable: "This OpenCV.js build does not expose SIFT or ORB feature APIs, so pixel overlap is being used.",
    siftReady: "Feature matching is enabled.",
    opencvLoaded: "OpenCV.js loaded.",
    opencvStatusLoading: "OpenCV: loading...",
    opencvStatusReady: (sift, orb, bf, ransac) => `OpenCV: loaded | SIFT: ${sift ? "available" : "not available"} | ORB: ${orb ? "available" : "not available"} | BFMatcher: ${bf ? "available" : "not available"} | RANSAC: ${ransac ? "available" : "not available"}`,
    moveUp: "Move up",
    moveDown: "Move down"
  }
};

function t(key, ...args) {
  const value = translations[language][key] || translations.zh[key] || key;
  return typeof value === "function" ? value(...args) : value;
}

window.onOpenCvScriptLoaded = () => {
  if (!window.cv) return;
  if (typeof window.cv.onRuntimeInitialized === "function") {
    const previousInit = window.cv.onRuntimeInitialized;
    window.cv.onRuntimeInitialized = () => {
      previousInit();
      openCvReady = true;
      updateOpenCvStatus();
      setStatus(t("opencvLoaded"));
    };
  } else {
    openCvReady = true;
    updateOpenCvStatus();
    setStatus(t("opencvLoaded"));
  }
};

setTimeout(() => {
  if (window.cv && !openCvReady) {
    openCvReady = true;
    updateOpenCvStatus();
  }
}, 1000);

function applyLanguage() {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  languageToggleButton.textContent = language === "zh" ? "EN" : "中文";
  editToggleButton.textContent = editMode ? t("finishAdjust") : t("manualAdjust");
  if (!images.length) thumbs.textContent = t("noImages");
  updateOpenCvStatus();
}

function updateOpenCvStatus() {
  if (!opencvStatusEl) return;
  if (!window.cv || !openCvReady) {
    opencvStatusEl.textContent = t("opencvStatusLoading");
    return;
  }

  opencvStatusEl.textContent = t(
    "opencvStatusReady",
    hasSiftSupport(),
    hasOrbSupport(),
    Boolean(window.cv.BFMatcher),
    Boolean(window.cv.findHomography && window.cv.RANSAC !== undefined)
  );
}

fileInput.addEventListener("change", async (event) => {
  const files = Array.from(event.target.files || []);
  await handleFiles(files);
});

languageToggleButton.addEventListener("click", () => {
  language = language === "zh" ? "en" : "zh";
  localStorage.setItem("mapStitcherLanguage", language);
  applyLanguage();
});

detectCoordsButton.addEventListener("click", async () => {
  if (!images.length) return;

  try {
    detectCoordsButton.disabled = true;
    const found = await detectCoordinatesForImages({ force: true });
    renderThumbs();
    setStatus(t("ocrDone", found, images.length), found === 0);
  } catch (error) {
    console.warn(error);
    setStatus(t("ocrUnavailable"), true);
  } finally {
    detectCoordsButton.disabled = images.length === 0;
  }
});

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropZone.classList.add("drag-over");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropZone.classList.remove("drag-over");
  });
});

dropZone.addEventListener("drop", async (event) => {
  const files = Array.from(event.dataTransfer.files || [])
    .filter((file) => file.type.startsWith("image/"));
  await handleFiles(files);
});

document.querySelectorAll("input[name='mode']").forEach((input) => {
  input.addEventListener("change", () => {
    const mode = getMode();
    gridSettings.hidden = mode !== "grid";
    coordinateSettings.hidden = mode !== "coordinate";
    if (getMode() === "random") {
      autoSortInput.checked = true;
    }
  });
});

[minOverlapInput, maxOverlapInput].forEach((input) => {
  input.addEventListener("input", updateOverlapLabels);
});

stitchButton.addEventListener("click", async () => {
  if (images.length < 2) {
    setStatus(t("needTwo"), true);
    return;
  }

  const mode = getMode();
  const options = getOptions();
  if (options.matchEngine === "features" && !hasFeatureSupport()) {
    options.matchEngine = "pixel";
    matchEngineInput.value = "pixel";
    setStatus(t("siftUnavailable"), true);
    await waitForUi();
  }
  if (options.minOverlap >= options.maxOverlap) {
    setStatus(t("overlapInvalid"), true);
    return;
  }

  try {
    stitchButton.disabled = true;
    downloadButton.disabled = true;
    setStatus(t("matching"));
    scrollToPreview();
    if (mode === "coordinate" && hasMissingCoordinates(images)) {
      await detectCoordinatesForImages({ force: false });
      renderThumbs();
    }
    const placements = await buildPlacements(mode, options);
    lastRenderOptions = options;
    currentPlacements = normalizePlacements(placements);
    finalCanvas = drawComposite(currentPlacements, editMode, lastRenderOptions);
    showCanvas(finalCanvas);
    scrollToPreview();
    downloadButton.disabled = false;
    editToggleButton.disabled = false;
    setStatus(options.autoSort ? t("generatedAuto", finalCanvas.width, finalCanvas.height) : t("generatedManual", finalCanvas.width, finalCanvas.height));
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    stitchButton.disabled = false;
  }
});

downloadButton.addEventListener("click", () => {
  if (!finalCanvas) return;

  const link = document.createElement("a");
  link.download = `game-map-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.png`;
  link.href = finalCanvas.toDataURL("image/png");
  link.click();
});

manualLayoutButton.addEventListener("click", () => {
  if (!images.length) return;
  currentPlacements = createManualLayout(images);
  editMode = true;
  selectedPlacementIndex = 0;
  editToggleButton.disabled = false;
  downloadButton.disabled = false;
  editToggleButton.textContent = t("finishAdjust");
  preview.classList.add("editing");
  lastRenderOptions = getOptions();
  finalCanvas = drawComposite(currentPlacements, true, lastRenderOptions);
  showCanvas(finalCanvas);
  scrollToPreview();
  setStatus(t("manualLayoutStatus"));
});

editToggleButton.addEventListener("click", () => {
  if (!currentPlacements.length) return;
  editMode = !editMode;
  selectedPlacementIndex = editMode ? 0 : -1;
  editToggleButton.textContent = editMode ? t("finishAdjust") : t("manualAdjust");
  preview.classList.toggle("editing", editMode);
  finalCanvas = drawComposite(currentPlacements, editMode, lastRenderOptions);
  showCanvas(finalCanvas);
  setStatus(editMode ? t("editOn") : t("editOff"));
});

preview.addEventListener("pointerdown", (event) => {
  if (!editMode || !currentPlacements.length) return;
  const point = getCanvasPoint(event);
  const index = findPlacementAt(point.x, point.y);
  if (index === -1) return;

  selectedPlacementIndex = index;
  const placement = currentPlacements[index];
  dragState = {
    pointerId: event.pointerId,
    startX: point.x,
    startY: point.y,
    originalX: placement.x,
    originalY: placement.y
  };
  preview.setPointerCapture(event.pointerId);
  preview.classList.add("dragging");
  event.preventDefault();
});

preview.addEventListener("pointermove", (event) => {
  if (!dragState || selectedPlacementIndex === -1) return;
  const point = getCanvasPoint(event);
  const placement = currentPlacements[selectedPlacementIndex];
  placement.x = Math.round(dragState.originalX + point.x - dragState.startX);
  placement.y = Math.round(dragState.originalY + point.y - dragState.startY);
  finalCanvas = drawComposite(currentPlacements, editMode, lastRenderOptions);
  showCanvas(finalCanvas);
});

preview.addEventListener("pointerup", finishDrag);
preview.addEventListener("pointercancel", finishDrag);

document.addEventListener("keydown", (event) => {
  if (!editMode || selectedPlacementIndex === -1) return;
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;

  const placement = currentPlacements[selectedPlacementIndex];
  const step = event.shiftKey ? 10 : 1;
  if (event.key === "ArrowLeft") placement.x -= step;
  if (event.key === "ArrowRight") placement.x += step;
  if (event.key === "ArrowUp") placement.y -= step;
  if (event.key === "ArrowDown") placement.y += step;
  finalCanvas = drawComposite(currentPlacements, editMode, lastRenderOptions);
  showCanvas(finalCanvas);
  event.preventDefault();
});

demoButton.addEventListener("click", async () => {
  await runDemo(false);
});

randomDemoButton.addEventListener("click", async () => {
  await runDemo(true);
});

async function runDemo(randomize) {
  setStatus(randomize ? t("randomDemoBuilding") : t("demoBuilding"));
  images = await createDemoImages();
  if (randomize) {
    images = shuffleImages(images);
  }
  document.querySelector(`input[name='mode'][value='${randomize ? "random" : "horizontal"}']`).checked = true;
  gridSettings.hidden = getMode() !== "grid";
  autoSortInput.checked = true;
  minOverlapInput.value = 20;
  maxOverlapInput.value = 50;
  sampleStepInput.value = 5;
  updateOverlapLabels();
  renderThumbs();

  matchCache = new Map();
  lastRenderOptions = getOptions();
  const placements = await buildPlacements(randomize ? "random" : "horizontal", lastRenderOptions);
  finalCanvas = drawComposite(placements, false, lastRenderOptions);
  showCanvas(finalCanvas);
  downloadButton.disabled = false;
  editToggleButton.disabled = false;
  manualLayoutButton.disabled = false;
  const passed = finalCanvas.width === 880 && finalCanvas.height === 300;
  setStatus(t("demoResult", passed, randomize, images.length, finalCanvas.width, finalCanvas.height), !passed);
}

function shuffleImages(sourceImages) {
  const shuffled = [...sourceImages];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

applyLanguage();
updateOverlapLabels();

async function handleFiles(files) {
  if (!files.length) {
    setStatus(t("noImageFiles"), true);
    return;
  }

  setStatus(t("reading"));
  matchCache = new Map();
  clearFeatureCache();
  featureCache = new Map();
  images = await Promise.all(files.map((file) => loadImageFile(file, getOptions())));
  renderThumbs();
  downloadButton.disabled = true;
  editToggleButton.disabled = true;
  manualLayoutButton.disabled = false;
  detectCoordsButton.disabled = false;
  currentPlacements = [];
  editMode = false;
  selectedPlacementIndex = -1;
  finalCanvas = null;
  currentPlacements = [];
  clearPreview();
  setStatus(t("filesLoaded", images.length));
}

function getMode() {
  return document.querySelector("input[name='mode']:checked").value;
}

function getOptions() {
  return {
    minOverlap: Number(minOverlapInput.value) / 100,
    maxOverlap: Number(maxOverlapInput.value) / 100,
    sampleStep: Number(sampleStepInput.value),
    matchEngine: matchEngineInput.value,
    coordScale: Math.max(1, Number(coordScaleInput.value) || 1),
    coordYDirection: coordYDirectionInput.value,
    rows: Math.max(1, Number(rowsInput.value) || 1),
    cols: Math.max(1, Number(colsInput.value) || 1),
    autoSort: autoSortInput.checked,
    alphaMasks: alphaMasksInput.checked,
    autoCrop: autoCropInput.checked
  };
}

function hasSiftSupport() {
  return Boolean(window.cv && (
    typeof window.cv.SIFT_create === "function" ||
    (window.cv.SIFT && typeof window.cv.SIFT.create === "function") ||
    typeof window.cv.SIFT === "function"
  ));
}

function hasOrbSupport() {
  return Boolean(window.cv && (
    typeof window.cv.ORB_create === "function" ||
    (window.cv.ORB && typeof window.cv.ORB.create === "function") ||
    typeof window.cv.ORB === "function"
  ));
}

function hasFeatureSupport() {
  return Boolean(window.cv && window.cv.BFMatcher && window.cv.findHomography && (hasSiftSupport() || hasOrbSupport()));
}

function clearFeatureCache() {
  featureCache.forEach((features) => {
    if (features.keypoints) features.keypoints.delete();
    if (features.descriptors) features.descriptors.delete();
  });
}

function updateOverlapLabels() {
  minOverlapValue.textContent = `${minOverlapInput.value}%`;
  maxOverlapValue.textContent = `${maxOverlapInput.value}%`;
}

function setStatus(message, warn = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("warn", warn);
}

function clearPreview() {
  const ctx = preview.getContext("2d");
  preview.width = 0;
  preview.height = 0;
  ctx.clearRect(0, 0, preview.width, preview.height);
  emptyState.hidden = false;
}

function showCanvas(canvas) {
  preview.width = canvas.width;
  preview.height = canvas.height;
  preview.getContext("2d").drawImage(canvas, 0, 0);
  emptyState.hidden = true;
}

function loadImageFile(file, options = getOptions()) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const processed = options.autoCrop ? autoCropImage(img) : null;
      const parsedCoords = parseCoordinatesFromName(file.name);
      resolve({
        file,
        id: nextImageId++,
        name: file.name,
        originalImg: img,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        crop: processed ? processed.crop : { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight },
        img: processed ? processed.img : img,
        width: processed ? processed.width : img.naturalWidth,
        height: processed ? processed.height : img.naturalHeight,
        coordX: parsedCoords ? parsedCoords.x : null,
        coordY: parsedCoords ? parsedCoords.y : null,
        url: processed ? processed.url : url,
        originalUrl: url
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`无法读取图片：${file.name}`));
    };
    img.src = url;
  });
}

function parseCoordinatesFromName(name) {
  const patterns = [
    /x\s*[-_= ]\s*(-?\d+(?:\.\d+)?).*?y\s*[-_= ]\s*(-?\d+(?:\.\d+)?)/i,
    /(-?\d+(?:\.\d+)?)\s*[,，_ -]\s*(-?\d+(?:\.\d+)?)/
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return { x: Number(match[1]), y: Number(match[2]) };
    }
  }
  return null;
}

function autoCropImage(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const crop = detectBorderCrop(imageData, canvas.width, canvas.height);

  if (crop.x === 0 && crop.y === 0 && crop.width === canvas.width && crop.height === canvas.height) {
    return null;
  }

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = crop.width;
  croppedCanvas.height = crop.height;
  croppedCanvas.getContext("2d").drawImage(canvas, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  const croppedUrl = croppedCanvas.toDataURL("image/png");
  const croppedImg = new Image();
  croppedImg.src = croppedUrl;

  return {
    img: croppedImg,
    width: crop.width,
    height: crop.height,
    url: croppedUrl,
    crop
  };
}

function detectBorderCrop(imageData, width, height) {
  const maxCropX = Math.floor(width * 0.2);
  const maxCropY = Math.floor(height * 0.2);
  const background = estimateCornerColor(imageData.data, width, height);
  const threshold = 34;

  let left = 0;
  while (left < maxCropX && columnLooksLikeBorder(imageData.data, width, height, left, background, threshold)) left += 1;

  let right = width - 1;
  while (right > width - 1 - maxCropX && columnLooksLikeBorder(imageData.data, width, height, right, background, threshold)) right -= 1;

  let top = 0;
  while (top < maxCropY && rowLooksLikeBorder(imageData.data, width, height, top, background, threshold)) top += 1;

  let bottom = height - 1;
  while (bottom > height - 1 - maxCropY && rowLooksLikeBorder(imageData.data, width, height, bottom, background, threshold)) bottom -= 1;

  if (right - left < width * 0.5 || bottom - top < height * 0.5) {
    return { x: 0, y: 0, width, height };
  }

  return {
    x: left,
    y: top,
    width: right - left + 1,
    height: bottom - top + 1
  };
}

function estimateCornerColor(data, width, height) {
  const samples = [];
  const marginX = Math.max(1, Math.floor(width * 0.04));
  const marginY = Math.max(1, Math.floor(height * 0.04));
  const corners = [
    [0, 0],
    [width - marginX, 0],
    [0, height - marginY],
    [width - marginX, height - marginY]
  ];

  corners.forEach(([startX, startY]) => {
    for (let y = startY; y < Math.min(height, startY + marginY); y += 4) {
      for (let x = startX; x < Math.min(width, startX + marginX); x += 4) {
        const index = (y * width + x) * 4;
        samples.push([data[index], data[index + 1], data[index + 2]]);
      }
    }
  });

  return medianColor(samples);
}

function medianColor(samples) {
  if (!samples.length) return [0, 0, 0];
  return [0, 1, 2].map((channel) => {
    const values = samples.map((sample) => sample[channel]).sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)];
  });
}

function columnLooksLikeBorder(data, width, height, x, color, threshold) {
  let similar = 0;
  let total = 0;
  for (let y = 0; y < height; y += 3) {
    const index = (y * width + x) * 4;
    if (rgbDistance(data[index], data[index + 1], data[index + 2], color) < threshold) similar += 1;
    total += 1;
  }
  return similar / Math.max(1, total) > 0.82;
}

function rowLooksLikeBorder(data, width, height, y, color, threshold) {
  let similar = 0;
  let total = 0;
  for (let x = 0; x < width; x += 3) {
    const index = (y * width + x) * 4;
    if (rgbDistance(data[index], data[index + 1], data[index + 2], color) < threshold) similar += 1;
    total += 1;
  }
  return similar / Math.max(1, total) > 0.82;
}

function rgbDistance(r, g, b, color) {
  return Math.sqrt(
    (r - color[0]) * (r - color[0]) +
    (g - color[1]) * (g - color[1]) +
    (b - color[2]) * (b - color[2])
  );
}

function renderThumbs() {
  thumbs.innerHTML = "";
  thumbs.classList.toggle("empty", images.length === 0);

  if (!images.length) {
    thumbs.textContent = t("noImages");
    return;
  }

  images.forEach((image, index) => {
    const item = document.createElement("div");
    item.className = "thumb";
    item.draggable = true;
    item.dataset.index = String(index);
    item.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", String(index));
      event.dataTransfer.effectAllowed = "move";
      item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      thumbs.querySelectorAll(".drop-target").forEach((node) => node.classList.remove("drop-target"));
    });
    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      item.classList.add("drop-target");
    });
    item.addEventListener("dragleave", () => {
      item.classList.remove("drop-target");
    });
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      item.classList.remove("drop-target");
      const fromIndex = Number(event.dataTransfer.getData("text/plain"));
      moveImageTo(fromIndex, index);
    });

    const previewImg = document.createElement("img");
    previewImg.src = image.url;
    previewImg.alt = image.name;

    const meta = document.createElement("div");
    const sizeText = image.originalWidth && (image.originalWidth !== image.width || image.originalHeight !== image.height)
      ? `${image.originalWidth} x ${image.originalHeight} -> ${image.width} x ${image.height}`
      : `${image.width} x ${image.height}`;
    meta.innerHTML = `<strong>${index + 1}. ${escapeHtml(image.name)}</strong><span>${sizeText}</span>`;

    const coordInputs = document.createElement("div");
    coordInputs.className = "coord-inputs";
    coordInputs.innerHTML = `
      <label>X <input type="number" step="any" value="${image.coordX ?? ""}" data-axis="x"></label>
      <label>Y <input type="number" step="any" value="${image.coordY ?? ""}" data-axis="y"></label>
    `;
    coordInputs.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => {
        const value = input.value === "" ? null : Number(input.value);
        if (input.dataset.axis === "x") image.coordX = value;
        if (input.dataset.axis === "y") image.coordY = value;
      });
    });
    meta.append(coordInputs);

    const moves = document.createElement("div");
    moves.className = "move-buttons";
    const up = document.createElement("button");
    up.type = "button";
    up.textContent = "↑";
    up.disabled = index === 0;
    up.title = t("moveUp");
    up.addEventListener("click", () => moveImage(index, -1));

    const down = document.createElement("button");
    down.type = "button";
    down.textContent = "↓";
    down.disabled = index === images.length - 1;
    down.title = t("moveDown");
    down.addEventListener("click", () => moveImage(index, 1));

    moves.append(up, down);
    item.append(previewImg, meta, moves);
    thumbs.append(item);
  });
}

function moveImage(index, delta) {
  const nextIndex = index + delta;
  if (nextIndex < 0 || nextIndex >= images.length) return;
  const [image] = images.splice(index, 1);
  images.splice(nextIndex, 0, image);
  renderThumbs();
  downloadButton.disabled = true;
  editToggleButton.disabled = true;
  manualLayoutButton.disabled = images.length === 0;
  finalCanvas = null;
  currentPlacements = [];
  setStatus(t("moveAdjusted"));
}

function moveImageTo(fromIndex, toIndex) {
  if (fromIndex === toIndex || Number.isNaN(fromIndex) || Number.isNaN(toIndex)) return;
  if (fromIndex < 0 || fromIndex >= images.length || toIndex < 0 || toIndex >= images.length) return;
  const [image] = images.splice(fromIndex, 1);
  images.splice(toIndex, 0, image);
  renderThumbs();
  downloadButton.disabled = true;
  editToggleButton.disabled = true;
  manualLayoutButton.disabled = images.length === 0;
  finalCanvas = null;
  currentPlacements = [];
  setStatus(t("dragAdjusted"));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

async function buildPlacements(mode, options) {
  if (mode === "coordinate") {
    return placeByCoordinates(images, options);
  }

  if (mode === "random") {
    return placeRandomImages(images, options);
  }

  const sourceImages = options.autoSort && mode !== "grid"
    ? await autoOrderImages(images, mode, options)
    : images;

  if (options.autoSort && mode !== "grid") {
    images = sourceImages;
    renderThumbs();
  }

  if (mode === "horizontal") return placeHorizontal(sourceImages, options, 0, 0);
  if (mode === "vertical") return placeVertical(sourceImages, options, 0, 0);

  const gridImages = options.autoSort ? await autoOrderImages(images, "horizontal", options) : images;
  if (options.autoSort) {
    images = gridImages;
    renderThumbs();
  }

  const placements = [];
  const rowFirstPlacements = [];
  const rows = Math.ceil(gridImages.length / options.cols);
  rowsInput.value = rows;
  for (let row = 0; row < rows; row += 1) {
    const rowImages = gridImages.slice(row * options.cols, row * options.cols + options.cols);
    if (!rowImages.length) continue;
    if (row === 0) {
      const rowPlacements = placeHorizontal(rowImages, options, 0, 0);
      placements.push(...rowPlacements);
      rowFirstPlacements.push(rowPlacements[0]);
      continue;
    }

    const aboveFirst = gridImages[(row - 1) * options.cols];
    const currentFirst = rowImages[0];
    const overlap = findBestOverlap(aboveFirst, currentFirst, "vertical", options);
    const y = rowFirstPlacements[row - 1].y + aboveFirst.height - overlap;
    const rowPlacements = placeHorizontal(rowImages, options, 0, y);
    placements.push(...rowPlacements);
    rowFirstPlacements.push(rowPlacements[0]);
  }
  return placements;
}

async function placeRandomImages(sourceImages, options) {
  if (sourceImages.length < 2) {
    return sourceImages.map((image) => ({ image, x: 0, y: 0 }));
  }

  setStatus(t("aiAnalyzing"));
  const edges = await buildPositionEdges(sourceImages, options);
  if (!edges.length) {
    throw new Error(t("noReliableOverlap"));
  }

  const placementsById = new Map();
  const seed = edges[0];
  placementsById.set(seed.from.id, { image: seed.from, x: 0, y: 0 });
  placementsById.set(seed.to.id, { image: seed.to, x: seed.dx, y: seed.dy });
  setStatus(t("aiPlaced", placementsById.size, sourceImages.length));
  await waitForUi();

  let changed = true;
  while (changed && placementsById.size < sourceImages.length) {
    changed = false;

    for (const edge of edges) {
      const fromPlacement = placementsById.get(edge.from.id);
      const toPlacement = placementsById.get(edge.to.id);

      if (fromPlacement && !toPlacement) {
        const proposed = {
          image: edge.to,
          x: Math.round(fromPlacement.x + edge.dx),
          y: Math.round(fromPlacement.y + edge.dy)
        };
        if (isPlacementAcceptable(proposed, Array.from(placementsById.values()))) {
          placementsById.set(edge.to.id, proposed);
          changed = true;
        }
      } else if (!fromPlacement && toPlacement) {
        const proposed = {
          image: edge.from,
          x: Math.round(toPlacement.x - edge.dx),
          y: Math.round(toPlacement.y - edge.dy)
        };
        if (isPlacementAcceptable(proposed, Array.from(placementsById.values()))) {
          placementsById.set(edge.from.id, proposed);
          changed = true;
        }
      }

      if (changed) {
        setStatus(t("aiPlaced", placementsById.size, sourceImages.length));
        await waitForUi();
      }
    }
  }

  const placements = Array.from(placementsById.values());
  const unplaced = sourceImages.filter((image) => !placementsById.has(image.id));
  if (unplaced.length) {
    const bounds = getPlacementBounds(placements);
    createManualLayout(unplaced).forEach((placement) => {
      placement.x += bounds.maxX + 80;
      placement.y += bounds.minY;
      placements.push(placement);
    });
    setStatus(t("aiPartial", placementsById.size, unplaced.length));
  }

  return placements;
}

async function buildPositionEdges(sourceImages, options) {
  if (options.matchEngine === "features") {
    return buildFeaturePositionEdges(sourceImages, options);
  }

  const edges = [];
  for (let i = 0; i < sourceImages.length; i += 1) {
    for (let j = i + 1; j < sourceImages.length; j += 1) {
      const a = sourceImages[i];
      const b = sourceImages[j];
      const candidates = [
        createEdgeCandidate(a, b, "right", options),
        createEdgeCandidate(a, b, "left", options),
        createEdgeCandidate(a, b, "bottom", options),
        createEdgeCandidate(a, b, "top", options)
      ].sort((left, right) => left.score - right.score);

      const best = candidates[0];
      const second = candidates[1];
      const confidence = second ? second.score / Math.max(1, best.score) : 99;
      if (confidence > 1.06) {
        edges.push({ ...best, confidence });
      }
    }
    if (i % 2 === 0) {
      setStatus(t("aiComparing", i + 1, sourceImages.length));
      await waitForUi();
    }
  }

  edges.sort((a, b) => {
    const confidenceDelta = b.confidence - a.confidence;
    if (Math.abs(confidenceDelta) > 0.08) return confidenceDelta;
    return a.score - b.score;
  });
  return edges;
}

async function buildFeaturePositionEdges(sourceImages, options) {
  const edges = [];

  for (let i = 0; i < sourceImages.length; i += 1) {
    for (let j = i + 1; j < sourceImages.length; j += 1) {
      const edge = createFeatureEdgeCandidate(sourceImages[i], sourceImages[j]);
      if (edge) {
        edges.push(edge);
      }
    }
    if (i % 2 === 0) {
      setStatus(t("aiComparing", i + 1, sourceImages.length));
      await waitForUi();
    }
  }

  edges.sort((a, b) => {
    const inlierDelta = b.inliers - a.inliers;
    if (Math.abs(inlierDelta) > 4) return inlierDelta;
    return a.score - b.score;
  });
  return edges;
}

function createFeatureEdgeCandidate(a, b) {
  if (!hasFeatureSupport()) {
    return null;
  }

  let matcher = null;
  let matches = null;
  let srcPoints = null;
  let dstPoints = null;
  let mask = null;
  let homography = null;

  try {
    const featureA = getImageFeatures(a);
    const featureB = getImageFeatures(b);
    if (!featureA || !featureB || featureA.descriptors.empty() || featureB.descriptors.empty()) {
      return null;
    }

    matcher = new cv.BFMatcher(featureA.normType, false);
    matches = new cv.DMatchVectorVector();
    matcher.knnMatch(featureA.descriptors, featureB.descriptors, matches, 2);

    const src = [];
    const dst = [];
    for (let index = 0; index < matches.size(); index += 1) {
      const pair = matches.get(index);
      if (pair.size() < 2) continue;

      const first = pair.get(0);
      const second = pair.get(1);
      const ratioLimit = featureA.type === "ORB" ? 0.82 : 0.72;
      if (first.distance >= second.distance * ratioLimit) continue;

      const pointA = featureA.keypoints.get(first.queryIdx).pt;
      const pointB = featureB.keypoints.get(first.trainIdx).pt;
      src.push(pointA.x, pointA.y);
      dst.push(pointB.x, pointB.y);
    }

    if (src.length / 2 < 8) return null;

    srcPoints = cv.matFromArray(src.length / 2, 1, cv.CV_32FC2, src);
    dstPoints = cv.matFromArray(dst.length / 2, 1, cv.CV_32FC2, dst);
    mask = new cv.Mat();
    homography = cv.findHomography(srcPoints, dstPoints, cv.RANSAC, 4, mask);
    if (!homography || homography.empty()) return null;

    const inliers = countMaskInliers(mask);
    if (inliers < 8) return null;

    const h = homography.data64F && homography.data64F.length ? homography.data64F : homography.data32F;
    if (!h || h.length < 9) return null;

    const dx = Math.round(-h[2] / featureA.scaleX);
    const dy = Math.round(-h[5] / featureA.scaleY);
    const score = 100000 / Math.max(1, inliers);

    return {
      from: a,
      to: b,
      side: "sift",
      dx,
      dy,
      score,
      confidence: inliers,
      inliers
    };
  } catch (error) {
    console.warn("Feature matching failed", error);
    return null;
  } finally {
    if (homography) homography.delete();
    if (mask) mask.delete();
    if (srcPoints) srcPoints.delete();
    if (dstPoints) dstPoints.delete();
    if (matches) matches.delete();
    if (matcher) matcher.delete();
  }
}

function getImageFeatures(image) {
  if (featureCache.has(image.id)) return featureCache.get(image.id);

  let detector = null;
  let source = null;
  let gray = null;
  let mask = null;
  try {
    const analysis = getAnalysisImage(image);
    source = cv.imread(analysis.canvas);
    gray = new cv.Mat();
    cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY);

    const detectorInfo = createFeatureDetector();
    detector = detectorInfo.detector;
    const keypoints = new cv.KeyPointVector();
    const descriptors = new cv.Mat();
    mask = new cv.Mat();
    detector.detectAndCompute(gray, mask, keypoints, descriptors);

    const features = {
      keypoints,
      descriptors,
      normType: detectorInfo.normType,
      type: detectorInfo.type,
      scaleX: analysis.scaleX,
      scaleY: analysis.scaleY
    };
    featureCache.set(image.id, features);
    return features;
  } catch (error) {
    console.warn("Feature extraction failed", error);
    return null;
  } finally {
    if (detector) detector.delete();
    if (source) source.delete();
    if (gray) gray.delete();
    if (mask) mask.delete();
  }
}

function createFeatureDetector() {
  if (hasSiftSupport()) {
    if (typeof cv.SIFT_create === "function") {
      return { detector: cv.SIFT_create(), normType: cv.NORM_L2, type: "SIFT" };
    }
    if (cv.SIFT && typeof cv.SIFT.create === "function") {
      return { detector: cv.SIFT.create(), normType: cv.NORM_L2, type: "SIFT" };
    }
    return { detector: new cv.SIFT(), normType: cv.NORM_L2, type: "SIFT" };
  }

  if (typeof cv.ORB_create === "function") {
    return { detector: cv.ORB_create(), normType: cv.NORM_HAMMING, type: "ORB" };
  }
  if (cv.ORB && typeof cv.ORB.create === "function") {
    return { detector: cv.ORB.create(), normType: cv.NORM_HAMMING, type: "ORB" };
  }
  return { detector: new cv.ORB(), normType: cv.NORM_HAMMING, type: "ORB" };
}

function countMaskInliers(mask) {
  if (!mask || mask.empty()) return 0;
  let total = 0;
  const data = mask.data || mask.data8U;
  for (let index = 0; index < data.length; index += 1) {
    if (data[index]) total += 1;
  }
  return total;
}

function createEdgeCandidate(a, b, side, options) {
  const match = findBestNeighborDetails(a, b, side, options);
  if (side === "right") {
    return { from: a, to: b, side, dx: a.width - match.overlap, dy: match.offset, score: match.score };
  }
  if (side === "left") {
    return { from: a, to: b, side, dx: -b.width + match.overlap, dy: match.offset, score: match.score };
  }
  if (side === "bottom") {
    return { from: a, to: b, side, dx: match.offset, dy: a.height - match.overlap, score: match.score };
  }
  return { from: a, to: b, side, dx: match.offset, dy: -b.height + match.overlap, score: match.score };
}

function isPlacementAcceptable(candidate, placements) {
  for (const placement of placements) {
    const ratio = getOverlapArea({
      x: candidate.x,
      y: candidate.y,
      width: candidate.image.width,
      height: candidate.image.height
    }, {
      x: placement.x,
      y: placement.y,
      width: placement.image.width,
      height: placement.image.height
    }) / Math.max(1, candidate.image.width * candidate.image.height);

    if (ratio > 0.68) return false;
  }
  return true;
}

function getCollisionPenalty(match, placements, anchorPlacement) {
  const candidateBox = {
    x: match.x,
    y: match.y,
    width: match.candidate.width,
    height: match.candidate.height
  };
  let penalty = 0;

  placements.forEach((placement) => {
    if (placement === anchorPlacement) return;
    const overlapArea = getOverlapArea(candidateBox, {
      x: placement.x,
      y: placement.y,
      width: placement.image.width,
      height: placement.image.height
    });
    const candidateArea = candidateBox.width * candidateBox.height;
    const ratio = overlapArea / Math.max(1, candidateArea);
    if (ratio > 0.35) {
      penalty += ratio * 200000;
    }
  });

  return penalty;
}

function getOverlapArea(a, b) {
  const left = Math.max(a.x, b.x);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const top = Math.max(a.y, b.y);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  return Math.max(0, right - left) * Math.max(0, bottom - top);
}

function getFastNeighborMatch(placed, candidate, side, options) {
  if (side === "right") {
    const match = findBestOverlapDetails(placed.image, candidate, "horizontal", options);
    return {
      side,
      score: match.score,
      x: placed.x + placed.image.width - match.overlap,
      y: placed.y
    };
  }

  if (side === "left") {
    const match = findBestOverlapDetails(candidate, placed.image, "horizontal", options);
    return {
      side,
      score: match.score,
      x: placed.x - candidate.width + match.overlap,
      y: placed.y
    };
  }

  if (side === "bottom") {
    const match = findBestOverlapDetails(placed.image, candidate, "vertical", options);
    return {
      side,
      score: match.score,
      x: placed.x,
      y: placed.y + placed.image.height - match.overlap
    };
  }

  const match = findBestOverlapDetails(candidate, placed.image, "vertical", options);
  return {
    side,
    score: match.score,
    x: placed.x,
    y: placed.y - candidate.height + match.overlap
  };
}

function getNeighborMatch(placed, candidate, side, options) {
  if (side === "right") {
    const match = findBestNeighborDetails(placed.image, candidate, side, options);
    return {
      score: match.score,
      x: placed.x + placed.image.width - match.overlap,
      y: placed.y + match.offset
    };
  }

  if (side === "left") {
    const match = findBestNeighborDetails(placed.image, candidate, side, options);
    return {
      score: match.score,
      x: placed.x - candidate.width + match.overlap,
      y: placed.y + match.offset
    };
  }

  if (side === "bottom") {
    const match = findBestNeighborDetails(placed.image, candidate, side, options);
    return {
      score: match.score,
      x: placed.x + match.offset,
      y: placed.y + placed.image.height - match.overlap
    };
  }

  const match = findBestNeighborDetails(placed.image, candidate, side, options);
  return {
    score: match.score,
    x: placed.x + match.offset,
    y: placed.y - candidate.height + match.overlap
  };
}

async function autoOrderImages(sourceImages, direction, options) {
  if (sourceImages.length <= 2) return [...sourceImages];

  let bestOrder = [...sourceImages];
  let bestTotal = Number.POSITIVE_INFINITY;

  for (const startImage of sourceImages) {
    const remaining = sourceImages.filter((image) => image !== startImage);
    const order = [startImage];
    let total = 0;

    while (remaining.length) {
      const previous = order[order.length - 1];
      let bestIndex = 0;
      let bestMatch = { score: Number.POSITIVE_INFINITY };

      remaining.forEach((candidate, index) => {
        const match = findBestOverlapDetails(previous, candidate, direction, options);
        if (match.score < bestMatch.score) {
          bestMatch = match;
          bestIndex = index;
        }
      });

      total += bestMatch.score;
      order.push(remaining.splice(bestIndex, 1)[0]);
      if (order.length % 4 === 0) {
        setStatus(t("autoSorting", order.length, sourceImages.length));
        await waitForUi();
      }
    }

    if (total < bestTotal) {
      bestTotal = total;
      bestOrder = order;
    }
  }

  return bestOrder;
}

function placeHorizontal(sourceImages, options, startX, startY) {
  const placements = [{ image: sourceImages[0], x: startX, y: startY }];
  let x = startX;

  for (let i = 1; i < sourceImages.length; i += 1) {
    const previous = sourceImages[i - 1];
    const current = sourceImages[i];
    const overlap = findBestOverlap(previous, current, "horizontal", options);
    x += previous.width - overlap;
    placements.push({ image: current, x, y: startY });
  }

  return placements;
}

function placeVertical(sourceImages, options, startX, startY) {
  const placements = [{ image: sourceImages[0], x: startX, y: startY }];
  let y = startY;

  for (let i = 1; i < sourceImages.length; i += 1) {
    const previous = sourceImages[i - 1];
    const current = sourceImages[i];
    const overlap = findBestOverlap(previous, current, "vertical", options);
    y += previous.height - overlap;
    placements.push({ image: current, x: startX, y });
  }

  return placements;
}

function createManualLayout(sourceImages) {
  if (!sourceImages.length) return [];

  const maxWidth = Math.max(...sourceImages.map((image) => image.width));
  const maxHeight = Math.max(...sourceImages.map((image) => image.height));
  const cols = Math.max(1, Math.ceil(Math.sqrt(sourceImages.length)));
  const stepX = Math.max(80, Math.round(maxWidth * 0.72));
  const stepY = Math.max(80, Math.round(maxHeight * 0.72));

  return sourceImages.map((image, index) => ({
    image,
    x: (index % cols) * stepX,
    y: Math.floor(index / cols) * stepY
  }));
}

function placeByCoordinates(sourceImages, options) {
  const missing = sourceImages.some((image) => !Number.isFinite(image.coordX) || !Number.isFinite(image.coordY));
  if (missing) {
    throw new Error(t("missingCoordinates"));
  }

  const ySign = options.coordYDirection === "up" ? -1 : 1;
  return sourceImages.map((image) => {
    const worldX = image.coordX * options.coordScale;
    const worldY = image.coordY * options.coordScale * ySign;
    return {
      image,
      x: Math.round(worldX - image.width / 2),
      y: Math.round(worldY - image.height / 2)
    };
  });
}

function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (tesseractLoadPromise) return tesseractLoadPromise;

  tesseractLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    script.onload = () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error("Tesseract unavailable"));
    script.onerror = reject;
    document.head.append(script);
  });

  return tesseractLoadPromise;
}

function hasMissingCoordinates(sourceImages) {
  return sourceImages.some((image) => !Number.isFinite(image.coordX) || !Number.isFinite(image.coordY));
}

async function detectCoordinatesForImages({ force }) {
  setStatus(t("ocrLoading"));
  await loadTesseract();

  let found = 0;
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    if (!force && Number.isFinite(image.coordX) && Number.isFinite(image.coordY)) {
      continue;
    }

    setStatus(t("ocrProgress", index + 1, images.length));
    const coords = await recognizeCoordinatesFromImage(image);
    if (coords) {
      image.coordX = coords.x;
      image.coordY = coords.y;
      found += 1;
    }
    await waitForUi();
  }

  return found;
}

async function recognizeCoordinatesFromImage(image) {
  const regions = createCoordinateOcrRegions(image);

  for (const regionCanvas of regions) {
    const result = await Tesseract.recognize(regionCanvas, "eng", {
      tessedit_char_whitelist: "0123456789-.,:;=XYxy坐标位置 "
    });
    const text = result && result.data ? result.data.text : "";
    const coords = parseCoordinatesFromText(text);
    if (coords) return coords;
  }

  return null;
}

function createCoordinateOcrRegions(image) {
  const source = imageToCanvas(image);
  const regions = [];
  const width = source.width;
  const height = source.height;
  const boxes = [
    { x: 0, y: Math.floor(height * 0.72), width, height: Math.ceil(height * 0.28) },
    { x: 0, y: 0, width: Math.ceil(width * 0.42), height: Math.ceil(height * 0.26) },
    { x: Math.floor(width * 0.58), y: 0, width: Math.ceil(width * 0.42), height: Math.ceil(height * 0.26) },
    { x: Math.floor(width * 0.55), y: Math.floor(height * 0.70), width: Math.ceil(width * 0.45), height: Math.ceil(height * 0.30) }
  ];

  boxes.forEach((box) => {
    regions.push(createOcrRegionCanvas(source, box, "raw"));
    regions.push(createOcrRegionCanvas(source, box, "lightText"));
    regions.push(createOcrRegionCanvas(source, box, "darkText"));
  });

  return regions;
}

function createOcrRegionCanvas(source, box, variant) {
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(box.width * scale));
  canvas.height = Math.max(1, Math.round(box.height * scale));
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, box.x, box.y, box.width, box.height, 0, 0, canvas.width, canvas.height);

  if (variant !== "raw") {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let offset = 0; offset < data.length; offset += 4) {
      const luminance = (data[offset] * 0.299) + (data[offset + 1] * 0.587) + (data[offset + 2] * 0.114);
      const isText = variant === "lightText" ? luminance > 150 : luminance < 120;
      const value = isText ? 0 : 255;
      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  return canvas;
}

function parseCoordinatesFromText(text) {
  const cleaned = text.replace(/\s+/g, " ");
  const patterns = [
    /x\s*[:=]?\s*(-?\d+(?:\.\d+)?).*?y\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i,
    /坐标\s*[:：]?\s*(-?\d+(?:\.\d+)?)[,，\s]+(-?\d+(?:\.\d+)?)/i,
    /位置\s*[:：]?\s*(-?\d+(?:\.\d+)?)[,，\s]+(-?\d+(?:\.\d+)?)/i,
    /(-?\d+(?:\.\d+)?)\s*[,，]\s*(-?\d+(?:\.\d+)?)/
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      return { x: Number(match[1]), y: Number(match[2]) };
    }
  }

  const numbers = cleaned.match(/-?\d+(?:\.\d+)?/g);
  if (numbers && numbers.length === 2) {
    return { x: Number(numbers[0]), y: Number(numbers[1]) };
  }

  return null;
}

function findBestOverlap(a, b, direction, options) {
  return findBestOverlapDetails(a, b, direction, options).overlap;
}

function findBestOverlapDetails(a, b, direction, options) {
  const cacheKey = `${a.id}:${b.id}:${direction}:${options.minOverlap}:${options.maxOverlap}:${options.sampleStep}`;
  if (matchCache.has(cacheKey)) return matchCache.get(cacheKey);

  const analysisA = getAnalysisImage(a);
  const analysisB = getAnalysisImage(b);
  const size = direction === "horizontal"
    ? Math.min(analysisA.width, analysisB.width)
    : Math.min(analysisA.height, analysisB.height);
  const min = Math.max(8, Math.round(size * options.minOverlap));
  const max = Math.max(min + 1, Math.round(size * options.maxOverlap));
  const step = Math.max(1, options.sampleStep);
  let bestOverlap = min;
  let bestScore = Number.POSITIVE_INFINITY;

  const canvasA = analysisA.canvas;
  const canvasB = analysisB.canvas;
  const ctxA = canvasA.getContext("2d", { willReadFrequently: true });
  const ctxB = canvasB.getContext("2d", { willReadFrequently: true });

  for (let overlap = min; overlap <= max; overlap += step) {
    const score = direction === "horizontal"
      ? scoreHorizontal(ctxA, ctxB, analysisA, analysisB, overlap, step)
      : scoreVertical(ctxA, ctxB, analysisA, analysisB, overlap, step);
    if (score < bestScore) {
      bestScore = score;
      bestOverlap = overlap;
    }
  }

  const refineMin = Math.max(min, bestOverlap - step);
  const refineMax = Math.min(max, bestOverlap + step);
  for (let overlap = refineMin; overlap <= refineMax; overlap += 1) {
    const score = direction === "horizontal"
      ? scoreHorizontal(ctxA, ctxB, analysisA, analysisB, overlap, step)
      : scoreVertical(ctxA, ctxB, analysisA, analysisB, overlap, step);
    if (score < bestScore) {
      bestScore = score;
      bestOverlap = overlap;
    }
  }

  const scale = direction === "horizontal" ? analysisA.scaleX : analysisA.scaleY;
  const result = {
    overlap: Math.max(1, Math.round(bestOverlap / scale)),
    score: bestScore
  };
  matchCache.set(cacheKey, result);
  return result;
}

function findBestNeighborDetails(placedImage, candidateImage, side, options) {
  const cacheKey = `${placedImage.id}:${candidateImage.id}:${side}:${options.minOverlap}:${options.maxOverlap}:${options.sampleStep}:offset`;
  if (matchCache.has(cacheKey)) return matchCache.get(cacheKey);

  const a = getAnalysisImage(placedImage);
  const b = getAnalysisImage(candidateImage);
  const horizontal = side === "right" || side === "left";
  const size = horizontal ? Math.min(a.width, b.width) : Math.min(a.height, b.height);
  const min = Math.max(8, Math.round(size * options.minOverlap));
  const max = Math.max(min + 1, Math.round(size * options.maxOverlap));
  const step = Math.max(1, options.sampleStep);
  const offsetSize = horizontal ? Math.min(a.height, b.height) : Math.min(a.width, b.width);
  const offsetLimit = Math.round(offsetSize * 0.2);
  const offsetStep = Math.max(3, step * 2);
  const ctxA = a.canvas.getContext("2d", { willReadFrequently: true });
  const ctxB = b.canvas.getContext("2d", { willReadFrequently: true });
  let best = { overlap: min, offset: 0, score: Number.POSITIVE_INFINITY };

  for (let overlap = min; overlap <= max; overlap += step) {
    for (let offset = -offsetLimit; offset <= offsetLimit; offset += offsetStep) {
      const score = horizontal
        ? scoreHorizontalNeighbor(ctxA, ctxB, a, b, overlap, offset, step, side)
        : scoreVerticalNeighbor(ctxA, ctxB, a, b, overlap, offset, step, side);
      if (score < best.score) {
        best = { overlap, offset, score };
      }
    }
  }

  const refineOverlapMin = Math.max(min, best.overlap - step);
  const refineOverlapMax = Math.min(max, best.overlap + step);
  const refineOffsetMin = Math.max(-offsetLimit, best.offset - offsetStep);
  const refineOffsetMax = Math.min(offsetLimit, best.offset + offsetStep);
  for (let overlap = refineOverlapMin; overlap <= refineOverlapMax; overlap += 1) {
    for (let offset = refineOffsetMin; offset <= refineOffsetMax; offset += 1) {
      const score = horizontal
        ? scoreHorizontalNeighbor(ctxA, ctxB, a, b, overlap, offset, step, side)
        : scoreVerticalNeighbor(ctxA, ctxB, a, b, overlap, offset, step, side);
      if (score < best.score) {
        best = { overlap, offset, score };
      }
    }
  }

  const scale = horizontal ? a.scaleX : a.scaleY;
  const offsetScale = horizontal ? a.scaleY : a.scaleX;
  const result = {
    overlap: Math.max(1, Math.round(best.overlap / scale)),
    offset: Math.round(best.offset / offsetScale),
    score: best.score
  };
  matchCache.set(cacheKey, result);
  return result;
}

function scoreHorizontalNeighbor(ctxA, ctxB, a, b, overlap, yOffset, step, side) {
  const startY = Math.max(0, yOffset);
  const endY = Math.min(a.height, b.height + yOffset);
  const height = endY - startY;
  if (height < Math.min(a.height, b.height) * 0.35) return Number.POSITIVE_INFINITY;

  const aX = side === "right" ? a.width - overlap : 0;
  const bX = side === "right" ? 0 : b.width - overlap;
  const dataA = ctxA.getImageData(aX, startY, overlap, height).data;
  const dataB = ctxB.getImageData(bX, startY - yOffset, overlap, height).data;
  return scoreImageData(dataA, dataB, overlap, height, step);
}

function scoreVerticalNeighbor(ctxA, ctxB, a, b, overlap, xOffset, step, side) {
  const startX = Math.max(0, xOffset);
  const endX = Math.min(a.width, b.width + xOffset);
  const width = endX - startX;
  if (width < Math.min(a.width, b.width) * 0.35) return Number.POSITIVE_INFINITY;

  const aY = side === "bottom" ? a.height - overlap : 0;
  const bY = side === "bottom" ? 0 : b.height - overlap;
  const dataA = ctxA.getImageData(startX, aY, width, overlap).data;
  const dataB = ctxB.getImageData(startX - xOffset, bY, width, overlap).data;
  return scoreImageData(dataA, dataB, width, overlap, step);
}

function scoreImageData(dataA, dataB, width, height, step) {
  let total = 0;
  let count = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      total += colorDistance(dataA, dataB, index);
      count += 1;
    }
  }

  return total / Math.max(1, count);
}

function getAnalysisImage(image) {
  if (image.analysis) return image.analysis;

  const scale = Math.min(1, ANALYSIS_MAX_SIZE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d", { willReadFrequently: true }).drawImage(image.img, 0, 0, width, height);
  image.analysis = {
    canvas,
    width,
    height,
    scaleX: width / image.width,
    scaleY: height / image.height
  };
  return image.analysis;
}

function waitForUi() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function scrollToPreview() {
  document.querySelector(".workspace").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function imageToCanvas(image) {
  if (image.canvas) return image.canvas;
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext("2d").drawImage(image.img, 0, 0);
  image.canvas = canvas;
  return canvas;
}

function scoreHorizontal(ctxA, ctxB, a, b, overlap, step) {
  const height = Math.min(a.height, b.height);
  const sampleWidth = overlap;
  const dataA = ctxA.getImageData(a.width - sampleWidth, 0, sampleWidth, height).data;
  const dataB = ctxB.getImageData(0, 0, sampleWidth, height).data;
  let total = 0;
  let count = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < sampleWidth; x += step) {
      const index = (y * sampleWidth + x) * 4;
      total += colorDistance(dataA, dataB, index);
      count += 1;
    }
  }

  return total / Math.max(1, count);
}

function scoreVertical(ctxA, ctxB, a, b, overlap, step) {
  const width = Math.min(a.width, b.width);
  const sampleHeight = overlap;
  const dataA = ctxA.getImageData(0, a.height - sampleHeight, width, sampleHeight).data;
  const dataB = ctxB.getImageData(0, 0, width, sampleHeight).data;
  let total = 0;
  let count = 0;

  for (let y = 0; y < sampleHeight; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      total += colorDistance(dataA, dataB, index);
      count += 1;
    }
  }

  return total / Math.max(1, count);
}

function colorDistance(dataA, dataB, index) {
  const red = dataA[index] - dataB[index];
  const green = dataA[index + 1] - dataB[index + 1];
  const blue = dataA[index + 2] - dataB[index + 2];
  return red * red + green * green + blue * blue;
}

function normalizePlacements(placements) {
  const bounds = getPlacementBounds(placements);
  return placements.map((placement) => ({
    ...placement,
    x: Math.round(placement.x - bounds.minX),
    y: Math.round(placement.y - bounds.minY)
  }));
}

function getPlacementBounds(placements) {
  const bounds = placements.reduce((box, placement) => {
    box.minX = Math.min(box.minX, placement.x);
    box.minY = Math.min(box.minY, placement.y);
    box.maxX = Math.max(box.maxX, placement.x + placement.image.width);
    box.maxY = Math.max(box.maxY, placement.y + placement.image.height);
    return box;
  }, {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY
  });

  return bounds;
}

function drawComposite(placements, showSelection = false, options = lastRenderOptions) {
  const bounds = getPlacementBounds(placements);
  canvasOffset = { x: -bounds.minX, y: -bounds.minY };
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(bounds.maxX - bounds.minX);
  canvas.height = Math.ceil(bounds.maxY - bounds.minY);
  const ctx = canvas.getContext("2d");

  if (options.alphaMasks && placements.length > 1 && !showSelection) {
    drawCompositeWithAlphaMasks(ctx, canvas.width, canvas.height, placements, bounds);
  } else {
    placements.forEach((placement) => {
      ctx.globalAlpha = 1;
      ctx.drawImage(
        placement.image.img,
        Math.round(placement.x - bounds.minX),
        Math.round(placement.y - bounds.minY)
      );
    });
    ctx.globalAlpha = 1;
  }

  if (showSelection) {
    drawSelectionOutlines(ctx, placements, bounds);
  }

  return canvas;
}

function drawCompositeWithAlphaMasks(ctx, width, height, placements, bounds) {
  const accumR = new Float32Array(width * height);
  const accumG = new Float32Array(width * height);
  const accumB = new Float32Array(width * height);
  const accumA = new Float32Array(width * height);

  placements.forEach((placement) => {
    const imageCanvas = imageToCanvas(placement.image);
    const imageCtx = imageCanvas.getContext("2d", { willReadFrequently: true });
    const data = imageCtx.getImageData(0, 0, placement.image.width, placement.image.height).data;
    const baseX = Math.round(placement.x - bounds.minX);
    const baseY = Math.round(placement.y - bounds.minY);
    const feather = Math.max(24, Math.round(Math.min(placement.image.width, placement.image.height) * 0.08));

    for (let y = 0; y < placement.image.height; y += 1) {
      const targetY = baseY + y;
      if (targetY < 0 || targetY >= height) continue;

      for (let x = 0; x < placement.image.width; x += 1) {
        const targetX = baseX + x;
        if (targetX < 0 || targetX >= width) continue;

        const sourceIndex = (y * placement.image.width + x) * 4;
        const sourceAlpha = data[sourceIndex + 3] / 255;
        if (sourceAlpha <= 0) continue;

        const edgeAlpha = getAlphaMaskWeight(x, y, placement.image.width, placement.image.height, feather);
        const weight = Math.max(0.001, sourceAlpha * edgeAlpha);
        const targetIndex = targetY * width + targetX;
        accumR[targetIndex] += data[sourceIndex] * weight;
        accumG[targetIndex] += data[sourceIndex + 1] * weight;
        accumB[targetIndex] += data[sourceIndex + 2] * weight;
        accumA[targetIndex] += weight;
      }
    }
  });

  const output = ctx.createImageData(width, height);
  for (let index = 0; index < accumA.length; index += 1) {
    const outputIndex = index * 4;
    const alpha = accumA[index];
    if (alpha <= 0) {
      output.data[outputIndex + 3] = 0;
      continue;
    }

    output.data[outputIndex] = Math.round(accumR[index] / alpha);
    output.data[outputIndex + 1] = Math.round(accumG[index] / alpha);
    output.data[outputIndex + 2] = Math.round(accumB[index] / alpha);
    output.data[outputIndex + 3] = 255;
  }
  ctx.putImageData(output, 0, 0);
}

function getAlphaMaskWeight(x, y, width, height, feather) {
  const edgeDistance = Math.min(x, y, width - 1 - x, height - 1 - y);
  if (edgeDistance >= feather) return 1;
  const normalized = Math.max(0, edgeDistance / feather);
  return normalized * normalized * (3 - 2 * normalized);
}

function drawSelectionOutlines(ctx, placements, bounds) {
  placements.forEach((placement, index) => {
    ctx.lineWidth = index === selectedPlacementIndex ? 6 : 2;
    ctx.strokeStyle = index === selectedPlacementIndex ? "#1f7a68" : "rgba(255,255,255,0.7)";
    ctx.strokeRect(
      Math.round(placement.x - bounds.minX) + 1,
      Math.round(placement.y - bounds.minY) + 1,
      placement.image.width - 2,
      placement.image.height - 2
    );
  });
}

function getCanvasPoint(event) {
  const rect = preview.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (preview.width / rect.width) - canvasOffset.x,
    y: (event.clientY - rect.top) * (preview.height / rect.height) - canvasOffset.y
  };
}

function findPlacementAt(x, y) {
  for (let index = currentPlacements.length - 1; index >= 0; index -= 1) {
    const placement = currentPlacements[index];
    if (
      x >= placement.x &&
      x <= placement.x + placement.image.width &&
      y >= placement.y &&
      y <= placement.y + placement.image.height
    ) {
      return index;
    }
  }
  return -1;
}

function finishDrag(event) {
  if (!dragState) return;
  try {
    preview.releasePointerCapture(event.pointerId);
  } catch {
    // Pointer capture may already be released by the browser.
  }
  dragState = null;
  preview.classList.remove("dragging");
  finalCanvas = drawComposite(currentPlacements, editMode, lastRenderOptions);
  showCanvas(finalCanvas);
}

async function createDemoImages() {
  const base = document.createElement("canvas");
  base.width = 900;
  base.height = 360;
  const ctx = base.getContext("2d");

  const sky = ctx.createLinearGradient(0, 0, 0, base.height);
  sky.addColorStop(0, "#99d2d9");
  sky.addColorStop(1, "#d9efe5");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, base.width, base.height);

  ctx.fillStyle = "#2f6f52";
  ctx.fillRect(0, 230, base.width, 130);

  ctx.fillStyle = "#83604a";
  ctx.fillRect(0, 286, base.width, 26);

  drawHill(ctx, 80, 245, 180, 82, "#57936d");
  drawHill(ctx, 305, 238, 220, 96, "#4f8469");
  drawHill(ctx, 620, 250, 260, 112, "#5c9a70");

  drawLake(ctx, 470, 282, 150, 34);
  drawTree(ctx, 130, 205, 34);
  drawTree(ctx, 245, 220, 28);
  drawTree(ctx, 705, 214, 36);
  drawTree(ctx, 810, 226, 26);
  drawTower(ctx, 386, 166);
  drawRocks(ctx, 555, 250);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "700 28px Segoe UI, Arial";
  ctx.fillText("TEST MAP", 34, 52);

  const cropWidth = 360;
  const cropHeight = 300;
  const starts = [0, 260, 520];
  return Promise.all(starts.map((x, index) => cropDemoImage(base, x, 30, cropWidth, cropHeight, index + 1)));
}

function cropDemoImage(base, x, y, width, height, number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(base, x, y, width, height, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        resolve({
          file: new File([blob], `demo-${number}.png`, { type: "image/png" }),
          id: nextImageId++,
          name: `demo-${number}.png`,
          img,
          width,
          height,
          url
        });
      };
      img.src = url;
    }, "image/png");
  });
}

function drawHill(ctx, x, y, width, height, color) {
  ctx.beginPath();
  ctx.moveTo(x - width / 2, y);
  ctx.quadraticCurveTo(x, y - height, x + width / 2, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawTree(ctx, x, y, size) {
  ctx.fillStyle = "#64482f";
  ctx.fillRect(x - 4, y, 8, size);
  ctx.fillStyle = "#1f6f4a";
  ctx.beginPath();
  ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2e9c60";
  ctx.beginPath();
  ctx.arc(x - size * 0.25, y - size * 0.2, size * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

function drawTower(ctx, x, y) {
  ctx.fillStyle = "#b58b62";
  ctx.fillRect(x, y, 42, 95);
  ctx.fillStyle = "#6f3f37";
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.lineTo(x + 21, y - 38);
  ctx.lineTo(x + 50, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#2e4752";
  ctx.fillRect(x + 14, y + 38, 14, 20);
}

function drawLake(ctx, x, y, width, height) {
  ctx.fillStyle = "#4da8b7";
  ctx.beginPath();
  ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 42, y - 2);
  ctx.quadraticCurveTo(x - 6, y - 10, x + 36, y - 1);
  ctx.stroke();
}

function drawRocks(ctx, x, y) {
  ctx.fillStyle = "#8a9590";
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.ellipse(x + i * 18, y + (i % 2) * 7, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
