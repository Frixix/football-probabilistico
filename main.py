import pandas as pd
import requests
import json
import os
from datetime import datetime
from src.models.poisson import (
    generar_matriz_partido,
    calcular_probabilidades_1x2,
    probabilidades_a_cuotas,
    calcular_probabilidades_over_under,
    calcular_probabilidades_btts
)

def obtener_predicciones_api():
    print("\n--- INICIANDO CÁLCULO DE API CON CACHÉ ---")
    
    # Archivo donde guardaremos los datos para no gastar peticiones
    archivo_cache = "partidos_cache.json"
    hoy = datetime.now().strftime("%Y-%m-%d")

    # 1. SISTEMA DE CACHÉ: Revisar si ya descargamos los datos hoy
    if os.path.exists(archivo_cache):
        try:
            with open(archivo_cache, "r", encoding="utf-8") as f:
                datos_cache = json.load(f)
                if datos_cache.get("fecha") == hoy:
                    print("✅ Usando caché local (0 peticiones gastadas).")
                    return datos_cache["partidos"]
        except Exception:
            pass # Si el caché falla, continuamos a la descarga

    # 2. DESCARGA DE DATOS REALES (Solo ocurre 1 vez al día)
    print("🌐 Conectando a API-Football (1 petición gastada)...")
    url = "https://v3.football.api-sports.io/fixtures"
    
    # Traemos los próximos 15 partidos oficiales a nivel mundial
    querystring = {"next": "15"}
    headers = {'x-apisports-key': 'dbb9e71d4b3320ceca52a903fd3c5bc8'}

    try:
        response = requests.get(url, headers=headers, params=querystring)
        datos_api = response.json()
        partidos_reales = datos_api.get("response", [])
    except Exception as e:
        print(f"Error conectando a la API: {e}")
        return []

    resultados_para_react = []
    identificador = 1

    print("3. Evaluando partidos con el Modelo de Poisson...")
    
    for p in partidos_reales:
        local = p["teams"]["home"]["name"]
        visitante = p["teams"]["away"]["name"]
        torneo = p["league"]["name"]
        
        # Extraemos fecha y hora real exacta
        fecha_hora = p["fixture"]["date"] # Ej: 2026-09-24T18:00:00+00:00
        fecha_str = fecha_hora[8:10] + "/" + fecha_hora[5:7]
        hora_str = fecha_hora[11:16]

        # PLAN DE CONTINGENCIA MATEMÁTICA:
        # Como aún no tenemos un CSV con el historial de todos los clubes del mundo,
        # inyectamos goles esperados (mu) estandarizados para que el motor de Poisson
        # pueda hacer sus cálculos y la aplicación no se bloquee.
        mu_l = 1.6  
        mu_v = 1.2  
        
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
            "hora": hora_str # ¡Enviamos la hora real!
        })
        identificador += 1

    # 4. GUARDAR EN CACHÉ
    with open(archivo_cache, "w", encoding="utf-8") as f:
        json.dump({"fecha": hoy, "partidos": resultados_para_react}, f, indent=4)

    print("--- CÁLCULO TERMINADO Y GUARDADO EN CACHÉ ---")
    return resultados_para_react