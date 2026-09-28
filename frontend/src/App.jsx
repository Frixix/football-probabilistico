import { useState } from 'react';
import MatchList from './components/MatchList';
import BetSlip from './components/BetSlip';
import { usePartidos } from './hooks/usePartidos'; // Importamos nuestro nuevo hook profesional
import './App.css';

function App() {
  // Lógica separada y limpia
  const { partidos, cargando, error } = usePartidos();
  const [ticket, setTicket] = useState([]);

  const agregarAlTicket = (partido) => {
    if (!ticket.find(item => item.id === partido.id)) {
      setTicket([...ticket, partido]);
    }
  };
  const removerDelTicket = (id) => setTicket(ticket.filter(item => item.id !== id));
  const limpiarTicket = () => setTicket([]);

  return (
    <div className="app-container">
      
      {/* 1. EL BANNER PREMIUM (HERO SECTION) */}
      <header className="hero-banner">
        <div className="hero-content">
          <h1 className="hero-title">
            Poisson Predictor <span className="badge">PRO</span>
          </h1>
          <p className="hero-subtitle">Dashboard Estadístico de Probabilidades Deportivas</p>
          
          {/* Indicadores Clave (KPIs) */}
          <div className="kpi-container">
            <div className="kpi-card">
              <span className="kpi-value">{partidos.length}</span>
              <span className="kpi-label">Partidos Analizados</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-value">Live</span>
              <span className="kpi-label">Estado del Sistema</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-value">5</span>
              <span className="kpi-label">Mercados Habilitados</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. EL CONTENIDO PRINCIPAL */}
      <main className="main-content">
        {error && <div className="error-msg">⚠️ Error de conexión: {error}</div>}
        
        {cargando ? (
          <div className="loader">Generando matriz de Poisson...</div>
        ) : (
          <div className="dashboard-grid">
            <section className="matches-section">
              <MatchList partidos={partidos} onAddTicket={agregarAlTicket} />
            </section>
            
            <aside className="betslip-section">
              <BetSlip ticket={ticket} onRemove={removerDelTicket} onClear={limpiarTicket} />
            </aside>
          </div>
        )}
      </main>
      
    </div>
  );
}

export default App;