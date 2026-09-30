import os
import json
import requests

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
        llave_liga = f"{id_liga}_{temporada}"
        
        # Si no tenemos la liga guardada, gastamos 1 token para descargarla entera
        if llave_liga not in self.cache:
            print(f"📥 Descargando estadísticas reales de la liga {id_liga} (1 Token gastado)...")
            url = "https://v3.football.api-sports.io/standings"
            params = {"league": id_liga, "season": temporada}
            headers = {'x-apisports-key': self.api_key}
            
            try:
                res = requests.get(url, headers=headers, params=params).json()
                if "response" in res and len(res["response"]) > 0:
                    standings = res["response"][0]["league"]["standings"][0]
                    
                    datos_liga = {}
                    for equipo in standings:
                        nombre = equipo["team"]["name"]
                        partidos = equipo["all"]["played"]
                        if partidos > 0:
                            # Promedio de goles a favor (Ataque) y en contra (Defensa)
                            gf = equipo["all"]["goals"]["for"] / partidos
                            gc = equipo["all"]["goals"]["against"] / partidos
                            datos_liga[nombre] = {"gf": gf, "gc": gc}
                    
                    self.cache[llave_liga] = datos_liga
                    self._guardar_cache()
            except Exception as e:
                print(f"⚠️ Error obteniendo liga {id_liga}: {e}")
                
        # Calculamos MU cruzando el ataque de uno contra la defensa del otro
        liga_stats = self.cache.get(llave_liga, {})
        stats_local = liga_stats.get(local, {"gf": 1.3, "gc": 1.3})
        stats_visitante = liga_stats.get(visitante, {"gf": 1.1, "gc": 1.5})
        
        mu_local = (stats_local["gf"] + stats_visitante["gc"]) / 2
        mu_visitante = (stats_visitante["gf"] + stats_local["gc"]) / 2
        
        # Nunca devolver cero absoluto para no romper la matemática
        return {"mu_local": max(0.1, mu_local), "mu_visitante": max(0.1, mu_visitante)}