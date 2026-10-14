import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
from main import validar_resultados_historicos

def main():
    print("=" * 65)
    print("⚽ ACTUALIZADOR DE RESULTADOS & ACIERTOS - FOOTBALL PROBABILÍSTICO")
    print("=" * 65)
    print("Consultando partidos pendientes en Supabase y marcadores oficiales...")
    
    resumen = validar_resultados_historicos(limite=50)
    
    print("\n" + "=" * 65)
    print("📊 RESUMEN DE LA ACTUALIZACIÓN:")
    print(f"  • Partidos pendientes revisados: {resumen.get('total_pendientes', 0)}")
    print(f"  • Partidos ya jugados y evaluados: {resumen.get('evaluados', 0)}")
    print(f"  • Pronósticos Acertados: ✅ {resumen.get('acertados', 0)}")
    print(f"  • Pronósticos Fallados:  ❌ {resumen.get('fallados', 0)}")
    print(f"  • Partidos aún no finalizados: ⏳ {resumen.get('aun_pendientes', 0)}")
    
    evaluados = resumen.get('evaluados', 0)
    acertados = resumen.get('acertados', 0)
    if evaluados > 0:
        winrate = round((acertados / evaluados) * 100, 1)
        print(f"  • Tasa de Acierto en este lote: 🎯 {winrate}%")
        
    print("=" * 65)
    print(resumen.get('mensaje', 'Proceso completado.'))
    print("=" * 65)

if __name__ == "__main__":
    main()
