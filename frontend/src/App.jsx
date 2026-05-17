import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import PredictionEngine from './pages/PredictionEngine';
import Forecasting from './pages/Forecasting';
import OpsCenter from './pages/OpsCenter';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="prediction" element={<PredictionEngine />} />
          <Route path="forecast"   element={<Forecasting />} />
          <Route path="ops-center" element={<OpsCenter />} />
          <Route path="*"          element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
