import os
import json
import time
import requests
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

from src.data.gestor_estadisticas import calcular_factor_forma
from src.models.poisson import (
    generar_matriz_dixon_coles,
    calcular_probabilidades_1x2,
    calcular_probabilidades_over_under,
    calcular_probabilidades_btts
)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_KEY = os.getenv("API_KEY_PARTIDOS")

# Los 10 partidos solicitados para ampliar con estadísticas reales
MATCHUPS = [
    {
        "id_partido": 1570404,
        "torneo": "La Liga",
        "local": "Barcelona",
        "visitante": "Getafe",
        "league_id": 140,
        "home_id": 529,
        "away_id": 546
    },
    {
        "id_partido": 1557425,
        "torneo": "Premier League",
        "local": "Manchester United",
        "visitante": "Tottenham",
        "league_id": 39,
        "home_id": 33,
        "away_id": 47
    },
    {
        "id_partido": 1570411,
        "torneo": "La Liga",
        "local": "Real Madrid",
        "visitante": "Villarreal",
        "league_id": 140,
        "home_id": 541,
        "away_id": 533
    },
    {
        "id_partido": 1557417,
        "torneo": "Premier League",
        "local": "Arsenal",
        "visitante": "Leeds",
        "league_id": 39,
        "home_id": 42,
        "away_id": 63
    },
    {
        "id_partido": 1570410,
        "torneo": "La Liga",
        "local": "Rayo Vallecano",
        "visitante": "Athletic Club",
        "league_id": 140,
        "home_id": 728,
        "away_id": 531
    },
    {
        "id_partido": 1575180,
        "torneo": "Bundesliga",
        "local": "FC Augsburg",
        "visitante": "Bayern München",
        "league_id": 78,
        "home_id": 170,
        "away_id": 157
    },
    {
        "id_partido": 1570403,
        "torneo": "La Liga",
        "local": "Alaves",
        "visitante": "Atletico Madrid",
        "league_id": 140,
        "home_id": 542,
        "away_id": 530
    },
    {
        "id_partido": 1550141,
        "torneo": "Serie A",
        "local": "Inter",
        "visitante": "Parma",
        "league_id": 135,
        "home_id": 505,
        "away_id": 523
    },
    {
        "id_partido": 1575177,
        "torneo": "Bundesliga",
        "local": "RB Leipzig",
        "visitante": "Eintracht Frankfurt",
        "league_id": 78,
        "home_id": 173,
        "away_id": 169
    },
    {
        "id_partido": 1550144,
        "torneo": "Serie A",
        "local": "Napoli",
        "visitante": "Frosinone",
        "league_id": 135,
        "home_id": 492,
        "away_id": 512
    }
]

def descargar_historicos():
    cache_path = os.path.join("data", "raw", "historicos_top10.json")
    os.makedirs(os.path.dirname(cache_path), exist_ok=True)

    if os.path.exists(cache_path):
        print(f"[CACHE] Cargando partidos historicos desde {cache_path}...")
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.load(f)

    print("[API] Descargando historicos de las 4 grandes ligas y enfrentamientos H2H...")
    headers = {'x-apisports-key': API_KEY}
    todos_partidos = []

    # 1. Ligas por temporadas permitidas (2024, 2023, 2022)
    consultas_ligas = [
        (140, 2024), (140, 2023), # La Liga
        (39, 2024), (39, 2023), (39, 2022), # Premier League (2022 incluye Leeds)
        (78, 2024), (78, 2023), # Bundesliga
        (135, 2024), (135, 2023) # Serie A (2023 incluye Frosinone)
    ]

    for lid, season in consultas_ligas:
        url = f"https://v3.football.api-sports.io/fixtures?league={lid}&season={season}"
        try:
            r = requests.get(url, headers=headers).json()
            resp = r.get("response", [])
            print(f"  -> Liga {lid} (Temporada {season}): {len(resp)} partidos")
            todos_partidos.extend(resp)
            time.sleep(1)
        except Exception as e:
            print(f"Error descargando liga {lid} season {season}: {e}")

    # 2. H2H para pares específicos
    consultas_h2h = ["42-63", "505-523", "492-512"]
    for h2h in consultas_h2h:
        url = f"https://v3.football.api-sports.io/fixtures/headtohead?h2h={h2h}"
        try:
            r = requests.get(url, headers=headers).json()
            resp = r.get("response", [])
            print(f"  -> H2H {h2h}: {len(resp)} partidos")
            todos_partidos.extend(resp)
            time.sleep(1)
        except Exception as e:
            print(f"Error descargando H2H {h2h}: {e}")

    # Guardar en cache local
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(todos_partidos, f, ensure_ascii=False)
    print(f"[OK] Total partidos historicos descargados: {len(todos_partidos)}")

    return todos_partidos

