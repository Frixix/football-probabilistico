import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from src.data.gestor_estadisticas import GestorEstadisticas

load_dotenv()

# Credenciales
api_partidos = os.getenv("API_KEY_PARTIDOS")
api_estadisticas = os.getenv("API_KEY_ESTADISTICAS")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

# Conexión a Supabase
supabase: Client = create_client(supabase_url, supabase_key)

print("--- INICIANDO BODEGA NOCTURNA ---")
hoy_dia = (datetime.utcnow() - timedelta(hours=5)).strftime("%Y-%m-%d")

# 1. Obtener partidos de hoy
url = "https://v3.football.api-sports.io/fixtures"
res = requests.get(url, headers={'x-apisports-key': api_partidos}, params={"date": hoy_dia, "timezone": "America/Bogota"}).json()

gestor = GestorEstadisticas(api_estadisticas)
partidos_procesados = 0

# 2. Procesar cada partido individualmente
for p in res.get("response", []):
    id_partido = p["fixture"]["id"]
    id_liga = p["league"]["id"]
    temporada = p["league"]["season"]
    torneo = p["league"]["name"]
    equipo_local = p["teams"]["home"]["name"]
    equipo_visitante = p["teams"]["away"]["name"]

    print(f"Procesando: {equipo_local} vs {equipo_visitante}")

    # Calculamos la fuerza de los equipos
    calculo = gestor.obtener_mu_esperado(id_liga, temporada, equipo_local, equipo_visitante)

    # LÓGICA TEMPORAL DE PREDICCIÓN 
    # (Como la base de datos exige un mercado y probabilidad, enviamos un cálculo básico 
    # mientras le conectas tu simulador de Poisson real).
    mercado = "Gana Local" if calculo["mu_local"] > calculo["mu_visitante"] else "Gana Visitante"
    probabilidad = 65.0 

    # 3. Empaquetar con los nombres EXACTOS de tu base de datos
    datos_para_guardar = {
        "id_partido": id_partido,
        "fecha": hoy_dia,
        "torneo": torneo,
        "local": equipo_local,
        "visitante": equipo_visitante,
        "mercado_predicho": mercado,
        "probabilidad": probabilidad
    }

    # 4. Enviar a Supabase usando UPSERT (si el partido ya existe, lo actualiza, no lo duplica)
    supabase.table("historial_predicciones").upsert(datos_para_guardar).execute()
    partidos_procesados += 1

print(f"✅ ¡Bodega llena! Se enviaron {partidos_procesados} partidos a Supabase.")