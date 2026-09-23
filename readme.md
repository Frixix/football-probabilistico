Markdown
# Football Probabilístico

Sistema de análisis probabilístico de fútbol que combina estadística, programación, análisis de datos, Machine Learning y backtesting para estimar probabilidades de eventos futbolísticos y compararlas con las probabilidades implícitas del mercado.

El objetivo no es crear una aplicación que simplemente diga qué apostar, sino construir un sistema capaz de responder:

> ¿Qué probabilidad estima nuestro modelo, qué tan confiable es esa estimación y cómo se comportó históricamente?

---

# 1. Objetivos del proyecto

El sistema deberá evolucionar progresivamente hasta permitir:

1. Recopilar y procesar datos históricos de fútbol.
2. Analizar el rendimiento de equipos.
3. Construir modelos estadísticos.
4. Estimar probabilidades de diferentes eventos.
5. Comparar las probabilidades del modelo con las probabilidades implícitas del mercado.
6. Calcular valor esperado (EV).
7. Realizar backtesting histórico.
8. Evaluar la calidad y calibración de los modelos.
9. Incorporar Machine Learning posteriormente.
10. Exponer los resultados mediante una API.
11. Construir una interfaz web utilizando JavaScript y React.
12. Mantener una arquitectura modular, testeable y escalable.

---

# 2. Filosofía del proyecto

Este proyecto tiene dos objetivos simultáneos.

## 2.1 Construir software real

El resultado final debe ser un sistema funcional de análisis futbolístico con:

* Código organizado.
* Arquitectura modular.
* Pruebas automatizadas.
* Modelos reproducibles.
* Datos procesados correctamente.
* Backtesting.
* API.
* Interfaz web.

## 2.2 Aprender mientras se construye

El proyecto también será utilizado para fortalecer conocimientos de:

* Python.
* Programación orientada a objetos.
* Estadística.
* Probabilidad.
* Análisis de datos.
* JavaScript.
* React.
* APIs.
* Bases de datos.
* Machine Learning.

## Regla fundamental

La IA puede acelerar el desarrollo, pero no debe sustituir el aprendizaje.

No se debe introducir código complejo que el desarrollador no pueda explicar.

Cuando aparezca una tecnología, función, patrón o concepto desconocido, primero debe explicarse y comprenderse antes de utilizarlo.

---

# 3. Metodología de aprendizaje

El desarrollo deberá seguir esta metodología:

