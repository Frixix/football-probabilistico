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
      setTimeout(() => {
        const datosSimulados = [
          { id: 1, local: "Netherlands", visitante: "Germany", mercado: "Gana Netherlands", prob: 0.55 },
          { id: 2, local: "Colombia", visitante: "Uruguay", mercado: "Menos de 2.5 Goles", prob: 0.72 },
          { id: 3, local: "England", visitante: "Spain", mercado: "Ambos Marcan: Sí", prob: 0.65 },
          { id: 4, local: "Argentina", visitante: "Chile", mercado: "Gana Argentina", prob: 0.82 }
        ];
        setPartidos(datosSimulados);
        setCargando(false);
      }, 2000);
    };
    pedirDatosAPython();
  }, []);

  const agregarAlTicket = (partido) => {
    const yaExiste = ticket.find(item => item.id === partido.id);
    if (!yaExiste) {
      setTicket([...ticket, partido]);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Dashboard de Probabilidades</h1>
      <hr style={{ marginBottom: '20px' }} />

      {cargando ? (
        <p>Calculando predicciones con el modelo de Poisson...</p>
      ) : (
        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
          {/* Aquí inyectamos nuestros nuevos componentes y les pasamos los datos (Props) */}
          <MatchList partidos={partidos} onAddTicket={agregarAlTicket} />
          <BetSlip ticket={ticket} />
        </div>
      )}
    </div>
  )
}

export default App