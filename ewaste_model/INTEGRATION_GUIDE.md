# 📱 E-Waste YOLOv8 AI Model — App Integration & Deployment Guide

This package contains the trained **YOLOv8 21-Class E-Waste Object Detection Model** ready for direct integration into your web, mobile (Flutter/React Native/Android/iOS), or backend server application.

---

## 📦 Package Contents

```
app_deployment_package/
├── ewaste_yolov8n.pt        # PyTorch model weights (for Python / Ultralytics / FastAPI)
├── ewaste_yolov8n.onnx      # ONNX model (cross-platform, Web, Flutter, React Native, C++)
├── model_metadata.json      # Model parameters, normalization specs, class mapping & metrics
├── labels.txt               # Plain text class labels (one per line)
├── labels.json              # Structured JSON label map
├── inference_python.py      # Ready-to-run Python inference script
├── inference_onnx.py        # Lightweight ONNX Runtime inference script (No PyTorch needed)
├── app_api_fastapi.py       # Production-ready REST API backend server
└── INTEGRATION_GUIDE.md     # This documentation guide
```

---

## 🏷️ Supported E-Waste Classes (21 Total)

| ID | Class Name | ID | Class Name | ID | Class Name |
|:---:|:---|:---:|:---|:---:|:---|
| 0 | Mobile-Phone | 7 | Headphones | 14 | Tablet |
| 1 | AC-Adapter | 8 | Keyboard | 15 | Smartwatch |
| 2 | Game-Controller | 9 | Microphone | 16 | Soldering-Iron |
| 3 | Earphones | 10 | Router | 17 | Speaker |
| 4 | Handheld-Fan | 11 | Computer-Mouse | 18 | E-Cigarette |
| 5 | Flashlight | 12 | Power-Bank | 19 | Webcam |
| 6 | Hot-Glue-Gun | 13 | Remote-Control | 20 | USB-Cable |

---

## 🚀 Integration Methods (Choose the Best for Your App)

### 🔹 Option 1: REST API Backend (Recommended for Mobile & Web Apps)
The easiest way to connect your frontend app (Flutter, React, Angular, Vue, iOS, Android) is via the provided FastAPI server.

1. **Install dependencies & Start the API Server**:
   ```bash
   pip install fastapi uvicorn ultralytics pillow python-multipart
   python app_api_fastapi.py
   ```
   *The server will start at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.*

2. **Call the API from JavaScript / Flutter / React Native**:
   ```javascript
   // JavaScript Fetch Example
   const formData = new FormData();
   formData.append("file", imageFile);

   const response = await fetch("http://localhost:8000/detect?conf=0.25", {
     method: "POST",
     body: formData,
   });

   const result = await response.json();
   console.log(result.detections);
   ```

   **Sample JSON API Response**:
   ```json
   {
     "success": true,
     "filename": "sample.jpg",
     "count": 2,
     "detections": [
       {
         "class_id": 0,
         "class_name": "Mobile-Phone",
         "confidence": 0.9412,
         "box": { "xmin": 120.5, "ymin": 84.2, "xmax": 340.1, "ymax": 512.0 }
       },
       {
         "class_id": 20,
         "class_name": "USB-Cable",
         "confidence": 0.8845,
         "box": { "xmin": 45.0, "ymin": 310.0, "xmax": 210.3, "ymax": 490.8 }
       }
     ]
   }
   ```

---

### 🔹 Option 2: On-Device / Embedded ONNX Runtime (No Server Needed)
Use `ewaste_yolov8n.onnx` for offline on-device inference in Flutter, React Native, Node.js, C#, or Python.

```bash
pip install onnxruntime pillow numpy
python inference_onnx.py --image path/to/sample.jpg --conf 0.25
```

---

### 🔹 Option 3: Direct Python / PyTorch Integration
```python
from ultralytics import YOLO

# Load model
model = YOLO("ewaste_yolov8n.pt")

# Predict on image, video, or webcam stream
results = model.predict(source="test.jpg", conf=0.25, imgsz=416)

# Print detected classes
for r in results:
    for box in r.boxes:
        print(f"Detected: {model.names[int(box.cls)]} ({float(box.conf):.2%})")
```

---

## ⚙️ Model Specifications
- **Input Dimensions**: `416 × 416 × 3` (RGB)
- **Normalization**: Pixel values scaled to `[0.0, 1.0]` (divide by `255.0`)
- **Overall mAP@0.50**: `91.22%`
- **Inference Speed**: `~4.2 ms / image` on GPU
