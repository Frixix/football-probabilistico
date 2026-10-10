import pytest

def evaluar_acierto_mercado(mercado_texto, gl, gv, local='', visitante=''):
    if gl is None or gv is None:
        return 'pendiente'
    
    pred = (mercado_texto or '').lower().strip()
    local_l = (local or '').lower().strip()
    vis_l = (visitante or '').lower().strip()
    suma = gl + gv

    ok = False
    # 1. Doble Oportunidad
    if pred.startswith('1x') or 'local o empate' in pred or 'o empate' in pred:
        ok = gl >= gv
    elif pred.startswith('x2') or 'empate o' in pred:
        ok = gv >= gl
    elif pred.startswith('12') or 'local o visitante' in pred or (' o ' in pred and 'empate' not in pred):
        ok = gl != gv
    # 2. 1X2 Ganador Directo / Empate
    elif 'empate' in pred:
        ok = gl == gv
    elif 'gana' in pred:
        if local_l and local_l in pred:
            ok = gl > gv
        elif vis_l and vis_l in pred:
            ok = gv > gl
        elif 'local' in pred or pred.startswith('1'):
            ok = gl > gv
        elif 'visitante' in pred or pred.startswith('2'):
            ok = gv > gl
    # 3. Líneas de Goles (+/- 0.5, 1.5, 2.5, 3.5)
    elif 'más de 0.5' in pred or 'mas de 0.5' in pred or '+0.5' in pred:
        ok = suma > 0.5
    elif 'menos de 0.5' in pred or '-0.5' in pred:
        ok = suma < 0.5
    elif 'más de 1.5' in pred or 'mas de 1.5' in pred or '+1.5' in pred:
        ok = suma > 1.5
    elif 'menos de 1.5' in pred or '-1.5' in pred:
        ok = suma < 1.5
    elif 'más de 2.5' in pred or 'mas de 2.5' in pred or '+2.5' in pred:
        ok = suma > 2.5
    elif 'menos de 2.5' in pred or '-2.5' in pred:
        ok = suma < 2.5
    elif 'más de 3.5' in pred or 'mas de 3.5' in pred or '+3.5' in pred:
        ok = suma > 3.5
    elif 'menos de 3.5' in pred or '-3.5' in pred:
        ok = suma < 3.5
    # 4. Ambos Marcan (BTTS)
    elif 'marcan: sí' in pred or 'marcan: si' in pred or 'btts sí' in pred or 'btts si' in pred:
        ok = gl > 0 and gv > 0
    elif 'marcan: no' in pred or 'btts no' in pred:
        ok = gl == 0 or gv == 0

    return 'acertado' if ok else 'fallado'

def test_alianza_aguilas_doble_oportunidad():
    # El caso exacto reportado por el usuario: Alianza Valledupar vs Águilas Doradas (2-2)
    res = evaluar_acierto_mercado("X2 (Empate o Águilas Doradas)", 2, 2, "Alianza Valledupar", "Águilas Doradas")
    assert res == 'acertado'

def test_doble_oportunidad_todas_las_variantes():
    # 1X
    assert evaluar_acierto_mercado("1X (Alianza Valledupar o Empate)", 2, 2, "Alianza Valledupar", "Águilas Doradas") == 'acertado'
    assert evaluar_acierto_mercado("1X (Alianza Valledupar o Empate)", 1, 0, "Alianza Valledupar", "Águilas Doradas") == 'acertado'
    assert evaluar_acierto_mercado("1X (Alianza Valledupar o Empate)", 0, 1, "Alianza Valledupar", "Águilas Doradas") == 'fallado'

    # X2
    assert evaluar_acierto_mercado("X2 (Empate o Águilas Doradas)", 0, 1, "Alianza Valledupar", "Águilas Doradas") == 'acertado'
    assert evaluar_acierto_mercado("X2 (Empate o Águilas Doradas)", 2, 1, "Alianza Valledupar", "Águilas Doradas") == 'fallado'

    # 12
    assert evaluar_acierto_mercado("12 (Alianza Valledupar o Águilas Doradas)", 2, 2, "Alianza Valledupar", "Águilas Doradas") == 'fallado'
    assert evaluar_acierto_mercado("12 (Alianza Valledupar o Águilas Doradas)", 1, 0, "Alianza Valledupar", "Águilas Doradas") == 'acertado'
    assert evaluar_acierto_mercado("12 (Alianza Valledupar o Águilas Doradas)", 0, 1, "Alianza Valledupar", "Águilas Doradas") == 'acertado'

def test_mercados_adicionales():
    # Empate directo
    assert evaluar_acierto_mercado("Empate", 2, 2) == 'acertado'
    assert evaluar_acierto_mercado("Empate", 1, 0) == 'fallado'

    # Over / Under
    assert evaluar_acierto_mercado("Menos de 2.5 Goles", 2, 2) == 'fallado'
    assert evaluar_acierto_mercado("Más de 2.5 Goles", 2, 2) == 'acertado'

    # BTTS
    assert evaluar_acierto_mercado("Ambos Marcan: Sí", 2, 2) == 'acertado'
    assert evaluar_acierto_mercado("Ambos Marcan: No", 2, 2) == 'fallado'
    assert evaluar_acierto_mercado("Ambos Marcan: No", 1, 0) == 'acertado'
