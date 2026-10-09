import { useState, useMemo } from 'react';
import { obtenerInfoTorneo, obtenerUrlBandera } from '../utils/leagues';
import { 
  TrophyIcon, ClockIcon, ChevronDownIcon, 
  BallIcon, SearchIcon, CheckIcon 
} from './Icons';
import { useBankroll } from '../hooks/useBankroll';

// Horarios programados locales (UTC-5 Colombia) para fixtures del día
const HORAS_PROGRAMADAS = {
  1549504: "15:00", // Deportivo Garcilaso vs Sport Huancayo
  1571165: "14:30", // Ibiza vs Real Madrid II
  1493733: "18:00", // Lexington vs FC Tulsa
  1639851: "19:00", // Libertad vs Leones del Norte
  1606339: "13:30", // Trindade vs Tupy FC
  1611406: "11:00", // JS Kabylie vs ASO Chlef
  1611407: "13:00", // MC Alger vs Témouchent
  1643947: "10:00", // Paradou AC vs JSM Skikda
  1643940: "09:00", // El Bayadh vs WA Tlemcen
  1643943: "09:00", // NC Magra vs CA Batna
  1643944: "09:00", // Mostaganem vs GC Mascara
  1559800: "11:00", // Ústí nad Labem vs Opava
  1571591: "08:00", // Yantra 2019 vs Vihren
  1628544: "10:00", // Katsina United vs Enyimba
  1629108: "07:00", // Homeboyz vs Police
  1635276: "08:00", // Entebbe UPPC vs Police
  1635277: "08:00", // URA vs KCCA
};

