import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from src.data.gestor_estadisticas import GestorEstadisticas

load_dotenv()

api_partidos = os.getenv("API_KEY_PARTIDOS")
api_estadisticas = os.getenv("API_KEY_ESTADISTICAS")

print("--- INICIANDO BODEGA NOCTURNA ---")
hoy_dia = (datetime.utcnow() - timedelta(hours=5)).strftime("%Y-%m-%d")

# 1. Ver ligas de hoy (Cuenta 1)
url = "https://v3.football.api-sports.io/fixtures"
res = requests.get(url, headers={'x-apisports-key': api_partidos}, params={"date": hoy_dia, "timezone": "America/Bogota"}).json()

ligas_hoy = set()
for p in res.get("response", []):
    ligas_hoy.add((p["league"]["id"], p["league"]["season"]))

print(f"Ligas únicas encontradas para hoy: {len(ligas_hoy)}")

# 2. Descargar tablas (Cuenta 2)
gestor = GestorEstadisticas(api_estadisticas)
for id_liga, temporada in ligas_hoy:
    gestor.obtener_mu_esperado(id_liga, temporada, "EquipoA", "EquipoB")

print("✅ ¡Bodega llena! Base de datos local actualizada.")