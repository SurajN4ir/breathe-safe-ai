const observability = [
  ['Prometheus', 'Scrapes backend and infrastructure metrics from configured targets.'],
  ['Grafana', 'Provides dashboards for API latency, request rate, and service health.'],
  ['Evidently AI', 'Generates drift and data quality reports for model monitoring.'],
  ['OpenLineage', 'Captures lineage events for pipeline transparency via Marquez.'],
];

export default function SystemMonitoring() {
  return (
    <div className="page-wrap animate-fade-in">
      <header className="mb-8">
        <p className="text-label text-teal mb-2">Observability</p>
        <h1 className="text-heading mb-3">Monitoring structure for data, model, and service health.</h1>
        <p className="max-w-3xl text-lg leading-8 text-muted">
          The platform includes configuration scaffolding for Prometheus, Grafana, Evidently, and OpenLineage. Run these services through Docker Compose or Kubernetes when demonstrating the full MLOps workflow.
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-2">
        {observability.map(([title, copy]) => (
          <article key={title} className="card p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-lg bg-sky-300/12 p-3 text-sky">
                <span className="material-symbols-outlined text-[24px]">monitoring</span>
              </span>
              <h2 className="text-2xl font-extrabold">{title}</h2>
            </div>
            <p className="leading-7 text-muted">{copy}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 insight-card rounded-lg p-6">
        <p className="text-label text-teal mb-3">Demo Guidance</p>
        <p className="text-lg leading-8 text-muted">
          Use the live API and forecast pages for product demonstration, then open MLflow, Grafana, Marquez, Great Expectations, and Promptfoo configs to explain the wider MLOps architecture.
        </p>
      </section>
    </div>
  );
}
