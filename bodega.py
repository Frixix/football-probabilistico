import sys
import os
import requests
import json

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from src.data.gestor_estadisticas import GestorEstadisticas
from src.models.poisson import (
    generar_matriz_dixon_coles,
    calcular_probabilidades_1x2,
    calcular_probabilidades_over_under,
    calcular_probabilidades_btts,
    seleccionar_mercado_goles_optimo
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

def es_partido_relevante(torneo, local, visitante, pais="", id_liga=None):
    t = (torneo or "").lower().strip()
    l = (local or "").lower().strip()
    v = (visitante or "").lower().strip()
    p = (pais or "").lower().strip()
    lid = int(id_liga) if id_liga else None

    # 1. Filtro estricto: descartar partidos basura / ligas menores / reservas
    descartes = [
        "u17", "u18", "u19", "u20", "u21", "u23", "youth", "women", "femenin",
        "druha", "league two", "3. division", "regionalliga", "primera c", "primera d",
        "state cup", "azadegan", "non league", "isthmian", "girone", "pro league a",
        "reserva", "cup women", "canadian"
    ]
    if any(k in t or k in l or k in v for k in descartes):
        return False

    # Descartar explícitamente países exóticos que usan nombres genéricos ("premier league", "ligue 1")
    paises_exoticos = [
        "mongolia", "kazakhstan", "kenya", "uganda", "malta", "algeria", "tunisia",
        "egypt", "lebanon", "panama", "belarus", "tanzania", "rwanda", "zambia", "myanmar"
    ]
    if any(px in p for px in paises_exoticos):
        return False

    # 2. Las 5 grandes ligas europeas y torneos élite prioritarios
    # 2.1 Inglaterra
    if lid == 39 or (("premier league" in t or "championship" in t or "fa cup" in t or "league cup" in t) and ("england" in p or "inglaterra" in p or not p)):
        return True
    # 2.2 España
    if lid == 140 or (("la liga" in t or "laliga" in t or "copa del rey" in t or "primera division" in t) and ("spain" in p or "españa" in p or not p)):
        return True
    # 2.3 Alemania
    if lid == 78 or (("bundesliga" in t or "dfb pokal" in t) and ("germany" in p or "alemania" in p or not p)):
        return True
    # 2.4 Italia
    if lid == 135 or (("serie a" in t or "coppa italia" in t) and ("italy" in p or "italia" in p or not p)):
        return True
    # 2.5 Francia
    if lid == 61 or (("ligue 1" in t or "coupe de france" in t) and ("france" in p or "francia" in p or not p)):
        return True
    # 2.6 Torneos Continentales Élite
    if lid in [2, 3, 848, 13, 11] or any(k in t for k in ["champions league", "europa league", "conference league", "copa libertadores", "copa sudamericana"]):
        return True
    # 2.7 Ligas principales de referencia (Colombia, Argentina, Brasil, MLS, Portugal, Países Bajos)
    if lid in [239, 128, 71, 253, 94, 88]:
        return True
    if any(k in t for k in ["betplay", "copa colombia", "torneo betano", "liga profesional", "brasileirao", "brasileirão", "copa do brasil"]):
        return True
    if "major league soccer" in t or t == "mls" or "eredivisie" in t or "primeira liga" in t:
        return True

    return False

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
            if partidos:
                for fix_item in partidos:
                    fid = str(fix_item["fixture"]["id"])
                    date_iso = fix_item["fixture"].get("date", "")
                    h_str = date_iso[11:16] if len(date_iso) >= 16 else "15:00"
                    try:
                        hh = int(h_str[:2])
                        mm = h_str[3:5]
                        ampm = "PM" if hh >= 12 else "AM"
                        hh12 = hh % 12 or 12
                        h12_str = f"{hh12}:{mm} {ampm}"
                    except Exception:
                        h12_str = h_str
                    fixtures_cache[fid] = {
                        "id": fix_item["fixture"]["id"],
                        "fecha": dia_objetivo,
                        "hora": h_str,
                        "hora12": h12_str,
                        "status": fix_item["fixture"]["status"]["short"],
                        "torneo": fix_item["league"].get("name", "Liga"),
                        "local": fix_item["teams"]["home"]["name"],
                        "visitante": fix_item["teams"]["away"]["name"]
                    }
                try:
                    os.makedirs(os.path.dirname(archivo_hf), exist_ok=True)
                    with open(archivo_hf, "w", encoding="utf-8") as f_out:
                        json.dump(fixtures_cache, f_out, ensure_ascii=False, indent=2)
                except Exception as err_cache:
                    print(f"Aviso guardando horarios en caché: {err_cache}")
        except Exception as e:
            print(f"🚨 Error consultando fixtures: {e}")
            partidos = []

    partidos_procesados = 0
    registros_batch = []

    for p in partidos:
        id_partido = p["fixture"]["id"]
        torneo = p["league"].get("name", "Liga")
        equipo_local = p["teams"]["home"]["name"]
        equipo_visitante = p["teams"]["away"]["name"]

        pais = p["league"].get("country", "")
        id_liga = p["league"].get("id", 0)

        # 🛑 Descartar partidos que no pertenezcan a ligas o países élite
        if not es_partido_relevante(torneo, equipo_local, equipo_visitante, pais=pais, id_liga=id_liga):
            continue

        temporada = p["league"].get("season", 2026)

        # Consultar estadísticas verificadas de la tabla de posiciones
        calculo = gestor.obtener_mu_esperado(id_liga, temporada, equipo_local, equipo_visitante)
        if not calculo:
            # Si no hay tabla de posiciones real, se omite (no inventar datos falsos)
            continue

        mu_local = calculo["mu_local"]
        mu_visitante = calculo["mu_visitante"]

        matriz = generar_matriz_dixon_coles(mu_local, mu_visitante)
        prob_1x2 = calcular_probabilidades_1x2(matriz)
        prob_goles = calcular_probabilidades_over_under(matriz, limite=2.5)
        prob_btts = calcular_probabilidades_btts(matriz)
        mercado_goles_optimo = seleccionar_mercado_goles_optimo(matriz, contexto_tabla=calculo)

        opciones_mercado = [
            {"mercado": f"Gana {equipo_local}", "prob": prob_1x2["1"], "tipo": "1x2"},
            {"mercado": "Empate", "prob": prob_1x2["X"], "tipo": "1x2"},
            {"mercado": f"Gana {equipo_visitante}", "prob": prob_1x2["2"], "tipo": "1x2"},
            {"mercado": "Más de 2.5 Goles", "prob": prob_goles["Over"], "tipo": "goles"},
            {"mercado": "Menos de 2.5 Goles", "prob": prob_goles["Under"], "tipo": "goles"},
            {"mercado": "Ambos Marcan: Sí", "prob": prob_btts["Si"], "tipo": "btts"},
            {"mercado": "Ambos Marcan: No", "prob": prob_btts["No"], "tipo": "btts"}
        ]
        # Si el mercado analítico de goles optimizado supera el umbral de robustez (>= 58%), agregarlo a las opciones
        if mercado_goles_optimo and mercado_goles_optimo.get("prob", 0) >= 0.58:
            opciones_mercado.append({
                "mercado": mercado_goles_optimo["mercado"],
                "prob": mercado_goles_optimo["prob"],
                "tipo": "goles"
            })

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