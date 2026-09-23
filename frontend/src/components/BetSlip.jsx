export default function BetSlip({ ticket }) {
  const probabilidadTotal = ticket.reduce((acc, partido) => acc * partido.prob, 1);
  const cuotaFinal = ticket.length > 0 ? (1 / probabilidadTotal) : 0;

  const obtenerColorSemaforo = (prob) => {
    if (prob > 0.40) return '#4caf50';
    if (prob >= 0.15) return '#ffeb3b';
    return '#f44336';
  };

  return (
    <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
      <h3>Tu Ticket</h3>
      
      {ticket.length === 0 ? (
        <p style={{ color: '#888' }}>Haz clic en los partidos para agregarlos.</p>
      ) : (
        <div>
          <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
            {ticket.map(item => (
              <li key={item.id} style={{ marginBottom: '10px' }}>
                {item.local} vs {item.visitante} <br/>
                <small style={{ color: '#666' }}>{item.mercado}</small>
              </li>
            ))}
          </ul>
          
          <hr style={{ margin: '15px 0' }} />
          
          <p><strong>Probabilidad combinada:</strong> {(probabilidadTotal * 100).toFixed(2)}%</p>
          <p><strong>Cuota total:</strong> {cuotaFinal.toFixed(2)}</p>
          
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: obtenerColorSemaforo(probabilidadTotal),
            color: probabilidadTotal >= 0.15 ? '#000' : '#fff',
            borderRadius: '4px',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            Nivel de Riesgo
          </div>
        </div>
      )}
    </div>
  )
}