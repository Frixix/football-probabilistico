import os
import json
import requests
import time
import re

def calcular_factor_forma(racha_str):
    """
    Calcula un multiplicador de forma reciente con decaimiento temporal (EWMA).
    Entrada: string de forma de API como 'WWDLW' (hasta 5 partidos).
    Salida: factor multiplicador calibrado entre 0.88 y 1.12 (1.0 es rendimiento neutro).
    """
    if not racha_str or not isinstance(racha_str, str):
        return 1.0
        
    chars = [c.upper() for c in racha_str.strip() if c.upper() in ('W', 'D', 'L')]
    if not chars:
        return 1.0
        
    n = len(chars)
    # Ponderaciones con decaimiento exponencial (partidos más recientes pesan más)
    raw_pesos = [2.71828 ** (0.35 * i) for i in range(n)]
    suma_pesos = sum(raw_pesos)
    pesos = [w / suma_pesos for w in raw_pesos]
    
    puntos_map = {'W': 1.0, 'D': 0.35, 'L': 0.0}
    score = sum(puntos_map[c] * w for c, w in zip(chars, pesos))
    
    # Impacto controlado y cuantitativo: ±10% sobre la tasa de goles esperados
    factor = 1.0 + (score - 0.50) * 0.20
    return round(max(0.88, min(1.12, factor)), 4)

def resolver_nombre_equipo(nombre_busqueda, dict_equipos):
    if not nombre_busqueda or not dict_equipos:
        return None
    if nombre_busqueda in dict_equipos:
        return nombre_busqueda
    n_norm = nombre_busqueda.lower().strip()
    for k in dict_equipos:
        if k.lower().strip() == n_norm:
            return k
    alias_map = {
        "milan": ["ac milan"],
        "ac milan": ["milan"],
        "juventus": ["juve"],
        "juve": ["juventus"],
        "juventud": ["juventus", "juve"],
        "roma": ["as roma"],
        "as roma": ["roma"],
        "lazio": ["ss lazio"],
        "fiorentina": ["acf fiorentina"],
        "inter": ["internazionale", "inter milan"],
        "psg": ["paris saint germain", "paris saint-germain"],
        "paris saint germain": ["psg"],
        "bayern": ["bayern münchen", "bayern munich"],
        "bayern münchen": ["bayern munich", "bayern"],
        "bayer leverkusen": ["leverkusen", "bayer 04 leverkusen"],
        "leverkusen": ["bayer leverkusen", "bayer 04 leverkusen"],
        "athletic club": ["athletic bilbao"],
        "atletico madrid": ["atlético madrid", "atletico de madrid"],
        "real madrid": ["madrid"],
        "manchester united": ["man united", "man utd"],
        "manchester city": ["man city"],
        "river plate": ["river"],
        "boca juniors": ["boca"]
    }
    if n_norm in alias_map:
        for al in alias_map[n_norm]:
            for k in dict_equipos:
                if al in k.lower():
                    return k
    if len(n_norm) >= 4:
        for k in dict_equipos:
            k_low = k.lower()
            if n_norm in k_low or k_low in n_norm:
                return k
    return None

