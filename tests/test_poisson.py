from src.models.poisson import poisson_probability, calcular_distribucion_goles, generar_matriz_partido, calcular_probabilidades_1x2
import numpy as np

def test_poisson_probability():
    # Escenario: Promedio esperado (mu) = 1.8, Goles exactos (k) = 2
    prob = poisson_probability(mu=1.8, k=2)
    
    # Redondeamos el resultado a 5 decimales y afirmamos (assert) que debe ser 0.26778
    assert round(prob, 5) == 0.26778


def test_calcular_distribucion_goles():
    # Calculamos la distribución para un equipo que marca 1.5 goles en promedio
    distribucion = calcular_distribucion_goles(mu=1.5, max_goles=5)
    
    # 1. Comprobamos que la lista tenga 6 elementos (0, 1, 2, 3, 4 y 5 goles)
    assert len(distribucion) == 6
    
    # 2. Comprobamos que el primer elemento (0 goles) sea correcto
    # Para mu=1.5, P(0) debería ser aprox 0.22313
    assert round(distribucion[0], 5) == 0.22313
    
    # 3. Comprobamos que la suma de todas las probabilidades sea casi 1.0 (100%)
    # OJO: No será exactamente 1.0 porque cortamos en 5 goles, 
    # pero debe ser mayor al 0.99 (99%)
    suma_total = sum(distribucion)
    assert suma_total > 0.99


def test_generar_matriz_partido():
    # Simulamos: Local marca 1.5 en promedio, Visitante marca 1.2
    matriz = generar_matriz_partido(mu_local=1.5, mu_visitante=1.2, max_goles=5)
    
    # 1. Comprobamos la forma de la matriz: debe ser de 6x6
    assert matriz.shape == (6, 6)
    
    # 2. Comprobamos la suma total de la matriz
    # La suma de TODAS las probabilidades cruzadas debe ser casi 1.0 (100%)
    suma_matriz = np.sum(matriz)
    assert suma_matriz > 0.98  # Mayor al 98% de probabilidad cubierta
    
    # 3. Comprobamos una celda específica: El 0-0
    # Prob 0 local (aprox 0.22313) * Prob 0 vis (aprox 0.30119) = aprox 0.0672
    assert round(matriz[0][0], 4) == 0.0672

def test_calcular_probabilidades_1x2():
    # Usamos la misma matriz simulada de antes
    matriz = generar_matriz_partido(mu_local=1.5, mu_visitante=1.2, max_goles=5)
    
    # Calculamos el mercado 1X2
    mercado = calcular_probabilidades_1x2(matriz)
    
    # 1. Comprobamos que existan las 3 llaves (1, X, 2)
    assert "1" in mercado
    assert "X" in mercado
    assert "2" in mercado
    
    # 2. Comprobamos que la suma de 1, X y 2 sea la misma suma total de la matriz
    # (No debe perderse ni inventarse probabilidad en el proceso)
    suma_1x2 = mercado["1"] + mercado["X"] + mercado["2"]
    suma_matriz = np.sum(matriz)
    
    # Comparamos redondeando a 5 decimales para evitar problemas de precisión de la computadora
    assert round(suma_1x2, 5) == round(suma_matriz, 5)