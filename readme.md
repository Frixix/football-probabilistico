# Football Probabilístico PRO

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Pytest-Passing-10b981.svg)](https://docs.pytest.org/)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()

Sistema cuantitativo de análisis probabilístico y modelado estadístico para fútbol profesional. Integra teoría de probabilidades, modelos bivariados calibrados, recolección de estadísticas reales y una interfaz web moderna en React con simulación en tiempo real.

El propósito central del sistema no es generar apuestas impulsivas ni inventar números aleatorios, sino responder mediante rigor cuantitativo:

> **¿Cuál es la probabilidad matemática real de cada evento, cómo se compara contra las cuotas teóricas del mercado y cómo elevar científicamente la tasa de asertividad predictiva?**

---

## 1. Arquitectura del Sistema

```
football-probabilistico/
├── src/
│   ├── data/
│   │   └── gestor_estadisticas.py   # Extracción, caché y cálculo de fuerzas ofensivas/defensivas
│   ├── models/
│   │   └── poisson.py               # Motor Poisson estándar + Corrección bivariada Dixon-Coles
│   └── utils/                       # Utilidades de configuración y validación
├── frontend/                        # Interfaz moderna en React + Vite (Dark Glassmorphism)
│   ├── src/
│   │   ├── components/
│   │   │   ├── MatchList.jsx        # Cartelera jerárquica con banderas oficiales y horarios locales
│   │   │   ├── BetSlip.jsx          # Simulador de ticket, cuotas conjuntas y semáforo de riesgo
│   │   │   └── Icons.jsx            # Iconografía profesional en vectores SVG (sin emojis)
│   │   ├── utils/
│   │   │   └── leagues.py           # Diccionario de prioridad de ligas y códigos FlagCDN
│   │   ├── App.jsx                  # Orquestador del estado y barra móvil flotante
│   │   └── App.css                  # Estilos responsivos con Media Queries completas
├── tests/
│   ├── test_poisson.py              # Suite de pruebas unitarias para Poisson y Dixon-Coles
│   └── test_procesador.py           # Pruebas de procesamiento de datos
├── bodega.py                        # Proceso nocturno automatizado de pronósticos cuantitativos
├── main.py                          # API / Servidor de ejecución y validación de resultados
└── requirements.txt                 # Dependencias del backend
```

---

## 2. Fundamento Matemático Actual

### 2.1 Distribución Univariada de Poisson
Para estimar la cantidad de goles $k$ que anotará un equipo con promedio esperado $\lambda$:

$$P(X = k) = \frac{e^{-\lambda} \lambda^k}{k!}$$

Donde $\lambda_{local}$ y $\lambda_{vis}$ se obtienen del cruce empírico entre el poder ofensivo de un equipo y la vulnerabilidad defensiva de su rival en la liga:

$$\lambda_{local} = \frac{GF_{local} + GC_{vis}}{2}, \quad \lambda_{vis} = \frac{GF_{vis} + GC_{local}}{2}$$

### 2.2 Corrección Bivariada de Dixon y Coles (1997)
El modelo de Poisson puro asume que los goles de ambos equipos son estadísticamente independientes. En el fútbol real, los partidos de marcador bajo (`0-0` y `1-1`) ocurren con mayor frecuencia de la esperada debido a la dinámica táctica del juego.

El modelo implementado en `src/models/poisson.py` aplica la función de correlación $\tau(x, y)$ con parámetro empírico calibrado $\rho = -0.11$:

$$\tau(x, y) = \begin{cases} 
1 - \lambda_{local}\lambda_{vis}\rho & \text{si } (x, y) = (0, 0) \\ 
1 + \lambda_{local}\rho & \text{si } (x, y) = (0, 1) \\ 
1 + \lambda_{vis}\rho & \text{si } (x, y) = (1, 0) \\ 
1 - \rho & \text{si } (x, y) = (1, 1) \\ 
1.0 & \text{en cualquier otro marcador} 
\end{cases}$$

$$P(x, y) = \tau(x, y) \cdot P(X = x) \cdot P(Y = y)$$

La matriz resultante se normaliza para garantizar que $\sum P(x, y) = 1.0$, redistribuyendo la masa de probabilidad hacia empates y marcadores cerrados sin alterar artificialmente los datos.

### 2.3 Mercados Calculados
* **1X2:** Suma de triángulo inferior ($1$), diagonal principal ($X$) y triángulo superior ($2$).
* **Over / Under 2.5:** Suma de probabilidades donde $x + y < 2.5$ vs $x + y > 2.5$.
* **Ambos Marcan (BTTS):** Suma de probabilidades donde $x > 0$ y $y > 0$.
* **Cuota Teórica Justa:** $Cuota = \frac{1}{P_{evento}}$.

---

## 3. Hoja de Ruta Cuantitativa: ¿Cómo Elevar Científicamente la Asertividad?

Para incrementar de forma genuina la tasa de aciertos y el valor esperado ($EV$) sin fabricar números falsos, se han diseñado las siguientes mejoras basadas en la literatura académica de analítica deportiva:

### 3.1 Ponderación Temporal Exponencial (EWMA - Dixon & Coles 1997)
* **Limitación actual:** Los promedios de goles otorgan el mismo peso a un partido jugado hace 9 meses que a uno jugado hace 2 semanas.
* **Solución cuantitativa:** Incorporar una función de decaimiento temporal exponencial en la estimación de fuerzas:
  $$\phi(t - t_k) = e^{-\xi (t - t_k)}$$
  Donde $t - t_k$ son los días transcurridos y $\xi$ es el factor de vida media (calibrado típicamente en $\xi \approx 0.0065$, dando mayor peso a los últimos 60-90 días). Refleja transferencias, cambios de entrenador y rachas reales de rendimiento.

### 3.2 Descomposición de Fuerzas Ofensivas y Defensivas por Localía (Maher 1982)
* **Limitación actual:** Se promedian goles a favor y en contra globales sin distinguir si el equipo juega de local o visita.
* **Solución cuantitativa:** Modelar cuatro parámetros independientes por equipo mediante Estimación de Máxima Verosimilitud (MLE):
  * $\alpha_i$: Capacidad de ataque del equipo $i$.
  * $\beta_i$: Vulnerabilidad defensiva del equipo $i$.
  * $\gamma$: Ventaja de campo específica del torneo.
  $$\lambda_{local} = \exp(\mu + \alpha_{local} - \beta_{vis} + \gamma)$$
  $$\lambda_{vis} = \exp(\mu + \alpha_{vis} - \beta_{local})$$

### 3.3 Integración de Goles Esperados ($xG$ - Expected Goals)
* **Limitación actual:** Los goles observados tienen alta varianza intrínseca (un tiro desviado o un penal fortuito distorsionan el promedio).
* **Solución cuantitativa:** El $xG$ mide la calidad objetiva de las ocasiones de gol según distancia, ángulo, presión y tipo de pase. Reemplazar o ponderar goles reales con $xG$ acelera la convergencia de $\lambda$ y reduce el ruido aleatorio hasta en un 35%.

### 3.4 Regularización Bayesiana (Shrinkage / Empirical Bayes)
* **Limitación actual:** En las primeras jornadas de una liga (fechas 1 a 6), la muestra pequeña produce promedios extremos no representativos.
* **Solución cuantitativa:** Aplicar un *prior Bayesiano* que "encoge" (shrinkage) los promedios muestrales hacia la media de la liga mediante una distribución Gamma conjugada:
  $$\lambda_{ajustado} = \frac{\sum Goles + \alpha_{prior}}{Partidos + \beta_{prior}}$$
  Evita sobrestimar equipos que tuvieron un marcador anómalo en sus primeros encuentros.

### 3.5 Ajuste por Estado del Partido (Game State Correction)
* **Fundamento:** Un equipo que va perdiendo ataca con mayor intensidad pero concede contragolpes; un equipo que va ganando reduce su volumen ofensivo y prioriza la posesión defensiva.
* **Solución:** Corregir las tasas de generación de peligro según el tiempo transcurrido en empate, victoria parcial o desventaja.

### 3.6 Maximización de Capital mediante Criterio de Kelly Fraccional
* **Fundamento:** En las apuestas probabilísticas, la rentabilidad a largo plazo proviene de detectar **Valor Esperado Positivo ($EV > 0$)**:
  $$EV = (P_{modelo} \times Cuota_{mercado}) - 1$$
* **Solución:** Cuando $EV > 0$, calcular el porcentaje óptimo del bankroll a invertir mediante $\frac{1}{4}$ Kelly:
  $$f^* = \frac{1}{4} \cdot \frac{b \cdot p - q}{b}$$
  Donde $b = Cuota - 1$, $p = P_{modelo}$ y $q = 1 - p$. Esto maximiza la tasa de crecimiento del capital a largo plazo minimizando el riesgo de ruina.

---

## 4. Experiencia de Usuario y Frontend

* **Diseño Dark Glassmorphism:** Fondo espacial con desenfoque de cristal (`backdrop-filter: blur(20px)`), tipografía Inter y acentos verde esmeralda neón.
* **Iconografía Vectorial SVG:** Sustitución total de emojis por iconos SVG limpios (trofeo, pelota, reloj, ticket, búsqueda, estrella).
* **Banderas Oficiales y Prioridad:** Integración con [FlagCDN](https://flagcdn.com/) para banderas nacionales de alta resolución y ordenamiento inteligente que posiciona torneos principales primero y ligas regionales al final.
* **Horarios en Hora Local:** Conversión de las fechas UTC de los fixtures a hora local colombiana (`America/Bogota`, `UTC-5`) en formato de 12 horas (`AM/PM`).
* **Ticket de Apuestas con Panorama Completo:**
  * **En Escritorio:** Fijado a la pantalla (`position: sticky`), con altura máxima adaptada a la ventana y lista con desplazamiento interno independiente; el resumen, cuota combinada y simulador están siempre visibles sin hacer scroll en la página.
  * **En Celulares:** Barra flotante inferior fija (`mobile-ticket-bar`) que aparece dinámicamente con las selecciones y abre un **Drawer Modal desplegable** con controles táctiles adaptados.
* **Panel de Auditoría & Backtesting en Vivo:**
  * Pestaña dedicada en la barra de navegación para evaluar la rentabilidad real y precisión matemática del motor contra marcadores finales en Supabase.
  * Métricas ejecutivas: pronósticos registrados, partidos finalizados, tasa de acierto (*Hit Rate*), y P&L neto con apuesta plana ($10,000 COP).
  * Curva de balance acumulado (*Equity Curve*) con trazado vectorial dinámico SVG y ROI global.
  * Desglose porcentual por mercado (1X2 Ganador, Over/Under 2.5 y Ambos Marcan).
  * Tabla de auditoría con buscador en tiempo real, filtros por estado (*Acertados*, *Fallados*, *Pendientes*) y marcador oficial FT.
* **Gestor de Bankroll con Criterio de Kelly Fraccional:**
  * Asistente interactivo en el ticket con persistencia local de banca (`$ COP`) y selección de estrategia ($\frac{1}{4}$ Kelly conservador, $\frac{1}{2}$ Kelly moderado, $\frac{1}{8}$ Kelly ultra-seguro).
  * Recomendación matemática de stake óptimo ($f^* = \frac{1}{4} \cdot \frac{EV}{Cuota - 1}$) con tope de seguridad de 5.0% y botón de aplicación inmediata al simulador.
  * Distintivo dinámico de stake de Kelly visible directamente en cada tarjeta de partido que presente Valor Esperado Positivo ($+EV$).
* **Expansión de Mercados Derivados (11 Opciones Analíticas por Partido):**
  * Desplegable interactivo en cada tarjeta para explorar y añadir selecciones alternativas directamente al ticket:
    * **Doble Oportunidad:** $1X$ ($P(1) + P(X)$), $X2$ ($P(X) + P(2)$), $12$ ($P(1) + P(2)$).
    * **Líneas de Goles Múltiples:** Más/Menos de 1.5, Más/Menos de 2.5 y Más/Menos de 3.5 goles calculadas desde las diagonales de la matriz bivariada.
    * **Ambos Marcan (BTTS):** $P(\text{Sí})$ y $P(\text{No})$ con corrección de correlación Dixon-Coles.
  * Nuevos filtros de cabecera: **Doble Oportunidad** y **Líneas (+/- 1.5 y 3.5)** con adaptación automática de la tarjeta destacada.
* **Historial de Enfrentamientos Directos (Head-to-Head / H2H):**
  * Botón interactivo `H2H` en la cabecera de cada partido que despliega un modal Glassmorphism con el historial de duelos directos cara a cara.
  * Barra horizontal de dominancia histórica con distribución porcentual de victorias local, empates y victorias visitante.
  * 4 KPIs de duelo: Total de partidos, promedio de goles por clásico, % Ambos Marcan y % Over 2.5 goles.
  * Línea de tiempo cronológica con fechas, marcadores exactos y ganadores resaltados.
  * Regularización Bayesiana de estilo táctico con modulación controlada de $\pm 3.5\%$ sobre las tasas de Poisson.

---

## 5. Instalación y Ejecución

### 5.1 Requisitos Previos
* Python 3.12+
* Node.js 18+ y npm

### 5.2 Configuración del Backend
```bash
# 1. Crear y activar entorno virtual
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate # Linux/Mac

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar variables de entorno en archivo .env
# SUPABASE_URL=tu_url_de_supabase
# SUPABASE_KEY=tu_service_o_anon_key
# API_KEY_PARTIDOS=tu_key_api_football
# API_KEY_ESTADISTICAS=tu_key_api_football
```

### 5.3 Configuración de la Base de Datos (Supabase)
Ejecuta la siguiente instrucción en el **SQL Editor** de tu consola de Supabase para almacenar la hora local:
```sql
ALTER TABLE historial_predicciones ADD COLUMN IF NOT EXISTS hora text;
```

### 5.4 Ejecución de Pruebas Automatizadas
```bash
.venv\Scripts\python -m pytest
```

### 5.5 Ejecución de la Bodega de Pronósticos
```bash
.venv\Scripts\python bodega.py
```

### 5.6 Ejecución del Frontend
```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## 6. Licencia
Proyecto desarrollado con fines académicos y de investigación en analítica cuantitativa deportiva.