class GestorEstadisticas:
    def __init__(self, api_key):
        self.api_key = api_key
        self.carpeta_data = "data"
        self.archivo_cache = os.path.join(self.carpeta_data, "estadisticas_ligas.json")
        os.makedirs(self.carpeta_data, exist_ok=True)
        self.cache = self._cargar_cache()

    def _cargar_cache(self):
        if os.path.exists(self.archivo_cache):
            try:
                with open(self.archivo_cache, "r", encoding="utf-8") as f:
                    return json.load(f)
            except:
                pass
        return {}

    def _guardar_cache(self):
        with open(self.archivo_cache, "w", encoding="utf-8") as f:
            json.dump(self.cache, f, indent=4)

    def resolver_equipo_global(self, nombre):
        """Busca el equipo en cualquier liga disponible en la caché."""
        ligas_prioridad = [
            "39_2026", "39_2024", "140_2026", "140_2024", "78_2026", "78_2024", 
            "135_2026", "135_2024", "61_2026", "61_2024", "88_2026", "88_2024",
            "94_2026", "94_2024", "128_2026", "71_2026", "239_2026", "2_2026", "3_2024", "848_2024"
        ]
        for k in ligas_prioridad:
            if k in self.cache and isinstance(self.cache[k], dict):
                eq = resolver_nombre_equipo(nombre, self.cache[k])
                if eq:
                    return self.cache[k][eq], eq
        for k, v in self.cache.items():
            if isinstance(v, dict):
                eq = resolver_nombre_equipo(nombre, v)
                if eq:
                    return v[eq], eq
        return None, None

    def obtener_mu_esperado(self, id_liga, temporada, local, visitante):
        llave_original = f"{id_liga}_{temporada}"
        
        # Buscar en cache con tolerancia multitemporada
        liga_stats = None
        for k in [llave_original, f"{id_liga}_2026", f"{id_liga}_2024", f"{id_liga}_2025", str(id_liga)]:
            if k in self.cache and self.cache[k]:
                liga_stats = self.cache[k]
                break

        if not liga_stats and id_liga and int(id_liga) != 0:
            print(f"📥 Descargando estadísticas reales de la liga {id_liga} (Temp {temporada})...")
            url = "https://v3.football.api-sports.io/standings"
            params = {"league": id_liga, "season": temporada}
            headers = {'x-apisports-key': self.api_key}
            
            try:
                res = requests.get(url, headers=headers, params=params).json()
                
                # 🛑 EXTRACCIÓN DINÁMICA DEL AÑO MÁXIMO PERMITIDO
                if res.get("errors"):
                    errores = res["errors"]
                    if "plan" in errores and "try from" in str(errores["plan"]):
                        anios = re.findall(r'\d{4}', str(errores["plan"]))
                        if len(anios) >= 2:
                            temp_maxima = int(anios[-1])
                            print(f"🔄 Temporada {temporada} bloqueada. Reintentando con ({temp_maxima})...")
                            params["season"] = temp_maxima
                            time.sleep(7)
                            res = requests.get(url, headers=headers, params=params).json()
                    
                    if res.get("errors"):
                        print(f"🚨 Error API en liga {id_liga}: {res['errors']}")
                        time.sleep(7)
                        return None

                datos_liga = {}
                if "response" in res and len(res["response"]) > 0:
                    liga_data = res["response"][0]["league"]
                    if "standings" in liga_data and len(liga_data["standings"]) > 0:
                        todos_los_equipos = []
                        for grp in liga_data["standings"]:
                            if isinstance(grp, list):
                                todos_los_equipos.extend(grp)
                            elif isinstance(grp, dict):
                                todos_los_equipos.append(grp)
                        standings = todos_los_equipos
                        
                        total_gf_h = sum(eq.get("home", {}).get("goals", {}).get("for", 0) for eq in standings)
                        total_p_h = sum(eq.get("home", {}).get("played", 0) for eq in standings)
                        total_gf_a = sum(eq.get("away", {}).get("goals", {}).get("for", 0) for eq in standings)
                        total_p_a = sum(eq.get("away", {}).get("played", 0) for eq in standings)
                        media_h = round(total_gf_h / total_p_h, 4) if total_p_h > 0 else 1.48
                        media_a = round(total_gf_a / total_p_a, 4) if total_p_a > 0 else 1.20

                        for equipo in standings:
                            nombre = equipo["team"]["name"]
                            rank = equipo.get("rank", 10)
                            points = equipo.get("points", 0)
                            goals_diff = equipo.get("goalsDiff", 0)
                            all_data = equipo.get("all", {})
                            home_data = equipo.get("home", {})
                            away_data = equipo.get("away", {})
                            forma_str = equipo.get("form", "")

                            partidos_total = all_data.get("played", 0)
                            if partidos_total > 0:
                                gf_total = all_data.get("goals", {}).get("for", 0) / partidos_total
                                gc_total = all_data.get("goals", {}).get("against", 0) / partidos_total

                                p_home = home_data.get("played", 0)
                                gf_home = (home_data.get("goals", {}).get("for", 0) / p_home) if p_home > 0 else gf_total
                                gc_home = (home_data.get("goals", {}).get("against", 0) / p_home) if p_home > 0 else gc_total

                                p_away = away_data.get("played", 0)
                                gf_away = (away_data.get("goals", {}).get("for", 0) / p_away) if p_away > 0 else gf_total
                                gc_away = (away_data.get("goals", {}).get("against", 0) / p_away) if p_away > 0 else gc_total

                                factor_forma = calcular_factor_forma(forma_str)

                                datos_liga[nombre] = {
                                    "rank": rank,
                                    "points": points,
                                    "goals_diff": goals_diff,
                                    "p_total": partidos_total,
                                    "gf": round(gf_total, 4),
                                    "gc": round(gc_total, 4),
                                    "gf_home": round(gf_home, 4),
                                    "gc_home": round(gc_home, 4),
                                    "gf_away": round(gf_away, 4),
                                    "gc_away": round(gc_away, 4),
                                    "p_home": p_home,
                                    "p_away": p_away,
                                    "forma": forma_str,
                                    "factor_forma": factor_forma,
                                    "media_liga_home": media_h,
                                    "media_liga_away": media_a
                                }
                
                if len(datos_liga) > 0:
                    self.cache[llave_original] = datos_liga
                    self.cache[f"{id_liga}_2026"] = datos_liga
                    self.cache[f"{id_liga}_2024"] = datos_liga
                    self._guardar_cache()
                    print(f"✅ Estadísticas guardadas con éxito para la liga {id_liga} (con tabla de posiciones)")
                    liga_stats = datos_liga
                else:
                    print(f"⚠️ La liga {id_liga} no tiene tabla de posiciones.")
                    self.cache[llave_original] = {} 
                    self._guardar_cache()
                    time.sleep(7)
                    return None
                time.sleep(7)

            except Exception as e:
                print(f"⚠️ Error crítico en liga {id_liga}: {e}")
                time.sleep(7)
                return None 

        if not liga_stats:
            liga_stats = {}
            
        nom_l_real = resolver_nombre_equipo(local, liga_stats) if liga_stats else None
        nom_v_real = resolver_nombre_equipo(visitante, liga_stats) if liga_stats else None

        stats_local = liga_stats.get(nom_l_real) if nom_l_real else None
        stats_visitante = liga_stats.get(nom_v_real) if nom_v_real else None

        # Si no están en la tabla específica del torneo, buscar en la caché global de ligas
        if not stats_local:
            stats_local, nom_l_real = self.resolver_equipo_global(local)
        if not stats_visitante:
            stats_visitante, nom_v_real = self.resolver_equipo_global(visitante)

        # Si ninguno de los dos equipos tiene datos registrados, no inventar
        if not stats_local and not stats_visitante:
            return None

        # Prior calibrado para rivales de copas continentales sin estadísticas en liga doméstica
        if not stats_local and stats_visitante:
            stats_local = {
                "gf": 1.05, "gc": 1.60, "gf_home": 1.10, "gc_home": 1.50,
                "p_home": 10, "p_away": 10, "rank": 15, "points": 8, "p_total": 10,
                "factor_forma": 1.0, "media_liga_home": 1.48, "media_liga_away": 1.20
            }
            nom_l_real = local
        elif not stats_visitante and stats_local:
            stats_visitante = {
                "gf": 0.85, "gc": 1.75, "gf_away": 0.80, "gc_away": 1.85,
                "p_home": 10, "p_away": 10, "rank": 16, "points": 8, "p_total": 10,
                "factor_forma": 1.0, "media_liga_home": 1.48, "media_liga_away": 1.20
            }
            nom_v_real = visitante
        
        # Ponderación Bayesiana de Local vs Visitante (Shrinkage)
        p_home_l = stats_local.get("p_home", 0)
        p_away_v = stats_visitante.get("p_away", 0)

        # Ataque local (pondera fuerza en casa vs media general)
        gf_l_home = stats_local.get("gf_home", stats_local.get("gf", 1.0))
        gf_l_all = stats_local.get("gf", 1.0)
        ataque_local = (p_home_l * gf_l_home + 3 * gf_l_all) / (p_home_l + 3) if p_home_l > 0 else gf_l_all

        # Defensa visitante (pondera vulnerabilidad fuera vs media general)
        gc_v_away = stats_visitante.get("gc_away", stats_visitante.get("gc", 1.0))
        gc_v_all = stats_visitante.get("gc", 1.0)
        defensa_visitante = (p_away_v * gc_v_away + 3 * gc_v_all) / (p_away_v + 3) if p_away_v > 0 else gc_v_all

        # Ataque visitante (pondera fuerza fuera vs media general)
        gf_v_away = stats_visitante.get("gf_away", stats_visitante.get("gf", 1.0))
        gf_v_all = stats_visitante.get("gf", 1.0)
        ataque_visitante = (p_away_v * gf_v_away + 3 * gf_v_all) / (p_away_v + 3) if p_away_v > 0 else gf_v_all

        # Defensa local (pondera vulnerabilidad en casa vs media general)
        gc_l_home = stats_local.get("gc_home", stats_local.get("gc", 1.0))
        gc_l_all = stats_local.get("gc", 1.0)
        defensa_local = (p_home_l * gc_l_home + 3 * gc_l_all) / (p_home_l + 3) if p_home_l > 0 else gc_l_all

        # Multiplicador de Forma Reciente (EWMA)
        factor_forma_local = stats_local.get("factor_forma", 1.0)
        factor_forma_visitante = stats_visitante.get("factor_forma", 1.0)

        media_home = stats_local.get("media_liga_home") or 1.48
        media_away = stats_visitante.get("media_liga_away") or 1.20

        # Modelo bivariado Maher con ajuste de Tabla de Posiciones
        if media_home and media_away and media_home > 0 and media_away > 0:
            fuerza_ataque_l = ataque_local / media_home
            vulnerabilidad_def_v = defensa_visitante / media_away
            fuerza_ataque_v = ataque_visitante / media_away
            vulnerabilidad_def_l = defensa_local / media_home

            mu_l_base = media_home * fuerza_ataque_l * vulnerabilidad_def_v
            mu_v_base = media_away * fuerza_ataque_v * vulnerabilidad_def_l

            rank_l = stats_local.get("rank", 10)
            rank_v = stats_visitante.get("rank", 10)
            p_tot_l = stats_local.get("p_total", 10)
            p_tot_v = stats_visitante.get("p_total", 10)

            pts_pg_l = (stats_local.get("points", 0) / p_tot_l) if p_tot_l > 0 else 1.3
            pts_pg_v = (stats_visitante.get("points", 0) / p_tot_v) if p_tot_v > 0 else 1.3
            diff_rank = rank_v - rank_l

            factor_tabla_l = 1.0
            factor_tabla_v = 1.0
            factor_ritmo_goles = 1.0
            tipo_partido = "estandar"

            es_top_l = rank_l <= 4 or pts_pg_l >= 2.0
            es_top_v = rank_v <= 4 or pts_pg_v >= 2.0
            es_fondo_l = rank_l >= 14 or pts_pg_l <= 0.95
            es_fondo_v = rank_v >= 14 or pts_pg_v <= 0.95

            # Asimetría por Desigualdad de Tabla (Top vs Fondo: Goleadas / Over)
            if es_top_l and es_fondo_v:
                factor_tabla_l += min(0.20, 0.012 * abs(diff_rank))
                factor_tabla_v *= 0.88
                factor_ritmo_goles = 1.08
                tipo_partido = "mismatch_goleador"
            elif es_top_v and es_fondo_l:
                factor_tabla_v += min(0.18, 0.010 * abs(diff_rank))
                factor_tabla_l *= 0.90
                factor_ritmo_goles = 1.06
                tipo_partido = "mismatch_goleador"
            # Duelo directo entre colistas (defensas cerradas: Under)
            elif es_fondo_l and es_fondo_v:
                factor_ritmo_goles = 0.90
                tipo_partido = "duelo_descenso_cerrado"
            # Duelo entre gigantes goleadores en la cima
            elif es_top_l and es_top_v:
                if stats_local.get("gf", 1.0) >= 1.6 and stats_visitante.get("gf", 1.0) >= 1.4:
                    factor_ritmo_goles = 1.08
                    tipo_partido = "duelo_elite_abierto"

            # Potenciador de equipos goleadores insignia (Inglaterra, España, Italia, Alemania, Francia, Argentina, Brasil)
            equipos_goleadores = [
                # Alemania
                "bayern", "bayer", "leverkusen", "borussia dortmund", "dortmund", "rb leipzig", "leipzig", "eintracht",
                # Francia
                "psg", "paris saint", "monaco", "marseille", "lille", "lyon",
                # Italia (Mencionados explícitamente: Milan, Juventus, Roma, Inter, Lazio, Fiorentina, Atalanta, Napoli)
                "inter", "ac milan", "milan", "juventus", "juve", "roma", "lazio", "fiorentina", "atalanta", "napoli",
                # Inglaterra
                "manchester city", "arsenal", "liverpool", "chelsea", "tottenham", "aston villa",
                # España
                "real madrid", "barcelona", "atletico madrid", "girona", "villarreal", "athletic club",
                # Argentina & Brasil
                "river plate", "boca juniors", "racing club", "flamengo", "palmeiras", "botafogo", "atletico mineiro"
            ]
            bonus_elite_l = 1.0
            bonus_elite_v = 1.0
            nom_l_low = (nom_l_real or local or "").lower()
            nom_v_low = (nom_v_real or visitante or "").lower()
            if any(eq in nom_l_low for eq in equipos_goleadores) and stats_local.get("gf", 1.0) >= 1.4:
                bonus_elite_l = 1.06
            if any(eq in nom_v_low for eq in equipos_goleadores) and stats_visitante.get("gf", 1.0) >= 1.3:
                bonus_elite_v = 1.05

            mu_local = mu_l_base * factor_tabla_l * bonus_elite_l * factor_forma_local * factor_ritmo_goles
            mu_visitante = mu_v_base * factor_tabla_v * bonus_elite_v * factor_forma_visitante * factor_ritmo_goles
        else:
            # Compatibilidad exacta con formato legacy y pruebas unitarias
            mu_local = ((ataque_local + defensa_visitante) / 2) * factor_forma_local
            mu_visitante = ((ataque_visitante + defensa_local) / 2) * factor_forma_visitante
            rank_l = stats_local.get("rank")
            rank_v = stats_visitante.get("rank")
            tipo_partido = "estandar"
        
        return {
            "mu_local": round(max(0.1, mu_local), 4),
            "mu_visitante": round(max(0.1, mu_visitante), 4),
            "forma_local": stats_local.get("forma", ""),
            "forma_visitante": stats_visitante.get("forma", ""),
            "rank_local": rank_l,
            "rank_visitante": rank_v,
            "tipo_partido": tipo_partido
        }