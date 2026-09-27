"""
E-Waste Object Detection REST API (FastAPI)
Run with: uvicorn app_api_fastapi:app --host 0.0.0.0 --port 8000 --reload
"""

import io
import os
from fastapi import FastAPI, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from ultralytics import YOLO

app = FastAPI(
    title="E-Waste YOLOv8 Detection API",
    description="REST API for detecting 21 e-waste item classes from images",
    version="1.0.0"
)

# Enable CORS for web and mobile frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "ewaste_yolov8n.pt")

print(f"Loading YOLO model from: {MODEL_PATH}")
model = YOLO(MODEL_PATH)

@app.get("/")
def home():
    return {
        "status": "online",
        "message": "E-Waste Detection API is running.",
        "model": "YOLOv8n-21class",
        "endpoints": {
            "detect": "POST /detect (Upload multipart/form-data image)"
        }
    }

@app.post("/detect")
async def detect_ewaste(
    file: UploadFile = File(...),
    conf: float = Query(0.25, ge=0.05, le=1.0, description="Confidence threshold")
):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        results = model.predict(source=image, conf=conf, imgsz=416, verbose=False)
        
        detections = []
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0].item())
                cls_name = model.names[cls_id]
                confidence = float(box.conf[0].item())
                xyxy = [round(float(x), 2) for x in box.xyxy[0].tolist()]
                
                detections.append({
                    "class_id": cls_id,
                    "class_name": cls_name,
                    "confidence": round(confidence, 4),
                    "box": {
                        "xmin": xyxy[0],
                        "ymin": xyxy[1],
                        "xmax": xyxy[2],
                        "ymax": xyxy[3]
                    }
                })
                
        return JSONResponse(content={
            "success": True,
            "filename": file.filename,
            "count": len(detections),
            "detections": detections
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app_api_fastapi:app", host="0.0.0.0", port=8000, reload=True)
