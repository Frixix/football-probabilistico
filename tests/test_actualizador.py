import pytest
from main import evaluar_acierto_mercado

def test_evaluar_acierto_1x2():
    # Gana Local
    assert evaluar_acierto_mercado("Gana Real Madrid", 2, 1, "Real Madrid", "Barcelona") is True
    assert evaluar_acierto_mercado("Gana Real Madrid", 1, 1, "Real Madrid", "Barcelona") is False
    assert evaluar_acierto_mercado("Gana Local", 3, 0, "Arsenal", "Chelsea") is True
    assert evaluar_acierto_mercado("Gana Local", 0, 1, "Arsenal", "Chelsea") is False

    # Gana Visitante
    assert evaluar_acierto_mercado("Gana Barcelona", 1, 2, "Real Madrid", "Barcelona") is True
    assert evaluar_acierto_mercado("Gana Visitante", 0, 2, "Arsenal", "Chelsea") is True

    # Empate
    assert evaluar_acierto_mercado("Empate", 1, 1, "Real Madrid", "Barcelona") is True
    assert evaluar_acierto_mercado("Empate", 2, 0, "Real Madrid", "Barcelona") is False

def test_evaluar_acierto_goles():
    # Más de 2.5
    assert evaluar_acierto_mercado("Más de 2.5 Goles", 2, 1, "Liverpool", "Everton") is True
    assert evaluar_acierto_mercado("Más de 2.5 Goles", 1, 1, "Liverpool", "Everton") is False

    # Menos de 2.5
    assert evaluar_acierto_mercado("Menos de 2.5 Goles", 1, 1, "Liverpool", "Everton") is True
    assert evaluar_acierto_mercado("Menos de 2.5 Goles", 3, 1, "Liverpool", "Everton") is False

    # Líneas 1.5 y 3.5
    assert evaluar_acierto_mercado("Más de 1.5 Goles", 2, 0, "Milan", "Inter") is True
    assert evaluar_acierto_mercado("Menos de 3.5 Goles", 2, 1, "Milan", "Inter") is True
    assert evaluar_acierto_mercado("Menos de 3.5 Goles", 3, 2, "Milan", "Inter") is False

def test_evaluar_acierto_btts():
    # Ambos Marcan: Sí
    assert evaluar_acierto_mercado("Ambos Marcan: Sí", 2, 1, "Bayern", "Dortmund") is True
    assert evaluar_acierto_mercado("Ambos Marcan: Sí", 3, 0, "Bayern", "Dortmund") is False

    # Ambos Marcan: No
    assert evaluar_acierto_mercado("Ambos Marcan: No", 3, 0, "Bayern", "Dortmund") is True
    assert evaluar_acierto_mercado("Ambos Marcan: No", 1, 1, "Bayern", "Dortmund") is False

def test_evaluar_acierto_doble_oportunidad():
    # 1X
    assert evaluar_acierto_mercado("1X (Real Madrid o Empate)", 2, 1, "Real Madrid", "Barcelona") is True
    assert evaluar_acierto_mercado("1X (Real Madrid o Empate)", 1, 1, "Real Madrid", "Barcelona") is True
    assert evaluar_acierto_mercado("1X (Real Madrid o Empate)", 0, 1, "Real Madrid", "Barcelona") is False

    # X2
    assert evaluar_acierto_mercado("X2 (Empate o Barcelona)", 1, 2, "Real Madrid", "Barcelona") is True
    assert evaluar_acierto_mercado("X2 (Empate o Barcelona)", 1, 1, "Real Madrid", "Barcelona") is True

    # 12
    assert evaluar_acierto_mercado("12 (Real Madrid o Barcelona)", 2, 1, "Real Madrid", "Barcelona") is True
    assert evaluar_acierto_mercado("12 (Real Madrid o Barcelona)", 1, 1, "Real Madrid", "Barcelona") is False
