import { useMemo, useState } from 'react';
import { getForecast } from '../services/api';
import { useCity } from '../context/CityContext.jsx';

const HORIZONS = [1, 3, 6, 12, 24];
const METRIC_TABS = ['AQI', 'PM2.5', 'PM10', 'CO', 'NO2', 'Weather'];

function aqiMeta(aqi) {
  if (aqi <= 50) return { label: 'Good', className: 'severity-good', color: 'var(--color-emerald)', note: 'Clean air for most outdoor plans.' };
  if (aqi <= 100) return { label: 'Moderate', className: 'severity-moderate', color: 'var(--color-amber)', note: 'Acceptable air, with mild sensitivity risk.' };
  if (aqi <= 150) return { label: 'Sensitive Risk', className: 'severity-sensitive', color: '#ffae73', note: 'Sensitive groups should shorten exposure.' };
  if (aqi <= 200) return { label: 'Unhealthy', className: 'severity-unhealthy', color: 'var(--color-rose)', note: 'Outdoor activity is not recommended.' };
  return { label: 'Very Unhealthy', className: 'severity-severe', color: '#d8b4fe', note: 'Avoid unnecessary outdoor exposure.' };
}

function InsightBlock({ insight }) {
  if (!insight) return null;
  const normalized = typeof insight === 'string'
    ? {
        summary: insight,
        risk_interpretation: 'Risk guidance is generated from the current forecast.',
        outdoor_guidance: 'Review the walking safety indicator before planning activity.',
        health_recommendation: 'Reduce exposure if symptoms appear.',
      }
    : insight;

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {[
        ['Summary', normalized.summary],
        ['Risk', normalized.risk_interpretation],
        ['Outdoor', normalized.outdoor_guidance],
        ['Health', normalized.health_recommendation],
      ].map(([label, value]) => (
        <div key={label} className="soft-panel p-4">
          <p className="text-label mb-2">{label}</p>
          <p className="text-sm leading-6 text-muted">{value}</p>
        </div>
      ))}
    </div>
  );
}

