def evaluar_resultado_1x2(probabilidades, goles_local, goles_visitante):
    """
    Compara la predicción del modelo (1X2) con el resultado real.
    """
    # 1. ¿Qué resultado predijo el modelo? (Sacamos el que tenga mayor %)
    prediccion_modelo = max(probabilidades, key=probabilidades.get)
    
    # 2. ¿Qué pasó en la realidad?
    if goles_local > goles_visitante:
        resultado_real = "1"
    elif goles_local == goles_visitante:
        resultado_real = "X"
    else:
        resultado_real = "2"
        
    # 3. ¿Acertamos? (Booleano: True o False)
    acierto = (prediccion_modelo == resultado_real)
    
    return prediccion_modelo, resultado_real, acierto