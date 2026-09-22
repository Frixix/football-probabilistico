import pandas as pd

class ProcesadorDatos:
    def __init__(self, df_partidos):
        self.df = df_partidos
        self.promedio_liga_local = self.df['Goles_Local'].mean()
        self.promedio_liga_visitante = self.df['Goles_Visitante'].mean()

    def obtener_promedios_liga(self):
        return {
            "goles_local": round(self.promedio_liga_local, 4),
            "goles_visitante": round(self.promedio_liga_visitante, 4)
        }

    def calcular_fuerzas_equipo(self, equipo):
        partidos_local = self.df[self.df["Local"] == equipo]
        partidos_visitante = self.df[self.df["Visitante"] == equipo]

        if partidos_local.empty and partidos_visitante.empty:
            return None

        ataque_local = partidos_local["Goles_Local"].mean() / self.promedio_liga_local
        ataque_visitante = partidos_visitante["Goles_Visitante"].mean() / self.promedio_liga_visitante
        defensa_local = partidos_local["Goles_Visitante"].mean() / self.promedio_liga_visitante
        defensa_visitante = partidos_visitante["Goles_Local"].mean() / self.promedio_liga_local

        return {
            "ataque_local": round(ataque_local, 4),
            "defensa_local": round(defensa_local, 4),
            "ataque_visitante": round(ataque_visitante, 4),
            "defensa_visitante": round(defensa_visitante, 4)
        }

    def calcular_mu_esperado(self, nombre_local, nombre_visitante):
        fuerzas_local = self.calcular_fuerzas_equipo(nombre_local)
        fuerzas_visitante = self.calcular_fuerzas_equipo(nombre_visitante)

        if not fuerzas_local or not fuerzas_visitante:
            return None # Faltan datos para alguno de los equipos

        # LA FÓRMULA MAESTRA
        mu_local = self.promedio_liga_local * fuerzas_local["ataque_local"] * fuerzas_visitante["defensa_visitante"]
        mu_visitante = self.promedio_liga_visitante * fuerzas_visitante["ataque_visitante"] * fuerzas_local["defensa_local"]

        return {
            "mu_local": round(mu_local, 4),
            "mu_visitante": round(mu_visitante, 4)
        }


# --- ZONA DE PRUEBAS ---
if __name__ == "__main__":
    datos_prueba = pd.DataFrame({
        "Local": ["Arsenal", "Man City", "Liverpool", "Chelsea", "Arsenal"],
        "Visitante": ["Chelsea", "Arsenal", "Everton", "Liverpool", "Man City"],
        "Goles_Local": [2, 3, 2, 1, 1],
        "Goles_Visitante": [1, 1, 0, 1, 2]
    })
    
    procesador = ProcesadorDatos(datos_prueba)
    
    print("--- PREDICCIÓN: ARSENAL (Local) vs CHELSEA (Visitante) ---")
    goles_esperados = procesador.calcular_mu_esperado("Arsenal", "Chelsea")
    print(f"Goles esperados Arsenal (mu_local): {goles_esperados['mu_local']}")
    print(f"Goles esperados Chelsea (mu_visitante): {goles_esperados['mu_visitante']}")