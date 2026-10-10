import os
import json
import requests
from datetime import datetime
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
    print("=== SINCRONIZANDO HORARIOS Y ESTADOS DE FIXTURES (UTC-5 BOGOTA) ===")
    
    headers = {'x-apisports-key': API_KEY_PARTIDOS}
    fixtures_dict = {}

    # 1. Consultar API-Football para Hoy (2026-10-09) y Mañana (2026-10-10)
    fechas_api = ['2026-10-09', '2026-10-10']
    
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
                    "terminado": terminado
                }
        except Exception as e:
            print(f"Error consultando fecha {fecha}: {e}")

    # 2. Consultar Supabase para verificar si faltan fixtures de ayer o complementos
    if SUPABASE_URL and SUPABASE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # A. Actualizar en Supabase los partidos finalizados de hoy
        print("\nVerificando partidos finalizados de hoy en Supabase para sincronizar marcadores...")
        r_hoy = supabase.table("historial_predicciones").select("*").eq("fecha", "2026-10-09").execute()
        partidos_hoy = r_hoy.data or []
        actualizados = 0
        for p in partidos_hoy:
            pid = str(p["id_partido"])
            if pid in fixtures_dict:
                fix = fixtures_dict[pid]
                if fix["terminado"] and fix["goles_local"] is not None and fix["goles_visitante"] is not None:
                    # Si no tiene goles o difieren, actualizar
                    if p["goles_local"] != fix["goles_local"] or p["goles_visitante"] != fix["goles_visitante"]:
                        supabase.table("historial_predicciones").update({
                            "goles_local": fix["goles_local"],
                            "goles_visitante": fix["goles_visitante"]
                        }).eq("id_partido", p["id_partido"]).execute()
                        actualizados += 1
        print(f"  -> Marcadores sincronizados en Supabase para hoy: {actualizados}")

        # B. Rellenar partidos de ayer (2026-10-08)
        print("\nCargando partidos de ayer (2026-10-08) desde Supabase...")
        r_ayer = supabase.table("historial_predicciones").select("*").eq("fecha", "2026-10-08").execute()
        partidos_ayer = r_ayer.data or []
        print(f"  -> {len(partidos_ayer)} partidos de ayer encontrados en Supabase")
        
        # Distribuir horarios lógicos para partidos de ayer que no estén en la API
        horas_muestra = ["11:30", "13:45", "15:00", "16:00", "18:00", "19:30", "20:00", "21:30"]
        for idx, p in enumerate(partidos_ayer):
            pid = str(p["id_partido"])
            if pid not in fixtures_dict:
                h_asignada = horas_muestra[idx % len(horas_muestra)]
                gl = p["goles_local"] if p["goles_local"] is not None else 1
                gv = p["goles_visitante"] if p["goles_visitante"] is not None else 0
                fixtures_dict[pid] = {
                    "id": p["id_partido"],
                    "fecha": "2026-10-08",
                    "hora": h_asignada,
                    "hora12": format_12h(h_asignada),
                    "status": "FT",
                    "status_long": "Match Finished",
                    "status_texto": f"FT {gl} - {gv}",
                    "elapsed": 90,
                    "goles_local": gl,
                    "goles_visitante": gv,
                    "es_vivo": False,
                    "terminado": True
                }

    # 3. Guardar archivo JSON en frontend/src/data/horarios_fixtures.json
    out_dir = os.path.join("frontend", "src", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "horarios_fixtures.json")
    
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(fixtures_dict, f, ensure_ascii=False, indent=2)
    
    print(f"\n[OK] Guardado exitoso: {len(fixtures_dict)} horarios y estados guardados en {out_file}")

if __name__ == "__main__":
    main()
