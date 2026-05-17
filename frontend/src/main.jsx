import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CityProvider } from './context/CityContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CityProvider>
      <App />
    </CityProvider>
  </StrictMode>,
)
