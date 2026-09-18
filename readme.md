# Football Probability Lab

Sistema de análisis estadístico y probabilístico aplicado al fútbol.

El objetivo del proyecto es construir un sistema capaz de **estimar probabilidades de eventos futbolísticos**, compararlas con las probabilidades implícitas en las cuotas del mercado y evaluar mediante **backtesting** si los modelos presentan capacidad predictiva y valor esperado fuera de muestra.

> **Principio fundamental:** el sistema no pretende "adivinar resultados". Busca construir, medir y validar modelos probabilísticos utilizando datos históricos y métodos estadísticos reproducibles.

---

## 1. Objetivos

### Objetivo general

Desarrollar una plataforma de análisis estadístico para fútbol que permita:

* Recopilar y procesar datos históricos.
* Construir modelos probabilísticos.
* Estimar probabilidades de eventos futbolísticos.
* Comparar las probabilidades del modelo con las probabilidades implícitas del mercado.
* Calcular valor esperado.
* Realizar backtesting.
* Evaluar la calibración y precisión de los modelos.
* Comparar diferentes modelos estadísticos y de Machine Learning.
* Analizar la estabilidad de los resultados fuera de muestra.

### Objetivos específicos

1. Construir un dataset histórico confiable.
2. Implementar modelos estadísticos base.
3. Implementar validación temporal.
4. Construir un motor de backtesting.
5. Medir el desempeño mediante métricas estadísticas y financieras.
6. Comparar modelos.
7. Construir un sistema de predicción probabilística.
8. Exponer los resultados mediante una API.
9. Crear un dashboard web.
10. Documentar todo el proceso de manera reproducible.

---

# 2. Filosofía del proyecto

El proyecto seguirá una metodología orientada a la investigación y no únicamente a la creación de una aplicación.

La cadena principal será:

```text
DATOS
  ↓
LIMPIEZA
  ↓
FEATURE ENGINEERING
  ↓
MODELO
  ↓
PROBABILIDADES
  ↓
CALIBRACIÓN
  ↓
COMPARACIÓN CON MERCADO
  ↓
BACKTESTING
  ↓
EVALUACIÓN
  ↓
MODELO VALIDADO
```

Se evitarán conclusiones basadas únicamente en resultados de una muestra pequeña.

---

# 3. Arquitectura

La arquitectura prevista será:

```text
                         ┌─────────────────────┐
                         │      Next.js        │
                         │ React + TypeScript  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │       FastAPI       │
                         │       Backend       │
                         └──────────┬──────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
       ┌───────────┐         ┌──────────────┐       ┌─────────────┐
       │    ETL    │         │ Model Engine │       │  Backtest   │
       │   Datos   │         │ Probabilidad │       │   Engine    │
       └─────┬─────┘         └──────┬───────┘       └──────┬──────┘
             │                      │                      │
             └──────────────────────┼──────────────────────┘
                                    ▼
                           ┌─────────────────┐
                           │   PostgreSQL    │
                           └─────────────────┘
```

---

# 4. Stack tecnológico

## Backend y Data Science

* Python
* FastAPI
* Pandas
* NumPy
* SciPy
* scikit-learn

## Machine Learning

Se incorporarán progresivamente:

* Logistic Regression
* Random Forest
* XGBoost
* LightGBM

## Modelos estadísticos

Inicialmente:

* Probabilidad implícita de cuotas
* Frecuencia histórica
* Poisson
* Dixon-Coles
* Elo
* Skellam

Posteriormente:

* Modelos de regresión
* Machine Learning
* Ensembles
* Modelos calibrados

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

## Base de datos

* PostgreSQL
* SQLAlchemy

## Visualización

* Plotly
* ECharts

## Desarrollo

* Git
* GitHub
* Docker
* Pytest
* Jupyter Notebook

## Experimentación

* MLflow

---

# 5. Estructura del proyecto

