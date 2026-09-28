import { useState, useEffect } from 'react';

export const usePartidos = () => {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        const response = await fetch("https://football-probabilistico.vercel.app/api/partidos");
        if (!response.ok) throw new Error("Error en la respuesta del servidor");
        const data = await response.json();
        setPartidos(data);
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