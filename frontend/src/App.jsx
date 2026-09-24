import { useState, useEffect } from 'react'
import MatchList from './components/MatchList'
import BetSlip from './components/BetSlip'
import './App.css'

function App() {
  const [partidos, setPartidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [ticket, setTicket] = useState([])

  useEffect(() => {
    const pedirDatosAPython = async () => {
      try {
        // Hacemos la petición real a nuestra API de Python (FastAPI)
        const respuesta = await fetch('http://localhost:8000/api/partidos');
        const datosReales = await respuesta.json();
        
        setPartidos(datosReales);
      } catch (error) {
        console.error("Error conectando con Python:", error);
      } finally {
        setCargando(false);
      }
    };
    
    pedirDatosAPython();
  }, []);

  const agregarAlTicket = (partido) => {
    const yaExiste = ticket.find(item => item.id === partido.id);
    if (!yaExiste) {
      setTicket([...ticket, partido]);
    }
  };

  // NUEVA FUNCIÓN: Filtra el array para dejar todos los partidos excepto el que queremos borrar
  const removerDelTicket = (id) => {
    setTicket(ticket.filter(item => item.id !== id));
  };

  // NUEVA FUNCIÓN: Vacía el array completamente
  const limpiarTicket = () => {
    setTicket([]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1> Dashboard de Probabilidades</h1>
      <hr style={{ marginBottom: '20px' }} />

      {cargando ? (
        <p> Calculando predicciones con el modelo de Poisson...</p>
      ) : (
        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
          <MatchList partidos={partidos} onAddTicket={agregarAlTicket} />
          
          {/* Pasamos las nuevas funciones al BetSlip */}
          <BetSlip 
            ticket={ticket} 
            onRemove={removerDelTicket} 
            onClear={limpiarTicket} 
          />
        </div>
      )}
    </div>
  )
}

export default App