```text
football-probability/
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── odds/
│
├── notebooks/
│   ├── exploration.ipynb
│   ├── poisson.ipynb
│   ├── elo.ipynb
│   └── backtest.ipynb
│
├── src/
│   ├── data/
│   │   ├── loader.py
│   │   ├── cleaning.py
│   │   └── features.py
│   │
│   ├── models/
│   │   ├── poisson.py
│   │   ├── dixon_coles.py
│   │   ├── elo.py
│   │   ├── logistic.py
│   │   ├── xgboost_model.py
│   │   └── ensemble.py
│   │
│   ├── betting/
│   │   ├── odds.py
│   │   ├── implied_probability.py
│   │   └── expected_value.py
│   │
│   ├── backtesting/
│   │   ├── engine.py
│   │   ├── bankroll.py
│   │   └── metrics.py
│   │
│   └── utils/
│       └── config.py
│
├── api/
│   ├── main.py
│   ├── routes/
│   └── schemas/
│
├── frontend/
│   └── ...
│
├── tests/
│   ├── test_models.py
│   ├── test_probabilities.py
│   └── test_backtest.py
│
├── results/
│   ├── models/
│   ├── backtests/
│   └── reports/
│
├── paper/
│   └── research.md
│
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

# 6. Datos

Los datos serán uno de los componentes más importantes del proyecto.

Se buscará almacenar información como:

### Partidos

* Fecha
* Liga
* Temporada
* Equipo local
* Equipo visitante
* Goles local
* Goles visitante
* Resultado

### Rendimiento

* xG
* tiros
* tiros a puerta
* posesión
* tarjetas
* corners
* rendimiento local
* rendimiento visitante

### Mercado

* Cuotas
* Casa de apuestas
* Hora de captura
* Cuota inicial
* Cuota de cierre
* Movimiento de cuota

### Contexto

Cuando los datos estén disponibles:

* Lesiones
* Suspensiones
* Días de descanso
* Calendario
* Localía
* Competición

---

# 7. Probabilidad implícita

Las cuotas serán convertidas a probabilidades implícitas.

Para una cuota decimal:

```text
P = 1 / cuota
```

Por ejemplo:

```text
Cuota = 2.00

P = 1 / 2.00

P = 0.50

P = 50%
```

Sin embargo, las cuotas incluyen el margen de la casa.

Por ello se deberá estudiar la diferencia entre:

```text
Probabilidad implícita
```

y

```text
Probabilidad implícita normalizada
```

para diferentes mercados.

---

# 8. Primer modelo: Poisson

El primer modelo probabilístico será Poisson.

La distribución de Poisson se define como:

```text
P(X = k) = e^(-λ) × λ^k / k!
```

donde:

* `λ` representa la media esperada de goles.
* `k` representa el número de goles.

El modelo permitirá construir probabilidades de marcadores.

Ejemplo conceptual:

```text
                 Goles visitante

                 0       1       2       3
              ┌────────────────────────────
Goles local 0 │
             1 │
             2 │
             3 │
```

A partir de esta matriz podrán calcularse probabilidades de:

* Victoria local
* Empate
* Victoria visitante
* Over/Under
* Ambos equipos marcan
* Marcador exacto

---

# 9. Modelos posteriores

## Dixon-Coles

Se utilizará para estudiar una mejora sobre el modelo Poisson, especialmente en determinados marcadores de baja anotación.

## Elo

Sistema de rating para estimar la fuerza relativa de los equipos.

Variables potenciales:

```text
Rating equipo A
Rating equipo B
Ventaja de localía
Diferencia de rating
```

## Skellam

Permitirá modelar la diferencia entre goles de dos equipos.

## Regresión logística

Se utilizará para problemas de clasificación:

```text
Local
Empate
Visitante
```

o eventos binarios:

```text
Over 2.5
Under 2.5
```

## Machine Learning

Posteriormente se evaluarán:

* Random Forest
* XGBoost
* LightGBM

---

# 10. Ensemble

Una fase posterior consistirá en combinar diferentes modelos.

Conceptualmente:

```text
Poisson
    │
Dixon-Coles
    │
Elo
    │
Logistic Regression
    │
XGBoost
    │
LightGBM
    │
    ▼
ENSEMBLE
    │
    ▼
PROBABILIDAD FINAL
```

La combinación deberá evaluarse estadísticamente y no asumirse automáticamente como una mejora.

---

# 11. Backtesting

El backtesting será una parte central del proyecto.

El sistema deberá simular cómo habría funcionado un modelo utilizando únicamente la información disponible en cada momento histórico.

```text
Datos históricos
      ↓
Fecha T
      ↓
Información disponible antes del partido
      ↓
Predicción
      ↓
Resultado real
      ↓
Evaluación
      ↓
