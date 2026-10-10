import os
import requests
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from src.data.gestor_estadisticas import GestorEstadisticas
from src.models.poisson import (
    generar_matriz_dixon_coles,
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

if supabase_url and supabase_key:
    supabase: Client = create_client(supabase_url, supabase_key)
else:
    supabase = None
    print("⚠️ Faltan credenciales de Supabase en .env")

print("--- INICIANDO BODEGA (HOY + MAÑANA) ---")

# 1. Validar resultados de partidos pasados pendientes
if supabase:
    validar_resultados_historicos()

gestor = GestorEstadisticas(api_estadisticas)

# Fechas a procesar: Hoy y Mañana (Bogotá UTC-5)
dt_bogota = datetime.utcnow() - timedelta(hours=5)
hoy_dia = dt_bogota.strftime("%Y-%m-%d")
manana_dia = (dt_bogota + timedelta(days=1)).strftime("%Y-%m-%d")
fechas_a_cargar = [hoy_dia, manana_dia]

headers = {'x-apisports-key': api_partidos}
url = "https://v3.football.api-sports.io/fixtures"

# Cargar caché local de fixtures si existe para optimizar peticiones
fixtures_cache = {}
archivo_hf = os.path.join("frontend", "src", "data", "horarios_fixtures.json")
if os.path.exists(archivo_hf):
    try:
        with open(archivo_hf, "r", encoding="utf-8") as f:
            fixtures_cache = json.load(f)
    except Exception:
        pass

for dia_objetivo in fechas_a_cargar:
    print(f"\n📅 Procesando pronósticos para la fecha: {dia_objetivo}")
    
    partidos = []
    # Buscar en fixtures_cache primero
    partidos_cached = [v for v in fixtures_cache.values() if v.get("fecha") == dia_objetivo]
    
    if partidos_cached:
        print(f"  -> Usando {len(partidos_cached)} fixtures desde caché local.")
        for fix in partidos_cached:
            partidos.append({
                "fixture": {"id": fix["id"], "date": f"{dia_objetivo}T{fix.get('hora', '15:00')}:00"},
                "league": {"id": fix.get("id_liga", 0), "season": 2026, "name": fix.get("torneo", "Liga")},
                "teams": {
                    "home": {"name": fix.get("local", "Local")},
                    "away": {"name": fix.get("visitante", "Visitante")}
                }
            })
    else:
        print(f"  -> Consultando API-Football para fixtures de {dia_objetivo}...")
        params = {"date": dia_objetivo, "timezone": "America/Bogota"}
        try:
            res = requests.get(url, headers=headers, params=params).json()
            partidos = res.get("response", [])
        except Exception as e:
            print(f"🚨 Error consultando fixtures: {e}")
            partidos = []

    partidos_procesados = 0
    registros_batch = []

    for p in partidos:
        id_partido = p["fixture"]["id"]
        id_liga = p["league"].get("id", 0)
        temporada = p["league"].get("season", 2026)
        torneo = p["league"].get("name", "Liga")
        equipo_local = p["teams"]["home"]["name"]
        equipo_visitante = p["teams"]["away"]["name"]

        calculo = gestor.obtener_mu_esperado(id_liga, temporada, equipo_local, equipo_visitante)
        if not calculo:
            calculo = {
                "mu_local": 1.35,
                "mu_visitante": 1.05,
                "forma_local": "",
                "forma_visitante": ""
            }

        mu_local = calculo["mu_local"]
        mu_visitante = calculo["mu_visitante"]

        matriz = generar_matriz_dixon_coles(mu_local, mu_visitante)
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

        registros_batch.append({
            "id_partido": id_partido,
            "fecha": dia_objetivo,
            "torneo": torneo,
            "local": equipo_local,
            "visitante": equipo_visitante,
            "mercado_predicho": mejor_opcion["mercado"],
            "probabilidad": round(float(mejor_opcion["prob"]) * 100, 2)
        })

    if supabase and registros_batch:
        BATCH_SIZE = 50
        for i in range(0, len(registros_batch), BATCH_SIZE):
            batch = registros_batch[i:i + BATCH_SIZE]
            try:
                supabase.table("historial_predicciones").upsert(batch).execute()
                partidos_procesados += len(batch)
            except Exception as e:
                print(f"Error guardando lote en Supabase: {e}")

    print(f"Fecha {dia_objetivo}: {partidos_procesados} partidos guardados en Supabase.")

print("\n¡Proceso de Bodega finalizado! Partidos de Hoy y de Mañana sincronizados exitosamente.")