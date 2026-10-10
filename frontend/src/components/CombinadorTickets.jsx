import { useState, useMemo, useEffect } from 'react';
import { 
  TicketIcon, DicesIcon, ZapIcon, ShieldIcon, 
  CopyIcon, CheckIcon, CalculatorIcon, WalletIcon, 
  TargetIcon, ChartIcon, BallIcon, TrophyIcon, 
  ClockIcon, AlertTriangleIcon 
} from './Icons';
import { 
  generarTicketAleatorioMayorProbabilidad, 
  generarTicketRiesgoModerado, 
  generarTicketUltraSeguro,
  generarTodasLasCombinadasSugeridas,
  formatearPickParaTicket,
  calcularMetricasTicket
} from '../utils/combinadas';
import { useBankroll } from '../hooks/useBankroll';
import MiniBarraHistorial from './MiniBarraHistorial';


export default function CombinadorTickets({ 
  partidos = [], 
  onCargarTicket, 
  ticketActual = [],
  onIrACartelera 
}) {
  const [numSelecciones, setNumSelecciones] = useState(2);
  const [filtroRiesgo, setFiltroRiesgo] = useState('todos'); // 'todos' | 'moderado' | 'controlado'
  const [ticketActivo, setTicketActivo] = useState(null);
  const [montoSimulado, setMontoSimulado] = useState(10000);
  const [copiado, setCopiado] = useState(false);
  const [cargadoFeedback, setCargadoFeedback] = useState(false);
  const [animandoAleatorio, setAnimandoAleatorio] = useState(false);

  const { bankroll, calcularStakeOptimo } = useBankroll();

  // Generar pool de combinadas sugeridas automáticas para la fecha
  const combinadasSugeridas = useMemo(() => {
    if (!partidos || partidos.length < 2) return [];
    return generarTodasLasCombinadasSugeridas(partidos);
  }, [partidos]);

  // Al montar o cambiar partidos, seleccionar por defecto el ticket Ultra Seguro (Mínimo Riesgo)
  useEffect(() => {
    if (combinadasSugeridas.length > 0 && !ticketActivo) {
      const seguro = combinadasSugeridas.find(c => c.tipoGenerador === 'ultra_seguro') || combinadasSugeridas[0];
      setTicketActivo(seguro);
    }
  }, [combinadasSugeridas]);

  // Manejador: Generar Ticket Ultra Seguro (Mínimo Riesgo, Alta Probabilidad, Equipos Conocidos)
  const handleGenerarUltraSeguro = () => {
    const nuevo = generarTicketUltraSeguro(partidos, numSelecciones);
    if (nuevo) {
      setTicketActivo(nuevo);
    }
  };

  // Manejador: Generar Ticket Aleatorio con Mayor Probabilidad (Equipos Conocidos)
  const handleGenerarAleatorio = () => {
    setAnimandoAleatorio(true);
    setTimeout(() => {
      const nuevo = generarTicketAleatorioMayorProbabilidad(partidos, numSelecciones);
      if (nuevo) {
        setTicketActivo(nuevo);
      }
      setAnimandoAleatorio(false);
    }, 200);
  };

  // Manejador: Generar Ticket Riesgo Moderado
  const handleGenerarModerado = () => {
    const nuevo = generarTicketRiesgoModerado(partidos, numSelecciones, true);
    if (nuevo) {
      setTicketActivo(nuevo);
    }
  };

  // Cargar selección al BetSlip principal
  const handleCargarEnBetSlip = (ticketParaCargar) => {
    if (!ticketParaCargar || !ticketParaCargar.picks) return;
    const itemsFormateados = ticketParaCargar.picks.map(p => formatearPickParaTicket(p));
    onCargarTicket(itemsFormateados);
    setCargadoFeedback(true);
    setTimeout(() => setCargadoFeedback(false), 2200);
  };

  // Copiar resumen de combinada al portapapeles
  const handleCopiarTicket = (ticketACopiar) => {
    if (!ticketACopiar || !ticketACopiar.picks) return;
    const m = ticketACopiar.metricas;
    const lineas = [
      `🎯 ${ticketACopiar.titulo} - Poisson Predictor PRO`,
      `📊 Probabilidad: ${m.probabilidadPct}% | Cuota: @${m.cuotaFormateada}`,
      `🛡️ Riesgo: ${m.riesgo.label} | EV: +${m.evPromedio}%`,
      `---`,
      ...ticketACopiar.picks.map((p, idx) => {
        const local = p.partido?.local || 'Local';
        const vis = p.partido?.visitante || 'Visitante';
        return `${idx + 1}. ${local} vs ${vis} -> ${p.mercado} (@${p.cuota} | ${p.probPct}%)`;
      }),
      `---`,
      `💰 Retorno Estimado para $${montoSimulado.toLocaleString('es-CO')}: $${Math.round(montoSimulado * m.cuotaTotal).toLocaleString('es-CO')} COP`
    ];

    navigator.clipboard.writeText(lineas.join('\n')).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  // Calcular recomendación de Kelly para el ticket activo
  const kellyTicketActivo = useMemo(() => {
    if (!ticketActivo || !ticketActivo.metricas) return null;
    const m = ticketActivo.metricas;
    return calcularStakeOptimo(m.probabilidadTotal, m.cuotaTotal * 1.05);
  }, [ticketActivo, calcularStakeOptimo]);

  // Filtrar tarjetas secundarias
  const combinadasFiltradas = useMemo(() => {
    if (filtroRiesgo === 'todos') return combinadasSugeridas;
    if (filtroRiesgo === 'moderado') {
      return combinadasSugeridas.filter(c => c.metricas.riesgo.label.toLowerCase().includes('moderado'));
    }
    if (filtroRiesgo === 'controlado') {
      return combinadasSugeridas.filter(c => c.metricas.riesgo.label.toLowerCase().includes('controlado'));
    }
    return combinadasSugeridas;
  }, [combinadasSugeridas, filtroRiesgo]);

  if (!partidos || partidos.length < 2) {
    return (
      <div className="combinador-container">
        <div className="empty-state glass-card">
          <div className="empty-icon-wrap">
            <AlertTriangleIcon size={44} className="empty-svg-icon" />
          </div>
          <h3>Se necesitan al menos 2 partidos para generar combinadas</h3>
          <p>
            No hay suficientes eventos programados en esta fecha para generar tickets combinados.
            Cambia a la fecha de Hoy o Mañana en el selector superior para ver combinadas sugeridas.
          </p>
          {onIrACartelera && (
            <button className="btn-empty-action" onClick={onIrACartelera}>
              Volver a la Cartelera de Partidos
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="combinador-container">
      {/* 1. HEADER DE LA SECCIÓN */}
      <section className="combinador-hero glass-card">
        <div className="combinador-hero-content">
          <div className="combinador-hero-badge">
            <ShieldIcon size={16} className="zap-badge-icon" />
            <span>ALGORITMO ESTOCÁSTICO • EQUIPOS CONOCIDOS</span>
          </div>
          <h2 className="combinador-title">
            Tickets Automáticos & <span className="title-gradient">Sugerencias de Mínimo Riesgo</span>
          </h2>
          <p className="combinador-desc">
            Construcción matemática de apuestas combinadas exclusivamente con <strong>equipos conocidos de ligas top</strong>. 
            Prioriza selecciones de alta certeza (Doble Oportunidad 1X/X2 y líneas seguras de goles) para <strong>minimizar las pérdidas al máximo</strong> y proteger tu banca.
          </p>
        </div>

        {/* 2. BARRA DE ACCIÓN RÁPIDA: GENERADORES AUTOMÁTICOS */}
        <div className="combinador-actions-panel">
          <div className="quick-buttons-group">
            <button 
              type="button" 
              className="btn-action-generator btn-generator-safe"
              onClick={handleGenerarUltraSeguro}
              title="Generar la combinación más segura de la jornada con equipos conocidos (minimizar pérdidas)"
            >
              <ShieldIcon size={20} className="generator-svg-icon" />
              <div className="btn-gen-text">
                <strong>Ultra Seguro</strong>
                <span>Mínimo Riesgo • Equipos Top</span>
              </div>
            </button>

            <button 
              type="button" 
              className={`btn-action-generator btn-generator-random ${animandoAleatorio ? 'pulse-btn' : ''}`}
              onClick={handleGenerarAleatorio}
              title="Generar un ticket combinando aleatoriamente entre los partidos conocidos con mayor probabilidad individual"
            >
              <DicesIcon size={20} className="generator-svg-icon" />
              <div className="btn-gen-text">
                <strong>Ticket Aleatorio</strong>
                <span>Equipos Conocidos</span>
              </div>
            </button>

            <button 
              type="button" 
              className="btn-action-generator btn-generator-moderate"
              onClick={handleGenerarModerado}
              title="Generar una combinada calibrada en Riesgo Moderado (20% a 45%)"
            >
              <ZapIcon size={20} className="generator-svg-icon" />
              <div className="btn-gen-text">
                <strong>Riesgo Moderado</strong>
                <span>Balance Cuota / Acierto</span>
              </div>
            </button>
          </div>

          {/* Selector de número de partidos */}
          <div className="generator-config-row">
            <div className="config-item">
              <span className="config-label">Cantidad de Selecciones:</span>
              <div className="config-pills">
                {[2, 3, 4].map(num => (
                  <button
                    key={num}
                    type="button"
                    className={`config-pill ${numSelecciones === num ? 'active' : ''}`}
                    onClick={() => {
                      setNumSelecciones(num);
                      // Regenerar al instante con la nueva cantidad
                      const n = generarTicketRiesgoModerado(partidos, num, true);
                      if (n) setTicketActivo(n);
                    }}
                  >
                    {num === 2 ? '2 (Doble)' : num === 3 ? '3 (Triple)' : '4 (Cuádruple)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-item">
              <span className="config-label">Filtro de Riesgo:</span>
              <div className="config-pills">
                <button 
                  type="button" 
                  className={`config-pill ${filtroRiesgo === 'todos' ? 'active' : ''}`}
                  onClick={() => setFiltroRiesgo('todos')}
                >
                  Todos
                </button>
                <button 
                  type="button" 
                  className={`config-pill ${filtroRiesgo === 'moderado' ? 'active' : ''}`}
                  onClick={() => setFiltroRiesgo('moderado')}
                >
                  ⚖️ Moderado
                </button>
                <button 
                  type="button" 
                  className={`config-pill ${filtroRiesgo === 'controlado' ? 'active' : ''}`}
                  onClick={() => setFiltroRiesgo('controlado')}
                >
                  🛡️ Controlado
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TICKET DESTACADO / ACTIVO EN SIMULACIÓN */}
      {ticketActivo && (
        <section className="active-ticket-section">
          <div className="section-title-wrap">
            <div className="title-with-icon">
              <TicketIcon size={22} className="ticket-title-svg" />
              <h3>Ticket Sugerido en Simulación</h3>
            </div>
            <span className="section-note">
              {ticketActivo.subtitulo}
            </span>
          </div>

          <div className="active-ticket-card glass-card">
            {/* Header del Ticket Activo */}
            <div className="active-ticket-top">
              <div className="ticket-identity">
                <span className="ticket-type-tag">COMBINADA {ticketActivo.picks.length}X</span>
                <h4 className="ticket-name">{ticketActivo.titulo}</h4>
              </div>

              {/* Indicadores Clave en la Cabecera */}
              <div className="ticket-key-indicators">
                <div 
                  className="risk-badge-pill"
                  style={{ 
                    backgroundColor: ticketActivo.metricas.riesgo.bg, 
                    color: ticketActivo.metricas.riesgo.color,
                    borderColor: ticketActivo.metricas.riesgo.color
                  }}
                >
                  <span className="risk-badge-dot" style={{ backgroundColor: ticketActivo.metricas.riesgo.color }}></span>
                  <strong>{ticketActivo.metricas.riesgo.label}</strong>
                </div>

                <div className="odds-badge-box">
                  <span className="odds-box-label">Cuota Combinada</span>
                  <strong className="odds-box-val">@{ticketActivo.metricas.cuotaFormateada}</strong>
                </div>

                <div className="prob-badge-box">
                  <span className="prob-box-label">Probabilidad Compuesta</span>
                  <strong className="prob-box-val">{ticketActivo.metricas.probabilidadPct}%</strong>
                </div>
              </div>
            </div>

            {/* Barra de Descripción de Riesgo */}
            <div 
              className="risk-banner-strip"
              style={{ 
                borderLeftColor: ticketActivo.metricas.riesgo.color,
                background: ticketActivo.metricas.riesgo.bg 
              }}
            >
              <div className="risk-banner-info">
                <strong>Análisis Cuantitativo:</strong> {ticketActivo.metricas.riesgo.desc}
              </div>
              <div className="risk-ev-tag">
                +{ticketActivo.metricas.evPromedio}% EV Estimado
              </div>
            </div>

            {/* Lista Detallada de Partidos del Ticket */}
            <div className="ticket-picks-grid">
              {ticketActivo.picks.map((pick, idx) => {
                const p = pick.partido || {};
                const local = p.local || 'Equipo Local';
                const vis = p.visitante || 'Equipo Visitante';
                const torneo = p.torneo || 'Torneo';
                const hora = p.hora || '18:00';

                return (
                  <div key={idx} className="ticket-pick-item">
                    <div className="pick-index-badge">{idx + 1}</div>
                    
                    <div className="pick-match-details">
                      <div className="pick-tournament-row">
                        <span className="pick-tournament-name">{torneo}</span>
                        <div className="pick-meta-badges">
                          <MiniBarraHistorial partido={p} />
                          <span className="pick-time-label">
                            <ClockIcon size={12} /> {hora}
                          </span>
                        </div>
                      </div>


                      <div className="pick-teams-name">
                        <strong>{local}</strong> vs <strong>{vis}</strong>
                      </div>

                      <div className="pick-market-highlight">
                        <span className="pick-market-pill">{pick.mercado}</span>
                      </div>
                    </div>

                    <div className="pick-stats-col">
                      <div className="pick-odd-box">
                        <span className="pick-odd-val">@{pick.cuota}</span>
                        <span className="pick-prob-val">{pick.probPct}% prob</span>
                      </div>
                      
                      {/* Barra de progreso de probabilidad individual */}
                      <div className="pick-prob-bar">
                        <div 
                          className="pick-prob-fill" 
                          style={{ width: `${Math.min(100, Math.max(15, pick.probPct))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Panel de Simulación Financiera & Asistente Kelly */}
            <div className="active-ticket-footer">
              <div className="financial-sim-wrap">
                <div className="sim-amount-input-group">
                  <label className="sim-group-label">Monto a Simular ($ COP):</label>
                  <div className="sim-input-box">
                    <input 
                      type="number"
                      value={montoSimulado}
                      onChange={(e) => setMontoSimulado(Math.max(1000, parseInt(e.target.value) || 0))}
                      className="sim-number-input"
                      step="5000"
                    />
                    <div className="sim-quick-pills">
                      {[10000, 20000, 50000].map(v => (
                        <button 
                          key={v}
                          type="button" 
                          className={`btn-sim-quick ${montoSimulado === v ? 'active' : ''}`}
                          onClick={() => setMontoSimulado(v)}
                        >
                          ${v / 1000}k
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sim-potential-return">
                  <span className="return-label">Ganancia Potencial Estimada:</span>
                  <div className="return-amount-box">
                    <strong className="return-amount">
                      ${Math.round(montoSimulado * ticketActivo.metricas.cuotaTotal).toLocaleString('es-CO')}
                    </strong>
                    <span className="return-currency">COP</span>
                  </div>
                  <span className="return-net">
                    (+${Math.round(montoSimulado * (ticketActivo.metricas.cuotaTotal - 1)).toLocaleString('es-CO')} netos)
                  </span>
                </div>
              </div>

              {/* Recomendación Kelly para esta combinada */}
              {kellyTicketActivo && kellyTicketActivo.esPositivo && (
                <div className="kelly-combination-hint">
                  <div className="kelly-hint-top">
                    <CalculatorIcon size={14} className="calc-svg" />
                    <span>Criterio de Kelly (Banca ${(bankroll / 1000).toLocaleString('es-CO')}k):</span>
                    <strong>${kellyTicketActivo.stakeRecomendado.toLocaleString('es-CO')} COP ({kellyTicketActivo.pctRecomendado}%)</strong>
                  </div>
                  <button 
                    type="button"
                    className="btn-apply-kelly-sim"
                    onClick={() => setMontoSimulado(kellyTicketActivo.stakeRecomendado)}
                    title="Usar stake recomendado por Kelly"
                  >
                    Usar Stake Kelly
                  </button>
                </div>
              )}

              {/* Botones de Acción Primaria */}
              <div className="ticket-actions-row">
                <button 
                  type="button" 
                  className={`btn-load-ticket-main ${cargadoFeedback ? 'btn-loaded-success' : ''}`}
                  onClick={() => handleCargarEnBetSlip(ticketActivo)}
                >
                  {cargadoFeedback ? (
                    <>
                      <CheckIcon size={18} />
                      <span>¡Cargado en Tu Ticket!</span>
                    </>
                  ) : (
                    <>
                      <ZapIcon size={18} />
                      <span>Cargar en Mi Ticket (BetSlip)</span>
                    </>
                  )}
                </button>

                <button 
                  type="button" 
                  className="btn-regenerate-rnd"
                  onClick={handleGenerarAleatorio}
                  title="Generar otra combinación aleatoria de alta probabilidad"
                >
                  <DicesIcon size={17} />
                  <span>Generar Otra</span>
                </button>

                <button 
                  type="button" 
                  className="btn-copy-ticket-text"
                  onClick={() => handleCopiarTicket(ticketActivo)}
                  title="Copiar desglose del ticket al portapapeles"
                >
                  {copiado ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                  <span>{copiado ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. GRID DE OTRAS COMBINADAS SUGERIDAS DE LA JORNADA */}
      <section className="suggested-grid-section">
        <div className="section-title-wrap">
          <div className="title-with-icon">
            <TrophyIcon size={20} className="trophy-title-svg" />
            <h3>Otras Combinadas Calculadas de la Jornada</h3>
          </div>
          <span className="section-note">
            Selecciona cualquiera para simularla o cargarla al instante
          </span>
        </div>

        <div className="suggested-cards-grid">
          {combinadasFiltradas.map((combinada) => {
            const esActiva = ticketActivo?.id === combinada.id;
            const m = combinada.metricas;

            return (
              <div 
                key={combinada.id} 
                className={`suggested-card glass-card ${esActiva ? 'card-selected' : ''}`}
                onClick={() => setTicketActivo(combinada)}
              >
                <div className="suggested-card-header">
                  <div className="suggested-header-left">
                    <span className="suggested-type-pill">{combinada.picks.length} PARTIDOS</span>
                    <h4 className="suggested-card-title">{combinada.titulo}</h4>
                  </div>
                  
                  <div 
                    className="suggested-risk-pill"
                    style={{ 
                      backgroundColor: m.riesgo.bg, 
                      color: m.riesgo.color,
                      borderColor: m.riesgo.color 
                    }}
                  >
                    {m.riesgo.label}
                  </div>
                </div>

                <p className="suggested-card-desc">{combinada.subtitulo}</p>

                {/* Métricas automáticas */}
                <div className="suggested-metrics-row">
                  <div className="metric-cell">
                    <span className="metric-cell-label">Cuota</span>
                    <strong className="metric-cell-val">@{m.cuotaFormateada}</strong>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-cell-label">Probabilidad</span>
                    <strong className="metric-cell-val val-green">{m.probabilidadPct}%</strong>
                  </div>
                  <div className="metric-cell">
                    <span className="metric-cell-label">EV Modelo</span>
                    <strong className="metric-cell-val val-blue">+{m.evPromedio}%</strong>
                  </div>
                </div>

                {/* Lista compacta de selecciones */}
                <div className="suggested-picks-compact">
                  {combinada.picks.map((pick, i) => (
                    <div key={i} className="compact-pick-row">
                      <span className="compact-pick-num">{i + 1}.</span>
                      <span className="compact-pick-match">
                        {pick.partido?.local} vs {pick.partido?.visitante}:
                      </span>
                      <strong className="compact-pick-market">{pick.mercado}</strong>
                      <span className="compact-pick-odd">@{pick.cuota}</span>
                    </div>
                  ))}
                </div>

                {/* Botón de acción */}
                <div className="suggested-card-actions">
                  <button 
                    type="button" 
                    className="btn-select-suggested"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTicketActivo(combinada);
                    }}
                  >
                    Simular
                  </button>

                  <button 
                    type="button" 
                    className="btn-load-suggested"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCargarEnBetSlip(combinada);
                    }}
                    title="Cargar esta combinación directamente en el BetSlip"
                  >
                    <ZapIcon size={14} />
                    <span>Cargar en BetSlip</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
