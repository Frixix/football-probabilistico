import { useState, useMemo } from 'react';

export default function MatchList({ partidos, onAddTicket }) {
  const [ligasAbiertas, setLigasAbiertas] = useState({});

  // 1. Algoritmo de Prioridad para Ligas (Para audiencia en Colombia)
  const obtenerPrioridad = (nombreTorneo) => {
    const t = nombreTorneo.toLowerCase();
    if (t.includes("primera a") || t.includes("betplay") || t.includes("copa colombia")) return 1;
    if (t.includes("champions league")) return 2;
    if (t.includes("premier league")) return 3;
    if (t.includes("la liga") || t.includes("primera division")) return 4;
    if (t.includes("libertadores")) return 5;
    if (t.includes("serie a")) return 6;
    if (t.includes("bundesliga")) return 7;
    if (t.includes("europa league")) return 8;
    if (t.includes("ligue 1")) return 9;
    if (t.includes("mls") || t.includes("major league soccer")) return 10;
    return 99; // Si no es ninguna de estas, se va al fondo de la lista
  };

  // 2. Agrupar los partidos
  const partidosAgrupados = useMemo(() => {
    const grupos = {};
    partidos.forEach(partido => {
      if (!grupos[partido.torneo]) {
        grupos[partido.torneo] = [];
      }
      grupos[partido.torneo].push(partido);
    });
    return grupos;
  }, [partidos]);

  // 3. Obtener los nombres de los torneos y ORDENARLOS por nuestra prioridad
  const ligasOrdenadas = Object.keys(partidosAgrupados).sort((a, b) => {
    const prioridadA = obtenerPrioridad(a);
    const prioridadB = obtenerPrioridad(b);
    
    // Si tienen distinta prioridad, ordenamos por número (el 1 va primero)
    if (prioridadA !== prioridadB) {
      return prioridadA - prioridadB;
    }
    // Si tienen la misma prioridad (ej. ambas son 99), se ordenan alfabéticamente
    return a.localeCompare(b);
  });

  const toggleLiga = (torneo) => {
    setLigasAbiertas(prev => ({
      ...prev,
      [torneo]: !prev[torneo]
    }));
  };

  if (!partidos || partidos.length === 0) {
    return <div className="empty-state">No hay partidos disponibles en este momento.</div>;
  }

  return (
    <div className="match-list-container">
      {ligasOrdenadas.map(torneo => (
        <div key={torneo} className="tournament-group">
          
          <div 
            className={`tournament-header ${ligasAbiertas[torneo] ? 'active' : ''}`} 
            onClick={() => toggleLiga(torneo)}
          >
            <div className="tournament-title">
              {/* ÍCONO SVG PROFESIONAL DE TORNEO/COPA */}
              <svg className="svg-icon accent-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                <path d="M4 22h16"></path>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
              </svg>
              
              <h3>{torneo}</h3>
              <span className="match-count">{partidosAgrupados[torneo].length} partidos</span>
            </div>
            
            {/* ÍCONO SVG PARA LA FLECHA DESPLEGABLE */}
            <svg 
              className="svg-icon toggle-icon" 
              style={{ transform: ligasAbiertas[torneo] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} 
              xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          
          {ligasAbiertas[torneo] && (
            <div className="matches-grid">
              {partidosAgrupados[torneo].map(partido => {
                const probFormateada = partido.prob > 1 
                  ? partido.prob.toFixed(1) 
                  : (partido.prob * 100).toFixed(1);

                return (
                  <div key={partido.id} className="match-card glass-card">
                    <div className="match-header">
                      {/* ÍCONO SVG DE RELOJ */}
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
      ))}
    </div>
  );
}