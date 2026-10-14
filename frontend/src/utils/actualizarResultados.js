import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const API_KEY_PARTIDOS = import.meta.env.VITE_API_KEY_PARTIDOS || '';
const BACKEND_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;


/**
 * Evalúa si una predicción cuantitativa fue acertada con base en el marcador final.
 */
export function evaluarAciertoPrediccion(prediccionRaw, golesLocal, golesVisitante, local, visitante) {
  if (golesLocal === null || golesLocal === undefined || golesVisitante === null || golesVisitante === undefined) {
    return null;
  }

  const pred = (prediccionRaw || '').trim().toLowerCase();
  const gl = Number(golesLocal);
  const gv = Number(golesVisitante);
  const sumaGoles = gl + gv;
  const loc = (local || '').trim().toLowerCase();
  const vis = (visitante || '').trim().toLowerCase();

  // 1. Empate / X
  if (pred === 'empate' || pred === 'x') {
    return gl === gv;
  }

  // 2. Doble Oportunidad
  if (pred.startsWith('1x') || pred.includes('local o empate') || (loc && pred.includes(`${loc} o empate`))) {
    return gl >= gv;
  }
  if (pred.startsWith('x2') || pred.includes('empate o visitante') || (vis && pred.includes(`empate o ${vis}`))) {
    return gv >= gl;
  }
  if (pred.startsWith('12') || pred.includes('local o visitante') || (loc && vis && pred.includes(`${loc} o ${vis}`))) {
    return gl !== gv;
  }

  // 3. 1X2 Ganador
  if (pred === 'gana local' || pred === '1') {
    return gl > gv;
  }
  if (pred === 'gana visitante' || pred === '2') {
    return gv > gl;
  }
  if (pred.startsWith('gana ')) {
    const equipo = pred.replace('gana ', '').trim();
    if (loc && (equipo === loc || equipo.includes(loc) || loc.includes(equipo))) {
      return gl > gv;
    }
    if (vis && (equipo === vis || equipo.includes(vis) || vis.includes(equipo))) {
      return gv > gl;
    }
  }

  // 4. Líneas de Goles (Over / Under)
  const lineas = [0.5, 1.5, 2.5, 3.5, 4.5];
  for (const lim of lineas) {
    if (pred.includes(String(lim))) {
      if (pred.includes('más') || pred.includes('mas') || pred.includes('over') || pred.includes('>') || pred.includes('ms')) {
        return sumaGoles > lim;
      }
      if (pred.includes('menos') || pred.includes('under') || pred.includes('<')) {
        return sumaGoles < lim;
      }
    }
  }

  // 5. Ambos Marcan (BTTS)
  if (pred.includes('ambos marcan') || pred.includes('btts')) {
    if (pred.includes(': no') || pred.includes('- no') || pred.endsWith(' no') || pred.includes('no')) {
      return gl === 0 || gv === 0;
    }
    if (pred.includes(': sí') || pred.includes(': si') || pred.includes('- sí') || pred.includes('- si') || pred.endsWith(' sí') || pred.endsWith(' si') || pred.includes('yes')) {
      return gl > 0 && gv > 0;
    }
  }


  return false;
}

/**
 * Función principal para actualizar la base de datos de partidos jugados y registrar aciertos.
 * Intenta primero vía API FastAPI backend, y si no está corriendo, ejecuta directo vía Supabase + API-Football.
 */
