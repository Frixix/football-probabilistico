import { useMemo } from 'react';
import { obtenerHistorialH2H } from '../utils/h2h';
import { SwordsIcon, CloseIcon, TargetIcon, ShieldIcon, HistoryIcon } from './Icons';

export default function H2HModal({ partido, onClose }) {
  const h2h = useMemo(() => {
    if (!partido) return null;
    return obtenerHistorialH2H(partido);
  }, [partido]);

  if (!partido || !h2h) return null;

  return (
    <div className="h2h-modal-backdrop" onClick={onClose}>
      <div className="h2h-modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        {/* 1. HEADER DEL MODAL */}
        <div className="h2h-modal-header">
          <div className="h2h-title-wrap">
            <div className="h2h-icon-badge">
              <SwordsIcon size={20} className="swords-svg" />
            </div>
            <div>
              <span className="h2h-subtitle">HISTORIAL CARA A CARA (H2H)</span>
              <h2 className="h2h-match-title">{h2h.local} vs {h2h.visitante}</h2>
              <span className="h2h-tournament">{h2h.torneo}</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-close-h2h" title="Cerrar ventana">
            <CloseIcon size={18} />
          </button>
        </div>

        {/* 2. BARRA DE DISTRIBUCIÓN DE VICTORIAS */}
        <div className="h2h-dominance-card">
          <div className="dominance-labels-row">
            <div className="dom-item dom-home">
              <span className="dom-team">{h2h.local}</span>
              <strong className="dom-stat">{h2h.victoriasLocal} ({h2h.pctLocal}%)</strong>
            </div>
            <div className="dom-item dom-draw">
              <span className="dom-team">Empates</span>
              <strong className="dom-stat">{h2h.empates} ({h2h.pctEmpate}%)</strong>
            </div>
            <div className="dom-item dom-away">
              <span className="dom-team">{h2h.visitante}</span>
              <strong className="dom-stat">{h2h.victoriasVisitante} ({h2h.pctVisitante}%)</strong>
            </div>
          </div>

          <div className="dominance-bar-track">
            <div 
              className="dom-segment seg-home" 
              style={{ width: `${h2h.pctLocal}%` }}
              title={`${h2h.local}: ${h2h.victoriasLocal} victorias (${h2h.pctLocal}%)`}
            />
            <div 
              className="dom-segment seg-draw" 
              style={{ width: `${h2h.pctEmpate}%` }}
              title={`Empates: ${h2h.empates} (${h2h.pctEmpate}%)`}
            />
            <div 
              className="dom-segment seg-away" 
              style={{ width: `${h2h.pctVisitante}%` }}
              title={`${h2h.visitante}: ${h2h.victoriasVisitante} victorias (${h2h.pctVisitante}%)`}
            />
          </div>
        </div>

        {/* 3. GRID DE MÉTRICAS CUANTITATIVAS */}
        <div className="h2h-kpi-grid">
          <div className="h2h-kpi-pill">
            <span className="kpi-label">Partidos Analizados</span>
            <strong className="kpi-number">{h2h.totalPartidos} Duelos</strong>
          </div>
          <div className="h2h-kpi-pill">
            <span className="kpi-label">Promedio de Goles</span>
            <strong className="kpi-number">{h2h.promedioGoles} Goles/P</strong>
          </div>
          <div className="h2h-kpi-pill">
            <span className="kpi-label">Ambos Marcan (BTTS)</span>
            <strong className="kpi-number">{h2h.pctBtts}%</strong>
          </div>
          <div className="h2h-kpi-pill">
            <span className="kpi-label">Más de 2.5 Goles</span>
            <strong className="kpi-number">{h2h.pctOver25}%</strong>
          </div>
        </div>

        {/* 4. NOTA DE CONCLUSIÓN Y MODULACIÓN */}
        <div className="h2h-insight-card">
          <ShieldIcon size={16} className="insight-shield-svg" />
          <div className="insight-text">
            <strong>Lectura Táctica del Modelo:</strong>
            <p>{h2h.conclusion}</p>
          </div>
        </div>

        {/* 5. LISTA HISTÓRICA DE ENCUENTROS RECIENTES */}
        <div className="h2h-matches-section">
          <div className="h2h-section-header">
            <HistoryIcon size={16} className="history-svg" />
            <h3>Últimos Enfrentamientos Directos</h3>
          </div>

          <div className="h2h-encuentros-list">
            {h2h.encuentros.map((m) => (
              <div key={m.id} className="h2h-match-row">
                <span className="h2h-match-date">{m.fecha}</span>
                <div className="h2h-match-teams">
                  <span className={`h2h-team-name ${m.esVictoriaLocalActual ? 'winner-team' : ''}`}>
                    {m.local}
                  </span>
                  <strong className="h2h-match-score">{m.marcador}</strong>
                  <span className={`h2h-team-name ${m.esVictoriaVisActual ? 'winner-team' : ''}`}>
                    {m.visitante}
                  </span>
                </div>
                <div className="h2h-match-badge">
                  {m.esEmpate ? (
                    <span className="badge-h2h badge-draw">Empate</span>
                  ) : m.ganador === h2h.local ? (
                    <span className="badge-h2h badge-home">Gana {h2h.local.substring(0, 10)}</span>
                  ) : (
                    <span className="badge-h2h badge-away">Gana {h2h.visitante.substring(0, 10)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
