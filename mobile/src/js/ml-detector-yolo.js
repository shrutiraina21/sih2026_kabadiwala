import * as ort from 'onnxruntime-web';

const MODEL_URL = '/models/yolo/ewaste_yolov8n.onnx';
const INPUT_SIZE = 416;
const NUM_CHANNELS = 25; // 4 box coords (cx, cy, w, h) + 21 class scores
const NUM_ANCHORS = 3549; // (52*52 + 26*26 + 13*13) at 416x416
const DETECTION_THRESHOLD = 0.25;

export const EWASTE_YOLO_CLASSES = [
  'Mobile-Phone',      // 0
  'AC-Adapter',        // 1
  'Game-Controller',   // 2
  'Earphones',         // 3 — OMITTED from predictions due to low test metrics
  'Handheld-Fan',      // 4
  'Flashlight',        // 5
  'Hot-Glue-Gun',      // 6
  'Headphones',        // 7
  'Keyboard',          // 8
  'Microphone',        // 9
  'Router',            // 10
  'Computer-Mouse',    // 11
  'Power-Bank',        // 12
  'Remote-Control',    // 13
  'Tablet',            // 14
  'Smartwatch',        // 15
  'Soldering-Iron',    // 16
  'Speaker',           // 17
  'E-Cigarette',       // 18
  'Webcam',            // 19
  'USB-Cable'          // 20
];

// Explicitly omit Earphones (ID 3) per validation performance requirements
export const OMITTED_CLASS_IDS = new Set([3]);
export const OMITTED_CLASS_NAMES = new Set(['Earphones', 'earphones']);

let modelSession = null;
let modelPromise = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function boxIOU(a, b) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);

  const overlap = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.width * a.height + b.width * b.height - overlap;
  return union > 0 ? overlap / union : 0;
}

function applyNMS(detections, iouThreshold = 0.45) {
  const sorted = [...detections].sort((a, b) => b.score - a.score);
  const kept = [];

  while (sorted.length > 0) {
    const current = sorted.shift();
    kept.push(current);
    const remaining = [];

    for (const next of sorted) {
      if (boxIOU(current, next) <= iouThreshold) remaining.push(next);
    }

    sorted.length = 0;
    sorted.push(...remaining);
  }

  return kept;
}

function prepareInputFromImage(imageElement) {
  const working = document.createElement('canvas');
  working.width = INPUT_SIZE;
  working.height = INPUT_SIZE;
  const ctx = working.getContext('2d');
  ctx.drawImage(imageElement, 0, 0, INPUT_SIZE, INPUT_SIZE);

  const { data } = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
  const totalPixels = INPUT_SIZE * INPUT_SIZE;
  const float32 = new Float32Array(3 * totalPixels);

  // Planar CHW layout: [1, 3, 416, 416] normalized to [0, 1]
  for (let p = 0; p < totalPixels; p++) {
    const src = p * 4;
    float32[p] = data[src] / 255.0;                      // Channel 0: R
    float32[totalPixels + p] = data[src + 1] / 255.0;    // Channel 1: G
    float32[2 * totalPixels + p] = data[src + 2] / 255.0;// Channel 2: B
  }

  return new ort.Tensor('float32', float32, [1, 3, INPUT_SIZE, INPUT_SIZE]);
}

async function loadModel() {
  if (modelSession) return modelSession;
  if (modelPromise) return modelPromise;

  modelPromise = (async () => {
    try {
      const session = await ort.InferenceSession.create(MODEL_URL, {
        executionProviders: ['wasm']
      });
      modelSession = session;
      return session;
    } catch (error) {
      console.warn('[Custom E-Waste YOLO] Could not load ONNX model:', error);
      modelPromise = null;
      throw error;
    }
  })();

  return modelPromise;
}

