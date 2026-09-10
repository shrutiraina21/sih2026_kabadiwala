# Recycler Dashboard Setup & Run Guide

This branch contains the fully functional MVP for the Recycler Dashboard (Journey 3).
It has been built using the MERN stack but modified to use an **in-memory database** so you do NOT need to install or run MongoDB to demo it. 

## Structure
- `recycler-dashboard-backend/` - Node.js + Express backend (Port 5000)
- `recycler-dashboard-frontend/` - React + Vite + Tailwind CSS frontend (Port 5173)

## Prerequisites
- Node.js installed (v18+ recommended)

## How to Run for a Demo

You need two terminal windows open.

### 1. Start the Backend
Open your first terminal and run:
```bash
cd recycler-dashboard-backend
npm install
npm run dev
```
*You should see "Server running on port 5000".*

### 2. Start the Frontend
Open your second terminal and run:
```bash
cd recycler-dashboard-frontend
npm install
npm run dev
```
*You should see a Vite success message.*

### 3. View the App
Open your browser and navigate to:
**http://localhost:5173**

## Features Implemented
- **Incoming Lots (`/`)**: View a table of pending and confirmed lots.
- **Confirm Handover (`/confirm`)**: Type `LOT-001` or `LOT-002`, enter a verified weight, and click confirm to auto-generate and download an **EPR Handover Certificate (PDF)**.
- **Recycler Profile (`/profile`)**: Manage accepted materials and their rates.
