import { useEffect, useMemo, useState } from 'react';
import { getLivePrediction, predictAQI } from '../services/api';
import { useCity } from '../context/CityContext.jsx';

function aqiMeta(aqi) {
  if (aqi <= 50) return { label: 'Good', className: 'severity-good', guidance: 'Air quality is comfortable for normal outdoor activity.' };
  if (aqi <= 100) return { label: 'Moderate', className: 'severity-moderate', guidance: 'Most people can continue normal outdoor activity.' };
  if (aqi <= 150) return { label: 'Sensitive Risk', className: 'severity-sensitive', guidance: 'Sensitive groups should reduce prolonged outdoor exposure.' };
  if (aqi <= 200) return { label: 'Unhealthy', className: 'severity-unhealthy', guidance: 'Avoid intense outdoor exercise and reduce exposure.' };
  return { label: 'Very Unhealthy', className: 'severity-severe', guidance: 'Prefer indoor activity and avoid unnecessary exposure.' };
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold text-muted">{label}</span>
      <select name={name} value={value} onChange={onChange} className="field">
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

export default function PredictionEngine() {
  const { city } = useCity();
  const [liveIntel, setLiveIntel] = useState(null);
  const [loadingLive, setLoadingLive] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [formData, setFormData] = useState({
    state: 1,
    area: 1,
    number_of_monitoring_stations: 5,
    prominent_pollutants: 2,
    air_quality_status: 1,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  });

  useEffect(() => {
    let active = true;
    async function loadLiveIntel() {
      try {
        setLoadingLive(true);
        const data = await getLivePrediction(city.lat, city.lon);
        if (active) setLiveIntel(data);
      } catch {
        if (active) setLiveIntel(null);
      } finally {
        if (active) setLoadingLive(false);
      }
    }
    loadLiveIntel();
    return () => {
      active = false;
    };
  }, [city]);

  function handleChange(event) {
    setFormData({ ...formData, [event.target.name]: Number(event.target.value) });
  }

  function localFallbackPredict(data) {
    let score = 52;
    score += Number(data.state) * 7;
    score += Number(data.area) * 5;
    score += Number(data.number_of_monitoring_stations) * 1.8;
    score += Number(data.prominent_pollutants) * 8;
    score += Number(data.air_quality_status) * 12.5;
    return Math.max(0, Math.min(500, score));
  }

  async function handlePredict(event) {
    event.preventDefault();
    setPredicting(true);
    setError(null);
    setNotice(null);
    try {
      const data = await predictAQI(formData);
      setPredictionResult(data);
    } catch (err) {
      const detail = err?.response?.data?.detail || '';
      if (String(detail).toLowerCase().includes('model artifact not found')) {
        setPredictionResult({
          predicted_aqi: localFallbackPredict(formData),
          method: 'frontend_fallback_heuristic',
        });
        setNotice('Primary model artifact is not available on deployed API yet. Using fallback estimation for now.');
      } else {
        setError(detail || 'Prediction failed. Please try again.');
      }
    } finally {
      setPredicting(false);
    }
  }

  const liveFeatures = liveIntel?.live_features;
  const liveAqi = liveFeatures?.pm2_5 ? Math.round(liveFeatures.pm2_5 * 3.4) : null;
  const predictedAqi = predictionResult?.predicted_aqi ? Math.round(predictionResult.predicted_aqi) : null;
  const displayAqi = predictedAqi || liveAqi || 75;
  const meta = useMemo(() => aqiMeta(displayAqi), [displayAqi]);

  const liveMetrics = [
    ['PM2.5', liveFeatures?.pm2_5, 'ug/m3'],
    ['PM10', liveFeatures?.pm10, 'ug/m3'],
    ['Humidity', liveFeatures?.humidity, '%'],
    ['Wind', liveFeatures?.wind_speed, 'm/s'],
  ];

  return (
    <div className="page-wrap animate-fade-in">
      <header className="mb-8">
        <p className="text-label text-teal mb-2">ML Prediction Engine</p>
        <h1 className="text-heading mb-3">Model-serving workflow for AQI prediction.</h1>
        <p className="max-w-3xl text-lg leading-8 text-muted">
          This page keeps the existing Random Forest endpoint visible for the MLOps demonstration while the live dashboard and forecast page handle current and future environmental decisions.
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handlePredict} className="card p-6">
          <p className="text-label mb-5">Encoded Model Inputs</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Region Type"
              name="state"
              value={formData.state}
              onChange={handleChange}
              options={[
                { value: 1, label: 'Metro or major city' },
                { value: 2, label: 'Tier-2 city' },
                { value: 3, label: 'Coastal area' },
                { value: 4, label: 'Industrial zone' },
                { value: 5, label: 'Rural or agricultural area' },
              ]}
            />
            <SelectField
              label="Urban Density"
              name="area"
              value={formData.area}
              onChange={handleChange}
              options={[
                { value: 1, label: 'Very dense' },
                { value: 2, label: 'Dense urban' },
                { value: 3, label: 'Suburban' },
                { value: 4, label: 'Outskirts' },
              ]}
            />
            <SelectField
              label="Monitoring Stations"
              name="number_of_monitoring_stations"
              value={formData.number_of_monitoring_stations}
              onChange={handleChange}
              options={[
                { value: 2, label: 'Few stations' },
                { value: 5, label: 'Moderate network' },
                { value: 10, label: 'Dense network' },
              ]}
            />
            <SelectField
              label="Dominant Pollutant Source"
              name="prominent_pollutants"
              value={formData.prominent_pollutants}
              onChange={handleChange}
              options={[
                { value: 1, label: 'Vehicle traffic' },
                { value: 2, label: 'Industrial activity' },
                { value: 3, label: 'Dust and construction' },
                { value: 4, label: 'Crop burning' },
                { value: 5, label: 'Mixed or unknown' },
              ]}
            />
            <div className="sm:col-span-2">
              <SelectField
                label="Observed Air Quality Status"
                name="air_quality_status"
                value={formData.air_quality_status}
                onChange={handleChange}
                options={[
                  { value: 1, label: 'Clean, clear visibility' },
                  { value: 2, label: 'Acceptable, slight haze' },
                  { value: 3, label: 'Poor, noticeable haze' },
                  { value: 4, label: 'Severe, heavy smog' },
                ]}
              />
            </div>
          </div>

          {notice && (
            <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-sm font-semibold text-amber">
              {notice}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-rose-300/25 bg-rose-300/10 p-3 text-sm font-semibold text-rose">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary mt-5 w-full" disabled={predicting}>
            <span className={`material-symbols-outlined text-[20px] ${predicting ? 'animate-spin' : ''}`}>psychology</span>
            {predicting ? 'Running Prediction' : 'Predict AQI'}
          </button>
        </form>

        <div className="space-y-5">
          <div className="panel p-6">
            <p className="text-label">Model Output</p>
            <div className="my-5 flex flex-wrap items-end gap-4">
              <span className="text-7xl font-extrabold text-teal">{displayAqi}</span>
              <span className={`mb-2 rounded-full border px-3 py-1 text-sm font-bold ${meta.className}`}>
                {meta.label}
              </span>
            </div>
            <p className="text-xl leading-8 text-muted">{meta.guidance}</p>
          </div>

          <div className="card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-label">Live Feature Context</p>
                <h2 className="text-section">{city.name}</h2>
              </div>
              {loadingLive && <span className="text-sm font-semibold text-muted">Loading</span>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {liveMetrics.map(([label, value, unit]) => (
                <div key={label} className="soft-panel p-4">
                  <p className="text-label mb-2">{label}</p>
                  <p className="text-2xl font-extrabold">
                    {value ?? '--'} <span className="text-sm font-semibold text-muted">{unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="insight-card rounded-lg p-5">
            <p className="text-label text-teal mb-2">Best Product Path</p>
            <p className="leading-7 text-muted">
              Use Live Analysis for current conditions and Forecasting for future outdoor decisions. This model page is retained for demonstrating model serving and MLflow-backed training.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
