export default function MatchList({ partidos, onAddTicket }) {
  return (
    <div style={{ flex: 2 }}>
      <h3>Cartelera de la Semana</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {partidos.map((partido) => (
          <div 
            key={partido.id} 
            style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', cursor: 'pointer' }}
            onClick={() => onAddTicket(partido)}
          >
            <h4 style={{ margin: '0 0 10px 0' }}>{partido.local} vs {partido.visitante}</h4>
            <p style={{ margin: 0, color: '#555' }}>
              <strong>Mejor opción:</strong> {partido.mercado} <br/>
              <strong>Probabilidad:</strong> {(partido.prob * 100).toFixed(2)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}