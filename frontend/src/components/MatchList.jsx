import { useState, useMemo } from 'react';

export default function MatchList({ partidos, onAddTicket }) {
  const [ligasAbiertas, setLigasAbiertas] = useState({});

  // 1. DICCIONARIO DE TORNEOS: Asigna Nombre Comercial, País, Código de Bandera y Prioridad
  const clasificarTorneo = (nombreOriginal) => {
    const t = nombreOriginal.toLowerCase();
    
    if (t.includes("primera a") || t.includes("betplay")) return { nombre: "Liga BetPlay", pais: "COLOMBIA", bandera: "co", prioridad: 1 };
    if (t.includes("champions league") || t.includes("uefa champions")) return { nombre: "Champions League", pais: "EUROPA", bandera: "eu", prioridad: 2 };
    if (t.includes("premier league")) return { nombre: "Premier League", pais: "INGLATERRA", bandera: "gb-eng", prioridad: 3 };
    if (t.includes("la liga") || t.includes("primera division")) return { nombre: "LaLiga EA Sports", pais: "ESPAÑA", bandera: "es", prioridad: 4 };
    if (t.includes("libertadores")) return { nombre: "Copa Libertadores", pais: "SUDAMÉRICA", bandera: "un", prioridad: 5 };
    if (t.includes("serie a")) return { nombre: "Serie A", pais: "ITALIA", bandera: "it", prioridad: 6 };
    if (t.includes("bundesliga")) return { nombre: "Bundesliga", pais: "ALEMANIA", bandera: "de", prioridad: 7 };
    if (t.includes("europa league")) return { nombre: "Europa League", pais: "EUROPA", bandera: "eu", prioridad: 8 };
    if (t.includes("ligue 1")) return { nombre: "Ligue 1", pais: "FRANCIA", bandera: "fr", prioridad: 9 };
    if (t.includes("mls") || t.includes("major league soccer")) return { nombre: "MLS", pais: "EE. UU.", bandera: "us", prioridad: 10 };
    if (t.includes("copa colombia")) return { nombre: "Copa Colombia", pais: "COLOMBIA", bandera: "co", prioridad: 11 };
    if (t.includes("primera b")) return { nombre: "Primera B", pais: "COLOMBIA", bandera: "co", prioridad: 12 };

    // Torneos no mapeados asumen una bandera genérica (Naciones Unidas) y van al fondo
    return { nombre: nombreOriginal, pais: "MUNDO", bandera: "un", prioridad: 99 };
  };

  // 2. Agrupar los partidos e incluir la metadata de país y bandera
  const torneosAgrupados = useMemo(() => {
    const grupos = {};
    partidos.forEach(partido => {
      const { nombre, pais, bandera, prioridad } = clasificarTorneo(partido.torneo);
      
      const keyUnica = `${pais}-${nombre}`; // Evita choques si dos ligas se llaman igual en distintos países
      
      if (!grupos[keyUnica]) {
        grupos[keyUnica] = { 
          nombreLiga: nombre,
          nombrePais: pais,
          codigoBandera: bandera,
          partidos: [], 
          prioridad: prioridad 
        };
      }
      grupos[keyUnica].partidos.push(partido);
    });
    return grupos;
  }, [partidos]);

  // 3. Ordenar basado en la prioridad
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
    return <div className="empty-state">No hay partidos disponibles en este momento.</div>;
  }

  return (
    <div className="match-list-container">
      {ligasOrdenadas.map(torneoKey => {
        const grupo = torneosAgrupados[torneoKey];
        
        return (
          <div key={torneoKey} className="tournament-group">
            
            {/* CABECERA AL ESTILO FLASHSCORE */}
            <div 
              className={`tournament-header ${ligasAbiertas[torneoKey] ? 'active' : ''}`} 
              onClick={() => toggleLiga(torneoKey)}
            >
              <div className="tournament-title">
                {/* Bandera consumida directamente desde FlagCDN */}
                <img 
                  src={`https://flagcdn.com/24x18/${grupo.codigoBandera}.png`} 
                  alt={grupo.nombrePais} 
                  className="league-flag"
                  width="20"
                  height="15"
                />
                
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
            
            {/* TARJETAS DE PARTIDOS */}
            {ligasAbiertas[torneoKey] && (
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