```text
PROBLEMA
   |
   v
EXPLICACIÓN
   |
   v
INTENTO DEL DESARROLLADOR
   |
   v
PISTA O CORRECCIÓN
   |
   v
IMPLEMENTACIÓN
   |
   v
PRUEBAS
   |
   v
REVISIÓN
La IA puede actuar como:

Tutor.

Revisor de código.

Pair programmer.

Investigador.

Ayuda para debugging.

Generador de ejercicios.

Analista de arquitectura.

Pero no debe convertirse en una herramienta para copiar y pegar código desconocido.

Cuando sea posible, el desarrollador deberá intentar resolver primero los problemas antes de recibir la solución completa.

4. Tecnologías principales
4.1 Python
Python será el lenguaje principal del motor estadístico y de análisis.

Se utilizará para:

Procesamiento de datos.

Estadística.

Probabilidad.

Modelos predictivos.

Backtesting.

Métricas.

Automatización.

APIs.

Tecnologías iniciales:

Python 3.12+

NumPy

Pandas

SciPy

Statsmodels

Pytest

Tecnologías posteriores:

Scikit-learn.

XGBoost.

LightGBM.

5. JavaScript
JavaScript será utilizado como base para el desarrollo frontend.

Antes de profundizar en React se deberán reforzar los siguientes conceptos:

Variables.

Tipos de datos.

Funciones.

Arrays.

Objetos.

Métodos de arrays.

map().

filter().

reduce().

Destructuring.

Módulos.

JSON.

Promises.

async/await.

Consumo de APIs.

Manejo de eventos.

Manipulación de datos.

Los ejercicios de JavaScript deberán estar relacionados, cuando sea posible, con problemas reales del proyecto.

6. React
React será utilizado posteriormente para construir la interfaz web.

Los conceptos se introducirán progresivamente:

Componentes.

Props.

State.

Hooks.

Eventos.

Formularios.

Renderizado condicional.

Componentización.

Consumo de APIs.

Manejo de estado.

No se deberá introducir React de forma profunda antes de tener una base suficiente de JavaScript.

7. TypeScript
TypeScript se incorporará posteriormente.

No es prioridad durante las primeras fases.

Primero se deberá desarrollar una base funcional de JavaScript y React.

Cuando el proyecto alcance una etapa adecuada, se podrá migrar progresivamente a TypeScript.

8. Tecnologías futuras
A medida que el proyecto madure se podrán incorporar:

Backend
FastAPI.

SQLAlchemy.

Base de datos
PostgreSQL.

Frontend
React.

Next.js.

TypeScript.

Tailwind CSS.

Machine Learning
Scikit-learn.

XGBoost.

LightGBM.

Experimentación
MLflow.

Infraestructura
Docker.

Git.

GitHub.

Estas tecnologías no deben incorporarse todas desde el comienzo.

Cada tecnología deberá introducirse cuando exista una necesidad real dentro del proyecto.

9. Datos
El sistema podrá trabajar con información como:

Fecha del partido.

Liga.

Temporada.

Equipo local.

Equipo visitante.

Goles del equipo local.

Goles del equipo visitante.

xG.

Tiros.

Tiros a puerta.

Posesión.

Tarjetas.

Corners.

Rendimiento como local.

Rendimiento como visitante.

Cuotas.

Casa de apuestas.

Hora de captura de la cuota.

Cuota inicial.

Cuota de cierre.

Movimiento de cuotas.

Lesiones.

Suspensiones.

Días de descanso.

Calendario.

Otros factores disponibles antes del partido.

La información utilizada para generar una predicción histórica debe corresponder únicamente a información que habría estado disponible antes del inicio del partido.

10. Primer modelo: Poisson
El primer modelo estadístico será una distribución de Poisson.

La fórmula es:

Plaintext
P(X = k) = e^(-λ) × λ^k / k!
Donde:

λ representa el promedio esperado de goles.

k representa una cantidad específica de goles.

El objetivo inicial será construir una matriz de probabilidades de marcadores.

Ejemplo conceptual:

Plaintext
              Visitante
             0     1     2     3
Local
0          8.2%  9.4%  5.4%  2.1%
1         13.0% 14.0%  8.1%  3.2%
2         11.0% 12.0%  7.0%  2.8%
3          6.0%  6.7%  3.9%  1.5%
A partir de esta matriz se podrán obtener probabilidades para:

1X2.

Over/Under.

BTTS.

Marcador exacto.

El rango de goles deberá ser configurable y no estar limitado permanentemente a un número arbitrario.

11. Modelos estadísticos futuros
Después del modelo Poisson podrán estudiarse:

Elo.

Dixon-Coles.

Skellam.

Regresión logística.

Regresión de Poisson.

Random Forest.

XGBoost.

LightGBM.

Modelos ensemble.

Cada modelo deberá evaluarse individualmente antes de combinarlo con otros.

12. Comparación con el mercado
Las cuotas pueden convertirse en probabilidades implícitas.

Conceptualmente:

Plaintext
P = 1 / cuota
Posteriormente deberá considerarse el margen de la casa de apuestas.

El sistema podrá comparar:

Plaintext
Probabilidad estimada por el modelo
                vs
Probabilidad implícita del mercado
Esta comparación deberá mantenerse separada de cualquier conclusión automática sobre una decisión de apuesta.

13. Valor esperado
Para determinados análisis se podrá calcular:

Plaintext
EV = P × (cuota - 1) - (1 - P)
Ejemplo:

Plaintext
Probabilidad del modelo = 60%
Cuota = 2.00

EV = 0.60 × (2 - 1) - 0.40
EV = 0.20
El valor esperado es una herramienta matemática de análisis.

Un EV histórico positivo no constituye una garantía de rendimiento futuro.

14. Backtesting
El backtesting será una parte fundamental del proyecto.

El sistema deberá evaluar los modelos utilizando datos históricos y respetando el orden temporal.

Principios fundamentales:

No utilizar información futura.

Evitar data leakage.

Separar entrenamiento y evaluación.

Utilizar validación temporal.

Evaluar resultados out-of-sample.

Mantener reproducibilidad.

Registrar las condiciones del experimento.

La estructura conceptual será:

Plaintext
Datos históricos
      |
      v
Información disponible antes del partido
      |
      v
Predicción
      |
      v
Resultado real
      |
      v
Evaluación
      |
      v
Métricas
15. Métricas
Los modelos podrán evaluarse mediante:

Brier Score.

Log Loss.

Accuracy.

Calibration.

Reliability diagrams.

Profit/Loss.

ROI.

Yield.

Max Drawdown.

Número de eventos.

Posteriormente:

CLV.

Intervalos de incertidumbre.

Simulaciones Monte Carlo.

Análisis de estabilidad.

Comparación entre períodos.

Las métricas predictivas y las métricas financieras deberán analizarse por separado.

16. Calibración
Una probabilidad del 70% debe representar aproximadamente un evento que ocurre 70% de las veces dentro de un conjunto suficientemente grande y comparable.

Por esta razón, la calibración será una parte importante del proyecto.

Se podrán estudiar:

Reliability diagrams.

Calibration curves.

Platt scaling.

Isotonic regression.

El objetivo no será solamente obtener predicciones, sino obtener probabilidades confiables.

17. Tests
El proyecto utilizará Pytest.

Los tests deberán comprobar especialmente:

Cálculos de Poisson.

Probabilidades.

Conversión de cuotas.

Margen del mercado.

EV.

Métricas.

Backtesting.

Casos extremos.

Validaciones de datos.

Ejemplo:

Plaintext
tests/
├── test_poisson.py
├── test_probabilities.py
└── test_metrics.py
Cada nueva funcionalidad importante deberá acompañarse de pruebas.

18. Estructura inicial del proyecto
Plaintext
football-probabilistico/
|
├── data/
│   ├── raw/
│   ├── processed/
│   └── odds/
|
├── notebooks/
│   └── 01_exploracion_datos.ipynb
|
├── src/
│   ├── __init__.py
│   |
│   ├── data/
│   │   ├── __init__.py
│   │   ├── loader.py
│   │   ├── cleaning.py
│   │   └── features.py
│   |
│   ├── models/
│   │   ├── __init__.py
│   │   └── poisson.py
│   |
│   ├── probabilities/
│   │   ├── __init__.py
│   │   └── calculations.py
│   |
│   ├── backtesting/
│   │   ├── __init__.py
│   │   └── engine.py
│   |
│   ├── metrics/
│   │   ├── __init__.py
│   │   └── evaluation.py
│   |
│   └── utils/
│       ├── __init__.py
│       └── config.py
|
├── tests/
│   ├── __init__.py
│   ├── test_poisson.py
│   ├── test_probabilities.py
│   └── test_metrics.py
|
├── results/
│   ├── models/
│   ├── backtests/
│   └── reports/
|
├── frontend/
|
├── .env.example
├── .gitignore
├── requirements.txt
├── README.md
└── main.py
La carpeta frontend/ podrá permanecer inicialmente vacía hasta comenzar el desarrollo de JavaScript y React.

19. Roadmap
Fase 1 — Fundamentos
Objetivos:

Crear estructura del proyecto.

Configurar Git.

Configurar entorno virtual de Python.

Configurar requirements.

Configurar Pytest.

Crear módulos iniciales.

Ejecutar correctamente el proyecto.

No implementar todavía modelos complejos.

Fase 2 — Python y datos
Aprender y aplicar:

Variables.

Funciones.

Estructuras de datos.

Módulos.

Manejo de archivos.

CSV.

JSON.

Pandas.

NumPy.

Limpieza de datos.

Transformación de datos.

Exploración estadística.

Resultado:

Plaintext
Datos crudos
     |
     v
Limpieza
     |
     v
Datos procesados
Fase 3 — Probabilidad y Poisson
Aprender:

Probabilidad.

Distribuciones.

Esperanza.

Varianza.

Poisson.

λ.

Probabilidad de goles.

Matriz de marcadores.

Resultado:

Plaintext
Equipos
   |
   v
λ local / λ visitante
   |
   v
Poisson
   |
   v
Matriz de marcadores
   |
   v
Probabilidades
Fase 4 — Backtesting
Construir un motor que recorra partidos históricos cronológicamente.

Resultado:

Plaintext
Partido histórico
      |
      v
Información disponible antes del partido
      |
      v
Predicción
      |
      v
Resultado real
      |
      v
Métrica
Fase 5 — JavaScript
Antes de comenzar React:

Variables.

Funciones.

Arrays.

Objetos.

Métodos de arrays.

JSON.

Promises.

Async/await.

APIs.

Eventos.

Manipulación de datos.

Los ejercicios deberán utilizar ejemplos relacionados con el proyecto.

Fase 6 — React
Construir progresivamente:

Plaintext
JavaScript
    |
    v
React
    |
    v
Componentes
    |
    v
Props
    |
    v
State
    |
    v
Hooks
    |
    v
API
    |
    v
Dashboard
Fase 7 — API
Introducir FastAPI.

Arquitectura:

Plaintext
React
  |
  v
API
  |
  v
Python
  |
  v
Modelos
  |
  v
Datos
Fase 8 — Base de datos
Introducir:

PostgreSQL.

SQLAlchemy.

La base de datos podrá almacenar:

Equipos.

Partidos.

Temporadas.

Estadísticas.

Cuotas.

Predicciones.

Resultados.

Modelos.

Experimentos.

Backtests.

Fase 9 — Machine Learning
Solo después de tener una base estadística sólida.

Modelos potenciales:

Logistic Regression.

Random Forest.

XGBoost.

LightGBM.

Posteriormente se podrán estudiar modelos ensemble.

Fase 10 — Dashboard
El frontend deberá permitir visualizar:

Partidos.

Probabilidades.

Marcadores esperados.

Distribuciones.

Estadísticas.

Comparación modelo vs mercado.

Resultados de backtesting.

Métricas.

Calibración.

Historial de modelos.

El dashboard deberá mostrar información y análisis, no simplemente producir una recomendación automática.

20. Arquitectura objetivo
Plaintext
                 FOOTBALL PROBABILÍSTICO

                       FRONTEND
                          |
                 JavaScript / React
                          |
                          v
                         API
                          |
                       FastAPI
                          |
              +-----------+-----------+
              |                       |
              v                       v
           MODELOS                  DATOS
              |                       |
        +-----+-----+             PostgreSQL
        |           |
        v           v
     Poisson       ML
        |           |
        +-----+-----+
              |
              v
       PROBABILIDADES
              |
              v
         BACKTESTING
              |
              v
           MÉTRICAS
              |
              v
          RESULTADOS
21. Separación de responsabilidades
El proyecto deberá mantener separadas las siguientes capas:

Plaintext
DATA
 |
 v
PROCESAMIENTO
 |
 v
FEATURES
 |
 v
MODELOS
 |
 v
PROBABILIDADES
 |
 v
BACKTESTING
 |
 v
MÉTRICAS
 |
 v
API
 |
 v
FRONTEND