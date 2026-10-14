import sys
import time
import requests
import json
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

# Importaciones locales
from src.data.gestor_estadisticas import GestorEstadisticas
from src.models.poisson import (
    generar_matriz_dixon_coles,
    calcular_probabilidades_1x2,
    calcular_probabilidades_over_under,
    calcular_probabilidades_btts,
    seleccionar_mercado_goles_optimo
)

# 1. Cargar variables de entorno
load_dotenv()

# 2. Conectar a Supabase y cargar llaves
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_KEY_PARTIDOS = os.getenv("API_KEY_PARTIDOS")
API_KEY_ESTADISTICAS = os.getenv("API_KEY_ESTADISTICAS")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("⚠️ Faltan las llaves de Supabase en el archivo .env")

# 3. Función de validación de historial y cálculo de aciertos
def evaluar_acierto_mercado(prediccion_raw, goles_local, goles_visitante, local, visitante):
    if goles_local is None or goles_visitante is None:
        return None
    pred = (prediccion_raw or "").strip().lower()
    gl = int(goles_local)
    gv = int(goles_visitante)
    suma = gl + gv
    loc = (local or "").strip().lower()
    vis = (visitante or "").strip().lower()

    # 1. Empate / X
    if pred in ["empate", "x"]:
        return gl == gv

    # 2. Doble Oportunidad
    if pred.startswith("1x") or "local o empate" in pred or (loc and f"{loc} o empate" in pred):
        return gl >= gv
    if pred.startswith("x2") or "empate o visitante" in pred or (vis and f"empate o {vis}" in pred):
        return gv >= gl
    if pred.startswith("12") or "local o visitante" in pred or (loc and vis and f"{loc} o {vis}" in pred):
        return gl != gv

    # 3. 1X2 Ganador
    if pred in ["gana local", "1"]:
        return gl > gv
    if pred in ["gana visitante", "2"]:
        return gv > gl
    if pred.startswith("gana "):
        eq = pred.replace("gana ", "").strip()
        if loc and (eq == loc or eq in loc or loc in eq):
            return gl > gv
        if vis and (eq == vis or eq in vis or vis in eq):
            return gv > gl

    # 4. Líneas de Goles (Over / Under)
    for linea in [0.5, 1.5, 2.5, 3.5, 4.5]:
        if str(linea) in pred:
            if any(k in pred for k in ["más", "mas", "over", ">", "ms"]):
                return suma > linea
            if any(k in pred for k in ["menos", "under", "<"]):
                return suma < linea

    # 5. Ambos Marcan (BTTS)
    if "ambos marcan" in pred or "btts" in pred:
        if ": no" in pred or "- no" in pred or pred.endswith(" no") or "no" in pred:
            return gl == 0 or gv == 0
        if any(k in pred for k in [": sí", ": si", "- sí", "- si", "yes"]) or pred.endswith(" sí") or pred.endswith(" si"):
            return gl > 0 and gv > 0


    return False

