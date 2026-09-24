from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importamos la función puente desde tu archivo principal
from main import obtener_predicciones_api 

app = FastAPI(title="Football API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"estado": "API funcionando perfectamente"}

@app.get("/api/partidos")
def obtener_partidos():
    # Ejecutamos tu modelo de Poisson real en vivo
    try:
        partidos_reales = obtener_predicciones_api()
        return partidos_reales
    except Exception as e:
        # En caso de que el CSV falle o haya un error matemático
        return {"error": str(e)}