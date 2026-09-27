"""
E-Waste YOLOv8 - Standalone ONNX Runtime Inference
Does NOT require PyTorch or Ultralytics! Only onnxruntime, numpy, and pillow/opencv.
"""

import os
import json
import argparse
import numpy as np
from PIL import Image

CLASSES = [
    "Mobile-Phone", "AC-Adapter", "Game-Controller", "Earphones", "Handheld-Fan",
    "Flashlight", "Hot-Glue-Gun", "Headphones", "Keyboard", "Microphone",
    "Router", "Computer-Mouse", "Power-Bank", "Remote-Control", "Tablet",
    "Smartwatch", "Soldering-Iron", "Speaker", "E-Cigarette", "Webcam", "USB-Cable"
]

def preprocess(img_path, target_size=(416, 416)):
    img = Image.open(img_path).convert('RGB')
    orig_w, orig_h = img.size
    
    # Resize with letterboxing
    img_resized = img.resize(target_size, Image.BILINEAR)
    img_data = np.array(img_resized, dtype=np.float32) / 255.0  # Normalize to [0, 1]
    img_data = np.transpose(img_data, (2, 0, 1))               # HWC to CHW
    img_data = np.expand_dims(img_data, axis=0)                # Add batch dim: (1, 3, 416, 416)
    
    return img_data, orig_w, orig_h

def postprocess(output, orig_w, orig_h, conf_thresh=0.25, iou_thresh=0.45):
    # Output shape: (1, 25, 3549) -> 25 = 4 box coordinates (cx, cy, w, h) + 21 class scores
    predictions = np.squeeze(output).T  # Shape: (3549, 25)
    
    boxes = predictions[:, :4]
    scores = predictions[:, 4:]
    
    class_ids = np.argmax(scores, axis=1)
    confidences = np.max(scores, axis=1)
    
    mask = confidences >= conf_thresh
    boxes = boxes[mask]
    confidences = confidences[mask]
    class_ids = class_ids[mask]
    
    if len(boxes) == 0:
        return []

    # Convert cx, cy, w, h to x1, y1, x2, y2 scaled to original dimensions
    scale_x = orig_w / 416.0
    scale_y = orig_h / 416.0
    
    x1 = (boxes[:, 0] - boxes[:, 2] / 2) * scale_x
    y1 = (boxes[:, 1] - boxes[:, 3] / 2) * scale_y
    x2 = (boxes[:, 0] + boxes[:, 2] / 2) * scale_x
    y2 = (boxes[:, 1] + boxes[:, 3] / 2) * scale_y
    
    # NMS (Non-Maximum Suppression)
    indices = nms(x1, y1, x2, y2, confidences, iou_thresh)
    
    results = []
    for idx in indices:
        cid = int(class_ids[idx])
        results.append({
            "class_id": cid,
            "class_name": CLASSES[cid] if cid < len(CLASSES) else f"Class_{cid}",
            "confidence": float(round(confidences[idx], 4)),
            "box": [float(round(x, 1)) for x in [x1[idx], y1[idx], x2[idx], y2[idx]]]
        })
    return results

def nms(x1, y1, x2, y2, scores, iou_threshold):
    areas = (x2 - x1) * (y2 - y1)
    order = scores.argsort()[::-1]
    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h
        ovr = inter / (areas[i] + areas[order[1:]] - inter)
        inds = np.where(ovr <= iou_threshold)[0]
        order = order[inds + 1]
    return keep

def run_onnx_inference(image_path, model_path=None, conf=0.25):
    import onnxruntime as ort
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if model_path is None:
        model_path = os.path.join(base_dir, "ewaste_yolov8n.onnx")
        
    session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
    input_name = session.get_inputs()[0].name
    
    input_tensor, orig_w, orig_h = preprocess(image_path)
    raw_output = session.run(None, {input_name: input_tensor})[0]
    
    detections = postprocess(raw_output, orig_w, orig_h, conf_thresh=conf)
    
    print(f"\n🔍 ONNX Detections for {os.path.basename(image_path)}:")
    for d in detections:
        print(f"  • {d['class_name']:<18} Confidence: {d['confidence']*100:.1f}%  Box: {d['box']}")
    return detections

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ONNX Runtime Detection for E-Waste")
    parser.add_argument("--image", type=str, required=True, help="Input image file")
    parser.add_argument("--conf", type=float, default=0.25, help="Confidence threshold")
    args = parser.parse_args()
    
    run_onnx_inference(args.image, conf=args.conf)
