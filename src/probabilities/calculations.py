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

def calcular_criterio_kelly(probabilidad: float, cuota: float, fraccion: float = 0.25, max_stake_pct: float = 0.05) -> dict:
    """
    Calcula el porcentaje de bankroll óptimo según el Criterio de Kelly Fraccional.
    
    Fórmula de Kelly:
      f* = (b * p - q) / b = (o * p - 1) / (o - 1) = EV_decimal / (cuota - 1)
      f_frac = fraccion * f*
      
    Parámetros:
    - probabilidad: Probabilidad estimada (0.0 a 1.0)
    - cuota: Cuota decimal del mercado (debe ser > 1.0)
    - fraccion: Factor fraccional (0.25 = 1/4 Kelly, recomendado)
    - max_stake_pct: Límite de seguridad máximo por apuesta (default 0.05 = 5.0%)
    
    Retorna:
    dict con ev_pct, kelly_full_pct, kelly_frac_pct, es_valido
    """
    p = probabilidad / 100.0 if probabilidad > 1.0 else float(probabilidad)
    o = float(cuota)
    
    if p <= 0.0 or p >= 1.0 or o <= 1.0:
        return {
            "ev_pct": 0.0,
            "kelly_full_pct": 0.0,
            "kelly_frac_pct": 0.0,
            "es_valido": False
        }
        
    ev_decimal = (p * o) - 1.0
    ev_pct = round(ev_decimal * 100.0, 2)
    
    if ev_decimal <= 0:
        return {
            "ev_pct": ev_pct,
            "kelly_full_pct": 0.0,
            "kelly_frac_pct": 0.0,
            "es_valido": False
        }
        
    b = o - 1.0
    f_full = ev_decimal / b
    f_frac_bruto = f_full * fraccion
    f_frac_seguro = min(f_frac_bruto, max_stake_pct)
    
    return {
        "ev_pct": ev_pct,
        "kelly_full_pct": round(f_full * 100.0, 2),
        "kelly_frac_pct": round(f_frac_seguro * 100.0, 2),
        "es_valido": True,
        "tope_alcanzado": f_frac_bruto > max_stake_pct
    }

