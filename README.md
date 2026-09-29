# Kabadiwala Connect - Digital E-Waste Traceability Platform

> **Smart India Hackathon (SIH 2026)** - Formalizing the Informal E-Waste Economy Through Machine-Assisted Offline Traceability, Dual-Weighed Mass Balance, and CPCB EPR Compliance.

Kabadiwala Connect is a unified 3-tier hardware-aware traceability and transaction settlement platform that bridges the informal recycling ecosystem with authorized industrial recyclers and government compliance bodies:

```
[ Doorstep Collector ]  --->  [ Scrap Dealer Aggregator ]  --->  [ Authorized Recycler ]  --->  [ CPCB / SPCB ]
  (Kabadiwala Lite PWA)            (Dealer Web / PWA)              (Recycler Portal)             (EPR Audit Records)
```

---

## The 3 Interconnected Applications

| Persona | Application | Port / Route | Tech Stack | Core Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **1. Doorstep Collector** | **Kabadiwala Lite** | `http://localhost:5173/kabadiwala-lite.html` | Vanilla JS, PWA, IndexedDB, ONNX Web, TF.js | Two-stage ML scrap ID, 8-language vernacular audio, instant fair value discovery, offline GPS digital slips. |
| **2. Scrap Dealer** | **Dealer Hub** | `http://localhost:5173/dealer.html` | Vanilla JS, IndexedDB, REST | Purchase intake logging, offline sync queue, live stock mass balance, ranked recycler matching, QR handover generation, dealer financial ledger. |
| **3. Industrial Recycler** | **Recycler Portal** | `http://localhost:5174/` | React 19, Vite, Tailwind CSS | Incoming lots stream, dual-weighing verification, discrepancy tolerance engine (>5% flagged, >30% critical warning), 1-click CPCB compliance PDF download. |
| **Core API & Database** | **FastAPI Backend** | `http://localhost:8000` (Docs: `/docs`) | FastAPI, SQLAlchemy, SQLite, pygeohash | Mass-balance split engine, JWT authentication, geohash milk-run clustering, Haversine routing, PDF certificate generator, audit logs. |

---

## Two-Stage On-Device ML Pipeline

The platform runs a fully local, zero-internet computer vision pipeline inside the browser to eliminate background clutter in scrap yards and achieve robust classification:

```
Captured Photo (Phone Camera)
       |
       v
Stage 1: Custom YOLOv8n E-Waste Object Detector (ONNX Runtime Web)
       - File: /models/yolo/ewaste_yolov8n.onnx (12.1 MB)
       - Resolution: 416 x 416 RGB (Planar CHW)
       - Metrics: 91.22% test mAP@50, 85.17% F1-score, 4.2ms inference speed
       - Classes: 20 active e-waste classes (Mobile-Phone, Keyboard, Mouse, Laptop, Router, etc.)
       - Note: Earphones class is explicitly omitted due to low validation performance
       - Isolates scrap object boundaries from cluttered surfaces and ground noise
       |
       +---> For each detected bounding box:
       |       Crop with 10% padding
       |       Letterbox resize to 240 x 240
       |       Normalize pixel values to [0, 1]
       |       |
       |       v
Stage 2: Quantized EfficientNetB1 INT8 Classifier (TensorFlow.js TFLite)
       - File: /models/ewaste_model/ewaste_model_int8.tflite (8.7 MB)
       - High-granularity inference mapped to the 7 canonical CPCB categories
       |
       +---> Fallback: If no boxes are detected, full-image classification executes with 1-tap manual override
```

Generic pretrained COCO models were removed from the project to eliminate domain mismatch, reduce bundle size by ~260 MB, and ensure all inference runs on models specifically trained for electronic waste streams.

---

## Quick Start: Running on Any Computer (Windows, macOS, Linux)

### 1. Prerequisites
- **Python**: 3.10 or higher (`python --version`)
- **Node.js**: 18.0 or higher (`node -v`)
- **Git**

### 2. Setup and Installation
Open your terminal in the repository root:

```bash
# A. Install Python backend dependencies
cd backend
python -m venv venv

# Activate venv:
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

pip install -r requirements.txt

# B. Install Mobile App dependencies
cd ../mobile
npm install

# C. Install Recycler Dashboard dependencies
cd ../recycler-dashboard-frontend
npm install
```

### 3. Launch the 3 Services
Open 3 terminal windows to run the stack:

```bash
# Terminal 1: Core FastAPI Backend
cd backend
python run.py
# -> Running on http://127.0.0.1:8000 (Swagger docs: http://127.0.0.1:8000/docs)

# Terminal 2: Collector Lite and Dealer App
cd mobile
npm run dev
# -> Running on http://localhost:5173

# Terminal 3: Recycler Dashboard Portal
cd recycler-dashboard-frontend
npm run dev
# -> Running on http://localhost:5174
```

---

## Running on Real Mobile Phones (Android and iOS)

Both `mobile/` and `backend/` are configured to bind to `0.0.0.0` (all network interfaces), allowing any smartphone on the same Wi-Fi network to run the apps directly.

1. **Connect host computer and phone to the same Wi-Fi network**.
2. **Find your computer local IP address**:
   - Windows: Run `ipconfig` (look for `IPv4 Address`, e.g. `192.168.1.15`)
   - Mac/Linux: Run `ifconfig | grep "inet "`
