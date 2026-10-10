import os
import json
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_KEY_PARTIDOS = os.getenv("API_KEY_PARTIDOS")

def format_12h(hora_24):
    if not hora_24 or len(hora_24) < 5:
        return "3:00 PM"
    try:
        h = int(hora_24[:2])
        m = hora_24[3:5]
        ampm = "PM" if h >= 12 else "AM"
        h12 = h % 12
        if h12 == 0:
            h12 = 12
        return f"{h12}:{m} {ampm}"
    except Exception:
        return hora_24

def main():
    print("=== SINCRONIZANDO HORARIOS, ESTADOS Y METADATOS DE FIXTURES (UTC-5 BOGOTA) ===")
    
    headers = {'x-apisports-key': API_KEY_PARTIDOS}
    out_dir = os.path.join("frontend", "src", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "horarios_fixtures.json")

    # Cargar fixtures existentes para no sobreescribir historial previo
    fixtures_dict = {}
    if os.path.exists(out_file):
        try:
            with open(out_file, "r", encoding="utf-8") as f:
                fixtures_dict = json.load(f)
            print(f"Cargados {len(fixtures_dict)} fixtures existentes de respaldo.")
        except Exception as e:
            print(f"Aviso al leer archivo previo: {e}")

    # Calcular fecha actual de Bogotá (UTC-5)
    dt_bogota = datetime.utcnow() - timedelta(hours=5)
    hoy_str = dt_bogota.strftime("%Y-%m-%d")
    ayer_str = (dt_bogota - timedelta(days=1)).strftime("%Y-%m-%d")
    manana_str = (dt_bogota + timedelta(days=1)).strftime("%Y-%m-%d")
    
    fechas_api = [ayer_str, hoy_str, manana_str]
    
    for fecha in fechas_api:
        url = f"https://v3.football.api-sports.io/fixtures?date={fecha}&timezone=America/Bogota"
        print(f"Obteniendo fixtures para {fecha} desde API-Football...")
        try:
            res = requests.get(url, headers=headers).json()
            items = res.get("response", [])
            print(f"  -> Recibidos {len(items)} fixtures para {fecha}")
            
            for item in items:
                f_id = item["fixture"]["id"]
                date_iso = item["fixture"]["date"]
                hora = date_iso[11:16] if len(date_iso) >= 16 else "15:00"
                hora12 = format_12h(hora)
                status_short = item["fixture"]["status"]["short"] or "NS"
                status_long = item["fixture"]["status"]["long"] or ""
                elapsed = item["fixture"]["status"]["elapsed"]
                gl = item["goals"]["home"]
                gv = item["goals"]["away"]
                
                es_vivo = status_short in ['1H', '2H', 'HT', 'ET', 'P', 'LIVE']
                terminado = status_short in ['FT', 'AET', 'PEN']
                
                if status_short == '1H':
                    status_texto = f"1T {elapsed}'" if elapsed else "1T"
                elif status_short == '2H':
                    status_texto = f"2T {elapsed}'" if elapsed else "2T"
                elif status_short == 'HT':
                    status_texto = "ENTRETIEMPO"
                elif status_short in ['FT', 'AET', 'PEN']:
                    status_texto = f"FT {gl} - {gv}" if (gl is not None and gv is not None) else "FINALIZADO"
                elif status_short in ['PST', 'SUSP', 'CANC', 'ABD']:
                    status_texto = "POSTERGADO"
                else:
                    status_texto = hora12

                league = item.get("league", {})
                teams = item.get("teams", {})

                fixtures_dict[str(f_id)] = {
                    "id": f_id,
                    "fecha": date_iso[:10],
                    "hora": hora,
                    "hora12": hora12,
                    "status": status_short,
                    "status_long": status_long,
                    "status_texto": status_texto,
                    "elapsed": elapsed,
                    "goles_local": gl,
                    "goles_visitante": gv,
                    "es_vivo": es_vivo,
                    "terminado": terminado,
                    "pais": league.get("country"),
                    "torneo": league.get("name"),
                    "id_liga": league.get("id"),
                    "bandera": league.get("flag"),
                    "local": teams.get("home", {}).get("name"),
                    "visitante": teams.get("away", {}).get("name")
                }
        except Exception as e:
            print(f"Error consultando fecha {fecha}: {e}")

    # 2. Sincronizar marcadores en Supabase si hay partidos finalizados
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            for f_check in [hoy_str, ayer_str]:
                r = supabase.table("historial_predicciones").select("*").eq("fecha", f_check).execute()
                partidos_db = r.data or []
                actualizados = 0
                for p in partidos_db:
                    pid = str(p["id_partido"])
                    if pid in fixtures_dict:
                        fix = fixtures_dict[pid]
                        if fix["terminado"] and fix["goles_local"] is not None and fix["goles_visitante"] is not None:
                            if p["goles_local"] != fix["goles_local"] or p["goles_visitante"] != fix["goles_visitante"]:
                                supabase.table("historial_predicciones").update({
                                    "goles_local": fix["goles_local"],
                                    "goles_visitante": fix["goles_visitante"]
                                }).eq("id_partido", p["id_partido"]).execute()
                                actualizados += 1
                if actualizados > 0:
                    print(f"Marcadores sincronizados en Supabase para {f_check}: {actualizados}")
        except Exception as err_sb:
            print(f"Aviso actualizando Supabase: {err_sb}")

    # 3. Guardar archivo JSON
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(fixtures_dict, f, ensure_ascii=False, indent=2)
    
    print(f"\n[OK] Guardado exitoso: {len(fixtures_dict)} fixtures con metadatos guardados en {out_file}")

if __name__ == "__main__":
    main()
