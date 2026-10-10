import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 🔥 TUS LLAVES (Asegúrate de que queden DENTRO de las comillas simples ' ' )
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'PEGA_AQUI_TU_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'PEGA_AQUI_TU_LLAVE';
const supabase = createClient(supabaseUrl, supabaseKey);

export function usePartidos(fechaSeleccionada) {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Fecha dinámica anclada a Bogotá (UTC-5)
  const hoyBogota = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  const fechaEfectiva = fechaSeleccionada || hoyBogota;

  useEffect(() => {
    let cancelado = false;

    const fetchPartidos = async () => {
      try {
        setCargando(true);
        setError(null);
        
        // Consulta a Supabase por la fecha elegida
        const { data, error: err } = await supabase
          .from('historial_predicciones')
          .select('*')
          .eq('fecha', fechaEfectiva);

        if (err) throw err;
        
        if (!cancelado) {
          setPartidos(data || []);
        }
      } catch (err) {
        console.error("Error obteniendo los partidos:", err);
        if (!cancelado) {
          setError(err.message);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    fetchPartidos();

    return () => {
      cancelado = true;
    };
  }, [fechaEfectiva]);

  return { partidos, cargando, error, fechaEfectiva };
}