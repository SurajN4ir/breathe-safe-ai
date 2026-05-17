import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLiveEnvironment } from '../services/api';
import { useCity } from '../context/CityContext.jsx';

function numericAqi(owmAqi, pm25) {
  const base = { 1: 35, 2: 75, 3: 125, 4: 175, 5: 230 }[owmAqi] || 75;
  const particle = pm25 <= 12 ? 25 + pm25 * 2 : pm25 <= 35.4 ? 51 + (pm25 - 12) * 2.1 : 101 + (pm25 - 35.4) * 2.5;
  return Math.round(base * 0.35 + particle * 0.65);
}

function aqiMeta(aqi) {
  if (aqi <= 50) return { label: 'Good', className: 'severity-good', summary: 'Air quality is comfortable for most people.' };
  if (aqi <= 100) return { label: 'Moderate', className: 'severity-moderate', summary: 'Most people can continue normal outdoor activity.' };
  if (aqi <= 150) return { label: 'Sensitive Risk', className: 'severity-sensitive', summary: 'Sensitive groups should reduce prolonged outdoor exposure.' };
  if (aqi <= 200) return { label: 'Unhealthy', className: 'severity-unhealthy', summary: 'Outdoor activity should be limited, especially for sensitive groups.' };
  return { label: 'Very Unhealthy', className: 'severity-severe', summary: 'Avoid outdoor exposure where possible.' };
}

