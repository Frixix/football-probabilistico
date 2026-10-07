import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Asegúrate de que esta ruta coincida con tu archivo de conexión

export function usePartidos() {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        setCargando(true);
        
        // 🔥 Tu lógica exacta: Fecha dinámica anclada a la zona horaria de Bogotá
        const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
        
        console.log(`📅 Buscando partidos frescos para la fecha: ${hoy}`);

        // Consultamos a Supabase solo los partidos del día actual
        const { data, error } = await supabase
          .from('historial_predicciones')
          .select('*')
          .eq('fecha', hoy);

        if (error) {
          throw error;
        }

        console.log("📦 Datos que llegaron de Supabase:", data);
        
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