import { useState, useEffect } from 'react';

export default function MatchList({ partidos = [], onAddTicket }) {
  
  const listaSegura = Array.isArray(partidos) ? partidos : (partidos.partidos || []);

  const [filtroMercado, setFiltroMercado] = useState('todos');
  const [filtroTorneo, setFiltroTorneo] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  
  // 🕒 MOTOR DE TIEMPO: Guarda la hora actual del PC
  const [horaPC, setHoraPC] = useState(new Date());

  // Actualiza el reloj interno de React cada 1 minuto
  useEffect(() => {
    const timer = setInterval(() => setHoraPC(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const torneosDisponibles = ['Todos', ...new Set(listaSegura.map(p => p.torneo))];

  const partidosFiltrados = listaSegura.filter(partido => {
    const pasaFiltroMercado = filtroMercado === 'todos' || partido.tipo === filtroMercado;
    const pasaFiltroTorneo = filtroTorneo === 'Todos' || partido.torneo === filtroTorneo;
    
    const terminoBusqueda = busqueda.toLowerCase();
    const pasaBuscador = partido.local.toLowerCase().includes(terminoBusqueda) || 
                         partido.visitante.toLowerCase().includes(terminoBusqueda);
    
    return pasaFiltroMercado && pasaFiltroTorneo && pasaBuscador;
  });

  // 🧠 FUNCIÓN INTELIGENTE: Calcula el color basándose en tu reloj local vs la hora del partido
  const obtenerEstadoDinamico = (fechaStr, horaStr, estadoApi, claseApi) => {
    // Si la API dijo que está aplazado o la hora falló, respetamos eso
    if (claseApi === "estado-gris" || fechaStr === "TBD" || horaStr === "TBD") {
      return { texto: estadoApi, clase: claseApi };
    }

    const añoActual = horaPC.getFullYear();
    const [dia, mes] = fechaStr.split('/');
    const [hora, min] = horaStr.split(':');
    
    // Creamos la fecha exacta del partido
    const fechaPartido = new Date(añoActual, parseInt(mes) - 1, parseInt(dia), parseInt(hora), parseInt(min));
    
    // Calculamos cuántos minutos han pasado desde el inicio
    const minutosTranscurridos = (horaPC - fechaPartido) / (1000 * 60);

    if (minutosTranscurridos < 0) {
      return { texto: "No Iniciado", clase: "estado-verde" };
    } 
    // Un partido dura aprox 115 mins (45 + 15 descanso + 45 + 10 reposición)
    else if (minutosTranscurridos >= 0 && minutosTranscurridos <= 115) {
      return { texto: "En Vivo", clase: "estado-amarillo" };
    } 
    else {
      return { texto: "Terminado", clase: "estado-rojo" };
    }
  };

  return (
    <div style={{ flex: 2 }}>
      <h3 style={{ marginBottom: '15px', marginTop: '0', color: '#212529' }}>Cartelera de la Semana</h3>
      
      <div className="buscador-container">
        <input 
          type="text" 
          className="buscador-input"
          placeholder="Buscar equipo (ej. Colombia, Spain)..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6c757d', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
          Competición
        </span>
        <div className="filtros-container" style={{ flexWrap: 'wrap' }}>
          {torneosDisponibles.map(torneo => (
            <button 
              key={torneo}
              className={`btn-filtro ${filtroTorneo === torneo ? 'activo' : ''}`}
              onClick={() => setFiltroTorneo(torneo)}
            >
              {torneo}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6c757d', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
          Mercado
        </span>
        <div className="filtros-container">
          <button className={`btn-filtro ${filtroMercado === 'todos' ? 'activo' : ''}`} onClick={() => setFiltroMercado('todos')}>Todos</button>
          <button className={`btn-filtro ${filtroMercado === '1x2' ? 'activo' : ''}`} onClick={() => setFiltroMercado('1x2')}>1X2</button>
          <button className={`btn-filtro ${filtroMercado === 'goles' ? 'activo' : ''}`} onClick={() => setFiltroMercado('goles')}>Goles</button>
          <button className={`btn-filtro ${filtroMercado === 'btts' ? 'activo' : ''}`} onClick={() => setFiltroMercado('btts')}>Ambos Marcan</button>
        </div>
      </div>
      
      <div className="cartelera-grid">
        {partidosFiltrados.length === 0 ? (
          <p style={{ color: '#888' }}>No hay partidos disponibles en este momento.</p>
        ) : (
          partidosFiltrados.map((partido) => {
            // Aplicamos tu regla de hora local a cada tarjeta antes de pintarla
            const estado = obtenerEstadoDinamico(partido.fecha, partido.hora, partido.estado_texto, partido.estado_clase);

            return (
              <div key={partido.id} className="tarjeta-partido" onClick={() => onAddTicket(partido)}>
                
                <div className="tarjeta-header">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="badge-torneo">{partido.torneo}</span>
                    {/* El semáforo dinámico */}
                    <span className={`badge-estado ${estado.clase}`}>
                      {estado.texto}
                    </span>
                  </div>
                  <span className="badge-fecha">{partido.fecha} • {partido.hora}</span>
                </div>
                
                <h4 className="tarjeta-titulo">{partido.local} vs {partido.visitante}</h4>
                
                <div className="tarjeta-datos">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Sugerencia del Modelo
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#495057' }}>
                      {partido.mercado}
                    </span>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: '#0d6efd', fontSize: '18px' }}>
                      {(partido.prob * 100).toFixed(1)}%
                    </strong>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  )
}