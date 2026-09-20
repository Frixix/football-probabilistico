from scipy.stats import poisson
import numpy as np

def poisson_probability(mu, k):
    return poisson.pmf(k, mu)

def calcular_distribucion_goles(mu, max_goles=5):
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


def generar_matriz_partido(mu_local, mu_visitante, max_goles=5):
    # 1. Calculamos las probabilidades individuales de cada equipo
    dist_local = calcular_distribucion_goles(mu_local, max_goles)
    dist_visitante = calcular_distribucion_goles(mu_visitante, max_goles)
    
    # 2. Le pedimos a numpy que cree una matriz llena de ceros (6 filas x 6 columnas)
    dimension = max_goles + 1
    matriz = np.zeros((dimension, dimension))
    
    # 3. Cruzamos las filas (Local) con las columnas (Visitante)
    for goles_local in range(dimension):
        for goles_visitante in range(dimension):
            # La magia matemática: multiplicamos las probabilidades independientes
            matriz[goles_local][goles_visitante] = dist_local[goles_local] * dist_visitante[goles_visitante]
            
    # 4. Devolvemos la matriz completa
    return matriz

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