function LoadingState() {
  return (
    <div className="page-wrap animate-pulse">
      <div className="mb-8 h-12 w-2/3 rounded-lg bg-white/10"></div>
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="h-96 rounded-lg bg-white/10"></div>
        <div className="grid gap-5 sm:grid-cols-2">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-40 rounded-lg bg-white/10"></div>)}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { city } = useCity();
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchLiveData() {
      try {
        setLoading(true);
        const data = await getLiveEnvironment(city.lat, city.lon);
        if (!active) return;
        setLiveData(data);
        setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setError(null);
      } catch {
        if (!active) return;
        setError('Live data is unavailable. Confirm the FastAPI server and OpenWeather API key are configured.');
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [city]);

  const view = useMemo(() => {
    const components = liveData?.pollution?.list?.[0]?.components || {};
    const weather = liveData?.weather || {};
    const pm25 = Number(components.pm2_5 ?? 0);
    const pm10 = Number(components.pm10 ?? 0);
    const owmAqi = liveData?.pollution?.list?.[0]?.main?.aqi || 2;
    const aqi = numericAqi(owmAqi, pm25);
    const meta = aqiMeta(aqi);

    return {
      components,
      weather,
      pm25,
      pm10,
      no2: components.no2 ?? '--',
      co: components.co ?? '--',
      temp: weather.main?.temp ?? '--',
      humidity: weather.main?.humidity ?? '--',
      pressure: weather.main?.pressure ?? '--',
      wind: weather.wind?.speed ?? '--',
      condition: weather.weather?.[0]?.description || 'Current condition unavailable',
      aqi,
      meta,
    };
  }, [liveData]);

  if (loading && !liveData) return <LoadingState />;

  const metrics = [
    {
      icon: 'thermostat',
      label: 'Temperature',
      value: `${view.temp} C`,
      guidance: 'Heat and humidity can affect breathing comfort during activity.',
      color: 'text-sky',
    },
    {
      icon: 'water_drop',
      label: 'Humidity',
      value: `${view.humidity}%`,
      guidance: Number(view.humidity) > 65 ? 'High humidity may make polluted air feel heavier.' : 'Humidity is not currently a major risk amplifier.',
      color: 'text-teal',
    },
    {
      icon: 'air',
      label: 'Wind',
      value: `${view.wind} m/s`,
      guidance: Number(view.wind) < 2 ? 'Low wind can allow pollutants to accumulate.' : 'Wind may help disperse local pollution.',
      color: 'text-emerald',
    },
    {
      icon: 'compress',
      label: 'Pressure',
      value: `${view.pressure} hPa`,
      guidance: 'Atmospheric pressure helps contextualize local weather stability.',
      color: 'text-amber',
    },
  ];

  const pollutants = [
    {
      label: 'PM2.5 fine particles',
      value: view.pm25,
      unit: 'ug/m3',
      guidance: view.pm25 > 35 ? 'Fine particle pollution may increase respiratory discomfort.' : 'Fine particles are within a more comfortable range.',
    },
    {
      label: 'PM10 coarse particles',
      value: view.pm10,
      unit: 'ug/m3',
      guidance: view.pm10 > 60 ? 'Dust and coarse particles are elevated; sensitive groups should use caution.' : 'Coarse particle levels are not strongly elevated.',
    },
    {
      label: 'Nitrogen dioxide',
      value: view.no2,
      unit: 'ug/m3',
      guidance: Number(view.no2) > 40 ? 'Traffic-related pollution may be contributing to irritation risk.' : 'NO2 is not showing a high traffic pollution signal.',
    },
  ];

  return (
    <div className="page-wrap animate-fade-in">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-label text-teal mb-2">Live Analysis</p>
          <h1 className="text-heading mb-3">Current air intelligence for {city.name}</h1>
          <p className="max-w-3xl text-lg leading-8 text-muted">
            Real-time AQI, weather, particulate pollution, and practical respiratory guidance from the live environmental API.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/10 px-4 py-3">
          <p className="text-label">Last updated</p>
          <p className={error ? 'font-semibold text-rose' : 'font-semibold text-emerald'}>{error || lastSync || 'Syncing'}</p>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="panel p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-label">Current AQI</p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <span className="text-7xl font-extrabold text-teal">{view.aqi}</span>
                <span className={`mb-2 rounded-full border px-3 py-1 text-sm font-bold ${view.meta.className}`}>
                  {view.meta.label}
                </span>
              </div>
            </div>
            <span className="rounded-lg bg-white/10 p-3 text-sky">
              <span className="material-symbols-outlined text-[32px]">monitor_heart</span>
            </span>
          </div>

          <p className="mb-6 text-xl leading-8 text-body">{view.meta.summary}</p>

          <div className="insight-card rounded-lg p-5">
            <p className="mb-2 text-sm font-bold text-teal">Health Guidance</p>
            <p className="leading-7 text-muted">
              {view.aqi <= 100
                ? 'Outdoor walking is generally suitable. People with respiratory sensitivity should stay aware of symptoms.'
                : view.aqi <= 150
                  ? 'Keep outdoor activity shorter, especially for children, older adults, and people with asthma.'
                  : 'Avoid prolonged outdoor activity and consider a protective mask if travel is necessary.'}
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {metrics.map((item) => (
            <article key={item.label} className="metric-card">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-label">{item.label}</p>
                <span className={`material-symbols-outlined text-[26px] ${item.color}`}>{item.icon}</span>
              </div>
              <p className="mb-3 text-3xl font-extrabold">{item.value}</p>
              <p className="text-sm leading-6 text-muted">{item.guidance}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-label">Pollution Metrics</p>
              <h2 className="text-section">What is in the air now</h2>
            </div>
            <p className="text-sm capitalize text-muted">{view.condition}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {pollutants.map((item) => (
              <div key={item.label} className="soft-panel p-4">
                <p className="mb-2 text-sm font-bold text-muted">{item.label}</p>
                <p className="mb-3 text-3xl font-extrabold">
                  {item.value} <span className="text-sm font-semibold text-muted">{item.unit}</span>
                </p>
                <p className="text-sm leading-6 text-muted">{item.guidance}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <p className="text-label mb-3">Outdoor Decision</p>
          <h2 className="mb-4 text-2xl font-extrabold">
            {view.aqi <= 100 ? 'Good time for normal activity' : view.aqi <= 150 ? 'Plan lighter exposure' : 'Prefer indoor activity'}
          </h2>
          <p className="mb-5 leading-7 text-muted">
            This live view is for current conditions. Use the Forecasting tab before planning evening walks, workouts, or commute timing.
          </p>
          <Link to="/forecast" className="btn-secondary w-full">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
            Check Future AQI
          </Link>
        </div>
      </section>
    </div>
  );
}
