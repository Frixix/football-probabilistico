import { useState, useEffect } from 'react';

export const usePartidos = () => {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        // 🔥 AQUÍ ESTÁ LA MAGIA: Apuntamos al nuevo servidor Python
        const response = await fetch('http://127.0.0.1:8000/api/predicciones');
        
        if (!response.ok) {
          throw new Error('Error en la respuesta del servidor');
        }
        
        const data = await response.json();
        
        // FastAPI nos devuelve un objeto { partidos: [...] }
        setPartidos(data.partidos || []);
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