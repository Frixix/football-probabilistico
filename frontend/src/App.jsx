import { useState, useMemo } from 'react';
import MatchList from './components/MatchList';
import BetSlip from './components/BetSlip';
import BacktestDashboard from './components/BacktestDashboard';
import CombinadorTickets from './components/CombinadorTickets';
import { usePartidos } from './hooks/usePartidos';
import { obtenerInfoTorneo } from './utils/leagues';
import { 
  BallIcon, ChartIcon, TrophyIcon, TargetIcon, 
  TicketIcon, SearchIcon, StarIcon, CloseIcon, AlertTriangleIcon, CalendarIcon,
  DicesIcon, ZapIcon, ShieldIcon
} from './components/Icons';
import { 
  generarTicketAleatorioMayorProbabilidad, 
  generarTicketRiesgoModerado, 
  generarTicketUltraSeguro,
  formatearPickParaTicket 
} from './utils/combinadas';
import HORARIOS_FIXTURES from './data/horarios_fixtures.json';
import './App.css';

function App() {
  // Fecha anclada dinámicamente a Bogotá (UTC-5)
  const hoyBogota = useMemo(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  }, []);

  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyBogota);
  const { partidos, cargando, error } = usePartidos(fechaSeleccionada);
  const [ticket, setTicket] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroMercado, setFiltroMercado] = useState('todos');
  const [soloTopLigas, setSoloTopLigas] = useState(false);
  const [mostrarTicketMobile, setMostrarTicketMobile] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState('cartelera');
  const [mensajeToast, setMensajeToast] = useState(null);

  // Pestañas relativas de fechas: Ayer, Hoy, Mañana
  const diasNav = useMemo(() => {
    const [y, m, d] = hoyBogota.split('-').map(Number);
    const dHoy = new Date(y, m - 1, d);

    const dAyer = new Date(dHoy);
    dAyer.setDate(dAyer.getDate() - 1);
    const fAyer = dAyer.toLocaleDateString('en-CA');

    const dManana = new Date(dHoy);
    dManana.setDate(dManana.getDate() + 1);
    const fManana = dManana.toLocaleDateString('en-CA');

    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const formato = (dt) => `${dt.getDate()} ${meses[dt.getMonth()]}`;

    return [
      { id: fAyer, label: 'Ayer', sub: formato(dAyer) },
      { id: hoyBogota, label: 'Hoy', sub: formato(dHoy) },
      { id: fManana, label: 'Mañana', sub: formato(dManana) },
    ];
  }, [hoyBogota]);

  // Manejadores de Ticket
  const agregarAlTicket = (partido) => {
    const idKey = partido.id_seleccion || (partido.id_partido ? `${partido.id_partido}-${partido.mercado_predicho || partido.mercado}` : (partido.id || Math.random()));
    const partidoConId = { ...partido, id_seleccion: idKey };

    const yaSeleccionado = ticket.some(item => (item.id_seleccion === idKey) || ((item.id_partido || item.id) === (partido.id_partido || partido.id) && (item.mercado_predicho || item.mercado) === (partido.mercado_predicho || partido.mercado)));

    if (yaSeleccionado) {
      removerDelTicket(idKey);
    } else {
      // Reemplaza cualquier selección previa del MISMO partido para evitar combinadas contradictorias
      const idBase = partido.id_partido || partido.id;
      const sinMismoPartido = ticket.filter(item => (item.id_partido || item.id) !== idBase);
      setTicket([...sinMismoPartido, partidoConId]);
    }
  };

  const removerDelTicket = (id) => {
    setTicket(prev => {
      const nuevo = prev.filter(item => item.id_seleccion !== id && (item.id_partido || item.id) !== id && item.id !== id);
      if (nuevo.length === 0) setMostrarTicketMobile(false);
      return nuevo;
    });
  };

  const limpiarTicket = () => {
    setTicket([]);
    setMostrarTicketMobile(false);
  };

  const cargarTicketCompleto = (partidosSeleccionados) => {
    const formateados = partidosSeleccionados.map(p => {
      const idReal = p.id_partido || p.id || Math.random();
      const idKey = p.id_seleccion || `${idReal}-${p.mercado_predicho || p.mercado}`;
      return {
        ...p,
        id_partido: idReal,
        id_seleccion: idKey
      };
    });
    setTicket(formateados);
    setMensajeToast('¡Ticket combinado cargado con éxito en el BetSlip!');
    setTimeout(() => setMensajeToast(null), 3200);
  };

  const handleGenerarSeguroRapido = () => {
    const pool = partidosFiltrados.length >= 2 ? partidosFiltrados : partidos;
    const res = generarTicketUltraSeguro(pool, 2);
    if (res && res.picks) {
      cargarTicketCompleto(res.picks.map(p => formatearPickParaTicket(p)));
      setMensajeToast(`🛡️ ${res.titulo} (@${res.metricas.cuotaFormateada}) cargado en el BetSlip`);
      setTimeout(() => setMensajeToast(null), 3200);
    } else {
      setMensajeToast('No hay suficientes partidos para generar el ticket ultra seguro');
      setTimeout(() => setMensajeToast(null), 2500);
    }
  };

  const handleGenerarAleatorioRapido = () => {
    const pool = partidosFiltrados.length >= 2 ? partidosFiltrados : partidos;
    const res = generarTicketAleatorioMayorProbabilidad(pool, 3);
    if (res && res.picks) {
      cargarTicketCompleto(res.picks.map(p => formatearPickParaTicket(p)));
      setMensajeToast(`🎲 ${res.titulo} (@${res.metricas.cuotaFormateada}) cargado en el BetSlip`);
      setTimeout(() => setMensajeToast(null), 3200);
    } else {
      setMensajeToast('No hay suficientes partidos para generar la combinada');
      setTimeout(() => setMensajeToast(null), 2500);
    }
  };

  const handleGenerarModeradoRapido = () => {
    const pool = partidosFiltrados.length >= 2 ? partidosFiltrados : partidos;
    const res = generarTicketRiesgoModerado(pool, 3, true);
    if (res && res.picks) {
      cargarTicketCompleto(res.picks.map(p => formatearPickParaTicket(p)));
      setMensajeToast(`⚖️ Combinada Riesgo Moderado (@${res.metricas.cuotaFormateada}) cargada`);
      setTimeout(() => setMensajeToast(null), 3200);
    } else {
      setMensajeToast('No hay suficientes partidos para generar la combinada');
      setTimeout(() => setMensajeToast(null), 2500);
    }
  };

  // Cuota y probabilidad compuesta para visualización en barra móvil

  const { probabilidadTotal, cuotaFinal } = useMemo(() => {
    if (!ticket.length) return { probabilidadTotal: 0, cuotaFinal: 0 };
    const prob = ticket.reduce((acc, p) => {
      let num = parseFloat(p.probabilidad);
      if (isNaN(num)) num = 0;
      let dec = num > 1 ? num / 100 : num;
      return acc * dec;
    }, 1);
    const cuota = prob > 0 ? (1 / prob) : 0;
    return { probabilidadTotal: prob, cuotaFinal: cuota };
  }, [ticket]);

  // Filtrado reactivo por buscador y por top ligas (incluyendo Liga Argentina)
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
        const idReal = p.id_partido || p.id;
        const infoFix = HORARIOS_FIXTURES[idReal] || HORARIOS_FIXTURES[String(idReal)] || null;
        const paisEfectivo = p.pais || infoFix?.pais || null;
        const idLiga = p.id_liga || infoFix?.id_liga || null;
        const info = obtenerInfoTorneo(p.torneo, paisEfectivo, p.local, p.visitante, idLiga);
        if (!info.esTop) return false;
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
    <div className={`app-container ${ticket.length > 0 ? 'has-mobile-ticket' : ''}`}>
      {/* 1. TOP NAVBAR HEADER */}
      <header className="main-navbar">
        <div className="navbar-content">
          <div className="brand-logo">
            <span className="logo-icon">
              <BallIcon size={26} className="brand-svg-icon" />
            </span>
            <div className="logo-text">
              <span className="brand-title">POISSON <span className="brand-highlight">PREDICTOR</span></span>
              <span className="brand-version">PRO v2.0</span>
            </div>
          </div>

          <div className="navbar-nav-tabs">
            <button 
              className={`nav-tab-btn ${pestanaActiva === 'cartelera' ? 'active' : ''}`}
              onClick={() => setPestanaActiva('cartelera')}
            >
              <BallIcon size={16} />
              <span>Cartelera</span>
            </button>
            <button 
              className={`nav-tab-btn ${pestanaActiva === 'combinadas' ? 'active' : ''}`}
              onClick={() => setPestanaActiva('combinadas')}
            >
              <ZapIcon size={16} />
              <span>Tickets Automáticos</span>
              <span className="tab-pill-badge">NUEVO</span>
            </button>
            <button 
              className={`nav-tab-btn ${pestanaActiva === 'backtest' ? 'active' : ''}`}
              onClick={() => setPestanaActiva('backtest')}
            >
              <ChartIcon size={16} />
              <span>Auditoría & Backtesting</span>
            </button>
          </div>

          <div className="navbar-status">
            <span className="status-indicator">
              <span className="status-dot"></span> MOTOR ACTIVO
            </span>
            <span className="system-time">Colombia (UTC-5)</span>
          </div>
        </div>
      </header>

      {pestanaActiva === 'backtest' ? (
        <main className="main-content">
          <BacktestDashboard />
        </main>
      ) : pestanaActiva === 'combinadas' ? (
        <main className="main-content">
          <CombinadorTickets 
            partidos={partidos} 
            onCargarTicket={cargarTicketCompleto}
            ticketActual={ticket}
            onIrACartelera={() => setPestanaActiva('cartelera')}
          />
        </main>
      ) : (
        <>
          {/* 2. HERO SECTION CON KPIS */}

          <section className="hero-banner">
            <div className="hero-content">
              <h1 className="hero-title">
                Inteligencia Probabilística <span className="title-gradient">de Fútbol</span>
              </h1>
              <p className="hero-subtitle">
                Cálculo estadístico bivariado de marcadores exactos, mercados de valor y análisis riguroso sin sesgos.
              </p>

              {/* Widgets de KPIs con iconos SVG profesionales */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-icon"><ChartIcon size={24} /></span>
                  <div className="kpi-data">
                    <span className="kpi-value">{partidos.length}</span>
                    <span className="kpi-label">Partidos Analizados</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <span className="kpi-icon"><TrophyIcon size={24} /></span>
                  <div className="kpi-data">
                    <span className="kpi-value">{totalLigas}</span>
                    <span className="kpi-label">Ligas Disponibles</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <span className="kpi-icon"><TargetIcon size={24} /></span>
                  <div className="kpi-data">
                    <span className="kpi-value">{probPromedio}%</span>
                    <span className="kpi-label">Confianza Promedio</span>
                  </div>
                </div>

                <div className="kpi-card highlight-kpi">
                  <span className="kpi-icon"><TicketIcon size={24} /></span>
                  <div className="kpi-data">
                    <span className="kpi-value">{ticket.length}</span>
                    <span className="kpi-label">En Tu Ticket</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. BARRA DE CONTROLES, NAVEGACIÓN DE FECHAS Y FILTROS */}
          <section className="controls-bar-container">
            <div className="controls-wrapper">
              {/* Selector de Fechas: Ayer, Hoy, Mañana y selector libre */}
              <div className="date-nav-container">
                <div className="date-tabs-bar">
                  {diasNav.map((dia) => (
                    <button
                      key={dia.id}
                      type="button"
                      className={`date-tab-pill ${fechaSeleccionada === dia.id ? 'active' : ''}`}
                      onClick={() => setFechaSeleccionada(dia.id)}
                    >
                      <span className="date-pill-main">{dia.label}</span>
                      <span className="date-pill-sub">{dia.sub}</span>
                    </button>
                  ))}
                </div>
                <div className="date-custom-picker" title="Elegir otra fecha del calendario">
                  <CalendarIcon size={15} className="calendar-svg-icon" />
                  <input
                    type="date"
                    value={fechaSeleccionada}
                    onChange={(e) => e.target.value && setFechaSeleccionada(e.target.value)}
                    className="date-native-input"
                  />
                </div>
              </div>

              {/* Buscador */}
              <div className="search-box">
                <span className="search-icon"><SearchIcon size={18} /></span>
                <input 
                  type="text" 
                  placeholder="Buscar equipo o torneo (ej. Real Madrid, BetPlay, Ibiza)..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="search-input"
                />
                {busqueda && (
                  <button onClick={() => setBusqueda('')} className="btn-clear-search">
                    <CloseIcon size={14} />
                  </button>
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <StarIcon size={13} /> Solo Top Ligas
                </button>
                <button 
                  className={`filter-pill ${filtroMercado === '1x2' ? 'active' : ''}`}
                  onClick={() => setFiltroMercado('1x2')}
                >
                  1X2 Ganador
                </button>
                <button 
                  className={`filter-pill ${filtroMercado === 'doble_oportunidad' ? 'active' : ''}`}
                  onClick={() => setFiltroMercado('doble_oportunidad')}
                >
                  Doble Oportunidad
                </button>
                <button 
                  className={`filter-pill ${filtroMercado === 'goles' ? 'active' : ''}`}
                  onClick={() => setFiltroMercado('goles')}
                >
                  +/- 2.5 Goles
                </button>
                <button 
                  className={`filter-pill ${filtroMercado === 'goles_lineas' ? 'active' : ''}`}
                  onClick={() => setFiltroMercado('goles_lineas')}
                >
                  Líneas (+/- 1.5 y 3.5)
                </button>
                <button 
                  className={`filter-pill ${filtroMercado === 'btts' ? 'active' : ''}`}
                  onClick={() => setFiltroMercado('btts')}
                >
                  Ambos Marcan
                </button>
                <button 
                  className={`filter-pill ${filtroMercado === 'valor' ? 'active' : ''}`}
                  onClick={() => setFiltroMercado(filtroMercado === 'valor' ? 'todos' : 'valor')}
                >
                  Solo Valor (+EV)
                </button>
              </div>
            </div>

            {/* BANNER DE ACCIÓN RÁPIDA: COMBINADAS & TICKETS AUTOMÁTICOS */}
            <div className="quick-generator-banner glass-card">
              <div className="quick-gen-left">
                <div className="quick-gen-icon-glow">
                  <ZapIcon size={20} className="quick-gen-svg-icon" />
                </div>
                <div className="quick-gen-info">
                  <div className="quick-gen-headline">
                    <strong>Generador Cuantitativo de Tickets</strong>
                    <span className="quick-gen-badge-live">DIXON-COLES PRO</span>
                  </div>
                  <p className="quick-gen-sub">
                    Tickets automáticos calibrados para balancear probabilidad acumulada y cuota justa.
                  </p>
                </div>
              </div>

              <div className="quick-gen-actions">
                <button 
                  type="button" 
                  className="btn-quick-generator btn-quick-rnd"
                  onClick={handleGenerarAleatorioRapido}
                  title="Generar al azar un ticket combinando los eventos de mayor probabilidad"
                >
                  <DicesIcon size={16} />
                  <span>Ticket Aleatorio (Alta Probabilidad)</span>
                </button>

                <button 
                  type="button" 
                  className="btn-quick-generator btn-quick-mod"
                  onClick={handleGenerarModeradoRapido}
                  title="Generar una combinada que calza en el rango de Riesgo Moderado"
                >
                  <ShieldIcon size={16} />
                  <span>Combinada Riesgo Moderado</span>
                </button>

                <button 
                  type="button" 
                  className="btn-quick-generator btn-quick-hub"
                  onClick={() => setPestanaActiva('combinadas')}
                  title="Ir al apartado completo de combinadas sugeridas"
                >
                  <ZapIcon size={16} />
                  <span>Ver Centro de Combinadas →</span>
                </button>
              </div>
            </div>
          </section>

          {/* 4. DASHBOARD PRINCIPAL (MATCHES + BETSLIP) */}
          <main className="main-content">
            {error && (
              <div className="error-banner glass-card">
                <span className="error-icon"><AlertTriangleIcon size={22} /></span>
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
                    onGenerarSeguro={handleGenerarSeguroRapido}
                    onGenerarAleatorio={handleGenerarAleatorioRapido}
                    onGenerarModerado={handleGenerarModeradoRapido}
                    onIrACombinadas={() => setPestanaActiva('combinadas')}
                  />
                </aside>
              </div>
            )}
          </main>
        </>
      )}

      {/* 5. FOOTER */}
      <footer className="main-footer">
        <p>© 2026 Poisson Predictor PRO • Sistema Estadístico Cuantitativo de Fútbol</p>
      </footer>

      {/* 6. BARRA FLOTANTE MÓVIL (VISIBLE EN CELULARES SI HAY TICKETS) */}
      {ticket.length > 0 && (pestanaActiva === 'cartelera' || pestanaActiva === 'combinadas') && (
        <div className="mobile-ticket-bar">
          <div className="mobile-bar-summary" onClick={() => setMostrarTicketMobile(true)}>
            <div className="mobile-bar-badge">
              <TicketIcon size={16} />
              <span>{ticket.length}</span>
            </div>
            <div className="mobile-bar-data">
              <span className="mobile-bar-label">Mi Ticket</span>
              <div className="mobile-bar-odds-row">
                <strong className="mobile-bar-odd">@{cuotaFinal.toFixed(2)}</strong>
                <span className="mobile-bar-prob">({(probabilidadTotal * 100).toFixed(1)}%)</span>
              </div>
            </div>
          </div>
          <button 
            className="btn-open-mobile-ticket"
            onClick={() => setMostrarTicketMobile(true)}
          >
            Ver Ticket
          </button>
        </div>
      )}

      {/* 7. DRAWER MODAL DESPLEGABLE PARA CELULARES */}
      {mostrarTicketMobile && (
        <div className="mobile-ticket-drawer-backdrop" onClick={() => setMostrarTicketMobile(false)}>
          <div className="mobile-ticket-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-handle-bar"></div>
            <BetSlip 
              ticket={ticket} 
              onRemove={removerDelTicket} 
              onClear={limpiarTicket} 
              onClose={() => setMostrarTicketMobile(false)}
              onGenerarSeguro={handleGenerarSeguroRapido}
              onGenerarAleatorio={handleGenerarAleatorioRapido}
              onGenerarModerado={handleGenerarModeradoRapido}
              onIrACombinadas={() => {
                setMostrarTicketMobile(false);
                setPestanaActiva('combinadas');
              }}
              isMobile={true}
            />
          </div>
        </div>
      )}

      {/* 8. NOTIFICACIÓN TOAST FLOTANTE */}
      {mensajeToast && (
        <div className="toast-notification glass-card">
          <ZapIcon size={18} className="toast-svg-icon" />
          <span>{mensajeToast}</span>
        </div>
      )}
    </div>

  );
}

export default App;