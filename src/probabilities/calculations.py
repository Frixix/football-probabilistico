def calcular_probabilidad_combinada(lista_probabilidades):
    """
    Calcula la probabilidad de que ocurran múltiples eventos independientes.
    Recibe una lista de probabilidades en formato decimal (ej: [0.50, 0.80, 0.33]).
    """
    if not lista_probabilidades:
        return 0.0
        
    prob_total = 1.0
    for prob in lista_probabilidades:
        prob_total *= prob  # Multiplicamos la probabilidad actual por la acumulada
        
    return prob_total

def calcular_cuota_combinada(lista_cuotas):
    """
    Calcula la cuota final de una apuesta combinada (parlay).
    """
    if not lista_cuotas:
        return 0.0
        
    cuota_total = 1.0
    for cuota in lista_cuotas:
        cuota_total *= cuota
        
    return round(cuota_total, 2)
