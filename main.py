import tempfile
import requests
import json
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

# NUEVA IMPORTACIÓN: Nuestro Gestor inteligente
from src.data.gestor_estadisticas import GestorEstadisticas
from src.models.poisson import (
    generar_matriz_partido,
    calcular_probabilidades_1x2,
    calcular_probabilidades_over_under,
    calcular_probabilidades_btts
)

# 1. Cargar variables de entorno del archivo .env
load_dotenv()

# 2. Conectar a Supabase ANTES de cualquier función
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("⚠️ Faltan las llaves de Supabase en el archivo .env")

# 3. Función de validación de historial
def validar_resultados_historicos():
    print("🔍 Iniciando validación de historial en Supabase...")
    if not supabase:
        print("⚠️ Supabase no está conectado. Omitiendo validación.")
        return

    try:
        respuesta = supabase.table("historial_predicciones")\
            .select("*")\
            .is_("fue_acierto", "null")\
            .limit(50)\
            .execute()
        
        partidos_pendientes = respuesta.data
        if not partidos_pendientes:
            print("✅ No hay partidos pendientes por evaluar.")
            return
            
        print(f"🔄 Se encontraron {len(partidos_pendientes)} partidos para evaluar.")

        for partido in partidos_pendientes:
            id_partido = partido["id_partido"]
            prediccion = partido["mercado_predicho"]
            
            url = f"https://v3.football.api-sports.io/fixtures?id={id_partido}"
            headers = {'x-apisports-key': "dbb9e71d4b3320ceca52a903fd3c5bc8"}
            
            try:
                res_api = requests.get(url, headers=headers).json()
                if not res_api.get("response"):
                    continue
                    
                datos_reales = res_api["response"][0]
                estado_corto = datos_reales["fixture"]["status"]["short"]
                
                if estado_corto in ["FT", "AET", "PEN"]:
                    goles_local = datos_reales["goals"]["home"]
                    goles_visitante = datos_reales["goals"]["away"]
                    
                    if goles_local is None or goles_visitante is None:
                        continue 
                        
                    suma_goles = goles_local + goles_visitante
                    fue_acierto = False
                    
                    if "Gana" in prediccion:
                        equipo_ganador = prediccion.replace("Gana ", "")
                        if goles_local > goles_visitante and equipo_ganador == partido["local"]:
                            fue_acierto = True
                        elif goles_visitante > goles_local and equipo_ganador == partido["visitante"]:
                            fue_acierto = True
                    elif prediccion == "Empate":
                        if goles_local == goles_visitante:
                            fue_acierto = True
                    elif "Más de 2.5" in prediccion:
                        if suma_goles > 2.5:
                            fue_acierto = True
                    elif "Menos de 2.5" in prediccion:
                        if suma_goles < 2.5:
                            fue_acierto = True
                    elif "Ambos Marcan: Sí" in prediccion:
                        if goles_local > 0 and goles_visitante > 0:
                            fue_acierto = True
                    elif "Ambos Marcan: No" in prediccion:
                        if goles_local == 0 or goles_visitante == 0:
                            fue_acierto = True
                            
                    actualizacion = {
                        "goles_local": goles_local,
                        "goles_visitante": goles_visitante,
                        "fue_acierto": fue_acierto
                    }
                    supabase.table("historial_predicciones")\
                        .update(actualizacion)\
                        .eq("id_partido", id_partido)\
                        .execute()
                        
                    print(f"Marcador guardado: {partido['local']} {goles_local} - {goles_visitante} {partido['visitante']} | ¿Acierto? {fue_acierto}")
            except Exception as e:
                print(f"Error procesando validación del partido {id_partido}: {e}")
                
    except Exception as e:
        print(f"Error consultando Supabase para validación: {e}")

# 4. Función Principal de la API
def simular_partido_real():
    pass

def obtener_predicciones_api():
    print("\n--- INICIANDO CÁLCULO DE API (MODO DESARROLLO / BLINDADO) ---")
    
    validar_resultados_historicos()
    
    archivo_cache = os.path.join("data", "cache_diario.json")
    hoy_dia = (datetime.utcnow() - timedelta(hours=5)).strftime("%Y-%m-%d")

    if os.path.exists(archivo_cache):
        try:
            with open(archivo_cache, "r", encoding="utf-8") as f:
                datos_cache = json.load(f)
                if len(datos_cache.get("partidos", [])) > 0:
                    print("🛠️ MODO DESARROLLO: Usando caché bloqueado (0 peticiones gastadas para los pronósticos).")
                    return datos_cache["partidos"]
        except Exception:
            pass 

    print("🌐 Conectando a API-Football...")
    url = "https://v3.football.api-sports.io/fixtures"
    
    querystring = {
        "date": hoy_dia,
        "timezone": "America/Bogota"
    }
    
    api_key = "dbb9e71d4b3320ceca52a903fd3c5bc8"
    headers = {'x-apisports-key': api_key}

    try:
        response = requests.get(url, headers=headers, params=querystring)
        datos_api = response.json()
        if not datos_api.get("response"):
            print("🚨 ALERTA API-FOOTBALL:", datos_api)
        partidos_reales = datos_api.get("response", [])
    except Exception as e:
        print(f"Error conectando a la API: {e}")
        partidos_reales = []

    print("📊 Inicializando Gestor de Estadísticas Reales...")
    gestor = GestorEstadisticas(api_key)

    resultados_para_react = []
    identificador = 1
    
    for p in partidos_reales:
        local = p["teams"]["home"]["name"]
        visitante = p["teams"]["away"]["name"]
        torneo = p["league"]["name"]
        pais = p["league"].get("country", "Mundo")
        bandera = p["league"].get("flag", "")
        
        # DATOS CLAVE PARA BUSCAR ESTADÍSTICAS REALES
        id_liga = p["league"]["id"]
        temporada = p["league"]["season"]
        
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
            fecha_db = colombia_dt.strftime("%Y-%m-%d") 
        except:
            fecha_str = "TBD"
            hora_str = "TBD"
            fecha_db = hoy_dia

        # CONSEGUIMOS MU REAL DE LA LIGA ACTUAL
        esperados = gestor.obtener_mu_esperado(id_liga, temporada, local, visitante)
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

        if supabase:
            try:
                registro_db = {
                    "id_partido": p["fixture"]["id"],
                    "fecha": fecha_db,
                    "torneo": torneo,
                    "local": local,
                    "visitante": visitante,
                    "mercado_predicho": mejor_opcion["mercado"],
                    "probabilidad": float(mejor_opcion["prob"])
                }
                supabase.table("historial_predicciones").upsert(registro_db).execute()
            except Exception as error_db:
                print(f"Error guardando en Supabase el partido {local}: {error_db}")

        resultados_para_react.append({
            "id": identificador,
            "local": local,
            "visitante": visitante,
            "mercado": mejor_opcion["mercado"],
            "prob": mejor_opcion["prob"],
            "tipo": mejor_opcion["tipo"],
            "fecha": fecha_str,
            "torneo": torneo,
            "pais": pais,
            "bandera": bandera,
            "hora": hora_str,
            "estado_texto": estado_texto,
            "estado_clase": estado_clase
        })
        identificador += 1

    if resultados_para_react:
        try:
            with open(archivo_cache, "w", encoding="utf-8") as f:
                json.dump({"partidos": resultados_para_react}, f, indent=4)
        except Exception as e:
            print(f"Error guardando caché temporal: {e}")
            
    if len(resultados_para_react) == 0:
        print("⚠️ No hay partidos reales, enviando datos de prueba al Frontend...")
        return []

    return resultados_para_react

if __name__ == "__main__":
    simular_partido_real()