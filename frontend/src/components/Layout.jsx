import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-shell min-h-screen text-on-background">
      <Navbar />
      {!isLanding && sidebarOpen && <Sidebar onToggle={() => setSidebarOpen(false)} />}
      {!isLanding && !sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-20 z-40 hidden h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-[#0c1118]/90 text-muted backdrop-blur-xl transition hover:text-body md:flex"
          aria-label="Open sidebar"
        >
          <span className="material-symbols-outlined text-[20px]">left_panel_open</span>
        </button>
      )}
      <main className={isLanding ? 'pt-16 min-h-screen' : `pt-20 pb-10 min-h-screen ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <Outlet />
      </main>
    </div>
  );
}
