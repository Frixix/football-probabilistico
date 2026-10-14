import React from 'react';
import { 
  CheckIcon, CloseIcon, RefreshCwIcon, TargetIcon, 
  TrophyIcon, ClockIcon, AlertTriangleIcon 
} from './Icons';

export default function ActualizadorModal({ 
  visible, 
  cargando, 
  progresoTexto, 
  resultado, 
  onCerrar 
}) {
  if (!visible) return null;

  const evaluados = resultado?.evaluados || 0;
  const acertados = resultado?.acertados || 0;
  const fallados = resultado?.fallados || 0;
  const pendientes = resultado?.aunPendientes || 0;
  const totalRevisados = resultado?.totalPendientes || 0;
  const winRate = evaluados > 0 ? ((acertados / evaluados) * 100).toFixed(1) : 0;

  return (
    <div className="modal-backdrop" onClick={!cargando ? onCerrar : undefined}>
      <div className="modal-container glass-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className={`modal-icon-badge ${cargando ? 'pulsing' : 'active'}`}>
              <RefreshCwIcon size={18} className={cargando ? 'rotating' : ''} />
            </span>
            <div>
              <h3 className="modal-title">Actualizador de Base de Datos</h3>
              <span className="modal-subtitle">
                {cargando ? 'Verificando marcadores oficiales...' : 'Sincronización con marcadores reales'}
              </span>
            </div>
          </div>
          {!cargando && (
            <button className="modal-btn-close" onClick={onCerrar} title="Cerrar">
              <CloseIcon size={18} />
            </button>
          )}
        </div>

        {/* Contenido en carga */}
        {cargando ? (
          <div className="modal-loading-body">
            <div className="spinner-large"></div>
            <p className="modal-loading-text">
              {progresoTexto || "Consultando partidos pendientes y verificando si ya finalizaron..."}
            </p>
            <span className="modal-loading-sub">
              Cruzando marcadores oficiales de API-Football con Supabase
            </span>
          </div>
        ) : (
          /* Contenido de resultados */
          <div className="modal-results-body">
            {/* Mensaje de estado */}
            <div className={`modal-status-alert ${resultado?.exito ? 'alert-success' : 'alert-error'}`}>
              {resultado?.exito ? (
                <>
                  <CheckIcon size={18} className="alert-svg-icon" />
                  <span>{resultado?.mensaje || "Actualización completada exitosamente."}</span>
                </>
              ) : (
                <>
                  <AlertTriangleIcon size={18} className="alert-svg-icon" />
                  <span>{resultado?.mensaje || "Ocurrió un error durante la actualización."}</span>
                </>
              )}
            </div>

            {/* Grid de Resumen de KPIs */}
            {resultado?.exito && (
              <div className="modal-stats-grid">
                <div className="modal-stat-card">
                  <span className="stat-label">Revisados</span>
                  <span className="stat-val">{totalRevisados}</span>
                  <span className="stat-sub">partidos en BD</span>
                </div>

                <div className="modal-stat-card">
                  <span className="stat-label">Finalizados</span>
                  <span className="stat-val stat-blue">{evaluados}</span>
                  <span className="stat-sub">con resultado final</span>
                </div>

                <div className="modal-stat-card">
                  <span className="stat-label">Acertados</span>
                  <span className="stat-val stat-green">✅ {acertados}</span>
                  <span className="stat-sub">pronósticos ganados</span>
                </div>

                <div className="modal-stat-card">
                  <span className="stat-label">Fallados</span>
                  <span className="stat-val stat-red">❌ {fallados}</span>
                  <span className="stat-sub">pronósticos perdidos</span>
                </div>

                <div className="modal-stat-card">
                  <span className="stat-label">Aún Pendientes</span>
                  <span className="stat-val stat-yellow">⏳ {pendientes}</span>
                  <span className="stat-sub">en juego / sin iniciar</span>
                </div>

                <div className="modal-stat-card highlight-stat">
                  <span className="stat-label">Tasa de Acierto</span>
                  <span className="stat-val stat-neon">🎯 {winRate}%</span>
                  <span className="stat-sub">en este lote</span>
                </div>
              </div>
            )}

            {/* Lista detallada de partidos evaluados */}
            {resultado?.detalles && resultado.detalles.length > 0 && (
              <div className="modal-detalles-box">
                <h4 className="modal-detalles-title">Detalle de Partidos Evaluados ({resultado.detalles.length}):</h4>
                <div className="modal-detalles-list">
                  {resultado.detalles.map((det, idx) => (
                    <div 
                      key={det.id_partido || idx} 
                      className={`detalle-row ${det.fue_acierto ? 'row-acertado' : 'row-fallado'}`}
                    >
                      <span className="detalle-icon">
                        {det.fue_acierto ? '✅' : '❌'}
                      </span>
                      <div className="detalle-info">
                        <strong className="detalle-partido">{det.partido}</strong>
                        <span className="detalle-pred">Predicción: <em>{det.prediccion}</em></span>
                      </div>
                      <span className={`detalle-badge ${det.fue_acierto ? 'badge-win' : 'badge-loss'}`}>
                        {det.fue_acierto ? 'ACERTADO' : 'FALLADO'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón de acción final */}
            <div className="modal-footer">
              <button className="btn-modal-primary" onClick={onCerrar}>
                Entendido / Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