export default function Forecasting() {
  const { city, cities, setCity } = useCity();
  const [hours, setHours] = useState(6);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeMetric, setActiveMetric] = useState('AQI');

  async function runForecast() {
    setLoading(true);
    setError(null);
    try {
      const data = await getForecast(city.lat, city.lon, hours, city.name);
      setForecast(data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Forecast unavailable. Confirm the FastAPI server and API keys are configured.');
    } finally {
      setLoading(false);
    }
  }

  const meta = useMemo(() => aqiMeta(forecast?.predicted_aqi || 85), [forecast]);
  const timeline = useMemo(() => {
    if (!forecast) return [];
    return HORIZONS.map((h) => {
      const progress = Math.min(h / Math.max(forecast.forecast_hours, 1), 1);
      const value = Math.round(forecast.current_aqi + forecast.drift * progress);
      return { h, value: Math.max(0, Math.min(300, value)), meta: aqiMeta(value) };
    });
  }, [forecast]);

  const factors = useMemo(() => forecast?.factors || {}, [forecast]);
  const metricDetails = useMemo(() => {
    const details = {
      AQI: {
        value: forecast?.predicted_aqi ?? '--',
        unit: 'AQI',
        title: `Predicted AQI in ${hours} hours`,
        copy: forecast ? meta.note : 'Generate a forecast to see the AQI outlook.',
      },
      'PM2.5': {
        value: factors.pm25_ugm3 ?? '--',
        unit: 'ug/m3',
        title: 'Fine particle pollution',
        copy: 'PM2.5 is weighted strongly because fine particles can affect respiratory comfort.',
      },
      PM10: {
        value: factors.pm10_ugm3 ?? '--',
        unit: 'ug/m3',
        title: 'Coarse particle pollution',
        copy: 'PM10 captures larger dust and smoke particles that can irritate sensitive groups.',
      },
      CO: {
        value: factors.co_ugm3 ?? '--',
        unit: 'ug/m3',
        title: 'Carbon monoxide',
        copy: 'CO is included as a live pollution component for environmental context.',
      },
      NO2: {
        value: factors.no2_ugm3 ?? '--',
        unit: 'ug/m3',
        title: 'Nitrogen dioxide',
        copy: 'NO2 can indicate traffic or combustion-related pollution pressure.',
      },
      Weather: {
        value: factors.weather_condition || '--',
        unit: `${factors.temperature_c ?? '--'} C`,
        title: 'Weather context',
        copy: `Wind is ${factors.wind_speed_ms ?? '--'} m/s and humidity is ${factors.humidity_pct ?? '--'}%. These conditions influence AQI drift.`,
      },
    };
    return details[activeMetric];
  }, [activeMetric, factors, forecast, hours, meta.note]);

  return (
    <div className="page-wrap animate-fade-in">
      <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm text-muted">
            <span className="material-symbols-outlined text-[18px] text-teal">home</span>
            <span>Dashboard</span>
            <span>/</span>
            <span>India</span>
            <span>/</span>
            <span>{city.name}</span>
          </div>
          <p className="text-label text-teal mb-2">Future AQI Forecasting</p>
          <h1 className="text-section">AQI forecast and outdoor safety outlook</h1>
          <p className="mt-2 max-w-3xl leading-7 text-muted">
            Live atmospheric conditions are converted into a near-term AQI estimate with health guidance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
          {METRIC_TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setActiveMetric(item)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                activeMetric === item
                  ? 'bg-sky-300 text-[#071521]'
                  : 'border border-white/10 text-muted hover:border-sky-300/40 hover:text-body'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      <section className="mb-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="panel overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="mb-2 inline-flex items-center gap-2 rounded-md bg-rose-400 px-3 py-1 text-xs font-extrabold text-white">
                  <span className="h-2 w-2 rounded-full bg-white"></span>
                  LIVE BASIS
                </span>
                <h2 className="text-2xl font-extrabold">{city.name} forecasted air quality</h2>
                <p className="mt-1 text-sm text-muted">Estimated from current AQI, PM, wind, humidity, and NO2.</p>
              </div>
              <button className="btn-secondary min-h-10 px-4 py-2 text-sm" onClick={runForecast} disabled={loading}>
                <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                {loading ? 'Updating' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="grid gap-5 p-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-label mb-2">Predicted AQI in {hours} hours</p>
              <div className="flex flex-wrap items-end gap-3">
                <span className="text-7xl font-extrabold" style={{ color: meta.color }}>
                  {forecast?.predicted_aqi ?? '--'}
                </span>
                <span className={`mb-2 rounded-md border px-3 py-1 text-sm font-extrabold ${meta.className}`}>
                  {forecast?.aqi_category || 'Waiting'}
                </span>
              </div>
              <p className="mt-3 text-lg font-semibold text-muted">{forecast ? meta.note : 'Generate a forecast to see the AQI outlook.'}</p>

              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs font-semibold text-muted">
                  <span>Good</span>
                  <span>Moderate</span>
                  <span>Poor</span>
                  <span>Severe</span>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-gradient-to-r from-emerald-300 via-yellow-300 via-orange-300 to-rose-400">
                  {forecast && (
                    <span
                      className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-[#102033] shadow-lg"
                      style={{ left: `${Math.min(96, Math.max(2, (forecast.predicted_aqi / 300) * 100))}%` }}
                    />
                  )}
                </div>
              </div>

              <div className="soft-panel mt-5 p-4">
                <p className="text-label mb-2">{metricDetails.title}</p>
                <div className="mb-2 flex flex-wrap items-end gap-2">
                  <span className="text-3xl font-extrabold text-body">{metricDetails.value}</span>
                  <span className="pb-1 text-sm font-semibold text-muted">{metricDetails.unit}</span>
                </div>
                <p className="text-sm leading-6 text-muted">{metricDetails.copy}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Walking Safety', forecast?.walking_safety || 'Generate forecast', 'directions_walk'],
                ['Trend', forecast?.trend || 'Waiting', 'trending_up'],
                ['Risk Level', forecast?.risk_level || 'Waiting', 'health_and_safety'],
                ['Confidence', forecast?.confidence || 'Waiting', 'verified'],
              ].map(([label, value, icon]) => (
                <div key={label} className="soft-panel p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-label">{label}</p>
                    <span className="material-symbols-outlined text-[20px] text-teal">{icon}</span>
                  </div>
                  <p className="text-xl font-extrabold capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-label mb-4">Forecast Inputs</p>
          <label>
            <span className="mb-2 block text-sm font-semibold text-muted">City</span>
            <select
              value={city.name}
              onChange={(event) => setCity(cities.find((item) => item.name === event.target.value))}
              className="field"
            >
              {cities.map((item) => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </select>
          </label>

          <div className="mt-4">
            <span className="mb-2 block text-sm font-semibold text-muted">Forecast horizon</span>
            <div className="grid grid-cols-5 gap-2">
              {HORIZONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setHours(item)}
                  className={`min-h-11 rounded-lg border text-sm font-extrabold transition ${
                    hours === item
                      ? 'border-teal-300/50 bg-teal-300/20 text-teal'
                      : 'border-white/10 bg-white/5 text-muted hover:text-body'
                  }`}
                >
                  {item}h
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary mt-4 w-full" onClick={runForecast} disabled={loading}>
            <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
            {loading ? 'Analysing Live Conditions' : 'Generate Forecast'}
          </button>

          {error && (
            <div className="mt-4 rounded-lg border border-rose-300/25 bg-rose-300/10 p-3 text-sm font-semibold text-rose">
              {error}
            </div>
          )}
        </div>
      </section>

      {forecast && (
        <div className="space-y-5">
          <section className="grid gap-5 lg:grid-cols-[1fr_0.55fr]">
            <div className="card p-5">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-label">AQI Timeline</p>
                  <h2 className="text-section">Near-term trend projection</h2>
                </div>
                <p className="text-sm text-muted">Current AQI {forecast.current_aqi}; drift {forecast.drift}</p>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {timeline.map((item) => (
                  <div key={item.h} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="mb-3 flex h-24 items-end rounded-md bg-black/10 px-2">
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${Math.max(8, (item.value / 300) * 100)}%`,
                          background: `linear-gradient(180deg, ${item.meta.color}, rgba(255,255,255,0.14))`,
                        }}
                      />
                    </div>
                    <p className="font-data-mono text-xl font-bold">{item.value}</p>
                    <p className="text-sm text-muted">{item.h}h</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="h-full min-h-72 bg-[linear-gradient(135deg,rgba(99,200,255,0.22),rgba(251,113,133,0.18)),radial-gradient(circle_at_30%_35%,rgba(255,255,255,0.22),transparent_5rem)] p-5">
                <div className="rounded-lg border border-white/20 bg-[#102033]/70 p-4 backdrop-blur">
                  <p className="text-label text-teal mb-2">Location Context</p>
                  <h3 className="text-2xl font-extrabold">{city.name}</h3>
                  <p className="mt-2 leading-7 text-muted">
                    Use this with the live dashboard map/API view to compare current and expected exposure before going outside.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="card p-5">
              <p className="text-label mb-4">Measured Factors</p>
              <div className="grid gap-3">
                {[
                  ['PM2.5', `${factors.pm25_ugm3} ug/m3`, 'grain'],
                  ['PM10', `${factors.pm10_ugm3} ug/m3`, 'blur_on'],
                  ['Wind', `${factors.wind_speed_ms} m/s`, 'air'],
                  ['Humidity', `${factors.humidity_pct}%`, 'water_drop'],
                ].map(([label, value, icon]) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[22px] text-teal">{icon}</span>
                      <span className="font-bold text-muted">{label}</span>
                    </div>
                    <span className="font-data-mono font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="insight-card rounded-lg p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-lg bg-teal-300/12 p-3 text-teal">
                  <span className="material-symbols-outlined text-[24px]">psychology</span>
                </span>
                <div>
                  <p className="text-label text-teal">LLM Environmental Health Intelligence</p>
                  <h2 className="text-section">Grounded AI interpretation</h2>
                </div>
              </div>
              <InsightBlock insight={forecast.ai_insight} />
            </div>
          </section>
        </div>
      )}

      {!forecast && !loading && (
        <section className="card p-8 text-center">
          <span className="material-symbols-outlined mx-auto mb-4 block text-[48px] text-teal">travel_explore</span>
          <h2 className="mb-3 text-2xl font-extrabold">Generate a forecast to see AQI, safety, and health guidance.</h2>
          <p className="mx-auto max-w-2xl leading-7 text-muted">
            Example: choose Hyderabad and 6h to answer whether it is safe to walk outside later today.
          </p>
        </section>
      )}
    </div>
  );
}
