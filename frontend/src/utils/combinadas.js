import { generarMercadosCompletos } from './markets';

/**
 * Motor Cuantitativo de Combinadas y Generador Automático de Tickets
 *
 * Clasificación de Riesgo:
 * - Riesgo Controlado: P >= 0.45 (Cuota ~1.50 - 2.20)
 * - Riesgo Moderado:   0.20 <= P < 0.45 (Cuota ~2.22 - 5.00) -> Zona Óptima de Valor
 * - Alto Riesgo:       P < 0.20 (Cuota > 5.00)
 */

export const RANGOS_RIESGO = {
  CONTROLADO: { min: 0.45, max: 1.00, label: 'Riesgo Controlado', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  MODERADO:   { min: 0.20, max: 0.45, label: 'Riesgo Moderado',   color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  ALTO:       { min: 0.00, max: 0.20, label: 'Alto Riesgo',       color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
};

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
 * 🎲 BOTÓN: TICKET ALEATORIO CON MAYOR PROBABILIDAD
 *
 * Toma aleatoriamente entre los partidos disponibles con las selecciones de mayor
 * probabilidad estadística (ej. Doble Oportunidad, +1.5 goles o favoritos sólidos con prob >= 65%).
 * Devuelve un ticket combinado fresco en cada ejecución.
 */
export function generarTicketAleatorioMayorProbabilidad(partidos, numSelecciones = 3) {
  if (!partidos || partidos.length === 0) return null;

  // Extraer el mejor pick (más seguro) de cada partido disponible
  const mejoresPorPartido = partidos.map(partido => {
    const candidatos = obtenerCandidatosPartido(partido, 0.60);
    // Tomar el de más alta probabilidad
    return candidatos[0] || null;
  }).filter(Boolean);

  if (mejoresPorPartido.length === 0) return null;

  // Filtrar o priorizar partidos con prob >= 65%
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
    subtitulo: 'Generado al azar a partir de las selecciones de mayor certeza estadística',
    tipoGenerador: 'aleatorio_alta_probabilidad',
    picks: seleccionados,
    metricas
  };
}

/**
 * ⚖️ GENERADOR DE TICKET DE RIESGO MODERADO
 *
 * Busca y construye una combinada cuya probabilidad conjunta caiga con precisión
 * dentro del rango de Riesgo Moderado (20% <= P <= 45%, típicamente 25% a 38%, cuota ~2.40 - 4.20).
 */
export function generarTicketRiesgoModerado(partidos, numSelecciones = 3, aleatorizar = true) {
  if (!partidos || partidos.length < 2) return null;

  // Extraer candidatos con buena solidez (58% a 85% de probabilidad individual)
  const candidatosPorPartido = partidos.map(p => {
    const c = obtenerCandidatosPartido(p, 0.58);
    // Preferir dobles oportunidades o líneas de goles seguras para combinadas moderadas
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
    subtitulo: 'Balance calibrado entre probabilidad matemática (20% - 45%) y cuota atractiva',
    tipoGenerador: 'riesgo_moderado',
    picks: seleccionados,
    metricas
  };
}

/**
 * 🛡️ TICKET CONSERVADOR (RIESGO CONTROLADO)
 * 2 selecciones de máxima probabilidad (> 75-80% cada una) para una combinada de prob >= 50%.
 */
export function generarTicketConservador(partidos) {
  if (!partidos || partidos.length < 2) return null;

  const mejoresPicks = [];
  partidos.forEach(p => {
    const c = obtenerCandidatosPartido(p, 0.70);
    if (c.length > 0) {
      mejoresPicks.push(c[0]);
    }
  });

  if (mejoresPicks.length < 2) {
    // Si no hay tantos de 70%, tomar los top de cada uno
    const fallback = partidos.map(p => obtenerCandidatosPartido(p, 0.50)[0]).filter(Boolean);
    fallback.sort((a, b) => b.probDecimal - a.probDecimal);
    if (fallback.length < 2) return null;
    const picks = fallback.slice(0, 2);
    return {
      id: 'conservador-default',
      titulo: 'Doble de Alta Seguridad',
      subtitulo: '2 selecciones con la máxima confianza disponible de la jornada',
      tipoGenerador: 'controlado',
      picks,
      metricas: calcularMetricasTicket(picks)
    };
  }

  mejoresPicks.sort((a, b) => b.probDecimal - a.probDecimal);
  const picks = mejoresPicks.slice(0, 2);

  return {
    id: 'conservador-default',
    titulo: 'Doble de Riesgo Controlado',
    subtitulo: 'Máxima tasa de acierto estimada con cuota moderada (P > 45%)',
    tipoGenerador: 'controlado',
    picks,
    metricas: calcularMetricasTicket(picks)
  };
}

/**
 * ⚽ TICKET ESPECIAL GOLES (LÍNEAS SEGURAS)
 * Selecciona mercados de goles (+1.5 o -3.5) con alta probabilidad.
 */
export function generarTicketGoles(partidos, numSelecciones = 3) {
  if (!partidos || partidos.length < 2) return null;

  const picksGoles = [];
  partidos.forEach(p => {
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
    subtitulo: 'Especializada en líneas de goles (+1.5 o -3.5) con alta consistencia de Poisson',
    tipoGenerador: 'goles',
    picks,
    metricas: calcularMetricasTicket(picks)
  };
}

/**
 * 💎 TICKET DE VALOR MATEMÁTICO (+EV PRO)
 * Combina las selecciones con mayor valor esperado (+EV) y respaldo probabilístico.
 */
export function generarTicketValorEV(partidos, numSelecciones = 3) {
  if (!partidos || partidos.length < 2) return null;

  const candidatos = [];
  partidos.forEach(p => {
    const c = obtenerCandidatosPartido(p, 0.55);
    if (c.length > 0) {
      // Ordenar por EV descendente y tomar el mejor
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
    subtitulo: 'Selecciones donde la estimación matemática supera la cuota promedio del mercado',
    tipoGenerador: 'valor',
    picks,
    metricas: calcularMetricasTicket(picks)
  };
}

/**
 * Genera el paquete completo de combinaciones sugeridas para la vista principal.
 */
export function generarTodasLasCombinadasSugeridas(partidos) {
  if (!partidos || partidos.length === 0) return [];

  const sugeridas = [];

  // 1. Ticket Riesgo Moderado (Prioridad solicitada por el usuario)
  const ticketModerado = generarTicketRiesgoModerado(partidos, 3, false);
  if (ticketModerado) sugeridas.push(ticketModerado);

  // 2. Ticket Aleatorio de Alta Probabilidad (Ejemplo explícito del usuario)
  const ticketAleatorio = generarTicketAleatorioMayorProbabilidad(partidos, 3);
  if (ticketAleatorio) sugeridas.push(ticketAleatorio);

  // 3. Ticket Conservador (Riesgo Controlado)
  const ticketConservador = generarTicketConservador(partidos);
  if (ticketConservador) sugeridas.push(ticketConservador);

  // 4. Ticket Especial de Goles
  const ticketGoles = generarTicketGoles(partidos, 3);
  if (ticketGoles) sugeridas.push(ticketGoles);

  // 5. Ticket de Valor Matemático
  const ticketValor = generarTicketValorEV(partidos, 3);
  if (ticketValor) sugeridas.push(ticketValor);

  return sugeridas;
}
