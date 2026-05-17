const stages = [
  ['Data Validation', 'Great Expectations checks AQI ranges, nulls, and valid status labels.'],
  ['Versioning', 'DVC tracks datasets and reproducible training artifacts.'],
  ['Experiment Tracking', 'MLflow records Random Forest training runs, metrics, and model artifacts.'],
  ['Serving', 'FastAPI exposes /predict, /live-environment, /predict-live, and /forecast.'],
  ['Frontend', 'React presents live analysis, forecasting, and AI health guidance.'],
  ['Monitoring', 'Evidently, Prometheus, and Grafana scaffolding support drift and service observability.'],
];

const tools = [
  'OpenLineage + Marquez',
  'DVC',
  'Great Expectations',
  'Feast',
  'MLflow',
  'Docker',
  'Kubernetes',
  'Evidently AI',
  'Prometheus + Grafana',
  'GitHub Actions',
  'ArgoCD',
  'Promptfoo',
];

export default function MLOps() {
  return (
    <div className="page-wrap animate-fade-in">
      <header className="mb-8">
        <p className="text-label text-teal mb-2">MLOps Architecture</p>
        <h1 className="text-heading mb-3">A structured workflow for model, data, prompt, and deployment governance.</h1>
        <p className="max-w-3xl text-lg leading-8 text-muted">
          This view documents the project workflow honestly: core FastAPI, React, MLflow, Docker, DVC, and Great Expectations are integrated, while advanced platform tools are scaffolded for demonstration and future production hardening.
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="card p-6">
          <p className="text-label mb-5">Pipeline Flow</p>
          <div className="space-y-4">
            {stages.map(([title, copy], index) => (
              <div key={title} className="flex gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-300/12 font-data-mono font-bold text-teal">
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-lg font-extrabold">{title}</h2>
                  <p className="mt-1 leading-7 text-muted">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <p className="text-label mb-5">Assignment Coverage</p>
          <div className="grid gap-2">
            {tools.map((tool) => (
              <div key={tool} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <span className="material-symbols-outlined text-[19px] text-emerald">check_circle</span>
                <span className="font-semibold text-muted">{tool}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 md:grid-cols-3">
        <article className="insight-card rounded-lg p-6">
          <p className="text-label text-teal mb-3">Forecasting Layer</p>
          <h2 className="mb-3 text-xl font-extrabold">Transparent prototype intelligence</h2>
          <p className="leading-7 text-muted">
            The forecast module uses current AQI, PM2.5, PM10, humidity, wind, and NO2 to estimate near-term drift without claiming deep atmospheric modeling.
          </p>
        </article>
        <article className="card p-6">
          <p className="text-label mb-3">LLM Layer</p>
          <h2 className="mb-3 text-xl font-extrabold">Environmental interpretation</h2>
          <p className="leading-7 text-muted">
            Groq Llama 3 receives structured environmental values and returns grounded JSON guidance for health risk and outdoor activity.
          </p>
        </article>
        <article className="card p-6">
          <p className="text-label mb-3">Roadmap</p>
          <h2 className="mb-3 text-xl font-extrabold">Production evolution</h2>
          <p className="leading-7 text-muted">
            Historical AQI training, XGBoost or LSTM forecasting, Kubernetes rollout, ArgoCD sync, and deeper drift monitoring are documented next steps.
          </p>
        </article>
      </section>
    </div>
  );
}