function parseDetectionsFromOutput(outputData, origW, origH) {
  if (!outputData || outputData.length < NUM_CHANNELS * NUM_ANCHORS) {
    return [];
  }

  const detections = [];
  const numClasses = EWASTE_YOLO_CLASSES.length;
  const scaleX = origW / INPUT_SIZE;
  const scaleY = origH / INPUT_SIZE;

  // Output shape is [1, 25, 3549] stored in row-major order:
  // channel 0 (cx): offset 0 * 3549 + a
  // channel 1 (cy): offset 1 * 3549 + a
  // channel 2 (w):  offset 2 * 3549 + a
  // channel 3 (h):  offset 3 * 3549 + a
  // channel 4..24 (class scores): offset (4 + c) * 3549 + a
  for (let a = 0; a < NUM_ANCHORS; a++) {
    let bestScore = -1;
    let bestClassId = -1;

    for (let c = 0; c < numClasses; c++) {
      // Strictly omit Earphones from candidate detections
      if (OMITTED_CLASS_IDS.has(c)) {
        continue;
      }

      const score = outputData[(4 + c) * NUM_ANCHORS + a];
      if (score > bestScore) {
        bestScore = score;
        bestClassId = c;
      }
    }

    if (bestClassId === -1 || bestScore < DETECTION_THRESHOLD) {
      continue;
    }

    const cx = outputData[0 * NUM_ANCHORS + a];
    const cy = outputData[1 * NUM_ANCHORS + a];
    const w  = outputData[2 * NUM_ANCHORS + a];
    const h  = outputData[3 * NUM_ANCHORS + a];

    // Scale to original image bounds
    const boxW = w * scaleX;
    const boxH = h * scaleY;
    const centerX = cx * scaleX;
    const centerY = cy * scaleY;

    const x = clamp(centerX - boxW / 2, 0, origW);
    const y = clamp(centerY - boxH / 2, 0, origH);
    const finalW = clamp(boxW, 8, origW - x);
    const finalH = clamp(boxH, 8, origH - y);

    detections.push({
      classId: bestClassId,
      className: EWASTE_YOLO_CLASSES[bestClassId] || 'E-Waste',
      score: bestScore,
      x,
      y,
      width: finalW,
      height: finalH
    });
  }

  return applyNMS(detections, 0.45).slice(0, 5);
}

function asImageElement(imageElementOrFile) {
  if (imageElementOrFile instanceof HTMLImageElement || imageElementOrFile instanceof HTMLCanvasElement) {
    return imageElementOrFile;
  }

  if (imageElementOrFile instanceof Blob || imageElementOrFile instanceof File) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(imageElementOrFile);
    });
  }

  return Promise.resolve(imageElementOrFile);
}

export async function detectObjects(imageElementOrFile) {
  try {
    const source = await asImageElement(imageElementOrFile);
    const session = await loadModel();
    if (!session) return [];

    const origW = source.naturalWidth || source.width || INPUT_SIZE;
    const origH = source.naturalHeight || source.height || INPUT_SIZE;

    const tensor = prepareInputFromImage(source);
    const outputs = await session.run({ [session.inputNames[0]]: tensor });
    const outputKey = Object.keys(outputs)[0];
    const output = outputs[outputKey];
    const parsed = parseDetectionsFromOutput(output.data, origW, origH);

    if (tensor && typeof tensor.dispose === 'function') {
      tensor.dispose();
    }

    // Secondary safety filter: ensure Earphones is omitted under all conditions
    const filtered = (parsed || []).filter(
      (d) => !OMITTED_CLASS_IDS.has(d.classId) && !OMITTED_CLASS_NAMES.has(d.className)
    );

    return filtered;
  } catch (error) {
    console.warn('[Custom E-Waste YOLO] Inference fallback:', error);
    // Graceful fallback: return empty list so pipeline evaluates entire image cleanly
    return [];
  }
}

export function getYOLOModelStatus() {
  return {
    modelLoaded: !!modelSession,
    modelUrl: MODEL_URL,
    architecture: 'Custom YOLOv8n E-Waste Object Detector (21 Classes)',
    omittedClasses: Array.from(OMITTED_CLASS_NAMES)
  };
}