3. **Open on Phone Browser (Chrome recommended)**:
   - **Collector Lite**: `http://<YOUR_IP>:5173/kabadiwala-lite.html`
   - **Dealer Hub**: `http://<YOUR_IP>:5173/dealer.html`
4. **Install as Native PWA**: Tap the prompt "Install App" or tap Chrome menu (three dots) -> "Install app" to place a standalone native app icon on your phone home screen.

See detailed phone setup and camera/GPS permissions in [docs/mobile-and-phone-setup.md](docs/mobile-and-phone-setup.md).

---

## Seeded Demo Accounts and Credentials

The system includes pre-seeded demo accounts in the SQLite database (`backend/kabadiwala.db`):

| Role | Email | Password | Business Name and Location | Seeded State |
| :--- | :--- | :--- | :--- | :--- |
| **Dealer** | `dealer@kabadiwala.com` | `password123` | Ramesh Scrap Traders (Mayapuri, Delhi) | Has available stock and purchase logs |
| **Recycler 1** | `greencycle@recycler.com` | `password123` | GreenCycle Recycling (Okhla, Delhi) | Has pending lot `LOT-2026-DEL-001` (PCB 25kg) and completed transaction |
| **Recycler 2** | `ecorecover@recycler.com` | `password123` | EcoRecover Technologies (Noida, UP) | Has disputed transaction `LOT-2026-DEL-003` (Cable) |
| **Recycler 3** | `cleanearth@recycler.com` | `password123` | CleanEarth Recycling (Naraina, Delhi) | Active buyer profile for matching |

---

## Canonical Material Categories

To prevent fraud and maintain accounting integrity across actors, the system strictly enforces **7 canonical e-waste streams**:

1. **PCB** (Printed Circuit Boards / Motherboards)
2. **CRT** (Cathode Ray Tube Monitors/TVs)
3. **LCD** (Flat Screen Displays)
4. **Cable** (Copper / Aluminum Insulated Wire)
5. **Battery** (Lead-Acid / Li-Ion)
6. **Motor/Magnet** (Electric Motors, Compressors, Transformers)
7. **Mixed Plastic** (ABS / Polycarbonate e-waste casings)

---

## Core Features and Implemented Architecture

### 1. Collector Lite (`kabadiwala-lite.html`)
- **Two-Stage Visual Classifier**:
  - Stage 1: Custom YOLOv8n detector localizes scrap items at 416x416 resolution (91.22% mAP@50).
  - Stage 2: EfficientNetB1 INT8 model classifies cropped regions into canonical streams.
  - Tactile 1-tap manual fallback if detection confidence is low.
- **4-Step Guided Workflow**: Photo capture, tactile weight stepper (`1kg`, `5kg`, `10kg`, `25kg`, `50kg`), fair price discovery, and offline GPS slip generation.
- **8 Indian Languages**: Vernacular translation across Hindi, English, Bengali, Telugu, Tamil, Marathi, Gujarati, and Kannada.
- **Spoken Audio Output**: Native Web Speech API synthesis reading total earnings aloud for low-literacy field collectors.
- **100% Offline-First**: Slips persist in browser LocalStorage/IndexedDB with zero internet required.

### 2. Dealer Mobile Hub (`dealer.html`)
- **Purchase Intake Queue**: Record doorstep purchases with persistent UUIDs.
- **Offline Sync Engine**: Queues purchases when offline; synchronizes idempotently when reconnected.
- **Mass-Balance Split Engine**: Subdivides purchase batches atomically so unpooled scrap stays in warehouse inventory.
- **Smart Recycler Matching**: Ranks verified recyclers by Distance (50%), Buying Rate (30%), and Pickup Service (20%).
- **QR Handover Generator**: Generates cryptographic QR payload containing strictly the verified Lot UUID.

### 3. Recycler Web Portal (`http://localhost:5174`)
- **Live Assigned Lots**: Stream of dealer lots ready for physical weighbridge verification.
- **Dual-Weighed Verification**: Compares declared weight with certified weighbridge weight.
- **Discrepancy Warning Engine**: Detects shrinkage, moisture, or fraud. Discrepancies >5% are flagged; >30% trigger critical dispute alert.
- **Milk-Run Pickup Dispatcher**: Geohash neighborhood clustering and Haversine nearest-neighbor route ordering for collection vehicles.
- **Compliance PDF Certificates**: Auto-generates downloadable official verification certificates with GPS, timestamps, and mass balance records.

---

## Running Automated Tests

The backend includes a comprehensive pytest suite covering all business rules, mass balance, security, and QR workflows:

```bash
cd backend
pytest -v
```
Current test suite: **22/22 tests passing (100%)**.

---

## Documentation Index

- [Mobile and Phone Setup Guide](docs/mobile-and-phone-setup.md) - Running over Wi-Fi, PWA installation, and mobile hardware testing.
- [Recycler Dashboard Guide](docs/recycler-dashboard-setup.md) - Recycler setup, dual-weighing, and compliance certificates.
- [Architecture Specifications](docs/architecture.md) - End-to-end technical data flow and system constraints.
- [API Contract](docs/api-contract.md) - Exhaustive REST endpoint documentation and schemas.
- [Dealer Journey](docs/dealers-journey.md) - Step-by-step dealer operations and ledger rules.
- [Collector ML Flow](docs/collector-ml-flow.md) - Model inference, confidence scoring, and fallback flows.