def validar_resultados_historicos(limite=15):
    print("🔍 Iniciando validación de historial en Supabase...")
    resultado_resumen = {
        "status": "error",
        "mensaje": "",
        "total_pendientes": 0,
        "evaluados": 0,
        "acertados": 0,
        "fallados": 0,
        "aun_pendientes": 0,
        "detalles": []
    }
    if not supabase:
        msg = "⚠️ Supabase no está conectado. Omitiendo validación."
        print(msg)
        resultado_resumen["mensaje"] = msg
        return resultado_resumen

    try:
        dt_bogota = datetime.utcnow() - timedelta(hours=5)
        hoy_dia = dt_bogota.strftime("%Y-%m-%d")

        # Validar priorizando fechas recientes hasta el día de hoy (no chequear partidos futuros)
        query = supabase.table("historial_predicciones")\
            .select("*")\
            .is_("fue_acierto", "null")\
            .lte("fecha", hoy_dia)\
            .order("fecha", desc=True)

        if limite:
            query = query.limit(limite)
        respuesta = query.execute()

        partidos_pendientes = respuesta.data or []
        resultado_resumen["total_pendientes"] = len(partidos_pendientes)

        if not partidos_pendientes:
            msg = "✅ No hay partidos pendientes por evaluar. ¡Todo al día!"
            print(msg)
            resultado_resumen["status"] = "ok"
            resultado_resumen["mensaje"] = msg
            return resultado_resumen

        print(f"🔄 Se encontraron {len(partidos_pendientes)} partidos para evaluar. (Protección de tokens activada)")

        headers = {'x-apisports-key': API_KEY_PARTIDOS}

        for partido in partidos_pendientes:
            id_partido = partido["id_partido"]
            prediccion = partido.get("mercado_predicho", "")
            local = partido.get("local", "")
            visitante = partido.get("visitante", "")

            url = f"https://v3.football.api-sports.io/fixtures?id={id_partido}"

            try:
                res_api = requests.get(url, headers=headers).json()
                if res_api.get("errors"):
                    err_msg = f"🚨 Límite o error de API al validar: {res_api.get('errors')}"
                    print(err_msg)
                    resultado_resumen["mensaje"] = err_msg
                    break
                if not res_api.get("response"):
                    time.sleep(0.5)
                    resultado_resumen["aun_pendientes"] += 1
                    continue

                datos_reales = res_api["response"][0]
                estado_corto = datos_reales["fixture"]["status"]["short"]

                if estado_corto in ["FT", "AET", "PEN"]:
                    goles_local = datos_reales["goals"]["home"]
                    goles_visitante = datos_reales["goals"]["away"]

                    if goles_local is None or goles_visitante is None:
                        resultado_resumen["aun_pendientes"] += 1
                        continue

                    fue_acierto = evaluar_acierto_mercado(
                        prediccion, goles_local, goles_visitante, local, visitante
                    )

                    actualizacion = {
                        "goles_local": goles_local,
                        "goles_visitante": goles_visitante,
                        "fue_acierto": fue_acierto
                    }
                    supabase.table("historial_predicciones")\
                        .update(actualizacion)\
                        .eq("id_partido", id_partido)\
                        .execute()

                    resultado_resumen["evaluados"] += 1
                    if fue_acierto:
                        resultado_resumen["acertados"] += 1
                    else:
                        resultado_resumen["fallados"] += 1

                    detalle_item = {
                        "id_partido": id_partido,
                        "partido": f"{local} {goles_local} - {goles_visitante} {visitante}",
                        "prediccion": prediccion,
                        "fue_acierto": fue_acierto
                    }
                    resultado_resumen["detalles"].append(detalle_item)
                    simbolo = "✅ ACERTADO" if fue_acierto else "❌ FALLADO"
                    print(f"Marcador guardado: {local} {goles_local} - {goles_visitante} {visitante} | {simbolo} ({prediccion})")
                else:
                    resultado_resumen["aun_pendientes"] += 1

            except Exception as e:
                print(f"Error procesando validación del partido {id_partido}: {e}")
                resultado_resumen["aun_pendientes"] += 1

            time.sleep(1.2) # Pausa para proteger API contra rate limits

        resultado_resumen["status"] = "ok"
        resultado_resumen["mensaje"] = f"Validación finalizada. Evaluados: {resultado_resumen['evaluados']} ({resultado_resumen['acertados']} acertados, {resultado_resumen['fallados']} fallados). Pendientes: {resultado_resumen['aun_pendientes']}."

    except Exception as e:
        err_msg = f"Error consultando Supabase para validación: {e}"
        print(err_msg)
        resultado_resumen["mensaje"] = err_msg

    return resultado_resumen

