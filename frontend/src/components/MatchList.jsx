import { useState, useMemo } from 'react';

export default function MatchList({ partidos, onAddTicket }) {
  const [ligasAbiertas, setLigasAbiertas] = useState({});

  const formatearHora12 = (hora24) => {
    if (!hora24 || hora24 === "TBD") return "TBD";
    const [horaStr, min] = hora24.split(":");
    let hora = parseInt(horaStr, 10);
    const ampm = hora >= 12 ? 'PM' : 'AM';
    hora = hora % 12;
    hora = hora ? hora : 12; 
    return `${hora}:${min} ${ampm}`;
  };

  // 1. SOLO ORDEN DE PRIORIDAD (La API ya nos da la información exacta)
  const obtenerPrioridad = (nombreTorneo, pais) => {
    const t = nombreTorneo.toLowerCase();
    const p = pais.toLowerCase();
    
    if (p === "colombia") {
      if (t.includes("primera a") || t.includes("betplay")) return 1;
      if (t.includes("copa colombia")) return 2;
      if (t.includes("primera b")) return 12;
    }
    if (t.includes("champions league")) return 3;
    if (t.includes("premier league")) return 4;
    if (t.includes("la liga") || (t.includes("primera division") && p === "spain")) return 5;
    if (t.includes("libertadores")) return 6;
    if (t.includes("serie a") && p === "italy") return 7;
    if (t.includes("bundesliga") && p === "germany") return 8;
    if (t.includes("europa league")) return 9;
    if (t.includes("ligue 1") && p === "france") return 10;
    if (t.includes("mls") || t.includes("major league soccer")) return 11;

    if (p === "world" || t.includes("friendlies") || t.includes("qualification")) return 15;
    return 99; 
  };

  const torneosAgrupados = useMemo(() => {
    const grupos = {};
    partidos.forEach(partido => {
      // Tomamos el país y bandera exactos desde el Backend
      const nombreLiga = partido.torneo;
      const nombrePais = partido.pais || "Mundo";
      const bandera = partido.bandera;
      const prioridad = obtenerPrioridad(nombreLiga, nombrePais);
      
      const keyUnica = `${nombrePais}-${nombreLiga}`; 
      
      if (!grupos[keyUnica]) {
        grupos[keyUnica] = { 
          nombreLiga,
          nombrePais,
          bandera,
          partidos: [], 
          prioridad 
        };
      }
      grupos[keyUnica].partidos.push(partido);
    });
    return grupos;
  }, [partidos]);

  const ligasOrdenadas = Object.keys(torneosAgrupados).sort((a, b) => {
    const prioA = torneosAgrupados[a].prioridad;
    const prioB = torneosAgrupados[b].prioridad;
    if (prioA !== prioB) return prioA - prioB; 
    return a.localeCompare(b);
  });

  const toggleLiga = (torneoKey) => {
    setLigasAbiertas(prev => ({ ...prev, [torneoKey]: !prev[torneoKey] }));
  };

  if (!partidos || partidos.length === 0) {
    return <div className="empty-state">No hay partidos disponibles.</div>;
  }

  return (
    <div className="match-list-container">
      {ligasOrdenadas.map(torneoKey => {
        const grupo = torneosAgrupados[torneoKey];
        
        return (
          <div key={torneoKey} className="tournament-group">
            
            <div 
              className={`tournament-header ${ligasAbiertas[torneoKey] ? 'active' : ''}`} 
              onClick={() => toggleLiga(torneoKey)}
            >
              <div className="tournament-title">
                {/* Renderiza el SVG oficial si existe, o un ícono genérico mundial */}
                {grupo.bandera ? (
                  <img 
                    src={grupo.bandera} 
                    alt={grupo.nombrePais} 
                    className="league-flag"
                    style={{ width: '24px', height: '18px', objectFit: 'cover', borderRadius: '3px' }}
                  />
                ) : (
                  <svg className="svg-icon accent-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                )}
                
                <h3>
                  <span className="country-label">{grupo.nombrePais}:</span> {grupo.nombreLiga}
                </h3> 
                <span className="match-count">{grupo.partidos.length}</span>
              </div>
              
              <svg 
                className="svg-icon toggle-icon" 
                style={{ transform: ligasAbiertas[torneoKey] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} 
                xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {ligasAbiertas[torneoKey] && (
              <div className="matches-grid">
                {grupo.partidos.map(partido => {
                  const probFormateada = partido.prob > 1 
                    ? partido.prob.toFixed(1) 
                    : (partido.prob * 100).toFixed(1);
                  const hora12 = formatearHora12(partido.hora);

                  return (
                    <div key={partido.id} className="match-card glass-card">
                      <div className="match-header">
                        <span className="match-time" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {hora12}
                        </span>
                        <span className={`status-badge ${partido.estado_clase}`}>
                          {partido.estado_texto}
                        </span>
                      </div>
                      
                      <div className="match-teams">
                        <div className="team">{partido.local}</div>
                        <div className="vs">vs</div>
                        <div className="team">{partido.visitante}</div>
                      </div>
                      
                      <div className="match-prediction">
                        <div className="market-name">{partido.mercado}</div>
                        <div className="market-prob">{probFormateada}%</div>
                      </div>
                      
                      <button className="btn-add-ticket" onClick={() => onAddTicket(partido)}>
                        + Añadir al Ticket
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