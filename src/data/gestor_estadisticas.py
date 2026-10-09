import os
import json
import requests
import time
import re

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

    def obtener_mu_esperado(self, id_liga, temporada, local, visitante):
        llave_original = f"{id_liga}_{temporada}"
        
        if llave_original not in self.cache:
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
                        standings = liga_data["standings"][0]
                        for equipo in standings:
                            nombre = equipo["team"]["name"]
                            all_data = equipo.get("all", {})
                            home_data = equipo.get("home", {})
                            away_data = equipo.get("away", {})

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

                                datos_liga[nombre] = {
                                    "gf": round(gf_total, 4),
                                    "gc": round(gc_total, 4),
                                    "gf_home": round(gf_home, 4),
                                    "gc_home": round(gc_home, 4),
                                    "gf_away": round(gf_away, 4),
                                    "gc_away": round(gc_away, 4),
                                    "p_home": p_home,
                                    "p_away": p_away
                                }
                
                # 🔥 CORRECCIÓN CLAVE: Solo guardar en caché si realmente encontramos datos
                if len(datos_liga) > 0:
                    self.cache[llave_original] = datos_liga
                    self._guardar_cache()
                    print(f"✅ Estadísticas guardadas con éxito para la liga {id_liga} (con desglose Local/Visita)")
                else:
                    print(f"⚠️ La liga {id_liga} no tiene tabla de posiciones (Probablemente es Copa o Amistoso).")
                    self.cache[llave_original] = {} 
                    self._guardar_cache()
                time.sleep(7)

            except Exception as e:
                print(f"⚠️ Error crítico en liga {id_liga}: {e}")
                time.sleep(7)
                return None 
                
        # Buscar en caché
        liga_stats = self.cache.get(llave_original, {})
        if not liga_stats:
            return None
            
        if local not in liga_stats or visitante not in liga_stats:
            return None
        
        stats_local = liga_stats[local]
        stats_visitante = liga_stats[visitante]
        
        # Ponderación Bayesiana de Local vs Visitante (Shrinkage)
        # Si un equipo tiene pocos partidos en esa condición, se regulariza con su media global
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

        mu_local = (ataque_local + defensa_visitante) / 2
        mu_visitante = (ataque_visitante + defensa_local) / 2
        
        return {"mu_local": round(max(0.1, mu_local), 4), "mu_visitante": round(max(0.1, mu_visitante), 4)}