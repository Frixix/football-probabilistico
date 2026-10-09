from scipy.stats import poisson
import numpy as np

def poisson_probability(mu, k):
    return poisson.pmf(k, mu)

def calcular_distribucion_goles(mu, max_goles=10):
    # 1. Preparamos una lista vacía para guardar nuestros resultados
    distribucion = []
    
    # 2. Hacemos un bucle desde el 0 hasta el max_goles
    for k in range(max_goles + 1):
        # 3. Calculamos la probabilidad para ese 'k' específico
        prob = poisson_probability(mu, k)
        
        # 4. Agregamos el resultado a nuestra lista
        distribucion.append(prob)
        
    # 5. Devolvemos la lista completa
    return distribucion

def dixon_coles_tau(x, y, mu_local, mu_visitante, rho=-0.11):
    """
    Función tau de corrección de Dixon y Coles (1997).
    Ajusta la correlación entre goles para marcadores bajos (0-0, 1-0, 0-1, 1-1),
    elevando la precisión empírica de empates y marcadores cerrados.
    """
    if x == 0 and y == 0:
        return 1.0 - (mu_local * mu_visitante * rho)
    elif x == 0 and y == 1:
        return 1.0 + (mu_local * rho)
    elif x == 1 and y == 0:
        return 1.0 + (mu_visitante * rho)
    elif x == 1 and y == 1:
        return 1.0 - rho
    else:
        return 1.0

def generar_matriz_partido(mu_local, mu_visitante, max_goles=10, ajustar_dixon_coles=False, rho=-0.11):
    # 1. Calculamos las probabilidades individuales de cada equipo
    dist_local = calcular_distribucion_goles(mu_local, max_goles)
    dist_visitante = calcular_distribucion_goles(mu_visitante, max_goles)
    
    # 2. Le pedimos a numpy que cree una matriz llena de ceros (ahora 11x11)
    dimension = max_goles + 1
    matriz = np.zeros((dimension, dimension))
    
    # 3. Cruzamos las filas (Local) con las columnas (Visitante)
    for goles_local in range(dimension):
        for goles_visitante in range(dimension):
            prob = dist_local[goles_local] * dist_visitante[goles_visitante]
            if ajustar_dixon_coles:
                tau = dixon_coles_tau(goles_local, goles_visitante, mu_local, mu_visitante, rho)
                prob = prob * tau
            matriz[goles_local][goles_visitante] = max(0.0, prob)
            
    # Si se aplica Dixon-Coles, normalizamos para que la probabilidad total sume exactamente 1.0
    if ajustar_dixon_coles:
        suma_total = np.sum(matriz)
        if suma_total > 0:
            matriz = matriz / suma_total

    # 4. Devolvemos la matriz completa
    return matriz

def generar_matriz_dixon_coles(mu_local, mu_visitante, max_goles=10, rho=-0.11):
    """
    Genera la matriz de probabilidades aplicando el modelo Dixon-Coles calibrado.
    """
    return generar_matriz_partido(mu_local, mu_visitante, max_goles=max_goles, ajustar_dixon_coles=True, rho=rho)

def calcular_probabilidades_1x2(matriz):
    # 1. Empate (X): Sumamos la diagonal principal
    prob_empate = np.sum(np.diag(matriz))
    
    # 2. Local (1): Sumamos el triángulo inferior (excluyendo la diagonal con k=-1)
    prob_local = np.sum(np.tril(matriz, -1))
    
    # 3. Visitante (2): Sumamos el triángulo superior (excluyendo la diagonal con k=1)
    prob_visitante = np.sum(np.triu(matriz, 1))
    
    # Devolvemos un diccionario con los 3 resultados para que sea fácil de leer
    return {
        "1": prob_local,
        "X": prob_empate,
        "2": prob_visitante
    }

def probabilidades_a_cuotas(diccionario_probabilidades):
    # Creamos un nuevo diccionario para guardar las cuotas
    cuotas = {}
    
    # Recorremos el diccionario de probabilidades (puede ser 1X2 o Over/Under)
    for llave, prob in diccionario_probabilidades.items():
        # Evitamos dividir por cero por seguridad matemática
        if prob > 0:
            # Fórmula: 1 / probabilidad, redondeado a 2 decimales
            cuotas[llave] = round(1 / prob, 2)
        else:
            cuotas[llave] = 0.0
            
    return cuotas

def calcular_probabilidades_over_under(matriz, limite=2.5):
    """
    Suma las probabilidades de la matriz para calcular el mercado Over/Under.
    La matriz debe ser una lista de listas o un array 2D.
    """
    prob_under = 0.0
    prob_over = 0.0
    
    # Recorremos todas las combinaciones posibles de goles (de 0 a 10 goles)
    for goles_local in range(len(matriz)):
        for goles_visitante in range(len(matriz[0])):
            probabilidad = matriz[goles_local][goles_visitante]
            
            # Si la suma de goles es menor al límite (ej. 2.5), es Under
            if (goles_local + goles_visitante) < limite:
                prob_under += probabilidad
            else:
                prob_over += probabilidad
                
    return {
        "Over": prob_over,
        "Under": prob_under
    }

def calcular_probabilidades_btts(matriz):
    """
    Calcula el mercado BTTS (Both Teams To Score / Ambos Equipos Marcan).
    """
    prob_si = 0.0
    prob_no = 0.0
    
    # Recorremos la matriz
    for goles_local in range(len(matriz)):
        for goles_visitante in range(len(matriz[0])):
            probabilidad = matriz[goles_local][goles_visitante]
            
            # Si ambos equipos marcaron 1 o más goles
            if goles_local > 0 and goles_visitante > 0:
                prob_si += probabilidad
            else:
                prob_no += probabilidad
                
    return {
        "Si": prob_si,
        "No": prob_no
    }

def calcular_probabilidades_doble_oportunidad(matriz):
    """
    Calcula el mercado de Doble Oportunidad a partir de la matriz de Dixon-Coles / Poisson:
    - 1X: Local o Empate (prob_local + prob_empate)
    - X2: Empate o Visitante (prob_empate + prob_visitante)
    - 12: Local o Visitante (sin empate, prob_local + prob_visitante)
    """
    p_1x2 = calcular_probabilidades_1x2(matriz)
    p_1 = p_1x2["1"]
    p_x = p_1x2["X"]
    p_2 = p_1x2["2"]
    
    return {
        "1X": p_1 + p_x,
        "X2": p_x + p_2,
        "12": p_1 + p_2
    }

def calcular_lineas_goles(matriz, limites=[1.5, 2.5, 3.5]):
    """
    Calcula las probabilidades analíticas de Over y Under para múltiples líneas de gol (1.5, 2.5, 3.5).
    """
    lineas = {}
    for lim in limites:
        lineas[str(lim)] = calcular_probabilidades_over_under(matriz, limite=lim)
    return lineas