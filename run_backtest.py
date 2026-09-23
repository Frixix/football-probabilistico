import pandas as pd
from src.data.procesador import ProcesadorDatos
from src.models.poisson import generar_matriz_partido, calcular_probabilidades_1x2
from src.backtesting.engine import evaluar_resultado_1x2

def iniciar_backtest():
    print("⏳ INICIANDO LA MÁQUINA DEL TIEMPO (BACKTESTING) ⏳\n")
    
    url = "https://raw.githubusercontent.com/martj42/international_results/master/results.csv"
    print("Descargando el historial mundial...")
    df = pd.read_csv(url)
    df['date'] = pd.to_datetime(df['date'])
    
    # 1. LA REGLA DE ORO: Separar Pasado (Entrenamiento) y Futuro (Prueba)
    print("🧠 Entrenando el modelo EXCLUSIVAMENTE con datos de 2020 a 2022...")
    df_entrenamiento = df[(df['date'].dt.year >= 2020) & (df['date'].dt.year <= 2022)].copy()
    
    # Limpiamos como de costumbre
    df_entrenamiento = df_entrenamiento[['home_team', 'away_team', 'home_score', 'away_score']]
    df_entrenamiento.columns = ['Local', 'Visitante', 'Goles_Local', 'Goles_Visitante']
    procesador = ProcesadorDatos(df_entrenamiento)
    
    # 2. Viajamos a 2023
    print("🔮 Viajando a 2023 para predecir sin ver el futuro...\n")
    df_prueba = df[df['date'].dt.year == 2023].copy()
    
    aciertos = 0
    errores = 0
    partidos_evaluados = 0
    
    print("Simulando cientos de partidos... (esto puede tardar unos segundos)")
    
    for index, fila in df_prueba.iterrows():
        local = fila['home_team']
        visitante = fila['away_team']
        goles_l_real = fila['home_score']
        goles_v_real = fila['away_score']
        
        # El modelo calcula su fuerza usando SOLO la memoria de 2020 a 2022
        esperados = procesador.calcular_mu_esperado(local, visitante)
        
        # Si un equipo es tan nuevo que no jugó entre 2020 y 2022, lo ignoramos
        if not esperados:
            continue
            
        matriz = generar_matriz_partido(esperados["mu_local"], esperados["mu_visitante"])
        probabilidades = calcular_probabilidades_1x2(matriz)
        
        # ¡La hora de la verdad!
        prediccion, real, acerto = evaluar_resultado_1x2(probabilidades, goles_l_real, goles_v_real)
        
        partidos_evaluados += 1
        if acerto:
            aciertos += 1
        else:
            errores += 1
            
    # 3. Resultados Finales
    print("\n========================================")
    print("📊 RESULTADOS DEL BACKTESTING (AÑO 2023) 📊")
    print(f"Partidos evaluados: {partidos_evaluados}")
    print(f"Aciertos del modelo: {aciertos}")
    print(f"Errores del modelo:  {errores}")
    
    precision = round((aciertos / partidos_evaluados) * 100, 2)
    print(f"\n🎯 PRECISIÓN (Accuracy): {precision}%")
    print("========================================")

if __name__ == "__main__":
    iniciar_backtest()
    