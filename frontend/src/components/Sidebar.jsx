import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', icon: 'monitor_heart', label: 'Live Analysis' },
  { to: '/forecast', icon: 'schedule', label: 'Forecasting' },
  { to: '/prediction', icon: 'psychology', label: 'ML Prediction' },
  { to: '/ops-center', icon: 'account_tree', label: 'Ops Center' },
];

export default function Sidebar({ onToggle }) {
  return (
    <aside className="fixed left-0 top-16 z-40 hidden h-[calc(100vh-64px)] w-64 border-r border-white/10 bg-[#0c1118]/72 px-4 py-6 backdrop-blur-2xl md:block">
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-muted transition hover:text-body"
          aria-label="Collapse sidebar"
        >
          <span className="material-symbols-outlined text-[18px]">left_panel_close</span>
        </button>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-300/25 bg-emerald-300/8 px-4 py-3">
        <span className="live-dot"></span>
        <div>
          <p className="text-sm font-bold text-emerald">Live API Mode</p>
          <p className="text-xs text-muted">Current + forecast intelligence</p>
        </div>
      </div>

      <nav className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-white/10 text-teal border border-white/15 shadow-[0_0_16px_rgba(94,234,212,0.12)]'
                  : 'text-muted hover:bg-white/7 hover:text-body border border-transparent hover:border-white/10'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-6 left-4 right-4 rounded-lg border border-white/10 bg-white/4 p-4">
        <p className="text-label mb-2">Air Quality Insight</p>
        <p className="text-sm leading-6 text-muted">
          Live conditions and short-horizon forecasts are combined to support safer daily outdoor decisions.
        </p>
      </div>
    </aside>
  );
}
