import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'PEGA_AQUI_TU_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'PEGA_AQUI_TU_LLAVE';
const supabase = createClient(supabaseUrl, supabaseKey);

const STAKE_PLANO = 10000; // Simulación con apuesta fija de $10,000 COP

export function useHistorial() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistorial = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      
      const { data, error: err } = await supabase
        .from('historial_predicciones')
        .select('*')
        .order('fecha', { ascending: false });

      if (err) throw err;
      setDatos(data || []);
    } catch (err) {
      console.error("Error consultando historial de predicciones:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  // Cálculos de Backtesting cuantitativo en memoria
  const backtest = useMemo(() => {
    if (!datos || datos.length === 0) {
      return {
        total: 0,
        validados: 0,
        aciertos: 0,
        fallos: 0,
        pendientes: 0,
        hitRate: 0,
        profitTotal: 0,
        roi: 0,
        porMercado: {},
        curvaEquity: [],
        registros: []
      };
    }

    let aciertos = 0;
    let fallos = 0;
    let pendientes = 0;
    let profitAcumulado = 0;

    const porMercado = {
      '1x2': { total: 0, aciertos: 0, fallos: 0, profit: 0 },
      'goles': { total: 0, aciertos: 0, fallos: 0, profit: 0 },
      'btts': { total: 0, aciertos: 0, fallos: 0, profit: 0 }
    };

    // Ordenamos cronológicamente (más antiguo primero) para la curva de balance
    const cronologicos = [...datos].sort((a, b) => {
      const cmp = (a.fecha || '').localeCompare(b.fecha || '');
      if (cmp !== 0) return cmp;
      return (a.id_partido || 0) - (b.id_partido || 0);
    });

    const curvaEquity = [{ punto: 0, fecha: 'Inicio', balance: 0, acierto: null }];

    const registrosEnriquecidos = cronologicos.map((item, idx) => {
      const prob = parseFloat(item.probabilidad) || 50;
      const probDec = prob > 1 ? prob / 100 : prob;
      const cuota = probDec > 0 ? (1 / probDec) : 1.0;
      const cuotaFmt = parseFloat(cuota.toFixed(2));

      const mercadoStr = (item.mercado_predicho || item.mercado || '').toLowerCase();
      let categoria = '1x2';
      if (mercadoStr.includes('goles') || mercadoStr.includes('2.5')) categoria = 'goles';
      if (mercadoStr.includes('marcan')) categoria = 'btts';

      const terminado = item.goles_local !== null && item.goles_local !== undefined && item.goles_visitante !== null;
      let resultado = 'PENDIENTE';
      let profit = 0;

      if (terminado) {
        if (item.fue_acierto === true) {
          resultado = 'ACERTADO';
          aciertos++;
          profit = Math.round(STAKE_PLANO * (cuotaFmt - 1));
          if (porMercado[categoria]) {
            porMercado[categoria].aciertos++;
            porMercado[categoria].profit += profit;
          }
        } else {
          resultado = 'FALLADO';
          fallos++;
          profit = -STAKE_PLANO;
          if (porMercado[categoria]) {
            porMercado[categoria].fallos++;
            porMercado[categoria].profit += profit;
          }
        }
        if (porMercado[categoria]) porMercado[categoria].total++;
        profitAcumulado += profit;

        curvaEquity.push({
          punto: curvaEquity.length,
          fecha: item.fecha,
          balance: profitAcumulado,
          acierto: item.fue_acierto,
          local: item.local,
          visitante: item.visitante
        });
      } else {
        pendientes++;
      }

      return {
        ...item,
        cuota: cuotaFmt,
        categoria,
        resultado,
        profit,
        terminado
      };
    });

    const validados = aciertos + fallos;
    const hitRate = validados > 0 ? parseFloat(((aciertos / validados) * 100).toFixed(1)) : 0;
    const totalApostado = validados * STAKE_PLANO;
    const roi = totalApostado > 0 ? parseFloat(((profitAcumulado / totalApostado) * 100).toFixed(1)) : 0;

    return {
      total: datos.length,
      validados,
      aciertos,
      fallos,
      pendientes,
      hitRate,
      profitTotal: profitAcumulado,
      roi,
      porMercado,
      curvaEquity,
      // Los registros se muestran en orden inverso (más recientes arriba) para la tabla
      registros: [...registrosEnriquecidos].reverse()
    };
  }, [datos]);

  return {
    datos,
    cargando,
    error,
    backtest,
    recargar: fetchHistorial
  };
}
