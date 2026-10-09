from src.models.poisson import poisson_probability, calcular_distribucion_goles, generar_matriz_partido, calcular_probabilidades_1x2, probabilidades_a_cuotas
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

def test_probabilidades_a_cuotas():
    probs_simuladas = {"1": 0.50, "X": 0.25, "2": 0.25}
    cuotas = probabilidades_a_cuotas(probs_simuladas)
    assert cuotas["1"] == 2.00
    assert cuotas["X"] == 4.00
    assert cuotas["2"] == 4.00

def test_dixon_coles():
    from src.models.poisson import dixon_coles_tau, generar_matriz_dixon_coles
    # Comprobar factores tau
    mu_l, mu_v, rho = 1.2, 1.0, -0.11
    # 0-0 debe tener corrección > 1
    assert dixon_coles_tau(0, 0, mu_l, mu_v, rho) > 1.0
    # 1-1 debe tener corrección > 1
    assert dixon_coles_tau(1, 1, mu_l, mu_v, rho) > 1.0
    # 1-0 y 0-1 deben tener corrección < 1
    assert dixon_coles_tau(1, 0, mu_l, mu_v, rho) < 1.0
    assert dixon_coles_tau(0, 1, mu_l, mu_v, rho) < 1.0
    # Marcadores mayores no se modifican (tau == 1.0)
    assert dixon_coles_tau(2, 1, mu_l, mu_v, rho) == 1.0
    
    # Comprobar matriz Dixon-Coles
    matriz_dc = generar_matriz_dixon_coles(mu_l, mu_v)
    assert matriz_dc.shape == (11, 11)
    assert round(float(np.sum(matriz_dc)), 4) == 1.0000

def test_criterio_kelly():
    from src.probabilities.calculations import calcular_criterio_kelly
    
    # Caso 1: Apuesta con valor positivo (+EV)
    # Probabilidad = 55% (0.55), Cuota = 2.00
    # EV = (0.55 * 2.00) - 1 = +10.0%
    # b = 2.0 - 1 = 1.0
    # Full Kelly = 0.10 / 1.0 = 10.0%
    # 1/4 Kelly = 2.5%
    res = calcular_criterio_kelly(probabilidad=0.55, cuota=2.00, fraccion=0.25)
    assert res["es_valido"] is True
    assert res["ev_pct"] == 10.0
    assert res["kelly_full_pct"] == 10.0
    assert res["kelly_frac_pct"] == 2.5
    
    # Caso 2: Apuesta sin valor esperado (EV <= 0)
    # Probabilidad = 40% (0.40), Cuota = 2.00
    # EV = (0.40 * 2.00) - 1 = -20.0%
    res_neg = calcular_criterio_kelly(probabilidad=0.40, cuota=2.00, fraccion=0.25)
    assert res_neg["es_valido"] is False
    assert res_neg["kelly_frac_pct"] == 0.0
    
    # Caso 3: Tope de seguridad (safety cap)
    # Probabilidad = 80%, Cuota = 3.00 (gran ventaja teórica)
    # EV = (0.80 * 3.0) - 1 = 1.40
    # Full Kelly = 1.40 / 2.0 = 70%
    # 1/4 Kelly bruto = 17.5% -> Debe limitarse al 5.0% máximo
    res_cap = calcular_criterio_kelly(probabilidad=0.80, cuota=3.00, fraccion=0.25, max_stake_pct=0.05)
    assert res_cap["es_valido"] is True
    assert res_cap["kelly_frac_pct"] == 5.0
    assert res_cap["tope_alcanzado"] is True
