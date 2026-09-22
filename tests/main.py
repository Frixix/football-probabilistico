import pandas as pd
from src.data.procesador import ProcesadorDatos
from src.models.poisson import (
    generar_matriz_partido,
    calcular_probabilidades_1x2,
    probabilidades_a_cuotas
)

def simular_partido():
    print("⚽ INICIANDO EL MOTOR PROBABILÍSTICO ⚽\n")
    
    # 1. Cargamos datos históricos (Simulados por ahora)
    datos = pd.DataFrame({
        "Local": ["Arsenal", "Man City", "Liverpool", "Chelsea", "Arsenal"],
        "Visitante": ["Chelsea", "Arsenal", "Everton", "Liverpool", "Man City"],
        "Goles_Local": [2, 3, 2, 1, 1],
        "Goles_Visitante": [1, 1, 0, 1, 2]
    })
    
    # 2. Inicializamos el procesador de datos
    procesador = ProcesadorDatos(datos)
    
    # 3. Elegimos el partido a predecir
    equipo_local = "Arsenal"
    equipo_visitante = "Chelsea"
    print(f"Partidazo: {equipo_local} vs {equipo_visitante}")
    
    # 4. Calculamos los goles esperados (Mu)
    esperados = procesador.calcular_mu_esperado(equipo_local, equipo_visitante)
    mu_l = esperados["mu_local"]
    mu_v = esperados["mu_visitante"]
    print(f"Goles esperados -> {equipo_local}: {mu_l} | {equipo_visitante}: {mu_v}")
    
    # 5. Generamos la matriz de Poisson (El motor matemático)
    matriz = generar_matriz_partido(mu_l, mu_v)
    
    # 6. Extraemos el mercado 1X2 (Probabilidades)
    probabilidades = calcular_probabilidades_1x2(matriz)
    print("\n📊 PROBABILIDADES (%):")
    print(f"Gana {equipo_local} (1): {round(probabilidades['1'] * 100, 2)}%")
    print(f"Empate (X): {round(probabilidades['X'] * 100, 2)}%")
    print(f"Gana {equipo_visitante} (2): {round(probabilidades['2'] * 100, 2)}%")
    
    # 7. Convertimos a Cuotas (Para comparar con la casa de apuestas)
    cuotas = probabilidades_a_cuotas(probabilidades)
    print("\n💰 CUOTAS JUSTAS (Nuestra predicción):")
    print(f"Cuota 1: {cuotas['1']}")
    print(f"Cuota X: {cuotas['X']}")
    print(f"Cuota 2: {cuotas['2']}")

if __name__ == "__main__":
    simular_partido()
    