import { useState, useEffect, useCallback } from 'react';
import { calcularKelly, BANKROLL_DEFAULT, FRACCIONES_KELLY, TOPE_MAX_STAKE_PCT } from '../utils/kelly';

const STORAGE_BANKROLL_KEY = 'pp_user_bankroll';
const STORAGE_KELLY_KEY = 'pp_user_kelly_frac';

export function useBankroll() {
  const [bankroll, setBankrollState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BANKROLL_KEY);
      return saved ? Math.max(10000, parseInt(saved, 10)) : BANKROLL_DEFAULT;
    } catch {
      return BANKROLL_DEFAULT;
    }
  });

  const [fraccionKelly, setFraccionKellyState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KELLY_KEY);
      return saved ? parseFloat(saved) : 0.25;
    } catch {
      return 0.25;
    }
  });

  const setBankroll = useCallback((nuevoValor) => {
    const val = Math.max(1000, parseInt(nuevoValor, 10) || 0);
    setBankrollState(val);
    try {
      localStorage.setItem(STORAGE_BANKROLL_KEY, val.toString());
    } catch (e) {
      console.warn("No se pudo guardar bankroll en localStorage:", e);
    }
  }, []);

  const setFraccionKelly = useCallback((nuevaFraccion) => {
    const val = parseFloat(nuevaFraccion) || 0.25;
    setFraccionKellyState(val);
    try {
      localStorage.setItem(STORAGE_KELLY_KEY, val.toString());
    } catch (e) {
      console.warn("No se pudo guardar fracción de Kelly en localStorage:", e);
    }
  }, []);

  const calcularStakeOptimo = useCallback((probabilidad, cuota) => {
    return calcularKelly({
      probabilidad,
      cuota,
      bankroll,
      fraccion: fraccionKelly,
      maxStakePct: TOPE_MAX_STAKE_PCT
    });
  }, [bankroll, fraccionKelly]);

  return {
    bankroll,
    setBankroll,
    fraccionKelly,
    setFraccionKelly,
    fraccionesDisponibles: FRACCIONES_KELLY,
    calcularStakeOptimo
  };
}
