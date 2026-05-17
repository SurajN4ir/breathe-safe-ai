import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCity } from '../context/CityContext.jsx';

export default function Navbar() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const { city, setCity, cities } = useCity();

  const linkClass = ({ isActive }) =>
    `hidden sm:inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition ${
      isActive ? 'text-teal bg-white/10' : 'text-muted hover:text-body hover:bg-white/10'
    }`;

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-[#102033]/82 backdrop-blur-2xl">
      <div className="h-16 px-container-desktop flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-300 to-sky-300 flex items-center justify-center text-[#071521]">
            <span className="material-symbols-outlined text-[21px]">air</span>
          </span>
          <span className="font-extrabold text-lg sm:text-xl text-body whitespace-nowrap">Breathe Safe AI</span>
        </Link>

        {isLanding ? (
          <nav className="flex items-center gap-1">
            <NavLink to="/dashboard" className={linkClass}>Live Analysis</NavLink>
            <NavLink to="/forecast" className={linkClass}>Forecasting</NavLink>
            <Link to="/forecast" className="btn-primary min-h-10 px-4 py-2 text-sm">Forecast</Link>
          </nav>
        ) : (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/10">
              <span className="material-symbols-outlined text-teal text-[18px]">location_on</span>
              <select
                value={city.name}
                onChange={(event) => setCity(cities.find((item) => item.name === event.target.value))}
                className="bg-transparent border-none outline-none text-sm font-semibold text-body"
              >
                {cities.map((item) => (
                  <option key={item.name} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>
            <Link to="/forecast" className="btn-secondary min-h-10 px-4 py-2 text-sm">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              Plan Air
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
