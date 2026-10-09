import pytest
from src.data.gestor_estadisticas import GestorEstadisticas

def test_gestor_mu_home_away_split():
    gestor = GestorEstadisticas(api_key="fake_key")
    
    # Inyectamos datos de prueba con desglose Local vs Visita
    gestor.cache["999_2026"] = {
        "FuerteEnCasa": {
            "gf": 1.5,
            "gc": 1.0,
            "gf_home": 2.4, # Muy goleador en casa
            "gc_home": 0.5, # Muy sólido defendiendo en casa
            "gf_away": 0.6,
            "gc_away": 1.5,
            "p_home": 10,
            "p_away": 10
        },
        "DebilFuera": {
            "gf": 1.2,
            "gc": 1.1,
            "gf_home": 1.8,
            "gc_home": 0.7,
            "gf_away": 0.6, # Anota poco de visitante
            "gc_away": 1.5, # Concede mucho de visitante
            "p_home": 10,
            "p_away": 10
        }
    }
    
    mu_dict = gestor.obtener_mu_esperado(999, 2026, "FuerteEnCasa", "DebilFuera")
    assert mu_dict is not None
    assert "mu_local" in mu_dict
    assert "mu_visitante" in mu_dict
    
    # mu_local debe ser notablemente superior a mu_visitante debido al factor localía
    assert mu_dict["mu_local"] > 1.6
    assert mu_dict["mu_visitante"] < 0.9

def test_gestor_backward_compatibility():
    gestor = GestorEstadisticas(api_key="fake_key")
    
    # Inyectamos datos en formato legacy (sin desglose home/away)
    gestor.cache["888_2026"] = {
        "Equipo1": {"gf": 1.4, "gc": 1.0},
        "Equipo2": {"gf": 1.2, "gc": 1.2}
    }
    
    mu_dict = gestor.obtener_mu_esperado(888, 2026, "Equipo1", "Equipo2")
    assert mu_dict is not None
    # Con formato legacy, mu_local = (1.4 + 1.2)/2 = 1.3
    assert mu_dict["mu_local"] == 1.3
    # mu_visitante = (1.2 + 1.0)/2 = 1.1
    assert mu_dict["mu_visitante"] == 1.1

def test_gestor_equipo_no_encontrado():
    gestor = GestorEstadisticas(api_key="fake_key")
    gestor.cache["777_2026"] = {
        "EquipoExiste": {"gf": 1.0, "gc": 1.0}
    }
    mu_dict = gestor.obtener_mu_esperado(777, 2026, "EquipoExiste", "EquipoInexistente")
    assert mu_dict is None
