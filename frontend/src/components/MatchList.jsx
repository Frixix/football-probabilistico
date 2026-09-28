import { useState, useMemo } from 'react';

export default function MatchList({ partidos, onAddTicket }) {
  // Estado para controlar qué ligas están abiertas o cerradas
  const [ligasAbiertas, setLigasAbiertas] = useState({});

  // 1. Agrupar los partidos por 'torneo' automáticamente
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

  // 2. Función para abrir/cerrar un torneo
  const toggleLiga = (torneo) => {
    setLigasAbiertas(prev => ({
      ...prev,
      [torneo]: !prev[torneo]
    }));
  };

  if (!partidos || partidos.length === 0) {
    return <div className="empty-state">No hay partidos disponibles.</div>;
  }

  return (
    <div className="match-list-container">
      {Object.keys(partidosAgrupados).map(torneo => (
        <div key={torneo} className="tournament-group">
          
          {/* CABECERA DEL ACORDEÓN */}
          <div 
            className={`tournament-header ${ligasAbiertas[torneo] ? 'active' : ''}`} 
            onClick={() => toggleLiga(torneo)}
          >
            <div className="tournament-title">
              <span className="trophy-icon">🏆</span>
              <h3>{torneo}</h3>
              <span className="match-count">{partidosAgrupados[torneo].length} partidos</span>
            </div>
            <span className="toggle-icon">
              {ligasAbiertas[torneo] ? '▲' : '▼'}
            </span>
          </div>
          
          {/* LISTA DE PARTIDOS (Solo se muestra si la liga está abierta) */}
          {ligasAbiertas[torneo] && (
            <div className="matches-grid">
              {partidosAgrupados[torneo].map(partido => {
                // Formateamos la probabilidad para que siempre se vea bien (ej. 75.5%)
                const probFormateada = partido.prob > 1 
                  ? partido.prob.toFixed(1) 
                  : (partido.prob * 100).toFixed(1);

                return (
                  <div key={partido.id} className="match-card glass-card">
                    <div className="match-header">
                      <span className="match-time">🕒 {partido.hora}</span>
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
                    
                    <button 
                      className="btn-add-ticket" 
                      onClick={() => onAddTicket(partido)}
                    >
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