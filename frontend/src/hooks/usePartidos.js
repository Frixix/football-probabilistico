import { useState, useEffect } from 'react';

export const usePartidos = () => {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        // 🔥 El '.trim()' elimina cualquier espacio o salto de línea invisible
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Faltan las variables de entorno en Vercel.");
        }

        const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
        
        // Construimos la URL limpia
        const urlFinal = `${supabaseUrl}/rest/v1/historial_predicciones?fecha=eq.${hoy}&select=*`;
        console.log("🚀 Disparando a:", urlFinal);

        const response = await fetch(urlFinal, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(`Supabase rechazó la petición: ${errData.error || errData.message || 'Error Desconocido'}`);
        }
        
        const data = await response.json();
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