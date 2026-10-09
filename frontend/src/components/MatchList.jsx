import { useState, useMemo } from 'react';
import { obtenerInfoTorneo, obtenerUrlBandera } from '../utils/leagues';

export default function MatchList({ partidos, ticket = [], onAddTicket, filtroMercado = 'todos' }) {
  // Inicializar con las ligas top abiertas por defecto
  const [ligasAbiertas, setLigasAbiertas] = useState({});

  const toggleLiga = (torneoKey) => {
    setLigasAbiertas(prev => ({
      ...prev,
      [torneoKey]: prev[torneoKey] === undefined ? false : !prev[torneoKey]
    }));
  };

  const formatearHora12 = (hora24) => {
    if (!hora24 || hora24 === "TBD") return "Hoy";
    const [horaStr, min] = hora24.split(":");
    let hora = parseInt(horaStr, 10);
    if (isNaN(hora)) return "Hoy";
    const ampm = hora >= 12 ? 'PM' : 'AM';
    hora = hora % 12;
    hora = hora ? hora : 12; 
    return `${hora}:${min} ${ampm}`;
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
      return true;
    });
  }, [partidos, filtroMercado]);

  // Agrupar y ordenar torneos con algoritmo de prioridad (Top primero, desconocidos al final)
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

  // Ordenar ligas: menor número de prioridad primero, torneos desconocidos (>=85) al final
  const ligasOrdenadas = useMemo(() => {
    return Object.keys(torneosAgrupados).sort((a, b) => {
      const prioA = torneosAgrupados[a].prioridad;
      const prioB = torneosAgrupados[b].prioridad;
      if (prioA !== prioB) return prioA - prioB; 
      return torneosAgrupados[a].nombreLiga.localeCompare(torneosAgrupados[b].nombreLiga);
    });
  }, [torneosAgrupados]);

  // Determinar si una liga está abierta: ligas con prioridad < 60 están abiertas por defecto
  const estaAbierta = (torneoKey, prioridad) => {
    if (ligasAbiertas[torneoKey] !== undefined) {
      return ligasAbiertas[torneoKey];
    }
    return prioridad < 60; // Abiertas automáticamente las principales
  };

  if (!partidos || partidos.length === 0) {
    return (
      <div className="empty-state glass-card">
        <div className="empty-icon">⚽</div>
        <h3>No hay partidos disponibles para la fecha</h3>
        <p>Los pronósticos se sincronizan automáticamente cada madrugada según el calendario de partidos.</p>
      </div>
    );
  }

  if (partidosFiltrados.length === 0) {
    return (
      <div className="empty-state glass-card">
        <div className="empty-icon">🔍</div>
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
                    🏆
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
                <span className={`toggle-chevron ${abierta ? 'rotated' : ''}`}>▼</span>
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
                  
                  const hora12 = formatearHora12(partido.hora);
                  const mercadoReal = partido.mercado_predicho || partido.mercado || "Sin Mercado"; 
                  const idReal = partido.id_partido || partido.id || Math.random(); 
                  const terminado = partido.goles_local !== null && partido.goles_local !== undefined;
                  const estadoClase = partido.estado_clase || (terminado ? "estado-rojo" : "estado-verde");
                  const estadoTexto = partido.estado_texto || (terminado ? `${partido.goles_local} - ${partido.goles_visitante} (FT)` : "PROGRAMADO");

                  const yaEnTicket = ticket.some(item => (item.id_partido || item.id) === idReal);

                  // Obtener iniciales de equipos
                  const iniLocal = (partido.local || 'L').substring(0, 2).toUpperCase();
                  const iniVis = (partido.visitante || 'V').substring(0, 2).toUpperCase();

                  // Clasificar tipo de mercado para color
                  let claseMercado = 'mercado-1x2';
                  if (mercadoReal.toLowerCase().includes('goles') || mercadoReal.toLowerCase().includes('2.5')) claseMercado = 'mercado-goles';
                  if (mercadoReal.toLowerCase().includes('marcan')) claseMercado = 'mercado-btts';

                  return (
                    <div key={idReal} className={`match-card glass-card ${yaEnTicket ? 'in-ticket-card' : ''}`}>
                      <div className="match-header">
                        <span className="match-time">
                          <span className="clock-icon">🕒</span> {hora12}
                        </span>
                        <span className={`status-badge ${estadoClase}`}>
                          {terminado ? '● ' : '○ '} {estadoTexto}
                        </span>
                      </div>
                      
                      {/* Enfrentamiento visual */}
                      <div className="match-teams-wrapper">
                        <div className="team-row">
                          <span className="team-avatar avatar-home">{iniLocal}</span>
                          <span className="team-name">{partido.local}</span>
                        </div>
                        <div className="vs-divider">VS</div>
                        <div className="team-row">
                          <span className="team-avatar avatar-away">{iniVis}</span>
                          <span className="team-name">{partido.visitante}</span>
                        </div>
                      </div>
                      
                      {/* Predicción Matemática */}
                      <div className={`match-prediction ${claseMercado}`}>
                        <div className="prediction-top">
                          <span className="prediction-label">PRONÓSTICO POISSON</span>
                          <span className="odd-pill">@{cuotaTeorica}</span>
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
                        {yaEnTicket ? '✓ En el Ticket' : '+ Añadir al Ticket'}
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