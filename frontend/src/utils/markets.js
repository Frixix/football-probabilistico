/**
 * Motor Cuantitativo de Mercados Derivados (Poisson / Dixon-Coles)
 *
 * Expansión analítica de mercados a partir de la matriz de probabilidades:
 * 1. 1X2 Ganador (Local, Empate, Visitante)
 * 2. Doble Oportunidad (1X, X2, 12): P(1X) = P(1) + P(X), P(X2) = P(X) + P(2), P(12) = P(1) + P(2)
 * 3. Líneas de Goles (+/- 1.5, +/- 2.5, +/- 3.5): Suma acumulada de diagonales i+j > k
 * 4. Ambos Marcan (BTTS Sí / No)
 */

function factorial(n) {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function poissonPMF(k, mu) {
  if (mu <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(mu, k) * Math.exp(-mu)) / factorial(k);
}

function dixonColesTau(x, y, muL, muV, rho = -0.11) {
  if (x === 0 && y === 0) return 1.0 - (muL * muV * rho);
  if (x === 0 && y === 1) return 1.0 + (muL * rho);
  if (x === 1 && y === 0) return 1.0 + (muV * rho);
  if (x === 1 && y === 1) return 1.0 - rho;
  return 1.0;
}

export function generarMatrizDixonColesJS(muL, muV, maxGoles = 10, rho = -0.11) {
  const dim = maxGoles + 1;
  const distL = new Array(dim);
  const distV = new Array(dim);

  for (let i = 0; i < dim; i++) {
    distL[i] = poissonPMF(i, muL);
    distV[i] = poissonPMF(i, muV);
  }

  const matriz = [];
  let sumaTotal = 0;

  for (let i = 0; i < dim; i++) {
    const fila = new Array(dim);
    for (let j = 0; j < dim; j++) {
      let p = distL[i] * distV[j];
      const tau = dixonColesTau(i, j, muL, muV, rho);
      p = Math.max(0, p * tau);
      fila[j] = p;
      sumaTotal += p;
    }
    matriz.push(fila);
  }

  // Normalización estocástica
  if (sumaTotal > 0) {
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        matriz[i][j] /= sumaTotal;
      }
    }
  }

  return matriz;
}

/**
 * Calibra tasas mu_l y mu_v a partir de la información de partido si no vienen explícitas.
 */
function inferirTasasMu(partido) {
  let muL = parseFloat(partido.mu_local);
  let muV = parseFloat(partido.mu_visitante);
  if (!isNaN(muL) && !isNaN(muV) && muL > 0 && muV > 0) {
    return { muL, muV };
  }

  const probNum = parseFloat(partido.probabilidad) || 50;
  const p = probNum > 1 ? probNum / 100 : probNum;
  const mercado = (partido.mercado_predicho || partido.mercado || '').toLowerCase();

  // Inferencia coherente
  if (mercado.includes('gana') || mercado.includes('1') || mercado.includes('local')) {
    muL = 1.2 + (p * 0.9);
    muV = Math.max(0.6, 2.0 - muL);
  } else if (mercado.includes('visita') || mercado.includes('2')) {
    muV = 1.2 + (p * 0.9);
    muL = Math.max(0.6, 2.0 - muV);
  } else if (mercado.includes('empate') || mercado.includes('x')) {
    muL = 1.1;
    muV = 1.1;
  } else if (mercado.includes('menos') || mercado.includes('under')) {
    const totalGoles = 1.6 + ((1 - p) * 1.2);
    muL = totalGoles * 0.55;
    muV = totalGoles * 0.45;
  } else if (mercado.includes('más') || mercado.includes('mas') || mercado.includes('over')) {
    const totalGoles = 2.4 + (p * 1.1);
    muL = totalGoles * 0.55;
    muV = totalGoles * 0.45;
  } else {
    muL = 1.45;
    muV = 1.15;
  }

  return { muL, muV };
}

/**
 * Genera todos los mercados derivados para un partido específico
 */
export function generarMercadosCompletos(partido) {
  const { muL, muV } = inferirTasasMu(partido);
  const matriz = generarMatrizDixonColesJS(muL, muV, 10);
  const dim = matriz.length;

  // 1. 1X2 Ganador
  let pLocal = 0;
  let pEmpate = 0;
  let pVisita = 0;

  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      const p = matriz[i][j];
      if (i > j) pLocal += p;
      else if (i === j) pEmpate += p;
      else pVisita += p;
    }
  }

  // 2. Doble Oportunidad
  const p1X = pLocal + pEmpate;
  const pX2 = pEmpate + pVisita;
  const p12 = pLocal + pVisita;

  // 3. Líneas de Goles (+/- 1.5, +/- 2.5, +/- 3.5)
  const lineasGoles = { 1.5: { over: 0, under: 0 }, 2.5: { over: 0, under: 0 }, 3.5: { over: 0, under: 0 } };

  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      const p = matriz[i][j];
      const goles = i + j;
      if (goles > 1.5) lineasGoles[1.5].over += p; else lineasGoles[1.5].under += p;
      if (goles > 2.5) lineasGoles[2.5].over += p; else lineasGoles[2.5].under += p;
      if (goles > 3.5) lineasGoles[3.5].over += p; else lineasGoles[3.5].under += p;
    }
  }

  // 4. Ambos Marcan (BTTS)
  let pBttsSi = 0;
  let pBttsNo = 0;
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      const p = matriz[i][j];
      if (i > 0 && j > 0) pBttsSi += p;
      else pBttsNo += p;
    }
  }

  const fmtItem = (label, prob, tipo) => {
    const probPct = parseFloat((prob * 100).toFixed(1));
    const cuota = prob > 0 ? parseFloat((1 / prob).toFixed(2)) : 1.0;
    return {
      etiqueta: label,
      prob: probPct,
      cuota,
      tipo
    };
  };

  const local = partido.local || 'Local';
  const visitante = partido.visitante || 'Visitante';

  return {
    '1x2': [
      fmtItem(`Gana ${local}`, pLocal, '1x2'),
      fmtItem('Empate', pEmpate, '1x2'),
      fmtItem(`Gana ${visitante}`, pVisita, '1x2')
    ],
    'doble_oportunidad': [
      fmtItem(`1X (${local} o Empate)`, p1X, 'doble_oportunidad'),
      fmtItem(`X2 (Empate o ${visitante})`, pX2, 'doble_oportunidad'),
      fmtItem(`12 (${local} o ${visitante})`, p12, 'doble_oportunidad')
    ],
    'goles': [
      fmtItem('Más de 1.5 Goles', lineasGoles[1.5].over, 'goles'),
      fmtItem('Menos de 1.5 Goles', lineasGoles[1.5].under, 'goles'),
      fmtItem('Más de 2.5 Goles', lineasGoles[2.5].over, 'goles'),
      fmtItem('Menos de 2.5 Goles', lineasGoles[2.5].under, 'goles'),
      fmtItem('Más de 3.5 Goles', lineasGoles[3.5].over, 'goles'),
      fmtItem('Menos de 3.5 Goles', lineasGoles[3.5].under, 'goles')
    ],
    'btts': [
      fmtItem('Ambos Marcan: Sí', pBttsSi, 'btts'),
      fmtItem('Ambos Marcan: No', pBttsNo, 'btts')
    ]
  };
}
