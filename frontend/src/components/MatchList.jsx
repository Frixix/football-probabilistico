import { useState } from 'react';

export default function MatchList({ partidos, onAddTicket }) {
  const [filtroMercado, setFiltroMercado] = useState('todos');
  const [filtroTorneo, setFiltroTorneo] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  // Extraer dinámicamente los torneos disponibles en los datos actuales
  const torneosDisponibles = ['Todos', ...new Set(partidos.map(p => p.torneo))];

  const partidosFiltrados = partidos.filter(partido => {
    const pasaFiltroMercado = filtroMercado === 'todos' || partido.tipo === filtroMercado;
    const pasaFiltroTorneo = filtroTorneo === 'Todos' || partido.torneo === filtroTorneo;
    
    const terminoBusqueda = busqueda.toLowerCase();
    const pasaBuscador = partido.local.toLowerCase().includes(terminoBusqueda) || 
                         partido.visitante.toLowerCase().includes(terminoBusqueda);
    
    return pasaFiltroMercado && pasaFiltroTorneo && pasaBuscador;
  });

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

      {/* Nuevo Menú de Filtros: Torneos / Ligas */}
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

      {/* Menú de Filtros: Mercados */}
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
          <p style={{ color: '#888' }}>No se encontraron partidos con los filtros aplicados.</p>
        ) : (
          partidosFiltrados.map((partido) => (
            <div key={partido.id} className="tarjeta-partido" onClick={() => onAddTicket(partido)}>
              
              <div className="tarjeta-header">
                <span className="badge-torneo">{partido.torneo}</span>
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
          ))
        )}
      </div>
    </div>
  )
}