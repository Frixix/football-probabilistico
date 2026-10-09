import { useState, useMemo } from 'react';
import { useHistorial } from '../hooks/useHistorial';
import { 
  ChartIcon, TargetIcon, TrophyIcon, 
  CheckIcon, CloseIcon, ClockIcon, SearchIcon,
  TrendingUpIcon, TrendingDownIcon, RefreshCwIcon, LayersIcon
} from './Icons';

export default function BacktestDashboard() {
  const { backtest, cargando, error, recargar } = useHistorial();
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [rotando, setRotando] = useState(false);

  const handleRecargar = () => {
    setRotando(true);
    recargar();
    setTimeout(() => setRotando(false), 800);
  };

  // Filtrar registros de la tabla
  const registrosFiltrados = useMemo(() => {
    if (!backtest.registros) return [];
    return backtest.registros.filter(item => {
      if (filtroEstado === 'acertados' && item.resultado !== 'ACERTADO') return false;
      if (filtroEstado === 'fallados' && item.resultado !== 'FALLADO') return false;
      if (filtroEstado === 'pendientes' && item.resultado !== 'PENDIENTE') return false;

      if (busqueda) {
        const q = busqueda.toLowerCase();
        const coincide = 
          (item.local && item.local.toLowerCase().includes(q)) ||
          (item.visitante && item.visitante.toLowerCase().includes(q)) ||
          (item.torneo && item.torneo.toLowerCase().includes(q)) ||
          (item.mercado_predicho && item.mercado_predicho.toLowerCase().includes(q));
        if (!coincide) return false;
      }
      return true;
    });
  }, [backtest.registros, filtroEstado, busqueda]);

  // Generador del trazado SVG para la curva de balance
  const svgData = useMemo(() => {
    const pts = backtest.curvaEquity || [];
    if (pts.length < 2) return null;

    const balances = pts.map(p => p.balance);
    const minVal = Math.min(...balances, 0);
    const maxVal = Math.max(...balances, 10000);
    const rango = (maxVal - minVal) || 1;

    const width = 800;
    const height = 220;
    const paddingX = 40;
    const paddingY = 30;

    const usableW = width - (paddingX * 2);
    const usableH = height - (paddingY * 2);

    const coords = pts.map((p, idx) => {
      const x = paddingX + (idx / (pts.length - 1)) * usableW;
      const y = height - paddingY - ((p.balance - minVal) / rango) * usableH;
      return { x, y, balance: p.balance, fecha: p.fecha, local: p.local, visitante: p.visitante, acierto: p.acierto };
    });

    const pathD = coords.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`, '');
    const areaD = `${pathD} L ${coords[coords.length - 1].x.toFixed(1)} ${height - paddingY} L ${coords[0].x.toFixed(1)} ${height - paddingY} Z`;

    const zeroY = height - paddingY - ((0 - minVal) / rango) * usableH;

    return {
      coords,
      pathD,
      areaD,
      zeroY,
      minVal,
      maxVal,
      esPositivo: (backtest.profitTotal || 0) >= 0
    };
  }, [backtest.curvaEquity, backtest.profitTotal]);

  if (cargando) {
    return (
      <div className="loader-container glass-card">
        <div className="spinner"></div>
        <p className="loader-title">Consultando base de auditoría histórica...</p>
        <span className="loader-sub">Sincronizando pronósticos y calculando rendimiento desde Supabase</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner glass-card">
        <p>Error cargando datos de auditoría: {error}</p>
      </div>
    );
  }

  return (
    <div className="backtest-container">
      {/* 1. HEADER DE AUDITORÍA */}
      <div className="backtest-header glass-card">
        <div className="backtest-title-col">
          <div className="backtest-badge-header">
            <ChartIcon size={18} />
            <span>AUDITORÍA CUANTITATIVA EN VIVO</span>
          </div>
          <h2>Rendimiento & Backtesting del Modelo</h2>
          <p className="backtest-desc">
            Evaluación matemática transparente: contrastamos cada predicción del motor Dixon-Coles contra el marcador real de los partidos terminados.
          </p>
        </div>

        <button 
          onClick={handleRecargar} 
          className={`btn-refresh-backtest ${rotando ? 'rotating' : ''}`}
          title="Recargar datos de Supabase"
        >
          <RefreshCwIcon size={16} />
          <span>Sincronizar</span>
        </button>
      </div>

      {/* 2. KPIS PRINCIPALES DE RENDIMIENTO */}
      <div className="backtest-kpi-grid">
        <div className="kpi-card glass-card">
          <div className="kpi-icon-wrap icon-purple">
            <LayersIcon size={22} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{backtest.total}</span>
            <span className="kpi-label">Pronósticos Registrados</span>
          </div>
        </div>

        <div className="kpi-card glass-card">
          <div className="kpi-icon-wrap icon-blue">
            <TargetIcon size={22} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{backtest.validados}</span>
            <span className="kpi-label">Partidos Finalizados</span>
          </div>
        </div>

        <div className="kpi-card glass-card highlight-kpi">
          <div className="kpi-icon-wrap icon-green">
            <TrophyIcon size={22} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{backtest.hitRate}%</span>
            <span className="kpi-label">Tasa de Acierto (Hit Rate)</span>
          </div>
        </div>

        <div className="kpi-card glass-card">
          <div className={`kpi-icon-wrap ${backtest.profitTotal >= 0 ? 'icon-green' : 'icon-red'}`}>
            {backtest.profitTotal >= 0 ? <TrendingUpIcon size={22} /> : <TrendingDownIcon size={22} />}
          </div>
          <div className="kpi-data">
            <span className={`kpi-value ${backtest.profitTotal >= 0 ? 'val-green' : 'val-red'}`}>
              {backtest.profitTotal >= 0 ? '+' : ''}${backtest.profitTotal.toLocaleString('es-CO')}
            </span>
            <span className="kpi-label">P&L Neto (Stake $10k COP)</span>
          </div>
        </div>
      </div>

      {/* 3. GRÁFICA DE EQUITY / EVOLUCIÓN DEL BALANCE */}
      <div className="equity-card glass-card">
        <div className="equity-header">
          <div className="equity-title-group">
            <h3>Curva de Balance Acumulado (Equity Curve)</h3>
            <span className="equity-subtitle">Evolución cronológica simulando apuesta plana fija de $10.000 COP por pronóstico</span>
          </div>
          <div className="equity-badge-roi">
            <span>ROI Global:</span>
            <strong className={backtest.roi >= 0 ? 'roi-green' : 'roi-red'}>
              {backtest.roi >= 0 ? '+' : ''}{backtest.roi}%
            </strong>
          </div>
        </div>

        {svgData ? (
          <div className="svg-chart-wrapper">
            <svg viewBox="0 0 800 220" className="equity-svg">
              <defs>
                <linearGradient id="gradientEquityGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradientEquityRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Línea Cero de Balance */}
              <line 
                x1="40" 
                y1={svgData.zeroY} 
                x2="760" 
                y2={svgData.zeroY} 
                stroke="rgba(255, 255, 255, 0.15)" 
                strokeDasharray="4 4" 
              />
              <text x="765" y={svgData.zeroY + 4} fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="monospace">$0</text>

              {/* Área y Línea */}
              <path 
                d={svgData.areaD} 
                fill={svgData.esPositivo ? "url(#gradientEquityGreen)" : "url(#gradientEquityRed)"} 
              />
              <path 
                d={svgData.pathD} 
                fill="none" 
                stroke={svgData.esPositivo ? "#10b981" : "#ef4444"} 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />

              {/* Puntos destacados */}
              {svgData.coords.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={i === svgData.coords.length - 1 ? 5 : 3}
                  fill={pt.acierto ? "#34d399" : pt.acierto === false ? "#f87171" : "#60a5fa"}
                  stroke="#090d16"
                  strokeWidth="1.5"
                >
                  <title>{`${pt.fecha}: ${pt.local || ''} vs ${pt.visitante || ''} | Balance: $${pt.balance.toLocaleString('es-CO')}`}</title>
                </circle>
              ))}
            </svg>
          </div>
        ) : (
          <div className="empty-equity-msg">
            <ClockIcon size={24} />
            <p>Se requieren al menos 2 partidos finalizados para dibujar la curva cronológica de balance.</p>
          </div>
        )}
      </div>

      {/* 4. DESGLOSE POR MERCADO */}
      <div className="markets-breakdown-row">
        {[
          { key: '1x2', label: 'Mercado 1X2 Ganador', data: backtest.porMercado['1x2'] },
          { key: 'goles', label: 'Mercado +/- 2.5 Goles', data: backtest.porMercado['goles'] },
          { key: 'btts', label: 'Ambos Marcan (BTTS)', data: backtest.porMercado['btts'] }
        ].map(m => {
          const totalM = m.data?.total || 0;
          const aciertosM = m.data?.aciertos || 0;
          const pctM = totalM > 0 ? ((aciertosM / totalM) * 100).toFixed(1) : 0;
          const profitM = m.data?.profit || 0;

          return (
            <div key={m.key} className="market-card glass-card">
              <div className="market-card-top">
                <span className="market-card-label">{m.label}</span>
                <strong className={`market-card-pct ${parseFloat(pctM) >= 50 ? 'pct-green' : 'pct-muted'}`}>
                  {pctM}%
                </strong>
              </div>
              <div className="market-progress-bar">
                <div className="market-progress-fill" style={{ width: `${pctM}%` }}></div>
              </div>
              <div className="market-card-bottom">
                <span>{aciertosM} de {totalM} aciertos</span>
                <span className={profitM >= 0 ? 'profit-green' : 'profit-red'}>
                  {profitM >= 0 ? '+' : ''}${profitM.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. TABLA DE AUDITORÍA DETALLADA */}
      <div className="audit-table-card glass-card">
        <div className="table-controls-bar">
          <div className="table-search-box">
            <SearchIcon size={16} className="search-svg" />
            <input 
              type="text" 
              placeholder="Buscar por equipo, torneo o mercado..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="table-search-input"
            />
          </div>

          <div className="table-filter-pills">
            <button 
              className={`table-filter-btn ${filtroEstado === 'todos' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('todos')}
            >
              Todos ({backtest.registros.length})
            </button>
            <button 
              className={`table-filter-btn ${filtroEstado === 'acertados' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('acertados')}
            >
              Acertados ({backtest.aciertos})
            </button>
            <button 
              className={`table-filter-btn ${filtroEstado === 'fallados' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('fallados')}
            >
              Fallados ({backtest.fallos})
            </button>
            <button 
              className={`table-filter-btn ${filtroEstado === 'pendientes' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('pendientes')}
            >
              Pendientes ({backtest.pendientes})
            </button>
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Partido</th>
                <th>Torneo</th>
                <th>Pronóstico Modelo</th>
                <th>Cuota</th>
                <th>Marcador FT</th>
                <th>Resultado</th>
                <th>P&L ($)</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-table-cell">
                    No se encontraron registros con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                registrosFiltrados.slice(0, 50).map((r, i) => {
                  const probNum = parseFloat(r.probabilidad) || 0;
                  const probFmt = probNum > 1 ? probNum.toFixed(1) : (probNum * 100).toFixed(1);

                  return (
                    <tr key={r.id_partido || i} className={`row-${r.resultado.toLowerCase()}`}>
                      <td className="cell-fecha">{r.fecha}</td>
                      <td className="cell-partido">
                        <strong>{r.local}</strong> vs {r.visitante}
                      </td>
                      <td className="cell-torneo">{r.torneo}</td>
                      <td className="cell-mercado">
                        <span className="tag-mercado">{r.mercado_predicho}</span>
                        <span className="tag-prob">({probFmt}%)</span>
                      </td>
                      <td className="cell-cuota">@{r.cuota}</td>
                      <td className="cell-score">
                        {r.terminado ? (
                          <strong className="score-ft">{r.goles_local} - {r.goles_visitante}</strong>
                        ) : (
                          <span className="score-pend">Pendiente</span>
                        )}
                      </td>
                      <td className="cell-resultado">
                        {r.resultado === 'ACERTADO' && (
                          <span className="badge-status status-acierto">
                            <CheckIcon size={12} /> ACERTADO
                          </span>
                        )}
                        {r.resultado === 'FALLADO' && (
                          <span className="badge-status status-fallo">
                            <CloseIcon size={12} /> FALLADO
                          </span>
                        )}
                        {r.resultado === 'PENDIENTE' && (
                          <span className="badge-status status-espera">
                            <ClockIcon size={12} /> PENDIENTE
                          </span>
                        )}
                      </td>
                      <td className="cell-profit">
                        {r.terminado ? (
                          <strong className={r.profit >= 0 ? 'profit-pos' : 'profit-neg'}>
                            {r.profit >= 0 ? '+' : ''}${r.profit.toLocaleString('es-CO')}
                          </strong>
                        ) : (
                          <span className="profit-zero">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
