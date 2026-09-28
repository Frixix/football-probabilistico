import { useState, useMemo } from 'react';

export default function MatchList({ partidos, onAddTicket }) {
  const [ligasAbiertas, setLigasAbiertas] = useState({});

  // 1. EL TRADUCTOR Y CLASIFICADOR PREMIUM
  // Intercepta el nombre de la API, le pone su nombre comercial y su nivel de prioridad
  const clasificarTorneo = (nombreOriginal) => {
    const t = nombreOriginal.toLowerCase();
    
    if (t.includes("primera a") || t.includes("betplay")) return { nombre: "Liga BetPlay", prioridad: 1 };
    if (t.includes("champions league") || t.includes("uefa champions")) return { nombre: "Champions League", prioridad: 2 };
    if (t.includes("premier league")) return { nombre: "Premier League", prioridad: 3 };
    if (t.includes("la liga") || t.includes("primera division")) return { nombre: "LaLiga", prioridad: 4 };
    if (t.includes("libertadores")) return { nombre: "Copa Libertadores", prioridad: 5 };
    if (t.includes("serie a")) return { nombre: "Serie A", prioridad: 6 };
    if (t.includes("bundesliga")) return { nombre: "Bundesliga", prioridad: 7 };
    if (t.includes("europa league")) return { nombre: "Europa League", prioridad: 8 };
    if (t.includes("ligue 1")) return { nombre: "Ligue 1", prioridad: 9 };
    if (t.includes("mls") || t.includes("major league soccer")) return { nombre: "MLS", prioridad: 10 };
    if (t.includes("copa colombia")) return { nombre: "Copa Colombia", prioridad: 11 };

    // Si es un torneo de otro país, se queda con su nombre original y va al fondo (99)
    return { nombre: nombreOriginal, prioridad: 99 };
  };

  // 2. Agrupar los partidos usando los NOMBRES NUEVOS
  const torneosAgrupados = useMemo(() => {
    const grupos = {};
    partidos.forEach(partido => {
      const { nombre, prioridad } = clasificarTorneo(partido.torneo);
      
      if (!grupos[nombre]) {
        grupos[nombre] = { 
          partidos: [], 
          prioridad: prioridad 
        };
      }
      grupos[nombre].partidos.push(partido);
    });
    return grupos;
  }, [partidos]);

  // 3. Ordenar las llaves (nombres de los torneos) basado en la prioridad
  const ligasOrdenadas = Object.keys(torneosAgrupados).sort((a, b) => {
    const prioA = torneosAgrupados[a].prioridad;
    const prioB = torneosAgrupados[b].prioridad;
    
    if (prioA !== prioB) return prioA - prioB; // El 1 va primero, luego el 2...
    return a.localeCompare(b); // Si ambos son 99, se ordenan por orden alfabético
  });

  const toggleLiga = (torneo) => {
    setLigasAbiertas(prev => ({ ...prev, [torneo]: !prev[torneo] }));
  };

  if (!partidos || partidos.length === 0) {
    return <div className="empty-state">No hay partidos disponibles en este momento.</div>;
  }

  return (
    <div className="match-list-container">
      {ligasOrdenadas.map(torneoNombre => {
        const grupo = torneosAgrupados[torneoNombre];
        
        return (
          <div key={torneoNombre} className="tournament-group">
            
            {/* CABECERA (Totalmente limpia, usando SVG) */}
            <div 
              className={`tournament-header ${ligasAbiertas[torneoNombre] ? 'active' : ''}`} 
              onClick={() => toggleLiga(torneoNombre)}
            >
              <div className="tournament-title">
                <svg className="svg-icon accent-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                  <path d="M4 22h16"></path>
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                </svg>
                
                {/* Aquí ya se imprime "Liga BetPlay" o "Champions League" en vez de "Primera A" */}
                <h3>{torneoNombre}</h3> 
                <span className="match-count">{grupo.partidos.length} partidos</span>
              </div>
              
              <svg 
                className="svg-icon toggle-icon" 
                style={{ transform: ligasAbiertas[torneoNombre] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} 
                xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {/* TARJETAS DE PARTIDOS */}
            {ligasAbiertas[torneoNombre] && (
              <div className="matches-grid">
                {grupo.partidos.map(partido => {
                  const probFormateada = partido.prob > 1 
                    ? partido.prob.toFixed(1) 
                    : (partido.prob * 100).toFixed(1);

                  return (
                    <div key={partido.id} className="match-card glass-card">
                      <div className="match-header">
                        <span className="match-time" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {partido.hora}
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