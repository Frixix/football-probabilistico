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

def es_partido_relevante(torneo, local, visitante):
    t = (torneo or "").lower()
    l = (local or "").lower()
    v = (visitante or "").lower()
    
    # 1. Filtro estricto: descartar partidos basura / ligas menores / reservas
    descartes = [
        "u17", "u18", "u19", "u20", "u21", "u23", "youth", "women", "femenin",
        "druha", "league two", "3. division", "regionalliga", "primera c", "primera d",
        "state cup", "azadegan", "non league", "isthmian", "girone", "pro league a",
        "reserva", "cup women"
    ]
    if any(k in t or k in l or k in v for k in descartes):
        return False
        
    # 2. Torneos y ligas reconocidas de primer nivel
    torneos_validos = [
        "premier league", "championship", "la liga", "laliga", "serie a", "serie b",
        "bundesliga", "2. bundesliga", "ligue 1", "ligue 2", "liga profesional",
        "brasileir", "betplay", "primera a", "copa libertadores", "copa sudamericana",
        "champions league", "europa league", "conference league", "nations league",
        "eredivisie", "primeira liga", "premiership", "super lig", "liga mx", "major league soccer",
        "copa del rey", "fa cup", "coppa italia", "coupe de france", "dfb pokal",
        "copa argentina", "copa do brasil", "copa colombia", "primera nacional"
    ]
    if any(k in t for k in torneos_validos):
        return True
        
    return False

    partidos_procesados = 0
    registros_batch = []

    for p in partidos:
        id_partido = p["fixture"]["id"]
        torneo = p["league"].get("name", "Liga")
        equipo_local = p["teams"]["home"]["name"]
        equipo_visitante = p["teams"]["away"]["name"]

        # 🛑 Descartar partidos basura que no sean de ligas reconocidas
        if not es_partido_relevante(torneo, equipo_local, equipo_visitante):
            continue

        id_liga = p["league"].get("id", 0)
        temporada = p["league"].get("season", 2026)

        # Consultar estadísticas verificadas de la tabla
        calculo = gestor.obtener_mu_esperado(id_liga, temporada, equipo_local, equipo_visitante)
        if not calculo:
            # Si no hay tabla de posiciones real, se omite (no inventar datos falsos)
            continue

        # Calibración cuantitativa por perfil goleador de la liga
        t_low = torneo.lower()
        factor_goles_liga = 1.0
        if any(k in t_low for k in ["bundesliga", "alemania"]):
            factor_goles_liga = 1.10  # Alta tasa goleadora histórica (~3.2 goles/partido)
        elif any(k in t_low for k in ["premier league", "inglaterra"]):
            factor_goles_liga = 1.06  # Alta intensidad ofensiva (~3.0 goles/partido)
        elif any(k in t_low for k in ["argentina", "brasil", "brazil"]):
            factor_goles_liga = 0.92  # Ligas más tácticas y marcadores más cerrados (~2.2 goles/partido)

        mu_local = calculo["mu_local"] * factor_goles_liga
        mu_visitante = calculo["mu_visitante"] * factor_goles_liga

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