import { useState, useMemo } from 'react';
import { obtenerInfoTorneo, obtenerUrlBandera } from '../utils/leagues';
import { 
  TrophyIcon, ClockIcon, ChevronDownIcon, 
  BallIcon, SearchIcon, CheckIcon, LayersIcon, SwordsIcon 
} from './Icons';
import { useBankroll } from '../hooks/useBankroll';
import { generarMercadosCompletos } from '../utils/markets';
import H2HModal from './H2HModal';

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
  const [partidosExpandidos, setPartidosExpandidos] = useState({});
  const [partidoH2H, setPartidoH2H] = useState(null);
  const { bankroll, calcularStakeOptimo } = useBankroll();

  const toggleMercados = (id) => {
    setPartidosExpandidos(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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
      if (filtroMercado === 'doble_oportunidad') return true;
      if (filtroMercado === 'goles') return mercado.includes('goles') || mercado.includes('2.5');
      if (filtroMercado === 'goles_lineas') return true;
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

                  const mercados = generarMercadosCompletos(partido);
                  const estaExpandido = !!partidosExpandidos[idReal];

                  // Selección activa en el ticket para este partido
                  const itemEnTicket = ticket.find(item => (item.id_partido || item.id) === idReal);
                  const yaEnTicket = !!itemEnTicket;
                  const mercadoEnTicket = itemEnTicket ? (itemEnTicket.mercado_predicho || itemEnTicket.mercado) : null;

                  // Mercado destacado según filtro activo
                  let mercadoDestacado = mercadoReal;
                  let probDestacada = probFormateada;
                  let cuotaDestacada = cuotaTeorica;

                  if (filtroMercado === 'doble_oportunidad') {
                    const topDC = [...mercados.doble_oportunidad].sort((a, b) => b.prob - a.prob)[0];
                    if (topDC) {
                      mercadoDestacado = topDC.etiqueta;
                      probDestacada = topDC.prob;
                      cuotaDestacada = topDC.cuota;
                    }
                  } else if (filtroMercado === 'goles_lineas') {
                    const topGL = [...mercados.goles].sort((a, b) => b.prob - a.prob)[0];
                    if (topGL) {
                      mercadoDestacado = topGL.etiqueta;
                      probDestacada = topGL.prob;
                      cuotaDestacada = topGL.cuota;
                    }
                  }

                  // Iniciales de equipos
                  const iniLocal = (partido.local || 'L').substring(0, 2).toUpperCase();
                  const iniVis = (partido.visitante || 'V').substring(0, 2).toUpperCase();

                  // Clasificar tipo de mercado
                  let claseMercado = 'mercado-1x2';
                  if (mercadoDestacado.toLowerCase().includes('goles') || mercadoDestacado.toLowerCase().includes('2.5')) claseMercado = 'mercado-goles';
                  if (mercadoDestacado.toLowerCase().includes('marcan')) claseMercado = 'mercado-btts';
                  if (mercadoDestacado.toLowerCase().includes('1x') || mercadoDestacado.toLowerCase().includes('x2') || mercadoDestacado.toLowerCase().includes('12')) claseMercado = 'mercado-dc';

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
                        <div className="vs-divider-row">
                          <button 
                            type="button" 
                            className="btn-h2h-trigger" 
                            onClick={(e) => { e.stopPropagation(); setPartidoH2H(partido); }}
                            title="Ver historial de duelos directos cara a cara (H2H)"
                          >
                            <SwordsIcon size={12} className="swords-icon-mini" />
                            <span>H2H</span>
                          </button>
                        </div>
                        <div className="team-row">
                          <div className="team-identity-left">
                            <span className="team-avatar avatar-away">{iniVis}</span>
                            <span className="team-name">{partido.visitante}</span>
                          </div>
                          {renderRacha(partido.forma_visitante)}
                        </div>
                      </div>
                      
                      {/* Predicción Matemática Destacada */}
                      <div className={`match-prediction ${claseMercado}`}>
                        <div className="prediction-top">
                          <span className="prediction-label">DIXON-COLES PRO</span>
                          <div className="odds-group">
                            <span className="odd-pill" title="Cuota Justa Estimada">@{cuotaDestacada}</span>
                            {(partido.es_valor || parseFloat(partido.ev) > 0 || probNum >= 0.60) && (() => {
                              const cuotaMercado = parseFloat(partido.cuota_mercado) || (parseFloat(cuotaDestacada) * 1.055);
                              const kMatch = calcularStakeOptimo(probDestacada, cuotaMercado);
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
                        <div className="market-name">{mercadoDestacado}</div>
                        
                        {/* Barra de probabilidad */}
                        <div className="prob-bar-container">
                          <div className="prob-bar-fill" style={{ width: `${Math.min(100, Math.max(10, parseFloat(probDestacada)))}%` }}></div>
                        </div>
                        <div className="prob-value-row">
                          <span>Confianza Modelo:</span>
                          <strong className="market-prob">{probDestacada}%</strong>
                        </div>
                      </div>
                      
                      {/* Botón Principal para el Ticket */}
                      <button 
                        className={`btn-add-ticket ${yaEnTicket && mercadoEnTicket === mercadoDestacado ? 'btn-selected' : ''}`} 
                        onClick={() => onAddTicket({
                          ...partido, 
                          id_partido: idReal,
                          mercado_predicho: mercadoDestacado,
                          mercado: mercadoDestacado,
                          probabilidad: probDestacada,
                          cuota_mercado: cuotaDestacada
                        })}
                      >
                        {yaEnTicket && mercadoEnTicket === mercadoDestacado ? (
                          <span className="btn-inner-content"><CheckIcon size={15} /> En el Ticket</span>
                        ) : yaEnTicket ? (
                          <span className="btn-inner-content"><CheckIcon size={15} /> Cambiar a {mercadoDestacado}</span>
                        ) : (
                          <span className="btn-inner-content">+ Añadir Selección ({mercadoDestacado})</span>
                        )}
                      </button>

                      {/* Desplegable de Mercados Derivados */}
                      <button 
                        type="button" 
                        className={`btn-toggle-derived ${estaExpandido ? 'expanded' : ''}`}
                        onClick={() => toggleMercados(idReal)}
                        title="Ver todos los mercados calculados por la matriz de Poisson"
                      >
                        <div className="btn-toggle-left">
                          <LayersIcon size={14} className="layers-svg" />
                          <span>{estaExpandido ? 'Ocultar Mercados' : 'Ver Todos los Mercados (11 Opciones)'}</span>
                        </div>
                        <ChevronDownIcon size={13} className={`chevron-toggle ${estaExpandido ? 'rotated' : ''}`} />
                      </button>

                      {/* Panel Acordeón de Mercados Derivados */}
                      {estaExpandido && (
                        <div className="derived-markets-panel">
                          {/* 1. Doble Oportunidad */}
                          <div className="derived-group">
                            <span className="derived-group-title">Doble Oportunidad (1X, X2, 12)</span>
                            <div className="derived-chips-grid grid-3">
                              {mercados.doble_oportunidad.map(m => {
                                const activo = mercadoEnTicket === m.etiqueta;
                                return (
                                  <button
                                    key={m.etiqueta}
                                    type="button"
                                    className={`derived-chip ${activo ? 'chip-selected' : ''}`}
                                    onClick={() => onAddTicket({
                                      ...partido,
                                      id: `${idReal}-${m.etiqueta}`,
                                      id_partido: idReal,
                                      mercado_predicho: m.etiqueta,
                                      mercado: m.etiqueta,
                                      probabilidad: m.prob,
                                      cuota_mercado: m.cuota
                                    })}
                                    title={`Añadir ${m.etiqueta} al ticket`}
                                  >
                                    <span className="chip-name">{m.etiqueta.split(' ')[0]}</span>
                                    <div className="chip-odds-wrap">
                                      <strong className="chip-odd">@{m.cuota}</strong>
                                      <span className="chip-prob">{m.prob}%</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 2. Líneas de Goles */}
                          <div className="derived-group">
                            <span className="derived-group-title">Líneas de Goles (+/- 1.5, 2.5, 3.5)</span>
                            <div className="derived-chips-grid grid-3">
                              {mercados.goles.map(m => {
                                const activo = mercadoEnTicket === m.etiqueta;
                                const nombreCorto = m.etiqueta.replace(' Goles', '').replace('Más de', '+').replace('Menos de', '-');
                                return (
                                  <button
                                    key={m.etiqueta}
                                    type="button"
                                    className={`derived-chip ${activo ? 'chip-selected' : ''}`}
                                    onClick={() => onAddTicket({
                                      ...partido,
                                      id: `${idReal}-${m.etiqueta}`,
                                      id_partido: idReal,
                                      mercado_predicho: m.etiqueta,
                                      mercado: m.etiqueta,
                                      probabilidad: m.prob,
                                      cuota_mercado: m.cuota
                                    })}
                                    title={`Añadir ${m.etiqueta} al ticket`}
                                  >
                                    <span className="chip-name">{nombreCorto}</span>
                                    <div className="chip-odds-wrap">
                                      <strong className="chip-odd">@{m.cuota}</strong>
                                      <span className="chip-prob">{m.prob}%</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 3. Ambos Marcan (BTTS) */}
                          <div className="derived-group">
                            <span className="derived-group-title">Ambos Equipos Marcan</span>
                            <div className="derived-chips-grid grid-2">
                              {mercados.btts.map(m => {
                                const activo = mercadoEnTicket === m.etiqueta;
                                return (
                                  <button
                                    key={m.etiqueta}
                                    type="button"
                                    className={`derived-chip ${activo ? 'chip-selected' : ''}`}
                                    onClick={() => onAddTicket({
                                      ...partido,
                                      id: `${idReal}-${m.etiqueta}`,
                                      id_partido: idReal,
                                      mercado_predicho: m.etiqueta,
                                      mercado: m.etiqueta,
                                      probabilidad: m.prob,
                                      cuota_mercado: m.cuota
                                    })}
                                    title={`Añadir ${m.etiqueta} al ticket`}
                                  >
                                    <span className="chip-name">{m.etiqueta.includes('Sí') ? 'BTTS Sí' : 'BTTS No'}</span>
                                    <div className="chip-odds-wrap">
                                      <strong className="chip-odd">@{m.cuota}</strong>
                                      <span className="chip-prob">{m.prob}%</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal de Enfrentamientos Directos (H2H) */}
      {partidoH2H && (
        <H2HModal partido={partidoH2H} onClose={() => setPartidoH2H(null)} />
      )}
    </div>
  );
}