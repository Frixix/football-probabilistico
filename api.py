from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from main import obtener_predicciones_api

app = FastAPI(title="Poisson Predictor API")

# Configuración de CORS para que React pueda conectarse sin bloqueos
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"estado": "En línea", "mensaje": "API de Poisson Predictor conectada"}

@app.get("/api/predicciones")
def get_predicciones(fecha: str = None):
    # Llama a la función matemática en main.py y guarda en Supabase
    resultados = obtener_predicciones_api(fecha_objetivo=fecha)
    return {"partidos": resultados}