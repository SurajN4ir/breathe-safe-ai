# Breathe Safe AI Frontend

React + Vite frontend for Breathe Safe AI.

## Local Development

```bash
npm install
npm run dev
```

The app expects the FastAPI backend at:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Copy `.env.example` to `.env` if you need to override the default.

## Production Build

```bash
npm run build
npm run preview
```

## Main Routes

- `/` - platform overview
- `/dashboard` - live environmental analysis
- `/forecast` - future AQI forecasting
- `/prediction` - Random Forest model-serving demo
- `/mlops` - MLOps workflow overview
- `/systems` - monitoring and observability overview
