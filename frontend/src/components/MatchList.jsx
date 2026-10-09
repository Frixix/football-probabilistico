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

  const traducirPais = (paisAPI) => {
    if (!paisAPI) return "Global";
    const p = paisAPI.trim();
    const traducciones = {
      "World": "Internacional", "England": "Inglaterra", "Spain": "España",
      "Germany": "Alemania", "France": "Francia", "Italy": "Italia",
      "Brazil": "Brasil", "Mexico": "México", "Japan": "Japón",
      "South-Korea": "Corea del Sur", "Netherlands": "Países Bajos",
      "USA": "EE. UU.", "United-Arab-Emirates": "Emiratos Árabes",
      "Costa-Rica": "Costa Rica", "Burkina-Faso": "Burkina Faso",
      "New-Zealand": "Nueva Zelanda", "Saudi-Arabia": "Arabia Saudita",
      "Ivory-Coast": "Costa de Marfil"
    };
    return traducciones[p] || p.replace(/-/g, ' ');
  };

  const obtenerPrioridad = (nombreTorneo, paisAPI) => {
    const t = nombreTorneo.toLowerCase();
    const p = paisAPI.toLowerCase();

    if (p === "colombia") {
      if (t.includes("primera a") || t.includes("betplay")) return 1;
      if (t.includes("copa colombia")) return 2;
      if (t.includes("primera b")) return 12;
      return 13;
    }
    if (t.includes("champions league")) return 3;
    if (t.includes("premier league") && p === "england") return 4;
    if (t.includes("la liga") || (t.includes("primera division") && p === "spain")) return 5;
    if (t.includes("libertadores")) return 6;
    if (t.includes("serie a") && p === "italy") return 7;
    if (t.includes("bundesliga") && p === "germany") return 8;
    if (t.includes("europa league")) return 9;
    if (t.includes("ligue 1") && p === "france") return 10;
    if (t.includes("mls") || t.includes("major league soccer")) return 11;

    if (p === "argentina") return 20; if (p === "brazil") return 21;
    if (p === "mexico") return 22; if (p === "uruguay") return 23;
    if (p === "chile") return 24; if (p === "ecuador") return 25;
    if (p === "peru") return 26; if (p === "paraguay") return 27;
    if (p === "bolivia") return 28; if (p === "venezuela") return 29;

    if (p === "portugal") return 30; if (p === "netherlands") return 31;
    if (p === "england") return 32; if (p === "spain") return 33; 
    if (p === "italy") return 34; if (p === "germany") return 35; 
    if (p === "france") return 36; 

    if (p === "world" || t.includes("friendlies") || t.includes("qualification")) return 40;
    return 99; 
  };

  const inferirPaisYPrioridad = (nombreTorneo, paisAPI) => {
    const t = (nombreTorneo || "").toLowerCase();
    let p = (paisAPI || "").trim().toLowerCase();

    // Si viene país explícito de la API y no es "mundo", lo traducimos
    if (p && p !== "mundo" && p !== "world") {
      const paisTraducido = traducirPais(paisAPI);
      return { pais: paisTraducido, prioridad: obtenerPrioridad(nombreTorneo, p) };
    }

    // Inferencia inteligente por nombre de torneo cuando viene de Supabase:
    if (t.includes("primera a") || t.includes("betplay") || t.includes("copa colombia") || t.includes("primera b")) {
      return { pais: "Colombia", prioridad: 1 };
    }
    if (t.includes("champions league")) {
      return { pais: "Internacional", prioridad: 3 };
    }
    if (t.includes("premier league") || t.includes("championship") || t.includes("fa cup") || t.includes("efl")) {
      return { pais: "Inglaterra", prioridad: 4 };
    }
    if (t.includes("la liga") || t.includes("primera division") || t.includes("laliga") || t.includes("copa del rey")) {
      return { pais: "España", prioridad: 5 };
    }
    if (t.includes("libertadores") || t.includes("sudamericana")) {
      return { pais: "Sudamérica", prioridad: 6 };
    }
    if (t.includes("serie a") || t.includes("serie b") || t.includes("coppa italia")) {
      return { pais: "Italia", prioridad: 7 };
    }
    if (t.includes("bundesliga") || t.includes("dfb pokal")) {
      return { pais: "Alemania", prioridad: 8 };
    }
    if (t.includes("europa league") || t.includes("conference league")) {
      return { pais: "Internacional", prioridad: 9 };
    }
    if (t.includes("ligue 1") || t.includes("ligue 2")) {
      return { pais: "Francia", prioridad: 10 };
    }
    if (t.includes("mls") || t.includes("major league soccer")) {
      return { pais: "EE. UU.", prioridad: 11 };
    }
    if (t.includes("k league")) {
      return { pais: "Corea del Sur", prioridad: 25 };
    }
    if (t.includes("ligi kuu bara")) {
      return { pais: "Tanzania", prioridad: 45 };
    }
    if (t.includes("friendlies") || t.includes("amistoso")) {
      return { pais: "Amistosos", prioridad: 40 };
    }
    if (t.includes("cup") || t.includes("copa")) {
      return { pais: "Copas", prioridad: 35 };
    }

    return { pais: "Global", prioridad: 99 };
  };

  const torneosAgrupados = useMemo(() => {
    const grupos = {};
    partidos.forEach(partido => {
      const nombreLiga = partido.torneo || "Torneo General";
      const info = inferirPaisYPrioridad(nombreLiga, partido.pais);
      const nombrePaisLimpio = info.pais;
      const prioridad = info.prioridad;
      const bandera = partido.bandera || null; 
      
      const keyUnica = `${nombrePaisLimpio}-${nombreLiga}`; 
      
      if (!grupos[keyUnica]) {
        grupos[keyUnica] = { 
          nombreLiga,
          nombrePais: nombrePaisLimpio,
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
                  // 🔥 EXTRACTOR BLINDADO ANTIFALLOS 🔥
                  let probNum = parseFloat(partido.probabilidad);
                  
                  if (isNaN(probNum) || partido.probabilidad === null) {
                    probNum = 0;
                  }

                  const probFormateada = probNum > 1 
                    ? probNum.toFixed(1) 
                    : (probNum * 100).toFixed(1);
                  
                  const hora12 = formatearHora12(partido.hora || "TBD");
                  const mercadoReal = partido.mercado_predicho || "Sin Mercado"; 
                  const idReal = partido.id_partido || Math.random(); 
                  const terminado = partido.goles_local !== null && partido.goles_local !== undefined;
                  const estadoClase = partido.estado_clase || (terminado ? "estado-rojo" : "estado-verde");
                  const estadoTexto = partido.estado_texto || (terminado ? `${partido.goles_local} - ${partido.goles_visitante} (FT)` : "Programado");

                  // Detector para la consola por si acaso
                  console.log(`🔍 Partido ${partido.local}:`, partido);

                  return (
                    <div key={idReal} className="match-card glass-card">
                      <div className="match-header">
                        <span className="match-time" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {hora12}
                        </span>
                        <span className={`status-badge ${estadoClase}`}>
                          {estadoTexto}
                        </span>
                      </div>
                      
                      <div className="match-teams">
                        <div className="team">{partido.local}</div>
                        <div className="vs">vs</div>
                        <div className="team">{partido.visitante}</div>
                      </div>
                      
                      <div className="match-prediction">
                        <div className="market-name">{mercadoReal}</div>
                        <div className="market-prob">{probFormateada}%</div>
                      </div>
                      
                      <button className="btn-add-ticket" onClick={() => onAddTicket({...partido, id: idReal})}>
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