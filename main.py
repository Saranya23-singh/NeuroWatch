from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class SensorData(BaseModel):
    gait: float
    voice: float
    tremor: float

@app.get("/")
def home():
    return {"status": "NeuroWatch Backend Running"}

@app.post("/predict")
def predict(data: SensorData):
    score = 0

    if data.gait < 60:
        score += 2
    if data.voice < 60:
        score += 2
    if data.tremor > 30:
        score += 2

    if score <= 2:
        risk = "Low Risk"
    elif score <= 4:
        risk = "Moderate Risk"
    else:
        risk = "High Risk"

    return {
        "risk": risk,
        "score": score
    }
