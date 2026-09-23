import pandas as pd
from src.data.procesador import ProcesadorDatos
from src.models.poisson import (
    generar_matriz_partido, calcular_probabilidades_1x2,
    probabilidades_a_cuotas, calcular_probabilidades_over_under, calcular_probabilidades_btts
)
from src.probabilities.calculations import calcular_probabilidad_combinada, calcular_cuota_combinada

def analizar_mercados_partido(mu_l, mu_v, equipo_local, equipo_visitante, mercados_permitidos):
    matriz = generar_matriz_partido(mu_l, mu_v)
    opciones = []
    
    if "1x2" in mercados_permitidos:
        p_1x2 = calcular_probabilidades_1x2(matriz)
        opciones.extend([
            {"mercado": f"Gana {equipo_local}", "prob": p_1x2["1"]},
            {"mercado": "Empate", "prob": p_1x2["X"]},
            {"mercado": f"Gana {equipo_visitante}", "prob": p_1x2["2"]}
        ])
        
    if "goles" in mercados_permitidos:
        p_goles = calcular_probabilidades_over_under(matriz)
        opciones.extend([
            {"mercado": "Más de 2.5 Goles", "prob": p_goles["Over"]},
            {"mercado": "Menos de 2.5 Goles", "prob": p_goles["Under"]}
        ])
        
    if "btts" in mercados_permitidos:
        p_btts = calcular_probabilidades_btts(matriz)
        opciones.extend([
            {"mercado": "Ambos Marcan: Sí", "prob": p_btts["Si"]},
            {"mercado": "Ambos Marcan: No", "prob": p_btts["No"]}
        ])
    
    for opt in opciones:
        opt["partido"] = f"{equipo_local} vs {equipo_visitante}"
        opt["cuota"] = round(1 / opt["prob"], 2) if opt["prob"] > 0 else 0
        
    opciones.sort(key=lambda x: x["prob"], reverse=True)
    return opciones

def iniciar_app():
    print("🏟️ INTERFAZ 1: CARTELERA DEL DÍA 🏟️\n")
    
    partidos_disponibles = [
        ("Netherlands", "Germany"),
        ("Portugal", "Wales"),
        ("Italy", "Belgium"),
        ("Turkey", "France"),
        ("England", "Spain"),
        ("Sweden", "Romania"),
        ("Norway", "Denmark")
    ]
    
    # --- MENÚ 1 ---
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
    
    # --- MENÚ 2 ---
    print("\n📊 FILTRO DE MERCADOS 📊")
    print("[1] 1X2 (Quién gana o empate)")
    print("[2] Goles (Más/Menos de 2.5)")
    print("[3] Ambos Marcan (BTTS)")
    print("[4] TODOS los mercados")
    
    mercados_texto = input("Elige los mercados separados por coma (Ej: 1, 2) -> ")
    filtro_usuario = [num.strip() for num in mercados_texto.split(',')]
    mercados_permitidos = []
    
    if "4" in filtro_usuario:
        mercados_permitidos = ["1x2", "goles", "btts"]
    else:
        if "1" in filtro_usuario: mercados_permitidos.append("1x2")
        if "2" in filtro_usuario: mercados_permitidos.append("goles")
        if "3" in filtro_usuario: mercados_permitidos.append("btts")
        
    if not mercados_permitidos: mercados_permitidos = ["1x2", "goles", "btts"]

    # --- MENÚ 3: MODO DE VISUALIZACIÓN ---
    print("\n👀 VISUALIZACIÓN 👀")
    respuesta_tabla = input("¿Deseas ver la tabla analítica detallada de cada partido? (s/n) -> ").strip().lower()
    mostrar_tabla = (respuesta_tabla == 's')

    print(f"\n⚙️ Procesando combinada...\n")
    
    url = "https://raw.githubusercontent.com/martj42/international_results/master/results.csv"
    df = pd.read_csv(url)
    df['date'] = pd.to_datetime(df['date'])
    df_reciente = df[df['date'].dt.year >= 2020][['home_team', 'away_team', 'home_score', 'away_score']].copy()
    df_reciente.columns = ['Local', 'Visitante', 'Goles_Local', 'Goles_Visitante']
    procesador = ProcesadorDatos(df_reciente)
    
    mejores_apuestas_ticket = []
    
    if mostrar_tabla:
        print("🔍 TABLA ANALÍTICA POR PARTIDO 🔍\n")
        
    for local, visitante in partidos_elegidos:
        esperados = procesador.calcular_mu_esperado(local, visitante)
        if esperados:
            opciones_partido = analizar_mercados_partido(
                esperados["mu_local"], esperados["mu_visitante"], 
                local, visitante, mercados_permitidos
            )
            
            if mostrar_tabla:
                print(f"⚽ {local} vs {visitante}")
                for opt in opciones_partido:
                    print(f"   - {opt['mercado']:<22} | Prob: {round(opt['prob']*100, 2):>5}% | Cuota: {opt['cuota']:>5}")
                print("-" * 55)
            
            if opciones_partido:
                mejores_apuestas_ticket.append(opciones_partido[0])
            
    print("\n⭐ TICKET AUTOMÁTICO (Las opciones más seguras) ⭐\n")
    probs, cuotas = [], []
    
    for seleccion in mejores_apuestas_ticket:
        probs.append(seleccion["prob"])
        cuotas.append(seleccion["cuota"])
        print(f"✅ {seleccion['partido']} -> {seleccion['mercado']}")
        
    # --- CÁLCULOS FINALES Y SEMÁFORO ---
    prob_final = calcular_probabilidad_combinada(probs)
    cuota_final = calcular_cuota_combinada(cuotas)
    
    print("========================================")
    print("📈 RESUMEN DEL TICKET 📈")
    print(f"Probabilidad de acertar todo: {round(prob_final * 100, 2)}%")
    print(f"Cuota Total a cobrar: {cuota_final}")
    
    print("\n🚦 SEMÁFORO ESTADÍSTICO 🚦")
    if prob_final > 0.40:
        print("🟢 SEGURO: Riesgo controlado. Matemáticamente viable a largo plazo.")
    elif prob_final >= 0.15:
        print("🟡 ALERTA: Efecto dado en curso. Estás dependiendo de múltiples variables.")
    else:
        print("🔴 PELIGRO: Ticket lotería. La matemática está completamente en tu contra.")
    print("========================================")

if __name__ == "__main__":
    iniciar_app()