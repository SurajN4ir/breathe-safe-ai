import { Link } from 'react-router-dom';

const pillars = [
  {
    icon: 'monitor_heart',
    title: 'Live Environmental Intelligence',
    copy: 'Current AQI, weather, particulate matter, and respiratory risk in one readable view.',
  },
  {
    icon: 'schedule',
    title: 'Future AQI Forecasting',
    copy: 'Near-term AQI outlooks for 1, 3, 6, 12, and 24 hours using transparent atmospheric heuristics.',
  },
  {
    icon: 'health_and_safety',
    title: 'Health Guidance',
    copy: 'Plain-language recommendations for walking, exercise, sensitive groups, and exposure reduction.',
  },
];

const stack = ['FastAPI', 'React', 'MLflow', 'Docker', 'Great Expectations', 'Groq Llama 3'];

export default function LandingPage() {
  return (
    <>
      <section className="page-wrap min-h-[calc(100vh-64px)] grid items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-teal-300/25 bg-teal-300/10 px-4 py-2">
            <span className="live-dot"></span>
            <span className="text-label text-teal">Real-time AQI and forecast intelligence</span>
          </div>

          <h1 className="text-display mb-6">
            Environmental intelligence for safer breathing decisions.
          </h1>

          <p className="mb-8 max-w-2xl text-xl leading-8 text-muted">
            Breathe Safe AI combines live air quality data, lightweight AQI forecasting,
            machine learning infrastructure, and LLM-powered health interpretation in a clean full-stack platform.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/dashboard" className="btn-primary">
              <span className="material-symbols-outlined text-[20px]">monitor_heart</span>
              View Live Analysis
            </Link>
            <Link to="/forecast" className="btn-secondary">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
              Forecast AQI
            </Link>
          </div>
        </div>

        <div className="panel p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-label">Hyderabad Outlook</p>
              <h2 className="text-section">Will it be safe to walk later?</h2>
            </div>
            <span className="rounded-lg bg-sky-300/12 p-3 text-sky">
              <span className="material-symbols-outlined text-[28px]">airwave</span>
            </span>
          </div>

          <div className="grid gap-4">
            <div className="rounded-lg border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-semibold text-muted">Predicted AQI in 6 hours</p>
              <div className="mt-2 flex items-end gap-3">
                <span className="text-6xl font-extrabold text-amber">142</span>
                <span className="mb-2 rounded-full border px-3 py-1 text-sm font-bold severity-sensitive">
                  Sensitive Groups
                </span>
              </div>
            </div>

            <div className="insight-card rounded-lg p-5">
              <p className="mb-2 text-sm font-bold text-teal">AI Environmental Insight</p>
              <p className="leading-7 text-muted">
                Fine particle pollution may remain elevated if wind stays low. Sensitive individuals should keep evening walks shorter and avoid intense outdoor exercise.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="soft-panel p-4">
                <p className="text-label mb-1">Walking</p>
                <p className="text-lg font-bold">Use Caution</p>
              </div>
              <div className="soft-panel p-4">
                <p className="text-label mb-1">Risk</p>
                <p className="text-lg font-bold text-amber">Elevated</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-wrap pb-16">
        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map((item) => (
            <article key={item.title} className="card p-6">
              <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-teal">
                <span className="material-symbols-outlined text-[26px]">{item.icon}</span>
              </span>
              <h3 className="mb-3 text-xl font-bold">{item.title}</h3>
              <p className="leading-7 text-muted">{item.copy}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-5">
          <p className="text-label mb-3">Built with an MLOps-ready stack</p>
          <div className="flex flex-wrap gap-2">
            {stack.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-muted">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