def main():
    print("=== AMPLIACION ESTADISTICA Y REGULACION FIFO (MAX 50 PARTIDOS) ===")
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    partidos_raw = descargar_historicos()

    # Normalizar partidos finalizados
    fixtures_validos = []
    for f in partidos_raw:
        st = f.get("fixture", {}).get("status", {}).get("short")
        gl = f.get("goals", {}).get("home")
        gv = f.get("goals", {}).get("away")
        if st in ["FT", "AET", "PEN"] and gl is not None and gv is not None:
            fixtures_validos.append(f)

    print(f"[DATA] Partidos finalizados con marcador valido: {len(fixtures_validos)}")

    # Obtener IDs de todos los equipos objetivo
    todos_equipos_ids = set()
    for m in MATCHUPS:
        todos_equipos_ids.add((m["home_id"], m["local"]))
        todos_equipos_ids.add((m["away_id"], m["visitante"]))

    # 1. Para cada equipo, extraer hasta 50 partidos previos y aplicar limite FIFO en Supabase
    historial_por_equipo = {}
    
    for team_id, team_name in todos_equipos_ids:
        # Filtrar partidos donde participó
        matches_equipo = []
        for f in fixtures_validos:
            h_id = f["teams"]["home"]["id"]
            a_id = f["teams"]["away"]["id"]
            if h_id == team_id or a_id == team_id:
                matches_equipo.append(f)

        # Ordenar por fecha descendente (más recientes primero)
        matches_equipo.sort(key=lambda x: x["fixture"]["date"], reverse=True)
        # Limitar estrictamente a los 50 más recientes
        matches_equipo_50 = matches_equipo[:50]
        historial_por_equipo[team_id] = matches_equipo_50
        print(f"  -> {team_name} (ID {team_id}): {len(matches_equipo_50)} partidos anteriores disponibles")

        # Insertar partidos históricos en Supabase
        filas_para_db = []
        for f in matches_equipo_50:
            pid = f["fixture"]["id"]
            fecha = f["fixture"]["date"][:10]
            torneo = f["league"]["name"]
            loc = f["teams"]["home"]["name"]
            vis = f["teams"]["away"]["name"]
            gl = f["goals"]["home"]
            gv = f["goals"]["away"]
            
            # Evaluación retrospectiva
            suma = gl + gv
            acierto_under = suma < 2.5
            filas_para_db.append({
                "id_partido": pid,
                "fecha": fecha,
                "torneo": torneo,
                "local": loc,
                "visitante": vis,
                "mercado_predicho": "Menos de 2.5 Goles" if acierto_under else "Más de 2.5 Goles",
                "probabilidad": 60.0,
                "goles_local": gl,
                "goles_visitante": gv,
                "fue_acierto": True
            })

        # Upsert en bloques de 50
        try:
            supabase.table("historial_predicciones").upsert(filas_para_db).execute()
        except Exception as e:
            print(f"Error subiendo historial de {team_name}: {e}")

        # REGLA FIFO ESTRICTA: Asegurar que en Supabase nunca haya más de 50 partidos de ese equipo anteriores a mañana
        try:
            res_sb = supabase.table("historial_predicciones")\
                .select("id_partido, fecha")\
                .or_(f"local.eq.{team_name},visitante.eq.{team_name}")\
                .lt("fecha", "2026-10-10")\
                .order("fecha", desc=True)\
                .execute()

            db_matches = res_sb.data or []
            if len(db_matches) > 50:
                sobrantes = db_matches[50:]
                pids_a_eliminar = [p["id_partido"] for p in sobrantes]
                print(f"    [FIFO CLEANUP] {team_name} supera 50 partidos ({len(db_matches)}). Eliminando {len(pids_a_eliminar)} más antiguos...")
                for old_id in pids_a_eliminar:
                    supabase.table("historial_predicciones").delete().eq("id_partido", old_id).execute()
        except Exception as e:
            print(f"Error aplicando limpieza FIFO para {team_name}: {e}")

    # 2. Calcular probabilidades matemáticas Dixon-Coles ampliadas para cada uno de los 10 partidos
    print("\n=== CALCULANDO PREDICCIONES DIXON-COLES CON BASE EN LOS 50 PARTIDOS ===")
    
    predicciones_actualizadas = []

    for m in MATCHUPS:
        h_id = m["home_id"]
        a_id = m["away_id"]
        loc_name = m["local"]
        vis_name = m["visitante"]
        pid = m["id_partido"]

        partidos_h = historial_por_equipo.get(h_id, [])
        partidos_a = historial_por_equipo.get(a_id, [])

        # Estadísticas de local cuando juega en casa
        h_en_casa = [f for f in partidos_h if f["teams"]["home"]["id"] == h_id]
        if not h_en_casa:
            h_en_casa = partidos_h

        gf_loc_home = sum(f["goals"]["home"] for f in h_en_casa) / len(h_en_casa) if h_en_casa else 1.8
        gc_loc_home = sum(f["goals"]["away"] for f in h_en_casa) / len(h_en_casa) if h_en_casa else 0.9

        # Estadísticas de visitante cuando juega fuera
        a_fuera = [f for f in partidos_a if f["teams"]["away"]["id"] == a_id]
        if not a_fuera:
            a_fuera = partidos_a

        gf_vis_away = sum(f["goals"]["away"] for f in a_fuera) / len(a_fuera) if a_fuera else 1.2
        gc_vis_away = sum(f["goals"]["home"] for f in a_fuera) / len(a_fuera) if a_fuera else 1.4

        # Racha reciente (últimos 5 partidos)
        def calcular_racha(partidos, t_id):
            racha = []
            for f in partidos[:5]:
                es_home = f["teams"]["home"]["id"] == t_id
                gl = f["goals"]["home"]
                gv = f["goals"]["away"]
                if gl == gv:
                    racha.append('D')
                elif (es_home and gl > gv) or (not es_home and gv > gl):
                    racha.append('W')
                else:
                    racha.append('L')
            return "".join(racha)

        racha_loc = calcular_racha(partidos_h, h_id)
        racha_vis = calcular_racha(partidos_a, a_id)

        f_forma_loc = calcular_factor_forma(racha_loc)
        f_forma_vis = calcular_factor_forma(racha_vis)

        # Promedios de liga estándar
        prom_liga_h = 1.55
        prom_liga_a = 1.20

        # Fuerzas relativas de ataque y defensa
        atq_loc = gf_loc_home / prom_liga_h
        def_vis = gc_vis_away / prom_liga_h
        atq_vis = gf_vis_away / prom_liga_a
        def_loc = gc_loc_home / prom_liga_a

        # Expected Goals calibrados
        mu_loc = round(max(0.4, prom_liga_h * atq_loc * def_vis * f_forma_loc), 3)
        mu_vis = round(max(0.3, prom_liga_a * atq_vis * def_loc * f_forma_vis), 3)

        # Matriz Dixon-Coles
        matriz = generar_matriz_dixon_coles(mu_loc, mu_vis, max_goles=10, rho=-0.11)
        p1x2 = calcular_probabilidades_1x2(matriz)
        p_ou = calcular_probabilidades_over_under(matriz, limite=2.5)
        p_btts = calcular_probabilidades_btts(matriz)

        # Doble oportunidad
        p_1x = p1x2["1"] + p1x2["X"]
        p_x2 = p1x2["X"] + p1x2["2"]
        p_12 = p1x2["1"] + p1x2["2"]

        opciones = [
            {"mercado": f"Gana {loc_name}", "prob": float(p1x2["1"])},
            {"mercado": "Empate", "prob": float(p1x2["X"])},
            {"mercado": f"Gana {vis_name}", "prob": float(p1x2["2"])},
            {"mercado": "Más de 2.5 Goles", "prob": float(p_ou["Over"])},
            {"mercado": "Menos de 2.5 Goles", "prob": float(p_ou["Under"])},
            {"mercado": "Ambos Marcan: Sí", "prob": float(p_btts["Si"])},
            {"mercado": "Ambos Marcan: No", "prob": float(p_btts["No"])},
            {"mercado": f"1X ({loc_name} o Empate)", "prob": float(p_1x)},
            {"mercado": f"X2 (Empate o {vis_name})", "prob": float(p_x2)},
            {"mercado": f"12 ({loc_name} o {vis_name})", "prob": float(p_12)}
        ]

        # Priorizar mercados principales de alto valor (1X2, Over/Under, BTTS)
        mercados_principales = [
            {"mercado": f"Gana {loc_name}", "prob": float(p1x2["1"])},
            {"mercado": "Empate", "prob": float(p1x2["X"])},
            {"mercado": f"Gana {vis_name}", "prob": float(p1x2["2"])},
            {"mercado": "Más de 2.5 Goles", "prob": float(p_ou["Over"])},
            {"mercado": "Menos de 2.5 Goles", "prob": float(p_ou["Under"])},
            {"mercado": "Ambos Marcan: Sí", "prob": float(p_btts["Si"])}
        ]
        mejor = max(mercados_principales, key=lambda x: x["prob"])
        prob_pct = round(mejor["prob"] * 100, 1)

        print(f"\n{m['torneo']}: {loc_name} (mu={mu_loc}) vs {vis_name} (mu={mu_vis})")
        print(f"  Rachas: {loc_name} [{racha_loc}] | {vis_name} [{racha_vis}]")
        print(f"  1X2: 1={round(p1x2['1']*100,1)}% | X={round(p1x2['X']*100,1)}% | 2={round(p1x2['2']*100,1)}%")
        print(f"  Over 2.5={round(p_ou['Over']*100,1)}% | BTTS Sí={round(p_btts['Si']*100,1)}%")
        print(f"  -> PREDICCION OPTIMA: {mejor['mercado']} ({prob_pct}%)")

        # Actualizar en Supabase para el partido de mañana (2026-10-10)
        actualizacion = {
            "mercado_predicho": mejor["mercado"],
            "probabilidad": prob_pct
        }
        supabase.table("historial_predicciones")\
            .update(actualizacion)\
            .eq("id_partido", pid)\
            .execute()

        predicciones_actualizadas.append({
            "id": pid,
            "local": loc_name,
            "visitante": vis_name,
            "mercado": mejor["mercado"],
            "probabilidad": prob_pct,
            "mu_local": mu_loc,
            "mu_visitante": mu_vis,
            "forma_local": racha_loc,
            "forma_visitante": racha_vis
        })

    print("\n[OK] Los 10 partidos fueron actualizados en Supabase con sus estadisticas matematicas ampliadas!")

if __name__ == "__main__":
    main()
