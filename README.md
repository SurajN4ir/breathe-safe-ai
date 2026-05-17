# Breathe Safe AI

Breathe Safe AI is an end-to-end AI + MLOps platform for live environmental intelligence and AQI forecasting.
It combines live API ingestion, multi-horizon forecasting (1h, 3h, 6h, 12h, 24h), health guidance generation, and production-style MLOps tooling.

## Product Modes

- Live Environmental Analysis: current AQI, weather, pollutant metrics, and respiratory guidance.
- Future AQI Forecasting: horizon-aware AQI prediction for 1/3/6/12/24 hours.
- Environmental Insight Layer: structured, grounded interpretation for health and outdoor decisions.

## Pipeline Flow

1. Data Ingestion  
   `src/data/ingestion.py`

2. Data Validation (Great Expectations)  
   `src/data/validation.py`

3. Live Feature Processing  
   `src/features/live_preprocessing.py`

4. Model Training (Existing AQI model)  
   `src/models/train.py`

5. Multi-Horizon Forecast Training (1/3/6/12/24h)  
   `src/models/train_forecast_multi_horizon.py`

6. Lineage Event Emission (OpenLineage-ready)  
   `src/mlops/openlineage.py`

7. API Serving  
   `src/api/main.py`

## Core API Endpoints

- `GET /` - backend health.
- `POST /predict` - ML AQI prediction from encoded features.
- `GET /live-environment?lat=&lon=` - raw live weather + pollution.
- `GET /predict-live?lat=&lon=` - processed live environmental features.
- `GET /forecast?city=Hyderabad&hours=6` - multi-horizon AQI forecast.
- `GET /metrics` - Prometheus-compatible API telemetry.

## Forecasting Architecture

The forecast endpoint now uses a horizon-aware hybrid strategy:

- Current pollution signals (PM2.5, PM10, NO2, CO, AQI anchor)
- Forecasted weather at selected horizon (wind, humidity, temperature, condition)
- Trained multi-horizon models when artifacts are available
- Safe heuristic fallback when trained models are unavailable

Trained artifacts path:

- `models/forecast_models/aqi_forecast_1h.joblib`
- `models/forecast_models/aqi_forecast_3h.joblib`
- `models/forecast_models/aqi_forecast_6h.joblib`
- `models/forecast_models/aqi_forecast_12h.joblib`
- `models/forecast_models/aqi_forecast_24h.joblib`

## Quick Start

### Backend

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.api.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Primary URLs

- API Docs: `http://127.0.0.1:8000/docs`
- API Metrics: `http://127.0.0.1:8000/metrics`
- Frontend: `http://127.0.0.1:5173` (or `5174` if 5173 is in use)

## Multi-Horizon Model Training

### 1) Build historical city-hourly dataset

```bash
python -m src.data.build_city_hourly_dataset
```

Output:

- `data/processed/city_hourly_aqi.csv`

### 2) Train 1/3/6/12/24h forecasting models

```bash
python -m src.models.train_forecast_multi_horizon
```

Outputs:

- `models/forecast_models/*.joblib`
- `models/forecast_models/training_summary.json`
- MLflow experiment runs in `BreatheSafeAQI_Forecast_MultiHorizon`

## MLOps Requirements Mapping

- Source Control + CI: `.github/workflows/`
- FastAPI Serving: `src/api/main.py`
- React Frontend: `frontend/src/`
- Experiment Tracking + Registry: MLflow in training scripts + compose service
- Containerization: `Dockerfile`, `docker-compose.yml`
- Data Quality: `gx/`, `src/data/validation.py`
- Feature Store: `feature_store/`
- Data Versioning: DVC files (`.dvc/` if initialized)
- Data Lineage: `src/mlops/openlineage.py`, `infrastructure/openlineage/`, Marquez service
- Monitoring (model/data): `monitoring/evidently_report.py`
- Infra Monitoring: `infrastructure/prometheus/`, `infrastructure/grafana/`
- Kubernetes: `infrastructure/kubernetes/`
- ArgoCD: `infrastructure/argocd/`
- Prompt Management: `promptfoo/`

## Docker Profiles

Core services:

```bash
docker compose up -d --build api frontend mlflow
```

Observability stack:

```bash
docker compose --profile observability up -d
```

Lineage stack:

```bash
docker compose --profile lineage up -d
```

## Environment Variables

Create `.env` from `.env.example` and set:

```bash
OPENWEATHER_API_KEY=your_openweather_key
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama3-8b-8192
OPENLINEAGE_URL=http://127.0.0.1:5001/api/v1/lineage
OPENLINEAGE_NAMESPACE=breathe-safe-ai
```

## Verification Checklist

- API up: open `/docs`.
- Metrics up: open `/metrics`.
- Forecast works for all horizons: call `/forecast` with `hours=1,3,6,12,24`.
- Trained mode active: response `method` includes `Trained multi-horizon model blended...`.
- MLflow runs visible at `http://127.0.0.1:5000`.
- Prometheus/Grafana reachable when observability profile is enabled.
- Marquez reachable when lineage profile is enabled.

## Roadmap

- Add city-level model selection and confidence intervals (`predicted_aqi_low/high`).
- Add scheduled retraining and drift-triggered model refresh.
- Extend feature store usage for online/offline feature parity.
- Strengthen lineage facets with dataset schema and model version links.
