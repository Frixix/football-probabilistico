from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from main import obtener_predicciones_api, validar_resultados_historicos

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

@app.post("/api/actualizar-resultados")
@app.get("/api/actualizar-resultados")
def api_actualizar_resultados(limite: int = 50):
    """
    Verifica los partidos pendientes en la base de datos de Supabase,
    consulta la API de fútbol para ver si ya terminaron (FT/AET/PEN),
    evalúa si el modelo acertó o no el pronóstico, y actualiza la base de datos.
    """
    resumen = validar_resultados_historicos(limite=limite)
    return resumen