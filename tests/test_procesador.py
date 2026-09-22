import pandas as pd
from src.data.procesador import ProcesadorDatos

def test_procesador_completo():
    # 1. Creamos una base de datos controlada
    datos_prueba = pd.DataFrame({
        "Local": ["EquipoA", "EquipoB", "EquipoA"],
        "Visitante": ["EquipoB", "EquipoA", "EquipoC"],
        "Goles_Local": [2, 3, 1], # Promedio local = 2.0
        "Goles_Visitante": [1, 1, 1] # Promedio visitante = 1.0
    })
    
    # 2. Inicializamos la clase
    procesador = ProcesadorDatos(datos_prueba)
    
    # 3. Comprobamos los promedios de la liga
    promedios = procesador.obtener_promedios_liga()
    assert promedios["goles_local"] == 2.0
    assert promedios["goles_visitante"] == 1.0
    
    # 4. Comprobamos que calcule fuerzas sin error
    fuerzas = procesador.calcular_fuerzas_equipo("EquipoA")
    assert "ataque_local" in fuerzas
    assert fuerzas["ataque_local"] == 0.75 # (1.5 promedio en casa / 2.0 de la liga)
    
    # 5. Comprobamos que calcule los mu esperados
    prediccion = procesador.calcular_mu_esperado("EquipoA", "EquipoB")
    assert "mu_local" in prediccion
    assert "mu_visitante" in prediccion
    assert prediccion["mu_local"] > 0
    