Siguiente partido
```

No se permitirá utilizar información futura.

---

# 12. Data Leakage

Una regla fundamental:

> **El modelo nunca debe utilizar información que no habría estado disponible en el momento de realizar la predicción.**

Ejemplo incorrecto:

```text
Partido
   ↓
Resultado final
   ↓
Modelo
```

Ejemplo correcto:

```text
Información histórica hasta T-1
              ↓
           Modelo
              ↓
        Predicción T
              ↓
       Resultado real
```

Esto será especialmente importante al utilizar:

* xG
* lesiones
* cuotas
* rankings
* estadísticas recientes
* movimientos del mercado

---

# 13. Métricas

El proyecto no utilizará una única métrica.

## Métricas probabilísticas

### Brier Score

Mide la calidad de probabilidades predichas.

### Log Loss

Penaliza predicciones probabilísticas incorrectas, especialmente cuando son demasiado confiadas.

### Calibration

Se analizará si:

```text
Predicción de 60%
```

ocurre aproximadamente el:

```text
60%
```

de las veces en eventos similares.

---

# 14. Métricas de estrategia

Cuando corresponda realizar simulaciones con cuotas:

* ROI
* Yield
* Profit/Loss
* Drawdown
* Volatilidad
* Número de operaciones
* Tasa de acierto
* Valor esperado
* CLV

Estas métricas deberán analizarse conjuntamente con las métricas probabilísticas.

Un ROI positivo en una muestra pequeña no será considerado evidencia suficiente de que un modelo funciona.

---

# 15. Validación temporal

No se utilizará únicamente un train/test split aleatorio.

Para datos deportivos se priorizará la validación temporal.

Ejemplo:

```text
2018 ─────────────── 2022
       TRAIN

2023 ─────────────── 2024
       VALIDATION

2025 ─────────────── 2026
       TEST
```

El objetivo es aproximarse a las condiciones reales de predicción.

---

# 16. Calibración

Una buena predicción no consiste únicamente en acertar.

También debe proporcionar probabilidades confiables.

Ejemplo:

```text
Predicción       Resultado observado

50%              ≈ 50%
60%              ≈ 60%
70%              ≈ 70%
80%              ≈ 80%
```

Se estudiarán herramientas como:

* Reliability diagrams
* Calibration curves
* Brier Score
* Log Loss
* Platt Scaling
* Isotonic Regression

---

# 17. Valor esperado

Una vez estimada una probabilidad, podrá compararse con una cuota.

Para una cuota decimal `O` y probabilidad estimada `P`:

```text
EV = P × (O - 1) - (1 - P)
```

Ejemplo hipotético:

```text
P = 0.60
O = 2.00

EV = 0.60 × 1 - 0.40

EV = 0.20
```

Esto representa un valor esperado teórico de:

```text
+20%
```

La existencia de un EV positivo estimado **no demuestra por sí misma** que exista una ventaja explotable. Deberá comprobarse mediante datos fuera de muestra, sensibilidad al error de estimación, costes y backtesting.

---

# 18. Simulación

Se podrán implementar posteriormente simulaciones Monte Carlo para estudiar:

* Distribución de resultados
* Variabilidad
* Drawdowns
* Sensibilidad a la probabilidad estimada
* Diferentes tamaños de muestra
* Diferentes reglas de staking

La simulación será utilizada como herramienta estadística, no como garantía de resultados futuros.

---

# 19. Dashboard

La aplicación web final podrá incluir:

### Dashboard general

```text
Partidos
Modelos
Probabilidades
Mercado
Backtesting
Experimentos
```

### Análisis de partido

```text
Equipo A vs Equipo B

Poisson
Dixon-Coles
Elo
XGBoost
Ensemble

