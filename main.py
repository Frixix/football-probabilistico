import pandas as pd
import requests
import json
import os
from datetime import datetime, timedelta
from src.data.procesador import ProcesadorDatos
from src.models.poisson import (
    generar_matriz_partido,
    calcular_probabilidades_1x2,
    probabilidades_a_cuotas,
    calcular_probabilidades_over_under,
    calcular_probabilidades_btts
)

def simular_partido_real():
    pass

def obtener_predicciones_api():
    print("\n--- INICIANDO CÁLCULO DE API (MODO DESARROLLO / BLINDADO) ---")
    
    archivo_cache = "partidos_cache.json"
    hoy_dia = datetime.now().strftime("%Y-%m-%d")

    # 1. SISTEMA DE CACHÉ
    if os.path.exists(archivo_cache):
        try:
            with open(archivo_cache, "r", encoding="utf-8") as f:
                datos_cache = json.load(f)
                if len(datos_cache.get("partidos", [])) > 0:
                    print("🛠️ MODO DESARROLLO: Usando caché bloqueado (0 peticiones gastadas).")
                    return datos_cache["partidos"]
        except Exception:
            pass 

    # 2. DESCARGA DE DATOS REALES DE LA API
    print("🌐 Conectando a API-Football...")
    url = "https://v3.football.api-sports.io/fixtures"
    
    # NUEVO: Le exigimos a la API que calcule el "hoy" basándose en Bogotá, no en Londres.
    querystring = {
        "date": hoy_dia,
        "timezone": "America/Bogota"
    }
    
    headers = {'x-apisports-key': 'dbb9e71d4b3320ceca52a903fd3c5bc8'}

    try:
        response = requests.get(url, headers=headers, params=querystring)
        datos_api = response.json()
        if not datos_api.get("response"):
            print("🚨 ALERTA API-FOOTBALL:", datos_api)
        partidos_reales = datos_api.get("response", [])
    except Exception as e:
        print(f"Error conectando a la API: {e}")
        partidos_reales = []

    # 3. INICIALIZAR EL MODELO ESTADÍSTICO (CON ESCUDO ANTI-BLOQUEOS)
    print("📊 Descargando CSV de GitHub...")
    procesador = None
    try:
        url_internacional = "https://raw.githubusercontent.com/martj42/international_results/master/results.csv"
        df_global = pd.read_csv(url_internacional)
        df_global['date'] = pd.to_datetime(df_global['date'])
        df_reciente = df_global[df_global['date'].dt.year >= 2020]
        df_limpio = df_reciente[['home_team', 'away_team', 'home_score', 'away_score']].copy()
        df_limpio.columns = ['Local', 'Visitante', 'Goles_Local', 'Goles_Visitante']
        procesador = ProcesadorDatos(df_limpio)
        print("✅ GitHub descargado correctamente.")
    except Exception as e:
        print(f"⚠️ GitHub bloqueó la descarga temporalmente. Usando modo de contingencia.")

    resultados_para_react = []
    identificador = 1
    
    for p in partidos_reales:
        local = p["teams"]["home"]["name"]
        visitante = p["teams"]["away"]["name"]
        torneo = p["league"]["name"]
        
        # CLASIFICACIÓN DE ESTADO PARA EL SEMÁFORO
        estado_short = p["fixture"]["status"]["short"]
        if estado_short == "NS":
            estado_texto = "No Iniciado"
            estado_clase = "estado-verde"
        elif estado_short in ["FT", "AET", "PEN"]:
            estado_texto = "Terminado"
            estado_clase = "estado-rojo"
        elif estado_short in ["1H", "2H", "HT", "ET", "P", "LIVE"]:
            estado_texto = "En Vivo"
            estado_clase = "estado-amarillo"
        else:
            estado_texto = "Aplazado"
            estado_clase = "estado-gris"
            
        fecha_hora_utc = p["fixture"]["date"]
        fecha_hora_limpia = fecha_hora_utc[:19]
        try:
            utc_dt = datetime.strptime(fecha_hora_limpia, "%Y-%m-%dT%H:%M:%S")
            colombia_dt = utc_dt - timedelta(hours=5)
            fecha_str = colombia_dt.strftime("%d/%m")
            hora_str = colombia_dt.strftime("%H:%M")
        except:
            fecha_str = "TBD"
            hora_str = "TBD"

        # Modelo Matemático
        esperados = procesador.calcular_mu_esperado(local, visitante) if procesador else None
        
        if esperados is None:
            mu_l = 1.5
            mu_v = 1.1
        else:
            mu_l = esperados["mu_local"]
            mu_v = esperados["mu_visitante"]
            
        matriz = generar_matriz_partido(mu_l, mu_v)
        prob_1x2 = calcular_probabilidades_1x2(matriz)
        prob_goles = calcular_probabilidades_over_under(matriz, limite=2.5)
        prob_btts = calcular_probabilidades_btts(matriz)

        opciones_mercado = [
            {"mercado": f"Gana {local}", "prob": prob_1x2["1"], "tipo": "1x2"},
            {"mercado": "Empate", "prob": prob_1x2["X"], "tipo": "1x2"},
            {"mercado": f"Gana {visitante}", "prob": prob_1x2["2"], "tipo": "1x2"},
            {"mercado": "Más de 2.5 Goles", "prob": prob_goles["Over"], "tipo": "goles"},
            {"mercado": "Menos de 2.5 Goles", "prob": prob_goles["Under"], "tipo": "goles"},
            {"mercado": "Ambos Marcan: Sí", "prob": prob_btts["Si"], "tipo": "btts"},
            {"mercado": "Ambos Marcan: No", "prob": prob_btts["No"], "tipo": "btts"}
        ]
        mejor_opcion = max(opciones_mercado, key=lambda x: x["prob"])

        resultados_para_react.append({
            "id": identificador,
            "local": local,
            "visitante": visitante,
            "mercado": mejor_opcion["mercado"],
            "prob": mejor_opcion["prob"],
            "tipo": mejor_opcion["tipo"],
            "fecha": fecha_str,
            "torneo": torneo,
            "hora": hora_str,
            "estado_texto": estado_texto,
            "estado_clase": estado_clase
        })
        identificador += 1

    # GUARDAR EN CACHÉ
    if resultados_para_react:
        with open(archivo_cache, "w", encoding="utf-8") as f:
            json.dump({"partidos": resultados_para_react}, f, indent=4)
            
    return resultados_para_react

if __name__ == "__main__":
    simular_partido_real()