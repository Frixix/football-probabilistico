Markdown# Football Probabilistico

Sistema de analisis probabilistico de futbol que combina estadistica, programacion, analisis de datos, Machine Learning y backtesting para estimar probabilidades de eventos futbolisticos y compararlas con las probabilidades implicitas del mercado.

El objetivo no es crear una aplicacion que simplemente diga que apostar, sino construir un sistema capaz de responder:

> ¿Que probabilidad estima nuestro modelo, que tan confiable es esa estimacion y como se comporto historicamente?

---

# 1. Objetivos del proyecto

El sistema debera evolucionar progresivamente hasta permitir:

1. Recopilar y procesar datos historicos de futbol.
2. Analizar el rendimiento de equipos.
3. Construir modelos estadisticos.
4. Estimar probabilidades de diferentes eventos.
5. Comparar las probabilidades del modelo con las probabilidades implicitas del mercado.
6. Calcular valor esperado (EV).
7. Realizar backtesting historico.
8. Evaluar la calidad y calibracion de los modelos.
9. Incorporar Machine Learning posteriormente.
10. Exponer los resultados mediante una API.
11. Construir una interfaz web utilizando JavaScript y React.
12. Mantener una arquitectura modular, testeable y escalable.

---

# 2. Filosofia del proyecto

Este proyecto tiene dos objetivos simultaneos.

## 2.1 Construir software real

El resultado final debe ser un sistema funcional de analisis futbolistico con:

* Codigo organizado.
* Arquitectura modular.
* Pruebas automatizadas.
* Modelos reproducibles.
* Datos procesados correctamente.
* Backtesting.
* API.
* Interfaz web.

## 2.2 Aprender mientras se construye

El proyecto tambien sera utilizado para fortalecer conocimientos de:

* Python.
* Programacion orientada a objetos.
* Estadistica.
* Probabilidad.
* Analisis de datos.
* JavaScript.
* React.
* APIs.
* Bases de datos.
* Machine Learning.

---

# 3. Metodologia de aprendizaje

El desarrollo debera seguir esta metodologia:

```text
PROBLEMA
    |
    v
EXPLICACION
    |
    v
INTENTO DEL DESARROLLADOR
    |
    v
PISTA O CORRECCION
    |
    v
IMPLEMENTACION
    |
    v
PRUEBAS
    |
    v
REVISION
4. Tecnologias principales4.1 PythonPython sera el lenguaje principal del motor estadistico y de analisis.Tecnologias iniciales:Python 3.12+NumPyPandasSciPyStatsmodelsPytestTecnologias posteriores:Scikit-learnXGBoostLightGBM4.2 JavaScript y ReactJavaScript sera utilizado como base para el desarrollo frontend y React para la construccion progresiva de la interfaz web, componentes, estados y consumo de la API.5. Estructura del ProyectoPlaintextfootball-probabilistico/
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── odds/
│
├── notebooks/
│   └── 01_exploracion_datos.ipynb
│
├── results/
│   ├── models/
│   ├── backtests/
│   └── reports/
│
├── src/
│   ├── __init__.py
│   ├── data/
│   │   ├── __init__.py
│   │   ├── loader.py
│   │   ├── cleaning.py
│   │   └── features.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── poisson.py
│   ├── probabilities/
│   │   ├── __init__.py
│   │   └── calculations.py
│   ├── backtesting/
│   │   ├── __init__.py
│   │   └── engine.py
│   ├── metrics/
│   │   ├── __init__.py
│   │   └── evaluation.py
│   └── utils/
│       ├── __init__.py
│       └── config.py
│
├── tests/
│   ├── __init__.py
│   ├── test_poisson.py
│   ├── test_probabilities.py
│   └── test_metrics.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── api.py
├── main.py
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
6. Modelo Base: PoissonEl primer modelo estadistico implementado es la distribucion de Poisson:PlaintextP(X = k) = e^(-λ) × λ^k / k!
Donde $\lambda$ representa el promedio esperado de goles y $k$ la cantidad especifica de goles, permitiendo generar matrices de probabilidad de marcadores para calcular mercados 1X2, Over/Under y ambos marcan (BTTS).7. Roadmap y FasesFase 1 — Fundamentos: Estructura, Git, entorno virtual y Pytest.Fase 2 — Python y datos: Limpieza, transformacion y exploracion con Pandas y NumPy.Fase 3 — Probabilidad y Poisson: Calculo de $\lambda$ y matriz de marcadores.Fase 4 — Backtesting: Motor de recorrido historico cronologico sin data leakage.Fase 5 — JavaScript: Fundamentos aplicados al dominio del proyecto.Fase 6 — React: Construccion progresiva de componentes y dashboard.Fase 7 — API: Integracion con FastAPI.Fase 8 — Base de datos: Integracion con PostgreSQL y SQLAlchemy.Fase 9 — Machine Learning: Modelos avanzados (Random Forest, XGBoost, LightGBM).Fase 10 — Dashboard Final: Visualizacion completa de analisis y metricas.8. Instalacion y Ejecucion LocalClonar el repositorio:Bashgit clone [https://github.com/Frixix/football-probabilistico.git](https://github.com/Frixix/football-probabilistico.git)
cd football-probabilistico
Instalar dependencias del backend:Bashpip install -r requirements.txt
Instalar dependencias del frontend:Bashcd frontend
npm install
cd ..
Iniciar el servidor API (FastAPI):Bashuvicorn api:app --reload
Iniciar la interfaz grafica (Vite):Bashcd frontend
npm run dev