Probabilidades
Cuotas
Probabilidad implícita
Diferencia
EV
```

### Modelos

```text
Modelo
Accuracy
Brier Score
Log Loss
Calibration
ROI histórico
Drawdown
```

### Backtesting

```text
Capital inicial
Capital final
Profit/Loss
ROI
Drawdown máximo
Número de eventos
```

---

# 20. Metodología científica

Cada experimento deberá documentar:

```text
Dataset
↓
Variables utilizadas
↓
Periodo
↓
Modelo
↓
Hiperparámetros
↓
Método de validación
↓
Métricas
↓
Resultados
↓
Limitaciones
```

Se evitará seleccionar únicamente los experimentos que produzcan resultados favorables.

---

# 21. Roadmap

## Fase 0 — Preparación

* [ ] Crear repositorio
* [ ] Configurar entorno Python
* [ ] Configurar Git
* [ ] Crear estructura de carpetas
* [ ] Documentar fuentes de datos

## Fase 1 — Datos

* [ ] Conseguir dataset histórico
* [ ] Limpieza
* [ ] Normalización
* [ ] Exploratory Data Analysis
* [ ] Definir esquema de datos

## Fase 2 — Modelo base

* [ ] Probabilidad implícita
* [ ] Modelo de frecuencia
* [ ] Poisson
* [ ] Matriz de marcadores
* [ ] 1X2
* [ ] Over/Under

## Fase 3 — Backtesting

* [ ] Motor temporal
* [ ] Train/Test temporal
* [ ] Brier Score
* [ ] Log Loss
* [ ] Calibration
* [ ] ROI
* [ ] Drawdown

## Fase 4 — Modelos avanzados

* [ ] Dixon-Coles
* [ ] Elo
* [ ] Skellam
* [ ] Regresión logística

## Fase 5 — Machine Learning

* [ ] Feature engineering
* [ ] Random Forest
* [ ] XGBoost
* [ ] LightGBM
* [ ] Optimización de hiperparámetros

## Fase 6 — Ensemble

* [ ] Combinar modelos
* [ ] Calibración
* [ ] Validación
* [ ] Análisis de robustez

## Fase 7 — Backend

* [ ] PostgreSQL
* [ ] SQLAlchemy
* [ ] FastAPI
* [ ] Endpoints
* [ ] Sistema de predicciones

## Fase 8 — Frontend

* [ ] Next.js
* [ ] Dashboard
* [ ] Partidos
* [ ] Modelos
* [ ] Gráficas
* [ ] Backtesting

## Fase 9 — Producción

* [ ] Docker
* [ ] Tests
* [ ] CI/CD
* [ ] MLflow
* [ ] Deployment
* [ ] Monitoreo

---

# 22. Estado actual

**Proyecto:** En planificación.

**Prioridad actual:**

```text
1. Dataset
2. Exploración estadística
3. Poisson
4. Backtesting
5. Validación
6. Modelos adicionales
7. Machine Learning
8. API
9. Dashboard
```

No se desarrollará el frontend completo antes de validar el motor estadístico.

---

# 23. Principio de reproducibilidad

Todo resultado deberá poder reproducirse mediante:

```text
Dataset
+
Código
+
Configuración
+
Versión del modelo
+
Parámetros
=
Resultado
```

Los experimentos importantes deberán quedar registrados.

---

# 24. Investigación futura

Posibles líneas de investigación:

* Efecto de la localía.
* Evolución de la fuerza de los equipos.
* Predicción de goles.
* Modelos de xG.
* Movimiento de cuotas.
* Closing Line Value.
* Calibración probabilística.
* Ensemble de modelos.
* Detección de overfitting.
* Sensibilidad del EV al error de probabilidad.
* Diferencias entre ligas.
* Robustez entre temporadas.
* Simulación Monte Carlo.
* Gestión del bankroll.
* Análisis de incertidumbre.

---

# 25. Advertencia metodológica

Este proyecto tiene fines de **investigación estadística, programación y análisis de datos**.

Una predicción probabilística no representa una certeza.

Un modelo puede presentar resultados históricos favorables debido a:

* Overfitting
* Data leakage
* Sesgo de selección
* Muestras pequeñas
* Cambios estructurales
* Calidad deficiente de los datos
* Costes y márgenes del mercado
* Error de estimación

Por esta razón, cualquier resultado deberá interpretarse dentro de su intervalo de incertidumbre y contexto estadístico.

---

# 26. Visión final

La visión del proyecto es construir un sistema donde la pregunta principal no sea:

> "¿Qué equipo va a ganar?"

sino:

> **"¿Qué probabilidad asigna nuestro modelo, qué tan bien calibrada está esa probabilidad y qué evidencia histórica existe para respaldarla?"**

El proyecto busca combinar:

```text
ESTADÍSTICA
     +
DATA SCIENCE
     +
MACHINE LEARNING
     +
PROGRAMACIÓN
     +
INVESTIGACIÓN
```

para construir un sistema reproducible de análisis probabilístico aplicado al fútbol.

---

## Licencia

Pendiente de definir.

## Autor

Frix
