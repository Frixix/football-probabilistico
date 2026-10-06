import { useState, useEffect } from 'react';

export const usePartidos = () => {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        // 🚨 DETECTOR PARA LA CONSOLA
        console.log("🔍 URL de Supabase:", supabaseUrl);
        console.log("🔑 Llave Anon:", supabaseKey ? "¡Sí hay llave!" : "VACÍA / UNDEFINED");

        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Faltan las variables de entorno en Vercel. Revisa los nombres.");
        }

        const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

        const response = await fetch(`${supabaseUrl}/rest/v1/historial_predicciones?fecha=eq.${hoy}&select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(`Supabase rechazó la petición: ${errData.message || response.statusText}`);
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