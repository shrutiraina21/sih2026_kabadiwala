"""
E-Waste YOLOv8 - Quick Inference Script (PyTorch / Ultralytics)
Use this script to test single images or batch folders.
"""

import os
import argparse
from ultralytics import YOLO

def run_inference(image_path, weights_path=None, conf=0.25, save=True, show=False):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if weights_path is None:
        weights_path = os.path.join(base_dir, "ewaste_yolov8n.pt")
        
    print(f"Loading model: {weights_path}")
    model = YOLO(weights_path)
    
    print(f"Running detection on: {image_path}")
    results = model.predict(
        source=image_path,
        conf=conf,
        imgsz=416,
        save=save,
        show=show,
        project=os.path.join(base_dir, "output"),
        name="detections",
        exist_ok=True
    )
    
    detections = []
    for r in results:
        boxes = r.boxes
        for box in boxes:
            cls_id = int(box.cls[0].item())
            cls_name = model.names[cls_id]
            confidence = float(box.conf[0].item())
            xyxy = [float(x) for x in box.xyxy[0].tolist()] # [xmin, ymin, xmax, ymax]
            
            detections.append({
                "class_id": cls_id,
                "class_name": cls_name,
                "confidence": round(confidence, 4),
                "bbox": [round(x, 2) for x in xyxy]
            })
            
    print("\n✅ Detected Items:")
    for d in detections:
        print(f"  • {d['class_name']} ({d['confidence']*100:.1f}%) -> Box: {d['bbox']}")
        
    return detections

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run E-Waste Object Detection on an Image")
    parser.add_argument("--image", type=str, required=True, help="Path to input image")
    parser.add_argument("--conf", type=float, default=0.25, help="Confidence threshold (default: 0.25)")
    args = parser.parse_args()
    
    run_inference(args.image, conf=args.conf)
