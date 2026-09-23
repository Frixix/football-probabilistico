import pandas as pd
from src.data.procesador import ProcesadorDatos
from src.models.poisson import (
    generar_matriz_partido,
    calcular_probabilidades_1x2,
    probabilidades_a_cuotas,
    calcular_probabilidades_over_under 
)

def simular_partido_real():
    print("🌍 CONECTANDO A BASE DE DATOS DE SELECCIONES (GITHUB) 🌍\n")
    
    url_internacional = "https://raw.githubusercontent.com/martj42/international_results/master/results.csv"
    print("Descargando historial de selecciones nacionales...")
    df_global = pd.read_csv(url_internacional)
    
    print("Filtrando partidos de la era moderna (2020+)...")
    df_global['date'] = pd.to_datetime(df_global['date'])
    df_reciente = df_global[df_global['date'].dt.year >= 2020]
    
    df_limpio = df_reciente[['home_team', 'away_team', 'home_score', 'away_score']].copy()
    df_limpio.columns = ['Local', 'Visitante', 'Goles_Local', 'Goles_Visitante']
    
    procesador = ProcesadorDatos(df_limpio)
    
    equipo_local = "Brazil"
    equipo_visitante = "Bolivia"
    print(f"\n🔥 PREDICCIÓN: {equipo_local} vs {equipo_visitante} 🔥")
    
    esperados = procesador.calcular_mu_esperado(equipo_local, equipo_visitante)
    
    if esperados is None:
        print("Error: Uno de los equipos no está en la base de datos.")
        return

    mu_l = esperados["mu_local"]
    mu_v = esperados["mu_visitante"]
    print(f"Goles esperados -> {equipo_local}: {mu_l} | {equipo_visitante}: {mu_v}")
    
    # Motor Matemático y Matriz
    matriz = generar_matriz_partido(mu_l, mu_v)
    probabilidades_1x2 = calcular_probabilidades_1x2(matriz)
    cuotas_1x2 = probabilidades_a_cuotas(probabilidades_1x2)
    
    print("\n📊 MERCADO 1X2 (Ganador del partido):")
    print(f"Gana {equipo_local} (1): {round(probabilidades_1x2['1'] * 100, 2)}% -> Cuota: {cuotas_1x2['1']}")
    print(f"Empate (X): {round(probabilidades_1x2['X'] * 100, 2)}% -> Cuota: {cuotas_1x2['X']}")
    print(f"Gana {equipo_visitante} (2): {round(probabilidades_1x2['2'] * 100, 2)}% -> Cuota: {cuotas_1x2['2']}")
    
    # --- NUEVA SECCIÓN: MERCADO DE GOLES ---
    prob_goles = calcular_probabilidades_over_under(matriz, limite=2.5)
    cuotas_goles = probabilidades_a_cuotas(prob_goles)
    
    print("\n⚽ MERCADO DE GOLES (Over/Under 2.5):")
    print(f"Más de 2.5 goles (Over) : {round(prob_goles['Over'] * 100, 2)}% -> Cuota Justa: {cuotas_goles['Over']}")
    print(f"Menos de 2.5 goles (Under): {round(prob_goles['Under'] * 100, 2)}% -> Cuota Justa: {cuotas_goles['Under']}")

if __name__ == "__main__":
    simular_partido_real()