export async function actualizarResultadosBD({ limite = 15, onProgreso = null } = {}) {
  // 1. Intento por backend FastAPI si está activo
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    const resBackend = await fetch(`${BACKEND_API_URL}/api/actualizar-resultados?limite=${limite}`, {
      method: 'POST',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (resBackend.ok) {
      const dataBackend = await resBackend.json();
      if (dataBackend && dataBackend.status === 'ok') {
        window.dispatchEvent(new CustomEvent('historial-actualizado', { detail: dataBackend }));
        return {
          exito: true,
          origen: 'backend',
          totalPendientes: dataBackend.total_pendientes,
          evaluados: dataBackend.evaluados,
          acertados: dataBackend.acertados,
          fallados: dataBackend.fallados,
          aunPendientes: dataBackend.aun_pendientes,
          mensaje: dataBackend.mensaje,
          detalles: dataBackend.detalles || []
        };
      }
    }
  } catch (errBackend) {
    // Backend offline, continuar con actualización directa desde cliente
    console.log("Servidor FastAPI no detectado, ejecutando validación directa desde navegador...", errBackend.message);
  }

  // 2. Ejecución directa desde el navegador (Cliente Web Autónomo)
  try {
    if (!supabase) {
      throw new Error("No se pudo conectar a Supabase. Verifica VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.");
    }
    if (onProgreso) onProgreso("Consultando partidos pendientes en Supabase...");


    const hoyBogota = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

    const { data: pendientes, error: errSupabase } = await supabase
      .from('historial_predicciones')
      .select('*')
      .is('fue_acierto', null)
      .lte('fecha', hoyBogota)
      .order('fecha', { ascending: false })
      .limit(limite);


    if (errSupabase) {
      throw new Error(`Error en Supabase: ${errSupabase.message}`);
    }

    if (!pendientes || pendientes.length === 0) {
      return {
        exito: true,
        origen: 'cliente',
        totalPendientes: 0,
        evaluados: 0,
        acertados: 0,
        fallados: 0,
        aunPendientes: 0,
        mensaje: "✅ No hay partidos pendientes por evaluar. ¡Todo al día!",
        detalles: []
      };
    }

    let evaluados = 0;
    let acertados = 0;
    let fallados = 0;
    let aunPendientes = 0;
    const detalles = [];

    for (let i = 0; i < pendientes.length; i++) {
      const partido = pendientes[i];
      if (onProgreso) {
        onProgreso(`Verificando partido (${i + 1}/${pendientes.length}): ${partido.local} vs ${partido.visitante}...`);
      }

      try {
        const urlFixture = `https://v3.football.api-sports.io/fixtures?id=${partido.id_partido}`;
        const resFixture = await fetch(urlFixture, {
          headers: {
            'x-apisports-key': API_KEY_PARTIDOS
          }
        });

        if (!resFixture.ok) {
          aunPendientes++;
          continue;
        }

        const dataFixture = await resFixture.json();
        if (dataFixture.errors && Object.keys(dataFixture.errors).length > 0) {
          console.warn("Aviso API-Football:", dataFixture.errors);
          break; // Detener en caso de cuota excedida
        }

        const datosReales = dataFixture.response && dataFixture.response[0];
        if (!datosReales) {
          aunPendientes++;
          continue;
        }

        const statusShort = datosReales.fixture?.status?.short;
        const finalizado = ['FT', 'AET', 'PEN'].includes(statusShort);

        if (finalizado) {
          const golesLocal = datosReales.goals?.home;
          const golesVisitante = datosReales.goals?.away;

          if (golesLocal !== null && golesVisitante !== null) {
            const fueAcierto = evaluarAciertoPrediccion(
              partido.mercado_predicho,
              golesLocal,
              golesVisitante,
              partido.local,
              partido.visitante
            );

            // Actualizar fila en Supabase
            const { error: errUpdate } = await supabase
              .from('historial_predicciones')
              .update({
                goles_local: golesLocal,
                goles_visitante: golesVisitante,
                fue_acierto: fueAcierto
              })
              .eq('id_partido', partido.id_partido);

            if (!errUpdate) {
              evaluados++;
              if (fueAcierto) acertados++;
              else fallados++;

              detalles.push({
                id_partido: partido.id_partido,
                partido: `${partido.local} ${golesLocal} - ${golesVisitante} ${partido.visitante}`,
                prediccion: partido.mercado_predicho,
                fue_acierto: fueAcierto
              });
            } else {
              console.error("Error al actualizar fila en Supabase:", errUpdate);
              aunPendientes++;
            }
          } else {
            aunPendientes++;
          }
        } else {
          // El partido aún no finaliza (NS, 1H, 2H, HT, etc.)
          aunPendientes++;
        }
      } catch (errItem) {
        console.warn(`Error consultando fixture ${partido.id_partido}:`, errItem);
        aunPendientes++;
      }

      // Pausa de 1000ms para respetar el límite de peticiones de API-Football
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const resultadoFinal = {
      exito: true,
      origen: 'cliente',
      totalPendientes: pendientes.length,
      evaluados,
      acertados,
      fallados,
      aunPendientes,
      mensaje: `Validación finalizada: ${evaluados} partidos evaluados (${acertados} acertados, ${fallados} fallados). ${aunPendientes} partidos continúan pendientes o en curso.`,
      detalles
    };

    // Disparar evento para que useHistorial se actualice automáticamente
    window.dispatchEvent(new CustomEvent('historial-actualizado', { detail: resultadoFinal }));

    return resultadoFinal;
  } catch (errorGeneral) {
    console.error("Error general actualizando base de datos:", errorGeneral);
    return {
      exito: false,
      origen: 'error',
      mensaje: errorGeneral.message || "Error al actualizar la base de datos."
    };
  }
}
