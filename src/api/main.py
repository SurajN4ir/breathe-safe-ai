from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

# -----------------------------
# LOAD TRAINED MODEL
# -----------------------------
model = joblib.load("models/aqi_model.pkl")

# -----------------------------
# CREATE FASTAPI APP
# -----------------------------
app = FastAPI()

# -----------------------------
# INPUT SCHEMA
# -----------------------------
class AQIInput(BaseModel):
    state: int
    area: int
    number_of_monitoring_stations: int
    prominent_pollutants: int
    air_quality_status: int
    year: int
    month: int
    day: int

# -----------------------------
# ROOT ENDPOINT
# -----------------------------
@app.get("/")
def home():
    return {
        "message": "Breathe Safe AI API is running!"
    }

# -----------------------------
# PREDICTION ENDPOINT
# -----------------------------
@app.post("/predict")
def predict(data: AQIInput):

    input_data = np.array([[
        data.state,
        data.area,
        data.number_of_monitoring_stations,
        data.prominent_pollutants,
        data.air_quality_status,
        data.year,
        data.month,
        data.day
    ]])

    prediction = model.predict(input_data)

    return {
        "predicted_aqi": round(float(prediction[0]), 2)
    }