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

  // 1. DICCIONARIO EXPANDIDO Y GLOBAL: Reconoce muchas más ligas del mundo
  const clasificarTorneo = (nombreOriginal) => {
    const t = nombreOriginal.toLowerCase();
    
    // --- TOP PRIORIDADES (COLOMBIA) ---
    if ((t.includes("primera a") || t.includes("betplay")) && !t.includes("ecuador")) return { nombre: "Liga BetPlay", pais: "COLOMBIA", bandera: "co", prioridad: 1 };
    if (t.includes("primera b") && !t.includes("metropolitana") && !t.includes("nacional") && !t.includes("chile")) return { nombre: "Primera B", pais: "COLOMBIA", bandera: "co", prioridad: 12 };
    if (t.includes("copa colombia")) return { nombre: "Copa Colombia", pais: "COLOMBIA", bandera: "co", prioridad: 11 };

    // --- TOP MUNDIAL ---
    if (t.includes("champions league") || t.includes("uefa champions")) return { nombre: "Champions League", pais: "EUROPA", bandera: "eu", prioridad: 2 };
    if (t === "premier league") return { nombre: "Premier League", pais: "INGLATERRA", bandera: "gb-eng", prioridad: 3 };
    if (t === "primera division" || t === "la liga" || t.includes("laliga")) return { nombre: "LaLiga EA Sports", pais: "ESPAÑA", bandera: "es", prioridad: 4 };
    if (t.includes("libertadores")) return { nombre: "Copa Libertadores", pais: "SUDAMÉRICA", bandera: "un", prioridad: 5 };
    if (t === "serie a" || (t.includes("serie a") && t.includes("italy"))) return { nombre: "Serie A", pais: "ITALIA", bandera: "it", prioridad: 6 };
    if (t.includes("bundesliga")) return { nombre: "Bundesliga", pais: "ALEMANIA", bandera: "de", prioridad: 7 };
    if (t.includes("europa league")) return { nombre: "Europa League", pais: "EUROPA", bandera: "eu", prioridad: 8 };
    if (t === "ligue 1" || (t.includes("ligue 1") && t.includes("france"))) return { nombre: "Ligue 1", pais: "FRANCIA", bandera: "fr", prioridad: 9 };
    if (t.includes("mls") || t.includes("major league soccer")) return { nombre: "MLS", pais: "EE. UU.", bandera: "us", prioridad: 10 };

    // --- OTROS PAÍSES RECURRENTES (Para no mostrar "Mundo") ---
    if (t.includes("argentina") || t.includes("metropolitana") || t.includes("nacional") || t.includes("reserva") || t.includes("primera c")) return { nombre: nombreOriginal, pais: "ARGENTINA", bandera: "ar", prioridad: 20 };
    if (t.includes("brazil") || t.includes("brasileiro") || t.includes("paulista") || t.includes("carioca") || t.includes("mineiro") || t.includes("serie b") || t.includes("serie c")) return { nombre: nombreOriginal, pais: "BRASIL", bandera: "br", prioridad: 21 };
    if (t.includes("mexico") || t.includes("mx") || t.includes("expansion") || t.includes("premier serie")) return { nombre: nombreOriginal, pais: "MÉXICO", bandera: "mx", prioridad: 22 };
    
    // Ligas Menores de Europa
    if (t.includes("spain") || t.includes("segunda division") || t.includes("primera rfef") || t.includes("tercera division") || t.includes("copa del rey")) return { nombre: nombreOriginal, pais: "ESPAÑA", bandera: "es", prioridad: 23 };
    if (t.includes("england") || t.includes("championship") || t.includes("league one") || t.includes("league two") || t.includes("fa cup") || t.includes("fa trophy") || t.includes("development league")) return { nombre: nombreOriginal, pais: "INGLATERRA", bandera: "gb-eng", prioridad: 24 };
    if (t.includes("italy") || t.includes("serie c") || t.includes("serie d") || t.includes("coppa italia")) return { nombre: nombreOriginal, pais: "ITALIA", bandera: "it", prioridad: 25 };
    if (t.includes("germany") || t.includes("regionalliga") || t.includes("oberliga") || t.includes("dfb")) return { nombre: nombreOriginal, pais: "ALEMANIA", bandera: "de", prioridad: 26 };
    if (t.includes("france") || t.includes("ligue 2") || t.includes("national")) return { nombre: nombreOriginal, pais: "FRANCIA", bandera: "fr", prioridad: 27 };
    
    // Otros de Sudamérica y Resto
    if (t.includes("chile") || (t.includes("primera division") && t.includes("chile"))) return { nombre: nombreOriginal, pais: "CHILE", bandera: "cl", prioridad: 28 };
    if (t.includes("peru") || t.includes("liga 1") || t.includes("liga 2")) return { nombre: nombreOriginal, pais: "PERÚ", bandera: "pe", prioridad: 29 };
    if (t.includes("ecuador") || t.includes("pro serie")) return { nombre: nombreOriginal, pais: "ECUADOR", bandera: "ec", prioridad: 30 };
    if (t.includes("japan") || t.includes("j1") || t.includes("j2") || t.includes("j3")) return { nombre: nombreOriginal, pais: "JAPÓN", bandera: "jp", prioridad: 31 };
    
    if (t.includes("poland") || t.includes("liga - group") || t.includes("ekstraklasa")) return { nombre: nombreOriginal, pais: "POLONIA", bandera: "pl", prioridad: 40 };
    if (t.includes("sweden") || t.includes("allsvenskan") || t.includes("ettan")) return { nombre: nombreOriginal, pais: "SUECIA", bandera: "se", prioridad: 41 };
    if (t.includes("romania") || t.includes("liga iii") || t.includes("liga ii")) return { nombre: nombreOriginal, pais: "RUMANIA", bandera: "ro", prioridad: 42 };
    if (t.includes("czech") || t.includes("msfl") || t.includes("cfl")) return { nombre: nombreOriginal, pais: "REPÚBLICA CHECA", bandera: "cz", prioridad: 43 };
    if (t.includes("austria")) return { nombre: nombreOriginal, pais: "AUSTRIA", bandera: "at", prioridad: 44 };

    // Torneos Internacionales / Selecciones
    if (t.includes("concacaf") || t.includes("uefa") || t.includes("afc") || t.includes("caf") || t.includes("nations league") || t.includes("world cup") || t.includes("friendlies") || t.includes("amistoso") || t.includes("qualification")) {
      return { nombre: nombreOriginal, pais: "INTERNACIONAL", bandera: "un", prioridad: 15 };
    }

    // Si nada coincide, asumimos etiqueta genérica "GLOBAL" en vez de "MUNDO"
    return { nombre: nombreOriginal, pais: "GLOBAL", bandera: "un", prioridad: 99 };
  };

  const torneosAgrupados = useMemo(() => {
    const grupos = {};
    partidos.forEach(partido => {
      const { nombre, pais, bandera, prioridad } = clasificarTorneo(partido.torneo);
      const keyUnica = `${pais}-${nombre}`; 
      
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
            
            <div 
              className={`tournament-header ${ligasAbiertas[torneoKey] ? 'active' : ''}`} 
              onClick={() => toggleLiga(torneoKey)}
            >
              <div className="tournament-title">
                {/* CAMBIO A SVG: Usamos la ruta directa al vector de FlagCDN */}
                <img 
                  src={`https://flagcdn.com/${grupo.codigoBandera}.svg`} 
                  alt={grupo.nombrePais} 
                  className="league-flag"
                  style={{ width: '24px', height: '18px', objectFit: 'cover', borderRadius: '3px' }}
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