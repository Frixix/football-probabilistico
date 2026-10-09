import { useState } from 'react';
import { TicketIcon, ReceiptIcon, CloseIcon } from './Icons';

export default function BetSlip({ ticket = [], onRemove, onClear }) {
  const [monto, setMonto] = useState(10000);

  // Probabilidad compuesta (regla del producto para eventos independientes)
  const probabilidadTotal = ticket.reduce((acc, partido) => {
    let probNum = parseFloat(partido.probabilidad);
    if (isNaN(probNum)) probNum = 0;
    let probDecimal = probNum > 1 ? probNum / 100 : probNum;
    return acc * probDecimal;
  }, 1);

  // Cuota teórica justa (1 / prob)
  const cuotaFinal = ticket.length > 0 && probabilidadTotal > 0 ? (1 / probabilidadTotal) : 0;
  
  // Retorno estimado
  const gananciaPotencial = Math.round(monto * cuotaFinal);

  const getRiesgoInfo = (prob) => {
    if (prob > 0.45) {
      return { nivel: 'Riesgo Controlado', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', desc: 'Probabilidad alta de acierto según Poisson.' };
    }
    if (prob >= 0.20) {
      return { nivel: 'Riesgo Moderado', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', desc: 'Efecto dado en juego: cuota atractiva con varianza moderada.' };
    }
    return { nivel: 'Alto Riesgo (Lotería)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', desc: 'La probabilidad conjunta cae drásticamente. Difícil ocurrencia.' };
  };

  const riesgo = getRiesgoInfo(probabilidadTotal);

  return (
    <div className="betslip-container glass-card">
      <div className="betslip-header">
        <div className="betslip-title">
          <span className="betslip-icon">
            <TicketIcon size={20} className="ticket-svg-icon" />
          </span>
          <h3>Ticket Combinado</h3>
          <span className="ticket-badge">{ticket.length}</span>
        </div>
        {ticket.length > 0 && (
          <button onClick={onClear} className="btn-clear-ticket" title="Vaciar ticket">
            Limpiar
          </button>
        )}
      </div>

      {ticket.length === 0 ? (
        <div className="betslip-empty">
          <div className="empty-ticket-art">
            <ReceiptIcon size={40} className="empty-receipt-svg" />
          </div>
          <p className="empty-main-text">Tu ticket está vacío</p>
          <span className="empty-sub-text">Selecciona uno o más partidos para simular la probabilidad conjunta y la cuota combinada.</span>
        </div>
      ) : (
        <div className="betslip-body">
          {/* Lista de selecciones */}
          <div className="ticket-items-list">
            {ticket.map((item, index) => {
              const mercadoReal = item.mercado_predicho || item.mercado || "Sin Mercado";
              let probNum = parseFloat(item.probabilidad);
              if (isNaN(probNum)) probNum = 0;
              const probFmt = probNum > 1 ? probNum.toFixed(1) : (probNum * 100).toFixed(1);
              const cuotaPart = probNum > 0 ? (probNum > 1 ? (100 / probNum).toFixed(2) : (1 / probNum).toFixed(2)) : '1.00';
              const itemId = item.id_partido || item.id;

              return (
                <div key={itemId || index} className="ticket-item">
                  <div className="ticket-item-main">
                    <span className="ticket-match-title">{item.local} vs {item.visitante}</span>
                    <div className="ticket-match-meta">
                      <span className="ticket-market-tag">{mercadoReal}</span>
                      <span className="ticket-odd-tag">@{cuotaPart} ({probFmt}%)</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemove(itemId)}
                    className="btn-remove-item"
                    title="Eliminar del ticket"
                  >
                    <CloseIcon size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="betslip-divider"></div>

          {/* Resumen Estadístico */}
          <div className="betslip-summary">
            <div className="summary-row">
              <span className="summary-label">Probabilidad Acumulada:</span>
              <strong className="summary-value highlight-prob">
                {(probabilidadTotal * 100).toFixed(2)}%
              </strong>
            </div>

            <div className="summary-row">
              <span className="summary-label">Cuota Justa Estimada:</span>
              <strong className="summary-value highlight-odd">
                @{cuotaFinal.toFixed(2)}
              </strong>
            </div>

            {/* Simulador de Apuesta / Inversión */}
            <div className="simulator-box">
              <label className="sim-label">Simulador de Monto ($):</label>
              <div className="sim-input-row">
                <input 
                  type="number" 
                  value={monto} 
                  onChange={(e) => setMonto(Math.max(0, parseInt(e.target.value) || 0))}
                  className="sim-input"
                  min="0"
                  step="1000"
                />
              </div>
              <div className="quick-amounts">
                {[5000, 10000, 20000, 50000].map(val => (
                  <button 
                    key={val} 
                    type="button" 
                    className={`btn-quick-amount ${monto === val ? 'active' : ''}`}
                    onClick={() => setMonto(val)}
                  >
                    ${val / 1000}k
                  </button>
                ))}
              </div>

              <div className="return-row">
                <span>Retorno Estimado:</span>
                <strong className="return-value">
                  ${gananciaPotencial.toLocaleString('es-CO')}
                </strong>
              </div>
            </div>

            {/* Semáforo de Riesgo */}
            <div 
              className="risk-indicator-box"
              style={{ backgroundColor: riesgo.bg, borderColor: riesgo.color }}
            >
              <div className="risk-header" style={{ color: riesgo.color }}>
                <span className="risk-dot" style={{ backgroundColor: riesgo.color }}></span>
                <strong>{riesgo.nivel}</strong>
              </div>
              <p className="risk-description">{riesgo.desc}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}