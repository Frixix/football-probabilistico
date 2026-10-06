import { useState, useEffect } from 'react';

export const usePartidos = () => {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Faltan las variables de entorno.");
        }

        const hoy = '2026-10-01';
        
        // 🔥 TRUCO DEFINITIVO: Pegamos la llave de acceso (?apikey=...) directamente al final de la URL
        const urlFinal = `${supabaseUrl}/rest/v1/historial_predicciones?fecha=eq.${hoy}&select=*&apikey=${supabaseKey}`;
        
        console.log("🚀 Disparando URL blindada");

        const response = await fetch(urlFinal, {
          headers: {
            // Mantenemos el Authorization por protocolo estándar de Supabase
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(`Error: ${errData.message || response.statusText}`);
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