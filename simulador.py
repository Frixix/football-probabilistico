from src.probabilities.calculations import calcular_probabilidad_combinada, calcular_cuota_combinada

def iniciar_simulador():
    print("🎟️ SIMULADOR DE APUESTAS COMBINADAS (PARLAYS) 🎟️\n")
    
    # Imaginemos que nuestro motor nos dio estos resultados
    ticket_apuestas = [
        {"partido": "Brasil vs Bolivia", "mercado": "Gana Brasil", "probabilidad": 0.93, "cuota": 1.07},
        {"partido": "Colombia vs Uruguay", "mercado": "Under 2.5 Goles", "probabilidad": 0.72, "cuota": 1.38},
        {"partido": "Argentina vs Chile", "mercado": "Gana Argentina", "probabilidad": 0.65, "cuota": 1.53}
    ]
    
    probabilidades_acumuladas = []
    cuotas_acumuladas = []
    
    print("Agregando selecciones al ticket...\n")
    
    for i, seleccion in enumerate(ticket_apuestas):
        # Agregamos la selección actual a nuestras listas
        probabilidades_acumuladas.append(seleccion["probabilidad"])
        cuotas_acumuladas.append(seleccion["cuota"])
        
        # Calculamos los totales hasta el momento
        prob_actual = calcular_probabilidad_combinada(probabilidades_acumuladas)
        cuota_actual = calcular_cuota_combinada(cuotas_acumuladas)
        
        # Mostramos cómo cambia todo paso a paso
        print(f"[{i+1}] + Se agregó: {seleccion['partido']} ({seleccion['mercado']})")
        print(f"    Probabilidad individual: {seleccion['probabilidad']*100}%")
        print(f"    --> PROBABILIDAD DEL TICKET: {round(prob_actual * 100, 2)}%")
        print(f"    --> CUOTA DEL TICKET: {cuota_actual}\n")

if __name__ == "__main__":
    iniciar_simulador()
    