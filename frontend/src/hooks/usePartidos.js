import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 🔥 TUS LLAVES (Asegúrate de que queden DENTRO de las comillas simples ' ' )
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'PEGA_AQUI_TU_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'PEGA_AQUI_TU_LLAVE';
const supabase = createClient(supabaseUrl, supabaseKey);

export function usePartidos() {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        setCargando(true);
        
        // Fecha dinámica anclada a Bogotá
        const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
        
        // Consulta a Supabase
        const { data, error } = await supabase
          .from('historial_predicciones')
          .select('*')
          .eq('fecha', hoy);

        if (error) throw error;
        
        setPartidos(data || []);
      } catch (err) {
        console.error("Error obteniendo los partidos:", err);
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchPartidos();
  }, []);

  return { partidos, cargando, error };
}