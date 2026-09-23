import pandas as pd
from src.data.procesador import ProcesadorDatos
from src.models.poisson import (
    generar_matriz_partido, calcular_probabilidades_1x2,
    probabilidades_a_cuotas, calcular_probabilidades_over_under, calcular_probabilidades_btts
)
from src.probabilities.calculations import calcular_probabilidad_combinada, calcular_cuota_combinada

def encontrar_mejor_apuesta(mu_l, mu_v, equipo_local, equipo_visitante, mercados_permitidos):
    """Analiza los mercados permitidos y devuelve la apuesta más segura."""
    matriz = generar_matriz_partido(mu_l, mu_v)
    opciones = []
    
    # 1. Filtro dinámico: Mercado de Ganador
    if "1x2" in mercados_permitidos:
        p_1x2 = calcular_probabilidades_1x2(matriz)
        opciones.extend([
            {"mercado": f"Gana {equipo_local}", "prob": p_1x2["1"]},
            {"mercado": "Empate", "prob": p_1x2["X"]},
            {"mercado": f"Gana {equipo_visitante}", "prob": p_1x2["2"]}
        ])
        
    # 2. Filtro dinámico: Mercado de Goles
    if "goles" in mercados_permitidos:
        p_goles = calcular_probabilidades_over_under(matriz)
        opciones.extend([
            {"mercado": "Más de 2.5 Goles", "prob": p_goles["Over"]},
            {"mercado": "Menos de 2.5 Goles", "prob": p_goles["Under"]}
        ])
        
    # 3. Filtro dinámico: Mercado Ambos Marcan
    if "btts" in mercados_permitidos:
        p_btts = calcular_probabilidades_btts(matriz)
        opciones.extend([
            {"mercado": "Ambos Marcan: Sí", "prob": p_btts["Si"]},
            {"mercado": "Ambos Marcan: No", "prob": p_btts["No"]}
        ])
    
    # Buscamos la mejor opción dentro de los mercados que sobrevivieron al filtro
    mejor_opcion = max(opciones, key=lambda x: x["prob"])
    mejor_opcion["partido"] = f"{equipo_local} vs {equipo_visitante}"
    mejor_opcion["cuota"] = round(1 / mejor_opcion["prob"], 2) if mejor_opcion["prob"] > 0 else 0
    
    return mejor_opcion

def iniciar_app():
    print("🏟️ INTERFAZ 1: CARTELERA DEL DÍA 🏟️\n")
    
    partidos_disponibles = [
        ("Brazil", "Bolivia"),
        ("Colombia", "Uruguay"),
        ("Argentina", "Chile"),
        ("Spain", "Costa Rica"),
        ("France", "Peru"),
        ("England", "Iran"),
        ("Germany", "Japan"),
        ("Ecuador", "Senegal"),
        ("Netherlands", "Qatar")
    ]
    
    # --- MENÚ 1: SELECCIÓN DE PARTIDOS ---
    print("Partidos disponibles para hoy:")
    for i, (local, visitante) in enumerate(partidos_disponibles):
        print(f"[{i}] {local} vs {visitante}")
        
    seleccion_texto = input("\nElige los partidos separados por coma (Ej: 0, 2, 4) -> ")
    
    try:
        indices = [int(num.strip()) for num in seleccion_texto.split(',')]
    except ValueError:
        print("\n❌ Error: Debes escribir números.")
        return
        
    if len(indices) < 2 or len(indices) > 8:
        print(f"\n❌ Error: Elegiste {len(indices)} partidos. Deben ser entre 2 y 8.")
        return
        
    partidos_elegidos = [partidos_disponibles[i] for i in indices if 0 <= i < len(partidos_disponibles)]
    
    # --- MENÚ 2: SELECCIÓN DE MERCADOS ---
    print("\n📊 FILTRO DE MERCADOS 📊")
    print("[1] 1X2 (Quién gana o empate)")
    print("[2] Goles (Más/Menos de 2.5)")
    print("[3] Ambos Marcan (BTTS)")
    print("[4] TODOS los mercados")
    
    mercados_texto = input("Elige los mercados separados por coma (Ej: 1, 2) -> ")
    
    # Traductor del input del usuario a nuestro código interno
    filtro_usuario = [num.strip() for num in mercados_texto.split(',')]
    mercados_permitidos = []
    
    if "4" in filtro_usuario:
        mercados_permitidos = ["1x2", "goles", "btts"]
    else:
        if "1" in filtro_usuario: mercados_permitidos.append("1x2")
        if "2" in filtro_usuario: mercados_permitidos.append("goles")
        if "3" in filtro_usuario: mercados_permitidos.append("btts")
        
    # Si el usuario metió algo raro, por defecto activamos todos
    if not mercados_permitidos:
        mercados_permitidos = ["1x2", "goles", "btts"]

    print(f"\n⚙️ Procesando {len(partidos_elegidos)} partidos con los filtros: {mercados_permitidos}...\n")
    
    # --- CARGA PESADA DE DATOS ---
    url = "https://raw.githubusercontent.com/martj42/international_results/master/results.csv"
    df = pd.read_csv(url)
    df['date'] = pd.to_datetime(df['date'])
    df_reciente = df[df['date'].dt.year >= 2020][['home_team', 'away_team', 'home_score', 'away_score']].copy()
    df_reciente.columns = ['Local', 'Visitante', 'Goles_Local', 'Goles_Visitante']
    procesador = ProcesadorDatos(df_reciente)
    
    mejores_apuestas = []
    for local, visitante in partidos_elegidos:
        esperados = procesador.calcular_mu_esperado(local, visitante)
        if esperados:
            mejor = encontrar_mejor_apuesta(esperados["mu_local"], esperados["mu_visitante"], local, visitante, mercados_permitidos)
            mejores_apuestas.append(mejor)
            
    mejores_apuestas.sort(key=lambda x: x["prob"], reverse=True)
    
    print("⭐ LA MEJOR COMBINACIÓN AUTOMÁTICA ⭐\n")
    probs, cuotas = [], []
    
    for seleccion in mejores_apuestas:
        probs.append(seleccion["prob"])
        cuotas.append(seleccion["cuota"])
        print(f"⚽ {seleccion['partido']}")
        print(f"   Mejor Mercado: {seleccion['mercado']}")
        print(f"   Probabilidad: {round(seleccion['prob']*100, 2)}% | Cuota: {seleccion['cuota']}\n")
        
    print("========================================")
    print("📈 RESUMEN DEL TICKET 📈")
    print(f"Probabilidad de acertar todo: {round(calcular_probabilidad_combinada(probs) * 100, 2)}%")
    print(f"Cuota Total a cobrar: {calcular_cuota_combinada(cuotas)}")
    print("========================================")

if __name__ == "__main__":
    iniciar_app()