import pandas as pd
from src.data.procesador import ProcesadorDatos
from src.models.poisson import (
    generar_matriz_partido,
    calcular_probabilidades_1x2,
    probabilidades_a_cuotas
)

def simular_partido_real():
    print("🌍 CONECTANDO A BASE DE DATOS DE SELECCIONES (GITHUB) 🌍\n")
    
    # 1. URL cruda de GitHub (Resultados internacionales, 100% estable)
    url_internacional = "https://raw.githubusercontent.com/martj42/international_results/master/results.csv"
    print("Descargando historial de selecciones nacionales...")
    df_global = pd.read_csv(url_internacional)
    
    # 2. Filtramos para usar solo fútbol moderno (desde el año 2020)
    print("Filtrando partidos de la era moderna (2020+)...")
    df_global['date'] = pd.to_datetime(df_global['date'])
    df_reciente = df_global[df_global['date'].dt.year >= 2020]
    
    # 3. Traducimos las columnas al idioma de nuestro procesador
    df_limpio = df_reciente[['home_team', 'away_team', 'home_score', 'away_score']].copy()
    df_limpio.columns = ['Local', 'Visitante', 'Goles_Local', 'Goles_Visitante']
    
    # 4. Inicializamos nuestro procesador
    procesador = ProcesadorDatos(df_limpio)
    
    promedios = procesador.obtener_promedios_liga()
    print(f"\nPromedio Goles Local: {promedios['goles_local']} | Visitante: {promedios['goles_visitante']}\n")
    
    # 5. Elegimos un clásico sudamericano
    equipo_local = "Colombia"
    equipo_visitante = "Argentina"
    print(f"🔥 PREDICCIÓN: {equipo_local} vs {equipo_visitante} 🔥")
    
    # 6. Calculamos los goles esperados (Mu)
    esperados = procesador.calcular_mu_esperado(equipo_local, equipo_visitante)
    
    if esperados is None:
        print("Error: Uno de los equipos no está en la base de datos. Verifica el nombre en inglés.")
        return

    mu_l = esperados["mu_local"]
    mu_v = esperados["mu_visitante"]
    print(f"Goles esperados -> {equipo_local}: {mu_l} | {equipo_visitante}: {mu_v}")
    
    # 7. Motor Matemático y Resultados
    matriz = generar_matriz_partido(mu_l, mu_v)
    probabilidades = calcular_probabilidades_1x2(matriz)
    
    print("\n📊 PROBABILIDADES REALES (%):")
    print(f"Gana {equipo_local} (1): {round(probabilidades['1'] * 100, 2)}%")
    print(f"Empate (X): {round(probabilidades['X'] * 100, 2)}%")
    print(f"Gana {equipo_visitante} (2): {round(probabilidades['2'] * 100, 2)}%")
    
    cuotas = probabilidades_a_cuotas(probabilidades)
    print("\n💰 CUOTAS JUSTAS:")
    print(f"Cuota 1: {cuotas['1']}")
    print(f"Cuota X: {cuotas['X']}")
    print(f"Cuota 2: {cuotas['2']}")

if __name__ == "__main__":
    simular_partido_real()