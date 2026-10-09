import { useState, useMemo } from 'react';
import MatchList from './components/MatchList';
import BetSlip from './components/BetSlip';
import { usePartidos } from './hooks/usePartidos';
import './App.css';

function App() {
  const { partidos, cargando, error } = usePartidos();
  const [ticket, setTicket] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroMercado, setFiltroMercado] = useState('todos');
  const [soloTopLigas, setSoloTopLigas] = useState(false);

  // Manejadores de Ticket
  const agregarAlTicket = (partido) => {
    const id = partido.id_partido || partido.id;
    if (ticket.some(item => (item.id_partido || item.id) === id)) {
      // Si ya está, al hacer clic lo removemos (toggle)
      removerDelTicket(id);
    } else {
      setTicket(prev => [...prev, partido]);
    }
  };

  const removerDelTicket = (id) => {
    setTicket(prev => prev.filter(item => (item.id_partido || item.id) !== id));
  };

  const limpiarTicket = () => setTicket([]);

  // Filtrado reactivo por buscador y por top ligas
  const partidosFiltrados = useMemo(() => {
    if (!partidos) return [];
    return partidos.filter(p => {
      const matchBusqueda = 
        !busqueda || 
        (p.local && p.local.toLowerCase().includes(busqueda.toLowerCase())) ||
        (p.visitante && p.visitante.toLowerCase().includes(busqueda.toLowerCase())) ||
        (p.torneo && p.torneo.toLowerCase().includes(busqueda.toLowerCase()));

      if (!matchBusqueda) return false;

      if (soloTopLigas) {
        const torneo = (p.torneo || '').toLowerCase();
        const topKeywords = ['primera a', 'betplay', 'champions', 'premier league', 'la liga', 'serie a', 'bundesliga', 'ligue 1', 'libertadores', 'mls'];
        const esTop = topKeywords.some(kw => torneo.includes(kw));
        if (!esTop) return false;
      }

      return true;
    });
  }, [partidos, busqueda, soloTopLigas]);

  // KPIs dinámicos
  const totalLigas = useMemo(() => {
    return new Set(partidos.map(p => p.torneo)).size;
  }, [partidos]);

  const probPromedio = useMemo(() => {
    if (!partidos.length) return 0;
    const suma = partidos.reduce((acc, p) => {
      let num = parseFloat(p.probabilidad);
      if (isNaN(num)) num = 0;
      return acc + (num > 1 ? num : num * 100);
    }, 0);
    return (suma / partidos.length).toFixed(1);
  }, [partidos]);

  return (
    <div className="app-container">
      {/* 1. TOP NAVBAR HEADER */}
      <header className="main-navbar">
        <div className="navbar-content">
          <div className="brand-logo">
            <span className="logo-icon">⚽</span>
            <div className="logo-text">
              <span className="brand-title">POISSON <span className="brand-highlight">PREDICTOR</span></span>
              <span className="brand-version">PRO v2.0</span>
            </div>
          </div>

          <div className="navbar-status">
            <span className="status-indicator">
              <span className="status-dot"></span> MOTOR ACTIVO
            </span>
            <span className="system-time">Colombia (UTC-5)</span>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION CON KPIS */}
      <section className="hero-banner">
        <div className="hero-content">
          <h1 className="hero-title">
            Inteligencia Probabilística <span className="title-gradient">de Fútbol</span>
          </h1>
          <p className="hero-subtitle">
            Cálculo estadístico bivariado de marcadores exactos, mercados de valor y análisis riguroso sin sesgos.
          </p>

          {/* Widgets de KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-icon">📊</span>
              <div className="kpi-data">
                <span className="kpi-value">{partidos.length}</span>
                <span className="kpi-label">Partidos Analizados</span>
              </div>
            </div>

            <div className="kpi-card">
              <span className="kpi-icon">🏆</span>
              <div className="kpi-data">
                <span className="kpi-value">{totalLigas}</span>
                <span className="kpi-label">Ligas Disponibles</span>
              </div>
            </div>

            <div className="kpi-card">
              <span className="kpi-icon">🎯</span>
              <div className="kpi-data">
                <span className="kpi-value">{probPromedio}%</span>
                <span className="kpi-label">Confianza Promedio</span>
              </div>
            </div>

            <div className="kpi-card highlight-kpi">
              <span className="kpi-icon">🎟️</span>
              <div className="kpi-data">
                <span className="kpi-value">{ticket.length}</span>
                <span className="kpi-label">En Tu Ticket</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BARRA DE CONTROLES, BÚSQUEDA Y FILTROS */}
      <section className="controls-bar-container">
        <div className="controls-wrapper">
          {/* Buscador */}
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar equipo o torneo (ej. Real Madrid, BetPlay, Ibiza)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="btn-clear-search">✕</button>
            )}
          </div>

          {/* Filtros de Mercado */}
          <div className="filter-pills">
            <button 
              className={`filter-pill ${filtroMercado === 'todos' && !soloTopLigas ? 'active' : ''}`}
              onClick={() => { setFiltroMercado('todos'); setSoloTopLigas(false); }}
            >
              Todos ({partidos.length})
            </button>
            <button 
              className={`filter-pill ${soloTopLigas ? 'active' : ''}`}
              onClick={() => setSoloTopLigas(!soloTopLigas)}
            >
              ⭐ Solo Top Ligas
            </button>
            <button 
              className={`filter-pill ${filtroMercado === '1x2' ? 'active' : ''}`}
              onClick={() => setFiltroMercado('1x2')}
            >
              1X2 Ganador
            </button>
            <button 
              className={`filter-pill ${filtroMercado === 'goles' ? 'active' : ''}`}
              onClick={() => setFiltroMercado('goles')}
            >
              +/- 2.5 Goles
            </button>
            <button 
              className={`filter-pill ${filtroMercado === 'btts' ? 'active' : ''}`}
              onClick={() => setFiltroMercado('btts')}
            >
              Ambos Marcan
            </button>
          </div>
        </div>
      </section>

      {/* 4. DASHBOARD PRINCIPAL (MATCHES + BETSLIP) */}
      <main className="main-content">
        {error && (
          <div className="error-banner glass-card">
            <span className="error-icon">⚠️</span>
            <div>
              <strong>Error de sincronización con Supabase:</strong> {error}
            </div>
          </div>
        )}

        {cargando ? (
          <div className="loader-container glass-card">
            <div className="spinner"></div>
            <p className="loader-title">Procesando matrices de Poisson...</p>
            <span className="loader-sub">Consultando históricos y estimando probabilidades en vivo</span>
          </div>
        ) : (
          <div className="dashboard-grid">
            <section className="matches-section">
              <div className="section-header-row">
                <h2>Cartelera de Pronósticos</h2>
                <span className="matches-subtitle">
                  Mostrando {partidosFiltrados.length} de {partidos.length} partidos verificados
                </span>
              </div>

              <MatchList 
                partidos={partidosFiltrados} 
                ticket={ticket}
                onAddTicket={agregarAlTicket} 
                filtroMercado={filtroMercado}
              />
            </section>

            <aside className="betslip-section">
              <BetSlip 
                ticket={ticket} 
                onRemove={removerDelTicket} 
                onClear={limpiarTicket} 
              />
            </aside>
          </div>
        )}
      </main>

      {/* 5. FOOTER */}
      <footer className="main-footer">
        <p>© 2026 Poisson Predictor PRO • Sistema Estadístico Cuantitativo de Fútbol</p>
      </footer>
    </div>
  );
}

export default App;