# 4. Función Principal de la API
def obtener_predicciones_api(fecha_objetivo=None):
    print("\n--- INICIANDO CÁLCULO DE API (SISTEMA DE DOBLE LLAVE) ---")
    
    validar_resultados_historicos()
    
    dt_bogota = datetime.utcnow() - timedelta(hours=5)
    hoy_dia = fecha_objetivo if fecha_objetivo else dt_bogota.strftime("%Y-%m-%d")
    archivo_cache = os.path.join("data", f"cache_{hoy_dia}.json")

    if os.path.exists(archivo_cache):
        try:
            with open(archivo_cache, "r", encoding="utf-8") as f:
                datos_cache = json.load(f)
                if isinstance(datos_cache, dict):
                    partidos_guardados = datos_cache.get("partidos", [])
                    if datos_cache.get("fecha") == hoy_dia and len(partidos_guardados) > 0:
                        print("🛠️ MODO DESARROLLO: Usando caché de hoy (0 peticiones gastadas para los pronósticos).")
                        return partidos_guardados
        except Exception:
            pass 

    print("🌐 Conectando a API-Football para partidos de hoy...")
    url = "https://v3.football.api-sports.io/fixtures"
    
    querystring = {
        "date": hoy_dia,
        "timezone": "America/Bogota"
    }
    
    headers_partidos = {'x-apisports-key': API_KEY_PARTIDOS}

    try:
        response = requests.get(url, headers=headers_partidos, params=querystring)
        datos_api = response.json()
        if not datos_api.get("response"):
            print("🚨 ALERTA API-FOOTBALL (Partidos):", datos_api)
        partidos_reales = datos_api.get("response", [])
    except Exception as e:
        print(f"Error conectando a la API de partidos: {e}")
        partidos_reales = []

    print("📊 Inicializando Gestor de Estadísticas Reales (Segunda Llave)...")
    gestor = GestorEstadisticas(API_KEY_ESTADISTICAS)

    resultados_para_react = []
    identificador = 1
    
    for p in partidos_reales:
        local = p["teams"]["home"]["name"]
        visitante = p["teams"]["away"]["name"]
        torneo = p["league"]["name"]
        pais = p["league"].get("country", "Mundo")
        bandera = p["league"].get("flag", "")
        
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

        esperados = gestor.obtener_mu_esperado(id_liga, temporada, local, visitante)
        if not esperados:
            continue
        mu_l = esperados["mu_local"]
        mu_v = esperados["mu_visitante"]
            
        # Motor probabilístico calibrado de Dixon-Coles
        matriz = generar_matriz_dixon_coles(mu_l, mu_v)
        prob_1x2 = calcular_probabilidades_1x2(matriz)
        prob_goles = calcular_probabilidades_over_under(matriz, limite=2.5)
        prob_btts = calcular_probabilidades_btts(matriz)
        mercado_goles_optimo = seleccionar_mercado_goles_optimo(matriz, contexto_tabla=esperados)

        opciones_mercado = [
            {"mercado": f"Gana {local}", "prob": prob_1x2["1"], "tipo": "1x2"},
            {"mercado": "Empate", "prob": prob_1x2["X"], "tipo": "1x2"},
            {"mercado": f"Gana {visitante}", "prob": prob_1x2["2"], "tipo": "1x2"},
            {"mercado": "Más de 2.5 Goles", "prob": prob_goles["Over"], "tipo": "goles"},
            {"mercado": "Menos de 2.5 Goles", "prob": prob_goles["Under"], "tipo": "goles"},
            {"mercado": "Ambos Marcan: Sí", "prob": prob_btts["Si"], "tipo": "btts"},
            {"mercado": "Ambos Marcan: No", "prob": prob_btts["No"], "tipo": "btts"}
        ]
        if mercado_goles_optimo and mercado_goles_optimo.get("prob", 0) >= 0.58:
            opciones_mercado.append({
                "mercado": mercado_goles_optimo["mercado"],
                "prob": mercado_goles_optimo["prob"],
                "tipo": "goles"
            })

        mejor_opcion = max(opciones_mercado, key=lambda x: x["prob"])

        prob_predicha = float(mejor_opcion["prob"])
        cuota_justa = round(1.0 / prob_predicha, 2) if prob_predicha > 0 else 1.0

        # Cuota de mercado de referencia con margen de casa (5% vigorish) y cálculo de Expected Value (EV)
        cuota_mercado = round(max(1.05, 1.0 / (prob_predicha * 0.95)), 2) if prob_predicha > 0 else 1.0
        ev = round(((prob_predicha * cuota_mercado) - 1.0) * 100, 1)
        es_valor = ev >= 3.0 or prob_predicha >= 0.60

        if supabase:
            registro_db = {
                "id_partido": p["fixture"]["id"],
                "fecha": fecha_db,
                "torneo": torneo,
                "local": local,
                "visitante": visitante,
                "mercado_predicho": mejor_opcion["mercado"],
                "probabilidad": round(float(mejor_opcion["prob"]) * 100, 2),
                "hora": hora_str
            }
            try:
                supabase.table("historial_predicciones").upsert(registro_db).execute()
            except Exception as error_db:
                if "hora" in registro_db:
                    registro_sin_hora = {k: v for k, v in registro_db.items() if k != "hora"}
                    try:
                        supabase.table("historial_predicciones").upsert(registro_sin_hora).execute()
                    except Exception as error_db2:
                        print(f"Error guardando en Supabase el partido {local}: {error_db2}")
                else:
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
            "estado_clase": estado_clase,
            "cuota_justa": cuota_justa,
            "cuota_mercado": cuota_mercado,
            "ev": ev,
            "es_valor": es_valor,
            "mu_local": mu_l,
            "mu_visitante": mu_v,
            "rank_local": esperados.get("rank_local"),
            "rank_visitante": esperados.get("rank_visitante"),
            "tipo_partido": esperados.get("tipo_partido", "estandar"),
            "forma_local": esperados.get("forma_local", ""),
            "forma_visitante": esperados.get("forma_visitante", "")
        })
        identificador += 1

    if resultados_para_react:
        try:
            os.makedirs("data", exist_ok=True)
            with open(archivo_cache, "w", encoding="utf-8") as f:
                json.dump({"fecha": hoy_dia, "partidos": resultados_para_react}, f, indent=4)
        except Exception as e:
            print(f"Error guardando caché temporal: {e}")
            
    if len(resultados_para_react) == 0:
        print("⚠️ No hay partidos reales, enviando datos de prueba al Frontend...")
        return []

    return resultados_para_react

if __name__ == "__main__":
    # ¡Aquí estaba el error! Ahora sí llama a la función correcta
    obtener_predicciones_api()