# Architecture

Breathe Safe AI is structured as a full-stack MLOps project with product-facing environmental intelligence.

## Runtime Flow

1. React collects city and forecast horizon.
2. FastAPI receives live or forecast requests.
3. Live services fetch weather and pollution data from OpenWeather.
4. Preprocessing normalizes weather, particulate, and pollution metrics.
5. Forecasting estimates near-term AQI drift using transparent heuristics.
6. Groq Llama 3 converts metrics into structured health guidance.
7. React renders live AQI, forecast outlook, walking safety, and respiratory recommendations.

## MLOps Flow

1. Raw data is versioned with DVC.
2. Great Expectations validates AQI ranges, null values, and category correctness.
3. Feature Store definitions live in Feast.
4. MLflow tracks Random Forest training metrics and artifacts.
5. Evidently is prepared for drift and data quality reporting.
6. Prometheus and Grafana are configured for infrastructure observability.
7. OpenLineage and Marquez are scaffolded for pipeline lineage.
8. Kubernetes manifests and ArgoCD config support GitOps deployment.
9. Promptfoo tests evaluate LLM environmental interpretations.
