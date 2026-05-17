import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const api = axios.create({ baseURL: BASE_URL });

export const getLiveEnvironment = async (lat, lon) => {
  const response = await api.get('/live-environment', { params: { lat, lon } });
  return response.data;
};

export const getLivePrediction = async (lat, lon) => {
  const response = await api.get('/predict-live', { params: { lat, lon } });
  return response.data;
};

export const predictAQI = async (data) => {
  const response = await api.post('/predict', data);
  return response.data;
};

export const getForecast = async (lat, lon, hours, city) => {
  const response = await api.get('/forecast', { params: { lat, lon, hours, city } });
  return response.data;
};
