import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 🔥 Reconectamos Supabase directamente aquí
// Nota: Si tenías tus llaves escritas entre comillas, pégalas aquí. 
// Si usabas variables de entorno, import.meta.env las leerá automáticamente.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'PEGA_AQUI_TU_URL_SI_LA_TENIAS_QUEMADA';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'PEGA_AQUI_TU_LLAVE_SI_LA_TENIAS_QUEMADA';
const supabase = createClient(supabaseUrl, supabaseKey);

export function usePartidos() {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        setCargando(true);
        
        // Fecha dinámica anclada a la zona horaria de Bogotá
        const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
        console.log(`📅 Buscando partidos frescos para la fecha: ${hoy}`);

        // Consultamos a Supabase solo los partidos de hoy
        const { data, error } = await supabase
          .from('historial_predicciones')
          .select('*')
          .eq('fecha', hoy);

        if (error) {
          throw error;
        }
        
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