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
                        return {"mu_local": 1.4, "mu_visitante": 1.2} 

                datos_liga = {}
                if "response" in res and len(res["response"]) > 0:
                    liga_data = res["response"][0]["league"]
                    if "standings" in liga_data and len(liga_data["standings"]) > 0:
                        standings = liga_data["standings"][0]
                        for equipo in standings:
                            nombre = equipo["team"]["name"]
                            partidos = equipo["all"]["played"]
                            if partidos > 0:
                                gf = equipo["all"]["goals"]["for"] / partidos
                                gc = equipo["all"]["goals"]["against"] / partidos
                                datos_liga[nombre] = {"gf": gf, "gc": gc}
                
                # 🔥 CORRECCIÓN CLAVE: Solo guardar en caché si realmente encontramos datos
                if len(datos_liga) > 0:
                    self.cache[llave_original] = datos_liga
                    self._guardar_cache()
                    print(f"✅ Estadísticas guardadas con éxito para la liga {id_liga}")
                else:
                    print(f"⚠️ La liga {id_liga} no tiene tabla de posiciones (Probablemente es Copa o Amistoso). Usando base genérica.")
                
                time.sleep(7)

            except Exception as e:
                print(f"⚠️ Error crítico en liga {id_liga}: {e}")
                time.sleep(7)
                return {"mu_local": 1.4, "mu_visitante": 1.2} 
                
        # Buscar en caché
        liga_stats = self.cache.get(llave_original, {})
        
        # Si la liga no tenía tabla (Amistosos), usa una base genérica
        stats_local = liga_stats.get(local, {"gf": 1.3, "gc": 1.3})
        stats_visitante = liga_stats.get(visitante, {"gf": 1.1, "gc": 1.5})
        
        mu_local = (stats_local["gf"] + stats_visitante["gc"]) / 2
        mu_visitante = (stats_visitante["gf"] + stats_local["gc"]) / 2
        
        return {"mu_local": max(0.1, mu_local), "mu_visitante": max(0.1, mu_visitante)}