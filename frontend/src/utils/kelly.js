/**
 * Utilidades Cuantitativas para el Criterio de Kelly Fraccional
 *
 * Fundamento Matemático (Kelly 1956, Thorp 2006):
 * f* = (b * p - q) / b = (o * p - 1) / (o - 1) = EV_decimal / (o - 1)
 * Donde:
 *   p: Probabilidad estimada por el modelo calibrado (0 a 1)
 *   o: Cuota ofrecida por el mercado
 *   b: Beneficio neto por unidad arriesgada (b = o - 1)
 *   q: Probabilidad de perder (1 - p)
 *   EV: p * o - 1 (Expected Value)
 *
 * Kelly Fraccional:
 * f_frac = fraccion * f*
 */

export const FRACCIONES_KELLY = [
  { id: 'quarter', fraccion: 0.25, etiqueta: '1/4 Kelly (Recomendado)', desc: 'Equilibrio óptimo: 75% menor volatilidad que Full Kelly' },
  { id: 'half', fraccion: 0.50, etiqueta: '1/2 Kelly (Moderado)', desc: 'Mayor agresividad para crecimiento rápido del bankroll' },
  { id: 'eighth', fraccion: 0.125, etiqueta: '1/8 Kelly (Conservador)', desc: 'Máxima protección del capital contra rachas negativas' }
];

export const BANKROLL_DEFAULT = 200000; // $200.000 COP por defecto
export const TOPE_MAX_STAKE_PCT = 0.05; // 5% de seguridad máxima por apuesta

export function calcularKelly({
  probabilidad,
  cuota,
  bankroll = BANKROLL_DEFAULT,
  fraccion = 0.25,
  maxStakePct = TOPE_MAX_STAKE_PCT
}) {
  const probNum = parseFloat(probabilidad) || 0;
  const p = probNum > 1 ? probNum / 100 : probNum;
  const o = parseFloat(cuota) || 1.0;

  if (p <= 0 || p >= 1 || o <= 1.0) {
    return {
      fKellyFull: 0,
      fKellyFrac: 0,
      pctRecomendado: 0,
      stakeRecomendado: 0,
      evDecimal: 0,
      evPct: 0,
      esPositivo: false,
      topeAlcanzado: false,
      razon: 'Sin ventaja o cuota insuficiente'
    };
  }

  // Valor esperado: EV = (p * o) - 1
  const evDecimal = (p * o) - 1;
  const evPct = parseFloat((evDecimal * 100).toFixed(2));

  // Si no hay ventaja matemática, Kelly prescribe NO apostar (stake = 0)
  if (evDecimal <= 0) {
    return {
      fKellyFull: 0,
      fKellyFrac: 0,
      pctRecomendado: 0,
      stakeRecomendado: 0,
      evDecimal,
      evPct,
      esPositivo: false,
      topeAlcanzado: false,
      razon: 'Sin valor esperado (+EV ≤ 0). Kelly prescribe no apostar.'
    };
  }

  const b = o - 1.0;
  const fFull = evDecimal / b;
  const fFracBruto = fFull * fraccion;
  const fFracSeguro = Math.min(fFracBruto, maxStakePct);

  const pctRecomendado = parseFloat((fFracSeguro * 100).toFixed(2));
  const stakeRecomendado = Math.round(bankroll * fFracSeguro);

  return {
    fKellyFull: parseFloat((fFull * 100).toFixed(2)),
    fKellyFrac: pctRecomendado,
    pctRecomendado,
    stakeRecomendado,
    evDecimal,
    evPct,
    esPositivo: true,
    topeAlcanzado: fFracBruto > maxStakePct,
    razon: `Kelly ${(fraccion * 100).toFixed(0)}% sugiere apostar el ${pctRecomendado}% de la banca`
  };
}
