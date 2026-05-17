import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="app-shell min-h-screen text-on-background">
      <Navbar />
      {!isLanding && <Sidebar />}
      <main className={isLanding ? 'pt-16 min-h-screen' : 'pt-20 pb-10 md:ml-64 min-h-screen'}>
        <Outlet />
      </main>
    </div>
  );
}
