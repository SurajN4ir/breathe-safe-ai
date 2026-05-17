# Breathe Safe AI

Breathe Safe AI is an AI-powered environmental intelligence and AQI forecasting platform. It combines live air quality data, weather signals, machine learning model serving, lightweight future AQI forecasting, and LLM-powered health interpretation.

The project now has two product modes:

- Live Environmental Analysis: current AQI, weather, pollution metrics, and respiratory guidance.
- Future AQI Forecasting: 1, 3, 6, 12, and 24 hour AQI outlooks with walking and health recommendations.

## Architecture

```text
React Frontend
  -> FastAPI Backend
    -> Live Environmental Services
      -> OpenWeather weather + air pollution APIs
    -> Preprocessing Layer
    -> Random Forest AQI Model
    -> Forecasting Heuristics
    -> Groq Llama 3 Environmental Insight Layer
  -> MLOps Tooling
    -> DVC, Great Expectations, Feast, MLflow, Evidently
    -> Docker, Kubernetes, Prometheus, Grafana, OpenLineage, Marquez, ArgoCD
    -> Promptfoo prompt evaluation
```

## Backend

FastAPI serves the platform from `src/api/main.py`.

Endpoints:

- `GET /`: API health check.
- `POST /predict`: ML-based AQI prediction using `models/aqi_model.pkl`.
- `GET /live-environment?lat=&lon=`: current weather and pollution data.
- `GET /predict-live?lat=&lon=`: processed live environmental features.
- `GET /forecast?city=Hyderabad&hours=6`: future AQI forecast. Coordinates can also be supplied with `lat` and `lon`.

Forecast response includes predicted AQI, AQI category, trend, walking safety, respiratory warning, health recommendation, confidence, contributing factors, and AI insight.

## Forecasting Logic

The forecasting layer is a lightweight predictive intelligence module, not a deep atmospheric model. It estimates AQI drift using:

- current AQI
- PM2.5 and PM10
- humidity
- wind speed
- NO2
- forecast horizon

Low wind, elevated particulate matter, and high humidity can increase projected AQI. Stronger wind can improve the estimate by dispersing pollution. The longer the horizon, the more directional the forecast becomes.

## LLM Environmental Insight Layer

`src/services/llm_insights.py` uses Groq with Llama 3 when `GROQ_API_KEY` is configured. The LLM acts as an Environmental Health Intelligence Engine, not a chatbot.

It receives structured AQI, pollution, weather, and forecast values, then returns JSON:

- `summary`
- `risk_interpretation`
- `outdoor_guidance`
- `health_recommendation`

If Groq is unavailable, the backend returns deterministic rule-based guidance.

Promptfoo-compatible prompt tests live in `promptfoo/`.

## Frontend

The React + Vite frontend lives in `frontend/`.

Main routes:

- `/`: premium overview page.
- `/dashboard`: live environmental analysis.
- `/forecast`: AQI forecasting workflow.
- `/prediction`: existing ML prediction workflow.

Configure the frontend API base URL with:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## MLOps Stack

Assignment coverage:

- Data Lineage: OpenLineage + Marquez scaffold in `infrastructure/openlineage/` and `docker-compose.yml`, with lineage event emission in ingestion/validation/training jobs.
- Versioning: DVC initialized with `.dvc/`.
- Data Quality: Great Expectations in `gx/`.
- Feature Store: Feast config in `feature_store/`.
- Experiment Tracking: MLflow in `src/models/train.py` and Docker Compose.
- Orchestration: Docker Compose and Kubernetes manifests in `infrastructure/kubernetes/`.
- Deployment: FastAPI backend and React frontend.
- Monitoring: Evidently report script in `monitoring/`.
- Infrastructure Monitoring: Prometheus and Grafana configs in `infrastructure/`.
- SCM and CI: GitHub Actions in `.github/workflows/ci.yml`.
- Continuous Deployment: ArgoCD application manifest in `infrastructure/argocd/`.
- Prompt Management: Promptfoo config in `promptfoo/`.

## Local Setup

Backend:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.api.main:app --reload
```

Optional full MLOps tooling:

```bash
pip install -r requirements-mlops.txt
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Docker:

```bash
docker compose up -d --build api frontend mlflow
```

Optional observability and lineage profiles:

```bash
docker compose --profile observability up -d
docker compose --profile lineage up -d
```

Service URLs:

- FastAPI: `http://127.0.0.1:8000`
- MLflow: `http://127.0.0.1:5000`
- Prometheus: `http://127.0.0.1:9090`
- Grafana: `http://127.0.0.1:3001`
- Marquez: `http://127.0.0.1:5001`

## Environment Variables

Copy `.env.example` to `.env` and add your keys:

```bash
OPENWEATHER_API_KEY=your_openweather_key
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama3-8b-8192
OPENLINEAGE_URL=http://127.0.0.1:5001/api/v1/lineage
OPENLINEAGE_NAMESPACE=breathe-safe-ai
```

Never commit `.env` to GitHub. It is ignored by `.gitignore`.

## Future Roadmap

- Train a true historical AQI forecasting model with XGBoost, Prophet, or LSTM.
- Add city-level historical AQI feature pipelines through Feast.
- Add OpenLineage dataset schema facets and column-level metadata.
- Add Evidently scheduled drift reports.
- Deploy Kubernetes manifests through ArgoCD.
- Expand Promptfoo tests for hallucination resistance and guidance consistency.

## Pipeline Commands

Run data ingestion:

```bash
python -m src.data.ingestion
```

Run Great Expectations validation (fails with non-zero exit if checks fail):

```bash
python -m src.data.validation
```

Train model with MLflow tracking and OpenLineage event emission:

```bash
python -m src.models.train
```

Run Promptfoo prompt tests:

```bash
cd promptfoo
promptfoo eval -c promptfooconfig.yaml
```