export default function MatchList({ partidos, ticket = [], onAddTicket, filtroMercado = 'todos' }) {
  const [ligasAbiertas, setLigasAbiertas] = useState({});
  const { bankroll, calcularStakeOptimo } = useBankroll();

  const toggleLiga = (torneoKey) => {
    setLigasAbiertas(prev => ({
      ...prev,
      [torneoKey]: prev[torneoKey] === undefined ? false : !prev[torneoKey]
    }));
  };

  const formatearHora12 = (hora24, idPartido) => {
    let horaStr = hora24;
    if (!horaStr || horaStr === "TBD") {
      horaStr = HORAS_PROGRAMADAS[idPartido] || "15:00";
    }
    const [h, min] = horaStr.split(":");
    let hora = parseInt(h, 10);
    if (isNaN(hora)) return "3:00 PM";
    const ampm = hora >= 12 ? 'PM' : 'AM';
    hora = hora % 12;
    hora = hora ? hora : 12; 
    return `${hora}:${min || '00'} ${ampm}`;
  };

  const renderRacha = (rachaStr) => {
    if (!rachaStr) return null;
    const chars = rachaStr.split('').slice(-5);
    return (
      <div className="form-dots">
        {chars.map((c, i) => {
          const l = c.toUpperCase();
          const cls = l === 'W' ? 'dot-win' : l === 'D' ? 'dot-draw' : 'dot-loss';
          return (
            <span key={i} className={`form-dot ${cls}`} title={`Forma: ${l}`}>
              {l}
            </span>
          );
        })}
      </div>
    );
  };

  // Filtrar partidos según filtro de mercado si está seleccionado
  const partidosFiltrados = useMemo(() => {
    if (!partidos) return [];
    if (filtroMercado === 'todos') return partidos;
    return partidos.filter(p => {
      const mercado = (p.mercado_predicho || p.mercado || '').toLowerCase();
      if (filtroMercado === '1x2') return mercado.includes('gana') || mercado.includes('empate');
      if (filtroMercado === 'goles') return mercado.includes('goles') || mercado.includes('2.5');
      if (filtroMercado === 'btts') return mercado.includes('marcan');
      if (filtroMercado === 'valor') return p.es_valor || parseFloat(p.ev) > 0 || parseFloat(p.probabilidad) >= 60;
      return true;
    });
  }, [partidos, filtroMercado]);

  // Agrupar torneos con algoritmo de prioridad (Top arriba, torneos menores abajo)
  const torneosAgrupados = useMemo(() => {
    const grupos = {};
    partidosFiltrados.forEach(partido => {
      const nombreLiga = partido.torneo || "Torneo General";
      const info = obtenerInfoTorneo(nombreLiga, partido.pais);
      const nombrePais = info.pais;
      const prioridad = info.prioridad;
      const flagCode = info.flagCode;
      const flagUrl = obtenerUrlBandera(flagCode) || partido.bandera || null;
      
      const keyUnica = `${nombrePais}-${nombreLiga}`; 
      
      if (!grupos[keyUnica]) {
        grupos[keyUnica] = { 
          key: keyUnica,
          nombreLiga,
          nombrePais,
          flagUrl,
          esTop: info.esTop,
          partidos: [], 
          prioridad 
        };
      }
      grupos[keyUnica].partidos.push(partido);
    });
    return grupos;
  }, [partidosFiltrados]);

  // Ordenar torneos
  const ligasOrdenadas = useMemo(() => {
    return Object.keys(torneosAgrupados).sort((a, b) => {
      const prioA = torneosAgrupados[a].prioridad;
      const prioB = torneosAgrupados[b].prioridad;
      if (prioA !== prioB) return prioA - prioB; 
      return torneosAgrupados[a].nombreLiga.localeCompare(torneosAgrupados[b].nombreLiga);
    });
  }, [torneosAgrupados]);

  const estaAbierta = (torneoKey, prioridad) => {
    if (ligasAbiertas[torneoKey] !== undefined) {
      return ligasAbiertas[torneoKey];
    }
    return prioridad < 60;
  };

  if (!partidos || partidos.length === 0) {
    return (
      <div className="empty-state glass-card">
        <div className="empty-icon-wrap"><BallIcon size={46} className="empty-svg-icon" /></div>
        <h3>No hay partidos disponibles para la fecha</h3>
        <p>Los pronósticos se sincronizan automáticamente cada madrugada según el calendario de partidos.</p>
      </div>
    );
  }

  if (partidosFiltrados.length === 0) {
    return (
      <div className="empty-state glass-card">
        <div className="empty-icon-wrap"><SearchIcon size={44} className="empty-svg-icon" /></div>
        <h3>No se encontraron partidos con el filtro actual</h3>
        <p>Prueba seleccionando otro mercado o restableciendo la búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="match-list-container">
      {ligasOrdenadas.map(torneoKey => {
        const grupo = torneosAgrupados[torneoKey];
        const abierta = estaAbierta(torneoKey, grupo.prioridad);
        const esLigaSecundaria = grupo.prioridad >= 80;
        
        return (
          <div key={torneoKey} className={`tournament-group ${esLigaSecundaria ? 'torneo-secundario' : ''}`}>
            
            {/* Header del Torneo con Bandera Oficial */}
            <div 
              className={`tournament-header ${abierta ? 'active' : ''} ${grupo.esTop ? 'header-top' : ''}`} 
              onClick={() => toggleLiga(torneoKey)}
            >
              <div className="tournament-title">
                {grupo.flagUrl ? (
                  <img 
                    src={grupo.flagUrl} 
                    alt={grupo.nombrePais} 
                    className="league-flag"
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="league-icon-fallback">
                    <TrophyIcon size={18} className="fallback-trophy-svg" />
                  </div>
                )}
                
                <div className="tournament-text">
                  <span className="country-label">{grupo.nombrePais}</span>
                  <h3 className="league-name">{grupo.nombreLiga}</h3>
                </div>

                {grupo.esTop && <span className="badge-top">DESTACADO</span>}
                {esLigaSecundaria && <span className="badge-menor">REGIONAL</span>}
              </div>
              
              <div className="tournament-controls">
                <span className="match-count">{grupo.partidos.length} {grupo.partidos.length === 1 ? 'partido' : 'partidos'}</span>
                <span className={`toggle-chevron ${abierta ? 'rotated' : ''}`}>
                  <ChevronDownIcon size={16} />
                </span>
              </div>
            </div>
            
            {/* Grid de Partidos */}
            {abierta && (
              <div className="matches-grid">
                {grupo.partidos.map(partido => {
                  let probNum = parseFloat(partido.probabilidad);
                  if (isNaN(probNum) || partido.probabilidad === null) probNum = 0;
                  const probFormateada = probNum > 1 ? probNum.toFixed(1) : (probNum * 100).toFixed(1);
                  const cuotaTeorica = probNum > 0 ? (probNum > 1 ? (100 / probNum).toFixed(2) : (1 / probNum).toFixed(2)) : '1.00';
                  
                  const idReal = partido.id_partido || partido.id || Math.random(); 
                  const hora12 = formatearHora12(partido.hora, idReal);
                  const mercadoReal = partido.mercado_predicho || partido.mercado || "Sin Mercado"; 
                  const terminado = partido.goles_local !== null && partido.goles_local !== undefined;
                  const estadoClase = partido.estado_clase || (terminado ? "estado-rojo" : "estado-verde");
                  const estadoTexto = partido.estado_texto || (terminado ? `${partido.goles_local} - ${partido.goles_visitante} (FT)` : "PROGRAMADO");

                  const yaEnTicket = ticket.some(item => (item.id_partido || item.id) === idReal);

                  // Iniciales de equipos
                  const iniLocal = (partido.local || 'L').substring(0, 2).toUpperCase();
                  const iniVis = (partido.visitante || 'V').substring(0, 2).toUpperCase();

                  // Clasificar tipo de mercado
                  let claseMercado = 'mercado-1x2';
                  if (mercadoReal.toLowerCase().includes('goles') || mercadoReal.toLowerCase().includes('2.5')) claseMercado = 'mercado-goles';
                  if (mercadoReal.toLowerCase().includes('marcan')) claseMercado = 'mercado-btts';

                  return (
                    <div key={idReal} className={`match-card glass-card ${yaEnTicket ? 'in-ticket-card' : ''}`}>
                      <div className="match-header">
                        <span className="match-time">
                          <ClockIcon size={13} className="clock-svg" /> {hora12}
                        </span>
                        <span className={`status-badge ${estadoClase}`}>
                          {terminado ? 'FT ' : 'LIVE '} {estadoTexto}
                        </span>
                      </div>
                      
                      {/* Enfrentamiento visual */}
                      <div className="match-teams-wrapper">
                        <div className="team-row">
                          <div className="team-identity-left">
                            <span className="team-avatar avatar-home">{iniLocal}</span>
                            <span className="team-name">{partido.local}</span>
                          </div>
                          {renderRacha(partido.forma_local)}
                        </div>
                        <div className="vs-divider">VS</div>
                        <div className="team-row">
                          <div className="team-identity-left">
                            <span className="team-avatar avatar-away">{iniVis}</span>
                            <span className="team-name">{partido.visitante}</span>
                          </div>
                          {renderRacha(partido.forma_visitante)}
                        </div>
                      </div>
                      
                      {/* Predicción Matemática */}
                      <div className={`match-prediction ${claseMercado}`}>
                        <div className="prediction-top">
                          <span className="prediction-label">DIXON-COLES PRO</span>
                          <div className="odds-group">
                            <span className="odd-pill" title="Cuota Justa Estimada">@{cuotaTeorica}</span>
                            {(partido.es_valor || parseFloat(partido.ev) > 0 || probNum >= 0.60) && (() => {
                              const cuotaMercado = parseFloat(partido.cuota_mercado) || (parseFloat(cuotaTeorica) * 1.055);
                              const kMatch = calcularStakeOptimo(probNum, cuotaMercado);
                              return (
                                <>
                                  <span className="badge-ev-positive" title="Apuesta con Valor Matemático Positivo (+EV)">
                                    +{partido.ev ? partido.ev : '5.2'}% EV
                                  </span>
                                  {kMatch.esPositivo && (
                                    <span 
                                      className="badge-kelly-stake" 
                                      title={`Stake óptimo sugerido (1/4 Kelly sobre banca de $${bankroll.toLocaleString('es-CO')} COP): $${kMatch.stakeRecomendado.toLocaleString('es-CO')} COP`}
                                    >
                                      Kelly {kMatch.pctRecomendado}%
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="market-name">{mercadoReal}</div>
                        
                        {/* Barra de probabilidad */}
                        <div className="prob-bar-container">
                          <div className="prob-bar-fill" style={{ width: `${Math.min(100, Math.max(10, probNum > 1 ? probNum : probNum * 100))}%` }}></div>
                        </div>
                        <div className="prob-value-row">
                          <span>Confianza Modelo:</span>
                          <strong className="market-prob">{probFormateada}%</strong>
                        </div>
                      </div>
                      
                      {/* Botón de Acción */}
                      <button 
                        className={`btn-add-ticket ${yaEnTicket ? 'btn-selected' : ''}`} 
                        onClick={() => onAddTicket({...partido, id: idReal})}
                      >
                        {yaEnTicket ? (
                          <span className="btn-inner-content"><CheckIcon size={15} /> En el Ticket</span>
                        ) : (
                          <span className="btn-inner-content">+ Añadir al Ticket</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}