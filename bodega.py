import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from src.data.gestor_estadisticas import GestorEstadisticas
from src.models.poisson import (
    generar_matriz_partido,
    calcular_probabilidades_1x2,
    calcular_probabilidades_over_under,
    calcular_probabilidades_btts
)
from main import validar_resultados_historicos

load_dotenv()

# Credenciales
api_partidos = os.getenv("API_KEY_PARTIDOS")
api_estadisticas = os.getenv("API_KEY_ESTADISTICAS")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

# Conexión a Supabase
if supabase_url and supabase_key:
    supabase: Client = create_client(supabase_url, supabase_key)
else:
    supabase = None
    print("⚠️ Faltan credenciales de Supabase en .env")

print("--- INICIANDO BODEGA NOCTURNA ---")
hoy_dia = (datetime.utcnow() - timedelta(hours=5)).strftime("%Y-%m-%d")

# 1. Validar resultados de partidos pasados pendientes
if supabase:
    validar_resultados_historicos()

# 2. Obtener partidos de hoy
url = "https://v3.football.api-sports.io/fixtures"
headers = {'x-apisports-key': api_partidos}
params = {"date": hoy_dia, "timezone": "America/Bogota"}

try:
    res = requests.get(url, headers=headers, params=params).json()
except Exception as e:
    print(f"🚨 Error de conexión al consultar fixtures: {e}")
    res = {}

if res.get("errors"):
    print("🚨 Errores devueltos por la API de partidos:", res.get("errors"))

partidos = res.get("response", [])
if not partidos:
    print(f"ℹ️ No se encontraron partidos o se alcanzó el límite de peticiones para hoy ({hoy_dia}).")

gestor = GestorEstadisticas(api_estadisticas)
partidos_procesados = 0

# 3. Procesar cada partido con Poisson
for p in partidos:
    id_partido = p["fixture"]["id"]
    id_liga = p["league"]["id"]
    temporada = p["league"]["season"]
    torneo = p["league"]["name"]
    equipo_local = p["teams"]["home"]["name"]
    equipo_visitante = p["teams"]["away"]["name"]

    print(f"Procesando ({partidos_procesados + 1}/{len(partidos)}): {equipo_local} vs {equipo_visitante}")

    # Calculamos la fuerza y los goles esperados (mu)
    calculo = gestor.obtener_mu_esperado(id_liga, temporada, equipo_local, equipo_visitante)
    if not calculo:
        continue

    mu_local = calculo["mu_local"]
    mu_visitante = calculo["mu_visitante"]

    # Motor probabilístico de Poisson
    matriz = generar_matriz_partido(mu_local, mu_visitante)
    prob_1x2 = calcular_probabilidades_1x2(matriz)
    prob_goles = calcular_probabilidades_over_under(matriz, limite=2.5)
    prob_btts = calcular_probabilidades_btts(matriz)

    opciones_mercado = [
        {"mercado": f"Gana {equipo_local}", "prob": prob_1x2["1"], "tipo": "1x2"},
        {"mercado": "Empate", "prob": prob_1x2["X"], "tipo": "1x2"},
        {"mercado": f"Gana {equipo_visitante}", "prob": prob_1x2["2"], "tipo": "1x2"},
        {"mercado": "Más de 2.5 Goles", "prob": prob_goles["Over"], "tipo": "goles"},
        {"mercado": "Menos de 2.5 Goles", "prob": prob_goles["Under"], "tipo": "goles"},
        {"mercado": "Ambos Marcan: Sí", "prob": prob_btts["Si"], "tipo": "btts"},
        {"mercado": "Ambos Marcan: No", "prob": prob_btts["No"], "tipo": "btts"}
    ]
    mejor_opcion = max(opciones_mercado, key=lambda x: x["prob"])

    # Empaquetar con las columnas existentes en la base de datos
    datos_para_guardar = {
        "id_partido": id_partido,
        "fecha": hoy_dia,
        "torneo": torneo,
        "local": equipo_local,
        "visitante": equipo_visitante,
        "mercado_predicho": mejor_opcion["mercado"],
        "probabilidad": round(float(mejor_opcion["prob"]) * 100, 2)
    }

    # Enviar a Supabase usando UPSERT
    if supabase:
        try:
            supabase.table("historial_predicciones").upsert(datos_para_guardar).execute()
            partidos_procesados += 1
        except Exception as e:
            print(f"Error guardando partido {id_partido} en Supabase: {e}")

print(f"✅ ¡Bodega completa! Se procesaron y enviaron {partidos_procesados} partidos con Poisson a Supabase.")