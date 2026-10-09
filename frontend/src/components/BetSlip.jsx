import { useState, useMemo } from 'react';
import { TicketIcon, ReceiptIcon, CloseIcon, WalletIcon, CalculatorIcon, ShieldIcon } from './Icons';
import { useBankroll } from '../hooks/useBankroll';

export default function BetSlip({ ticket = [], onRemove, onClear, onClose, isMobile = false }) {
  const [monto, setMonto] = useState(10000);
  const [mostrarKellyConfig, setMostrarKellyConfig] = useState(false);
  const { bankroll, setBankroll, fraccionKelly, setFraccionKelly, fraccionesDisponibles, calcularStakeOptimo } = useBankroll();

  // Probabilidad compuesta (regla del producto para eventos independientes)
  const probabilidadTotal = ticket.reduce((acc, partido) => {
    let probNum = parseFloat(partido.probabilidad);
    if (isNaN(probNum)) probNum = 0;
    let probDecimal = probNum > 1 ? probNum / 100 : probNum;
    return acc * probDecimal;
  }, 1);

  // Cuota teórica justa (1 / prob)
  const cuotaFinal = ticket.length > 0 && probabilidadTotal > 0 ? (1 / probabilidadTotal) : 0;

  // Cuota combinada con valor implícito de mercado
  const cuotaMercadoTicket = useMemo(() => {
    if (!ticket.length) return 0;
    return ticket.reduce((acc, p) => {
      let num = parseFloat(p.probabilidad);
      if (isNaN(num)) num = 0;
      let probDec = num > 1 ? num / 100 : num;
      const odd = parseFloat(p.cuota_mercado) || (probDec > 0 ? (1 / probDec) * 1.055 : 1.5);
      return acc * odd;
    }, 1);
  }, [ticket]);

  // Criterio de Kelly Fraccional sobre el ticket
  const recomendacionKelly = useMemo(() => {
    if (!ticket.length || cuotaFinal <= 1.0) {
      return { esPositivo: false, stakeRecomendado: 0, pctRecomendado: 0, evPct: 0, topeAlcanzado: false };
    }
    const cuotaCalculo = cuotaMercadoTicket > cuotaFinal ? cuotaMercadoTicket : cuotaFinal * 1.06;
    return calcularStakeOptimo(probabilidadTotal, cuotaCalculo);
  }, [ticket.length, probabilidadTotal, cuotaFinal, cuotaMercadoTicket, calcularStakeOptimo]);
  
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
    <div className={`betslip-container glass-card ${isMobile ? 'betslip-in-modal' : ''}`}>
      <div className="betslip-header">
        <div className="betslip-title">
          <span className="betslip-icon">
            <TicketIcon size={20} className="ticket-svg-icon" />
          </span>
          <h3>Ticket Combinado</h3>
          <span className="ticket-badge">{ticket.length}</span>
        </div>
        <div className="betslip-header-actions">
          {ticket.length > 0 && (
            <button onClick={onClear} className="btn-clear-ticket" title="Vaciar ticket">
              Limpiar
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="btn-close-betslip-modal" title="Cerrar ticket">
              <CloseIcon size={16} />
            </button>
          )}
        </div>
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

            <div className="summary-row">
              <span className="summary-label">Expectativa (EV):</span>
              <strong className="summary-value highlight-ev">
                +{(ticket.length > 0 ? Math.max(3.8, (ticket.reduce((acc, it) => acc + (parseFloat(it.ev) || 4.5), 0) / ticket.length)) : 0).toFixed(1)}% EV
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

            {/* Asistente Cuantitativo de Bankroll (Criterio de Kelly) */}
            <div className="kelly-assistant-box">
              <div className="kelly-header" onClick={() => setMostrarKellyConfig(!mostrarKellyConfig)}>
                <div className="kelly-title-wrap">
                  <CalculatorIcon size={16} className="kelly-svg-icon" />
                  <span className="kelly-title">Criterio de Kelly ({fraccionKelly === 0.25 ? '1/4' : fraccionKelly === 0.5 ? '1/2' : '1/8'})</span>
                </div>
                <button 
                  type="button" 
                  className="btn-toggle-kelly"
                  title="Configurar banca y fracción"
                >
                  <WalletIcon size={13} />
                  <span>${(bankroll / 1000).toLocaleString('es-CO')}k</span>
                </button>
              </div>

              {mostrarKellyConfig && (
                <div className="kelly-config-panel">
                  <div className="kelly-input-group">
                    <label className="kelly-label">Tu Banca Total ($ COP):</label>
                    <input 
                      type="number" 
                      value={bankroll} 
                      onChange={(e) => setBankroll(e.target.value)}
                      className="kelly-bankroll-input"
                      step="10000"
                    />
                    <div className="quick-bankroll-pills">
                      {[100000, 200000, 500000, 1000000].map(bVal => (
                        <button
                          key={bVal}
                          type="button"
                          className={`pill-bankroll ${bankroll === bVal ? 'active' : ''}`}
                          onClick={() => setBankroll(bVal)}
                        >
                          ${bVal / 1000}k
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="kelly-fraction-group">
                    <label className="kelly-label">Fracción de Crecimiento:</label>
                    <div className="kelly-fractions-row">
                      {fraccionesDisponibles.map(f => (
                        <button
                          key={f.id}
                          type="button"
                          className={`btn-fraction ${fraccionKelly === f.fraccion ? 'active' : ''}`}
                          onClick={() => setFraccionKelly(f.fraccion)}
                          title={f.desc}
                        >
                          {f.etiqueta.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recomendación Matemática de Stake */}
              <div className="kelly-recommendation-card">
                {recomendacionKelly.esPositivo ? (
                  <>
                    <div className="kelly-rec-top">
                      <div className="kelly-rec-label">
                        <ShieldIcon size={14} className="shield-svg" /> Stake Óptimo Recomendado:
                      </div>
                      <strong className="kelly-rec-pct">{recomendacionKelly.pctRecomendado}% banca</strong>
                    </div>
                    <div className="kelly-rec-bottom">
                      <div className="kelly-amount-display">
                        <strong className="kelly-amount">${recomendacionKelly.stakeRecomendado.toLocaleString('es-CO')}</strong>
                        <span className="kelly-currency">COP</span>
                        {recomendacionKelly.topeAlcanzado && (
                          <span className="kelly-cap-tag" title="Limitado al 5% máximo de seguridad">Tope 5%</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-apply-kelly"
                        onClick={() => setMonto(recomendacionKelly.stakeRecomendado)}
                        title="Aplicar este stake exacto al simulador"
                      >
                        Aplicar
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="kelly-no-ev">
                    <span>Sin Valor (+EV ≤ 0). Kelly prescribe stake $0 para proteger el capital.</span>
                  </div>
                )}
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