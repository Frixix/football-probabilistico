export default function BetSlip({ ticket, onRemove, onClear }) {
  const probabilidadTotal = ticket.reduce((acc, partido) => acc * partido.prob, 1);
  const cuotaFinal = ticket.length > 0 ? (1 / probabilidadTotal) : 0;

  const obtenerColorSemaforo = (prob) => {
    if (prob > 0.40) return '#4caf50'; // Verde
    if (prob >= 0.15) return '#ffeb3b'; // Amarillo
    return '#f44336'; // Rojo
  };

  return (
    <div style={{ flex: 1, backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #e9ecef', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>🎟️ Tu Ticket</h3>
        {ticket.length > 0 && (
          <button 
            onClick={onClear}
            style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}
          >
            Limpiar todo
          </button>
        )}
      </div>
      
      {ticket.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', padding: '20px 0' }}>Haz clic en los partidos para armar tu combinada.</p>
      ) : (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {ticket.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                <div>
                  <strong style={{ fontSize: '14px', display: 'block' }}>{item.local} vs {item.visitante}</strong>
                  <span style={{ color: '#6c757d', fontSize: '13px' }}>{item.mercado}</span>
                </div>
                <button 
                  onClick={() => onRemove(item.id)}
                  style={{ background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                  title="Eliminar partido"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px dashed #ced4da', margin: '15px 0' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#495057' }}>Probabilidad:</span>
            <strong>{(probabilidadTotal * 100).toFixed(2)}%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
            <span>Cuota Total:</span>
            <strong style={{ color: '#0d6efd' }}>{cuotaFinal.toFixed(2)}</strong>
          </div>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '12px', 
            backgroundColor: obtenerColorSemaforo(probabilidadTotal),
            color: probabilidadTotal >= 0.15 ? '#000' : '#fff',
            borderRadius: '6px',
            textAlign: 'center',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            transition: 'background-color 0.3s ease'
          }}>
            {probabilidadTotal > 0.40 ? "Riesgo Controlado" : probabilidadTotal >= 0.15 ? "Alerta: Efecto Dado" : "Peligro: Lotería"}
          </div>
        </div>
      )}
    </div>
  )
}