# Cab Management System

A multi-tenant SaaS application for managing cab operations, drivers, vehicles, and contracts.

## Architecture
- **Frontend:** React + Vite, TailwindCSS
- **Backend:** Python + FastAPI, SQLAlchemy
- **Database:** MySQL

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MySQL

### 1. Database Setup
Ensure MySQL is running and create a database named `cab_management`.

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
# Activate virtual environment
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt

# Copy .env.example to .env and configure your database
cp .env.example .env

# Run the backend
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Copy .env.example to .env
cp .env.example .env

# Run the frontend
npm run dev
```

## Deployment
This project is configured for Vercel (Frontend) and standard VPS/Serverless deployment (Backend). Ensure you set the `FRONTEND_URL` environment variable on your backend to match your Vercel URL, and `VITE_API_URL` on Vercel to match your backend URL.
