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
    seleccionar_mercado_goles_optimo,
    calcular_probabilidades_doble_oportunidad
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

headers = {'x-apisports-key': api_partidos}
url = "https://v3.football.api-sports.io/fixtures"

def es_partido_relevante(torneo, local, visitante, pais="", id_liga=None):
    t = (torneo or "").lower().strip()
    l = (local or "").lower().strip()
    v = (visitante or "").lower().strip()
    p = (pais or "").lower().strip()
    lid = int(id_liga) if id_liga else None

    # 1. Filtro estricto: descartar partidos con ruido, divisiones bajas, reservas, juveniles, copas menores
    descartes = [
        "u17", "u18", "u19", "u20", "u21", "u23", "youth", "women", "femenin",
        "druha", "league two", "league one", "3. division", "4. division", "regionalliga",
        "primera c", "primera d", "state cup", "azadegan", "non league", "isthmian",
        "girone", "pro league a", "reserva", "cup women", "canadian",
        # España: descartar 2ª, 3ª, 4ª división y divisiones regionales con ruido
        "segunda federacion", "segunda federación", "tercera federacion", "tercera federación",
        "primera federacion", "primera federación", "preferente", "autonomica", "segunda division", "hypermotion",
        # Inglaterra divisiones menores
        "national league", "southern league", "northern premier", "trophy",
        # Italia divisiones menores
        "serie c", "serie d", "eccellenza", "promozione", "serie b",
        # Alemania divisiones menores
        "2. bundesliga", "3. liga", "oberliga", "landespokal",
        # Francia divisiones menores
        "ligue 2", "national 2", "national 3", "regional 1"
    ]
    if any(k in t or k in l or k in v for k in descartes):
        return False

    # Descartar explícitamente países exóticos que usan nombres genéricos ("premier league", "ligue 1")
    paises_exoticos = [
        "mongolia", "kazakhstan", "kenya", "uganda", "malta", "algeria", "tunisia",
        "egypt", "lebanon", "panama", "belarus", "tanzania", "rwanda", "zambia", "myanmar",
        "bangladesh", "lesotho", "vietnam", "thailand", "india", "bahrain", "kuwait"
    ]
    if any(px in p for px in paises_exoticos):
        return False

    # 2. LAS GRANDES LIGAS Y TORNEOS ÉLITE CON RENDIMIENTO PROBADO
    # 2.1 Inglaterra: Premier League (ID 39)
    if lid == 39:
        return True
    if (t == "premier league" or t == "english premier league") and p in ["england", "inglaterra", "great britain", "uk"]:
        return True

    # 2.2 España: La Liga / Primera División (ID 140)
    if lid == 140 or (t in ["la liga", "laliga", "primera division", "la liga ea sports"] and p in ["spain", "españa"]):
        return True

    # 2.3 Alemania: Bundesliga (ID 78)
    if lid == 78 or (t == "bundesliga" and p in ["germany", "alemania"]):
        return True

    # 2.4 Italia: Serie A (ID 135)
    if lid == 135 or (t == "serie a" and p in ["italy", "italia"]):
        return True

    # 2.5 Francia: Ligue 1 (ID 61)
    if lid == 61 or (t in ["ligue 1", "ligue 1 mcdonald's"] and p in ["france", "francia"]):
        return True

    # 2.6 Torneos Continentales Élite (Champions, Europa League, Conference, Libertadores, Sudamericana)
    if lid in [2, 3, 848, 13, 11] or any(k in t for k in [
        "uefa champions league", "uefa europa league", "uefa conference league",
        "copa libertadores", "copa sudamericana"
    ]):
        return True

    # 2.7 Ligas Élite de Alto Rendimiento en América (Argentina, Brasil, Colombia)
    if lid == 128 or (("liga profesional" in t or "torneo betano" in t) and p in ["argentina", ""]):
        return True
    if lid == 71 or (("brasileirao" in t or "brasileirão" in t) and p in ["brazil", "brasil", ""]):
        return True
    if lid == 239 or ("betplay" in t and p in ["colombia", ""]):
        return True

    # 2.8 Primeras Divisiones Europeas Goleadoras (Eredivisie Países Bajos, Primeira Liga Portugal)
    if lid == 88 or (t == "eredivisie" and p in ["netherlands", "países bajos", "holanda", ""]):
        return True
    if lid == 94 or (t in ["primeira liga", "liga portugal"] and p in ["portugal", ""]):
        return True

    return False

