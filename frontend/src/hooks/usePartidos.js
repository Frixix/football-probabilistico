import { useState, useEffect } from 'react';

export const usePartidos = () => {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        // 1. Traemos las llaves secretas que guardaste en Vercel (y que Vite permite leer)
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        // 2. Calculamos la fecha de hoy en hora de Colombia (YYYY-MM-DD)
        const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

        // 3. 🔥 AQUÍ ESTÁ LA NUEVA MAGIA: Vamos directo a tu tabla en Supabase
        const response = await fetch(`${supabaseUrl}/rest/v1/historial_predicciones?fecha=eq.${hoy}&select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Error en la respuesta de Supabase');
        }
        
        const data = await response.json();
        
        // Supabase nos devuelve directamente la lista de partidos en un arreglo [ {...}, {...} ]
        setPartidos(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchPartidos();
  }, []);

  return { partidos, cargando, error };
};