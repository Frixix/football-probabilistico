import { generarMercadosCompletos } from './markets.js';
import { obtenerInfoTorneo } from './leagues.js';

/**
 * Motor Cuantitativo de Combinadas y Generador Automático de Tickets
 *
 * Clasificación de Riesgo:
 * - Riesgo Controlado (Ultra Seguro): P >= 0.45 (Cuota ~1.45 - 2.20) -> Mínima Varianza
 * - Riesgo Moderado:   0.20 <= P < 0.45 (Cuota ~2.22 - 5.00) -> Zona Óptima de Valor
 * - Alto Riesgo:       P < 0.20 (Cuota > 5.00)
 */

export const RANGOS_RIESGO = {
  CONTROLADO: { min: 0.45, max: 1.00, label: 'Mínimo Riesgo (Controlado)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  MODERADO:   { min: 0.20, max: 0.45, label: 'Riesgo Moderado',   color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  ALTO:       { min: 0.00, max: 0.20, label: 'Alto Riesgo',       color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
};

/**
 * Determina con rigor si un partido involucra equipos conocidos de ligas principales
 * (Colombia, Inglaterra, España, Alemania, Italia, Francia, Argentina, Brasil,
 * Champions League, Libertadores, Sudamericana, y primeras divisiones reconocidas).
 */
export function esPartidoEquipoConocido(partido) {
  if (!partido) return false;
  const idL = partido.id_liga || partido.id_torneo || null;
  const info = obtenerInfoTorneo(partido.torneo, partido.pais, partido.local, partido.visitante, idL);
  return Boolean(info.esTop || (info.prioridad !== undefined && info.prioridad <= 25));
}

/**
 * Filtra un pool de partidos para garantizar que las combinadas automáticas se construyan
 * exclusivamente con equipos conocidos de torneos destacados, evitando ligas exóticas o regionales.
 */
export function filtrarPartidosEquiposConocidos(partidos) {
  if (!partidos || partidos.length === 0) return [];
  const conocidos = partidos.filter(esPartidoEquipoConocido);
  if (conocidos.length >= 2) {
    // Ordenar de mayor jerarquía a menor (1: BetPlay, 2: Premier, 3: La Liga, etc.)
    return [...conocidos].sort((a, b) => {
      const idA = a.id_liga || a.id_torneo || null;
      const idB = b.id_liga || b.id_torneo || null;
      const infoA = obtenerInfoTorneo(a.torneo, a.pais, a.local, a.visitante, idA);
      const infoB = obtenerInfoTorneo(b.torneo, b.pais, b.local, b.visitante, idB);
      return (infoA.prioridad || 50) - (infoB.prioridad || 50);
    });
  }

  // Fallback si la jornada tiene pocos eventos en ligas top (permitir prioridad <= 35)
  const semiConocidos = partidos.filter(p => {
    const info = obtenerInfoTorneo(p.torneo, p.pais, p.local, p.visitante, p.id_liga);
    return (info.prioridad || 99) <= 35;
  });
  if (semiConocidos.length >= 2) return semiConocidos;

  return partidos;
}

/**
 * Extrae todos los mercados candidatos disponibles para un partido.
 * Retorna opciones con probabilidad >= umbralMinimo.
 */
export function obtenerCandidatosPartido(partido, umbralMinimo = 0.50) {
  const candidatos = [];
  const idReal = partido.id_partido || partido.id || Math.random();

  // 1. Mercado principal predicho
  let probPrincipal = parseFloat(partido.probabilidad);
  if (isNaN(probPrincipal)) probPrincipal = 50;
  const probDecPrincipal = probPrincipal > 1 ? probPrincipal / 100 : probPrincipal;
  const mercadoPrincipal = partido.mercado_predicho || partido.mercado || 'Ganador';
  const cuotaPrincipal = parseFloat(partido.cuota_mercado) || (probDecPrincipal > 0 ? parseFloat((1 / probDecPrincipal).toFixed(2)) : 1.5);

  candidatos.push({
    partidoId: idReal,
    partido,
    mercado: mercadoPrincipal,
    probDecimal: probDecPrincipal,
    probPct: parseFloat((probDecPrincipal * 100).toFixed(1)),
    cuota: cuotaPrincipal,
    ev: parseFloat(partido.ev) || 4.2,
    tipo: 'principal'
  });

  // 2. Mercados derivados de Poisson / Dixon-Coles
  try {
    const mercados = generarMercadosCompletos(partido);

    // Doble Oportunidad (usualmente muy alta probabilidad: 65% - 85%)
    if (mercados.doble_oportunidad) {
      mercados.doble_oportunidad.forEach(m => {
        const pDec = m.prob / 100;
        if (pDec >= umbralMinimo) {
          candidatos.push({
            partidoId: idReal,
            partido,
            mercado: m.etiqueta,
            probDecimal: pDec,
            probPct: m.prob,
            cuota: m.cuota,
            ev: parseFloat(partido.ev) || 4.0,
            tipo: 'doble_oportunidad'
          });
        }
      });
    }

    // Líneas de Goles (+1.5, -3.5, etc.)
    if (mercados.goles) {
      mercados.goles.forEach(m => {
        const pDec = m.prob / 100;
        // Priorizar líneas muy seguras (+1.5 o -3.5)
        if (pDec >= umbralMinimo && (m.etiqueta.includes('1.5') || m.etiqueta.includes('3.5'))) {
          candidatos.push({
            partidoId: idReal,
            partido,
            mercado: m.etiqueta,
            probDecimal: pDec,
            probPct: m.prob,
            cuota: m.cuota,
            ev: parseFloat(partido.ev) || 3.8,
            tipo: 'goles'
          });
        }
      });
    }

    // BTTS
    if (mercados.btts) {
      mercados.btts.forEach(m => {
        const pDec = m.prob / 100;
        if (pDec >= umbralMinimo) {
          candidatos.push({
            partidoId: idReal,
            partido,
            mercado: m.etiqueta,
            probDecimal: pDec,
            probPct: m.prob,
            cuota: m.cuota,
            ev: parseFloat(partido.ev) || 3.5,
            tipo: 'btts'
          });
        }
      });
    }
  } catch (err) {
    console.warn("Error generando mercados derivados para partido", idReal, err);
  }

  // Ordenar candidatos por mayor probabilidad
  return candidatos.sort((a, b) => b.probDecimal - a.probDecimal);
}

/**
 * Calcula todas las métricas e indicadores automáticos para un conjunto de selecciones.
 */
export function calcularMetricasTicket(picks) {
  if (!picks || picks.length === 0) {
    return {
      probabilidadTotal: 0,
      probabilidadPct: 0,
      cuotaTotal: 1.0,
      cuotaFormateada: '1.00',
      riesgo: RANGOS_RIESGO.CONTROLADO,
      evPromedio: 0,
      totalSelecciones: 0
    };
  }

  // Probabilidad acumulada (Regla de multiplicación de eventos independientes)
  const probabilidadTotal = picks.reduce((acc, p) => acc * (p.probDecimal || 0.5), 1);
  const probabilidadPct = parseFloat((probabilidadTotal * 100).toFixed(2));

  // Cuota combinada total
  const cuotaTotal = picks.reduce((acc, p) => {
    const c = parseFloat(p.cuota) || (p.probDecimal > 0 ? 1 / p.probDecimal : 1.5);
    return acc * c;
  }, 1);

  // Clasificación de Riesgo
  let riesgo = RANGOS_RIESGO.ALTO;
  if (probabilidadTotal >= 0.45) {
    riesgo = {
      ...RANGOS_RIESGO.CONTROLADO,
      desc: 'Alta probabilidad de ocurrencia según Dixon-Coles. Ideal para proteger banca.'
    };
  } else if (probabilidadTotal >= 0.20) {
    riesgo = {
      ...RANGOS_RIESGO.MODERADO,
      desc: 'Riesgo Moderado Óptimo: Excelente equilibrio entre cuota atractiva y probabilidad estadística.'
    };
  } else {
    riesgo = {
      ...RANGOS_RIESGO.ALTO,
      desc: 'Alto Riesgo (Cuota Alta): Variabilidad elevada; destinar stake reducido.'
    };
  }

  // EV Promedio
  const sumaEv = picks.reduce((acc, p) => acc + (parseFloat(p.ev) || 4.2), 0);
  const evPromedio = parseFloat((sumaEv / picks.length).toFixed(1));

  return {
    probabilidadTotal,
    probabilidadPct,
    cuotaTotal: parseFloat(cuotaTotal.toFixed(2)),
    cuotaFormateada: cuotaTotal.toFixed(2),
    riesgo,
    evPromedio,
    totalSelecciones: picks.length
  };
}

/**
 * Transforma un pick al formato estándar compatible con el BetSlip de la app.
 */
export function formatearPickParaTicket(pick) {
  const p = pick.partido || {};
  const idReal = pick.partidoId || p.id_partido || p.id || Math.random();
  const idKey = `${idReal}-${pick.mercado}`;

  return {
    ...p,
    id_partido: idReal,
    id_seleccion: idKey,
    id: idKey,
    mercado_predicho: pick.mercado,
    mercado: pick.mercado,
    probabilidad: pick.probPct,
    cuota_mercado: pick.cuota,
    ev: pick.ev
  };
}

/**
 * Función para barajar aleatoriamente un array (Fisher-Yates)
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 🛡️ GENERADOR DE TICKET ULTRA SEGURO / MÍNIMO RIESGO (CONSERVADOR)
 *
 * Filtra estrictamente EQUIPOS CONOCIDOS de ligas top (Colombia, Premier, La Liga,
 * Serie A, Bundesliga, Champions, Libertadores, etc.) y selecciona los mercados de
 * MÁXIMA probabilidad matemática (Doble Oportunidad 1X/X2 >= 72-85%, Goles +1.5 o -3.5 >= 75%).
 *
 * Por defecto combina 2 selecciones de alta certeza para producir una probabilidad
 * conjunta de 55% a 75%+ (cuota ~1.45 - 1.95), minimizando drásticamente la varianza y pérdidas.
 */
export function generarTicketUltraSeguro(partidos, numSelecciones = 2) {
  if (!partidos || partidos.length < 2) return null;

  // 1. Filtrar rigurosamente equipos conocidos de ligas principales
  const poolConocidos = filtrarPartidosEquiposConocidos(partidos);
  if (poolConocidos.length < 2) return null;

  // 2. Extraer el mercado más seguro de cada partido conocido
  const mejoresPorPartido = [];

  poolConocidos.forEach(p => {
    const candidatos = obtenerCandidatosPartido(p, 0.65);
    if (!candidatos || candidatos.length === 0) return;

    // Prioridad de máxima certeza:
    // a) Doble Oportunidad con prob >= 72% (tasa de fallo mínima)
    // b) Líneas seguras de goles (+1.5 o -3.5) con prob >= 75%
    // c) El mejor candidato disponible del partido
    const pickUltra = candidatos.find(c => 
      (c.tipo === 'doble_oportunidad' && c.probDecimal >= 0.72) ||
      (c.tipo === 'goles' && (c.mercado.includes('1.5') || c.mercado.includes('3.5')) && c.probDecimal >= 0.75)
    ) || candidatos[0];

    if (pickUltra && pickUltra.probDecimal >= 0.65) {
      mejoresPorPartido.push(pickUltra);
    }
  });

  if (mejoresPorPartido.length < 2) {
    // Si la jornada no tiene tantos picks con > 65%, tomar los mejores disponibles de equipos conocidos
    const fallback = poolConocidos.map(p => obtenerCandidatosPartido(p, 0.50)[0]).filter(Boolean);
    fallback.sort((a, b) => b.probDecimal - a.probDecimal);
    if (fallback.length < 2) return null;
    const picks = fallback.slice(0, Math.min(numSelecciones, fallback.length));
    return {
      id: `safe-${Date.now()}`,
      titulo: 'Ticket Ultra Seguro (Mínimo Riesgo)',
      subtitulo: `${picks.length} selecciones de máxima probabilidad en ligas top. Diseñado para maximizar aciertos y proteger banca.`,
      tipoGenerador: 'ultra_seguro',
      picks,
      metricas: calcularMetricasTicket(picks)
    };
  }

  // Ordenar por mayor probabilidad matemática individual
  mejoresPorPartido.sort((a, b) => b.probDecimal - a.probDecimal);
  const picks = mejoresPorPartido.slice(0, Math.min(numSelecciones, mejoresPorPartido.length));

  return {
    id: `safe-${Date.now()}`,
    titulo: 'Ticket Ultra Seguro (Mínimo Riesgo)',
    subtitulo: `${picks.length} selecciones de máxima certeza en equipos conocidos. Diseñado para maximizar aciertos y proteger banca.`,
    tipoGenerador: 'ultra_seguro',
    picks,
    metricas: calcularMetricasTicket(picks)
  };
}

export const generarTicketConservador = generarTicketUltraSeguro;

/**
 * 🎲 BOTÓN: TICKET ALEATORIO CON MAYOR PROBABILIDAD (EQUIPOS CONOCIDOS)
 *
 * Toma aleatoriamente entre los partidos de equipos conocidos con las selecciones de mayor
 * probabilidad estadística (Doble Oportunidad, +1.5 goles o favoritos sólidos con prob >= 65%).
 * Devuelve un ticket combinado fresco en cada ejecución sin salir de ligas top.
 */
export function generarTicketAleatorioMayorProbabilidad(partidos, numSelecciones = 3) {
  if (!partidos || partidos.length === 0) return null;

  // Filtrar exclusivamente equipos conocidos
  const poolConocidos = filtrarPartidosEquiposConocidos(partidos);
  if (poolConocidos.length < 2) return null;

  // Extraer el mejor pick (más seguro) de cada partido de equipos conocidos
  const mejoresPorPartido = poolConocidos.map(partido => {
    const candidatos = obtenerCandidatosPartido(partido, 0.62);
    // Preferir dobles oportunidades o líneas de goles seguras
    const preferente = candidatos.find(c => 
      (c.tipo === 'doble_oportunidad' && c.probDecimal >= 0.70) ||
      (c.tipo === 'goles' && c.probDecimal >= 0.72)
    ) || candidatos[0];
    return preferente || null;
  }).filter(Boolean);

  if (mejoresPorPartido.length === 0) return null;

  // Priorizar candidatos con prob >= 65%
  const altaProb = mejoresPorPartido.filter(c => c.probDecimal >= 0.65);
  const pool = altaProb.length >= numSelecciones ? altaProb : mejoresPorPartido;

  // Barajar aleatoriamente el pool de alta probabilidad
  const barajados = shuffle(pool);
  const cantidadEfectiva = Math.min(numSelecciones, barajados.length);
  const seleccionados = barajados.slice(0, cantidadEfectiva);

  const metricas = calcularMetricasTicket(seleccionados);

  return {
    id: `rnd-${Date.now()}`,
    titulo: 'Ticket Aleatorio de Alta Probabilidad',
    subtitulo: 'Generado al azar a partir de equipos conocidos con alta certeza estadística (Dixon-Coles)',
    tipoGenerador: 'aleatorio_alta_probabilidad',
    picks: seleccionados,
    metricas
  };
}

/**
 * ⚖️ GENERADOR DE TICKET DE RIESGO MODERADO (EQUIPOS CONOCIDOS)
 *
 * Busca y construye una combinada en ligas top cuya probabilidad conjunta caiga con precisión
 * dentro del rango de Riesgo Moderado (20% <= P <= 45%, típicamente 25% a 38%, cuota ~2.40 - 4.20).
 */
export function generarTicketRiesgoModerado(partidos, numSelecciones = 3, aleatorizar = true) {
  if (!partidos || partidos.length < 2) return null;

  // Filtrar exclusivamente equipos conocidos
  const poolConocidos = filtrarPartidosEquiposConocidos(partidos);
  if (poolConocidos.length < 2) return null;

  // Extraer candidatos con buena solidez (58% a 85% de probabilidad individual)
  const candidatosPorPartido = poolConocidos.map(p => {
    const c = obtenerCandidatosPartido(p, 0.58);
    const preferente = c.find(item => item.probDecimal >= 0.65 && item.probDecimal <= 0.85) || c[0];
    return preferente || null;
  }).filter(Boolean);

  if (candidatosPorPartido.length < 2) return null;

  let pool = aleatorizar ? shuffle(candidatosPorPartido) : candidatosPorPartido;
  let seleccionados = [];

  // Intentar encontrar una combinación que caiga exactamente en el rango moderado [0.20, 0.45]
  let mejorCombinacion = null;
  let menorDistancia = Infinity;
  const targetProb = 0.32; // Centro óptimo de riesgo moderado (cuota ~3.10)

  const maxIntentos = Math.min(100, pool.length * 6);
  for (let i = 0; i < maxIntentos; i++) {
    const muestra = shuffle(pool).slice(0, Math.min(numSelecciones, pool.length));
    const pConjunta = muestra.reduce((acc, it) => acc * it.probDecimal, 1);

    if (pConjunta >= 0.20 && pConjunta <= 0.45) {
      mejorCombinacion = muestra;
      break;
    }

    const dist = Math.abs(pConjunta - targetProb);
    if (dist < menorDistancia) {
      menorDistancia = dist;
      mejorCombinacion = muestra;
    }
  }

  seleccionados = mejorCombinacion || pool.slice(0, Math.min(numSelecciones, pool.length));
  const metricas = calcularMetricasTicket(seleccionados);

  return {
    id: `mod-${Date.now()}`,
    titulo: 'Combinada de Riesgo Moderado',
    subtitulo: 'Balance calibrado entre probabilidad matemática (20% - 45%) y cuota atractiva en ligas top',
    tipoGenerador: 'riesgo_moderado',
    picks: seleccionados,
    metricas
  };
}

/**
 * ⚽ TICKET ESPECIAL GOLES (LÍNEAS SEGURAS EN LIGAS TOP)
 * Selecciona mercados de goles (+1.5 o -3.5) con alta probabilidad en equipos conocidos.
 */
export function generarTicketGoles(partidos, numSelecciones = 3) {
  if (!partidos || partidos.length < 2) return null;

  const poolConocidos = filtrarPartidosEquiposConocidos(partidos);
  if (poolConocidos.length < 2) return null;

  const picksGoles = [];
  poolConocidos.forEach(p => {
    const c = obtenerCandidatosPartido(p, 0.65).filter(item => item.tipo === 'goles');
    if (c.length > 0) {
      picksGoles.push(c[0]);
    }
  });

  if (picksGoles.length < 2) return null;

  picksGoles.sort((a, b) => b.probDecimal - a.probDecimal);
  const picks = picksGoles.slice(0, Math.min(numSelecciones, picksGoles.length));

  return {
    id: 'goles-default',
    titulo: 'Combinada de Goles Seguros',
    subtitulo: 'Especializada en líneas de goles (+1.5 o -3.5) con alta consistencia de Poisson en ligas top',
    tipoGenerador: 'goles',
    picks,
    metricas: calcularMetricasTicket(picks)
  };
}

/**
 * 💎 TICKET DE VALOR MATEMÁTICO (+EV PRO)
 * Combina las selecciones con mayor valor esperado (+EV) en equipos conocidos.
 */
export function generarTicketValorEV(partidos, numSelecciones = 3) {
  if (!partidos || partidos.length < 2) return null;

  const poolConocidos = filtrarPartidosEquiposConocidos(partidos);
  if (poolConocidos.length < 2) return null;

  const candidatos = [];
  poolConocidos.forEach(p => {
    const c = obtenerCandidatosPartido(p, 0.55);
    if (c.length > 0) {
      const sortedByEv = [...c].sort((a, b) => (b.ev || 0) - (a.ev || 0));
      candidatos.push(sortedByEv[0]);
    }
  });

  if (candidatos.length < 2) return null;

  candidatos.sort((a, b) => (b.ev || 0) - (a.ev || 0));
  const picks = candidatos.slice(0, Math.min(numSelecciones, candidatos.length));

  return {
    id: 'valor-ev-default',
    titulo: 'Combinada de Valor Esperado (+EV)',
    subtitulo: 'Selecciones donde la estimación matemática supera la cuota promedio del mercado en ligas top',
    tipoGenerador: 'valor',
    picks,
    metricas: calcularMetricasTicket(picks)
  };
}

/**
 * Genera el paquete completo de combinaciones sugeridas para la vista principal.
 * Coloca en primer lugar el Ticket Ultra Seguro (Mínimo Riesgo).
 */
export function generarTodasLasCombinadasSugeridas(partidos) {
  if (!partidos || partidos.length === 0) return [];

  const sugeridas = [];

  // 1. Ticket Ultra Seguro (Mínimo Riesgo - 2 picks de máxima certidumbre en equipos conocidos)
  const ticketUltraSeguro = generarTicketUltraSeguro(partidos, 2);
  if (ticketUltraSeguro) sugeridas.push(ticketUltraSeguro);

  // 2. Ticket Riesgo Moderado (Zona Óptima de Valor)
  const ticketModerado = generarTicketRiesgoModerado(partidos, 3, false);
  if (ticketModerado) sugeridas.push(ticketModerado);

  // 3. Ticket Aleatorio de Alta Probabilidad (Equipos conocidos)
  const ticketAleatorio = generarTicketAleatorioMayorProbabilidad(partidos, 3);
  if (ticketAleatorio) sugeridas.push(ticketAleatorio);

  // 4. Ticket Especial de Goles
  const ticketGoles = generarTicketGoles(partidos, 3);
  if (ticketGoles) sugeridas.push(ticketGoles);

  // 5. Ticket de Valor Matemático
  const ticketValor = generarTicketValorEV(partidos, 3);
  if (ticketValor) sugeridas.push(ticketValor);

  return sugeridas;
}