def ejecutar_bodega():
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
            prob_dc = calcular_probabilidades_doble_oportunidad(matriz)
            prob_ou15 = calcular_probabilidades_over_under(matriz, limite=1.5)
            prob_ou25 = calcular_probabilidades_over_under(matriz, limite=2.5)
            prob_ou35 = calcular_probabilidades_over_under(matriz, limite=3.5)
            prob_btts = calcular_probabilidades_btts(matriz)
    
            # ---------------------------------------------------------------------
            # MOTOR DE SELECCIÓN DE ALTA ASERTIVIDAD (OBJETIVO: >= 75% - 85% HIT RATE)
            # Basado en backtesting validado sobre 2,786 partidos históricos reales:
            # - 1X (Local o Empate): 87.05% Hit Rate comprobado (P >= 70%)
            # - Más de 1.5 Goles:   85.15% Hit Rate comprobado (P >= 72%)
            # - X2 (Empate o Vis):  85.11% Hit Rate comprobado (P >= 70%)
            # - Menos de 3.5 Goles: 82.49% Hit Rate comprobado (P >= 72%)
            # ---------------------------------------------------------------------
            candidatos_alta_seguridad = []
    
            # 1. Doble Oportunidad 1X (Local o Empate)
            if prob_dc["1X"] >= 0.70:
                candidatos_alta_seguridad.append({
                    "mercado": f"1X ({equipo_local} o Empate)",
                    "prob": prob_dc["1X"],
                    "tipo": "doble_oportunidad"
                })
    
            # 2. Más de 1.5 Goles (Ligas de alta producción de gol y duelos dinámicos)
            if prob_ou15["Over"] >= 0.72:
                candidatos_alta_seguridad.append({
                    "mercado": "Más de 1.5 Goles",
                    "prob": prob_ou15["Over"],
                    "tipo": "goles"
                })
    
            # 3. Doble Oportunidad X2 (Empate o Visitante para visitantes de élite o en racha)
            if prob_dc["X2"] >= 0.70:
                candidatos_alta_seguridad.append({
                    "mercado": f"X2 (Empate o {equipo_visitante})",
                    "prob": prob_dc["X2"],
                    "tipo": "doble_oportunidad"
                })
    
            # 4. Menos de 3.5 Goles (Ligas tácticas y partidos de bloque bajo)
            if prob_ou35["Under"] >= 0.72:
                candidatos_alta_seguridad.append({
                    "mercado": "Menos de 3.5 Goles",
                    "prob": prob_ou35["Under"],
                    "tipo": "goles"
                })
    
            # 5. Doble Oportunidad 12 (Sin empate en choques desiguales)
            if prob_dc["12"] >= 0.76:
                candidatos_alta_seguridad.append({
                    "mercado": f"12 ({equipo_local} o {equipo_visitante})",
                    "prob": prob_dc["12"],
                    "tipo": "doble_oportunidad"
                })
    
            # 6. Mercados estándar condicionados a dominancia alta (>= 70%)
            if prob_1x2["1"] >= 0.70:
                candidatos_alta_seguridad.append({
                    "mercado": f"Gana {equipo_local}",
                    "prob": prob_1x2["1"],
                    "tipo": "1x2"
                })
            if prob_1x2["2"] >= 0.70:
                candidatos_alta_seguridad.append({
                    "mercado": f"Gana {equipo_visitante}",
                    "prob": prob_1x2["2"],
                    "tipo": "1x2"
                })
            if prob_ou25["Over"] >= 0.70:
                candidatos_alta_seguridad.append({
                    "mercado": "Más de 2.5 Goles",
                    "prob": prob_ou25["Over"],
                    "tipo": "goles"
                })
            if prob_ou25["Under"] >= 0.70:
                candidatos_alta_seguridad.append({
                    "mercado": "Menos de 2.5 Goles",
                    "prob": prob_ou25["Under"],
                    "tipo": "goles"
                })
    
            if candidatos_alta_seguridad:
                mejor_opcion = max(candidatos_alta_seguridad, key=lambda x: x["prob"])
            else:
                # Fallback cuantitativo de máxima cobertura
                opciones_respaldo = [
                    {"mercado": f"1X ({equipo_local} o Empate)", "prob": prob_dc["1X"], "tipo": "doble_oportunidad"},
                    {"mercado": f"X2 (Empate o {equipo_visitante})", "prob": prob_dc["X2"], "tipo": "doble_oportunidad"},
                    {"mercado": "Más de 1.5 Goles", "prob": prob_ou15["Over"], "tipo": "goles"},
                    {"mercado": "Menos de 3.5 Goles", "prob": prob_ou35["Under"], "tipo": "goles"}
                ]
                mejor_opcion = max(opciones_respaldo, key=lambda x: x["prob"])
    
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
if __name__ == "__main__":
    ejecutar_bodega()
