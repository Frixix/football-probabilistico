// 1. Simulación de nuestro Backend en Python (API)
function pedirDatosAPython() {
  return new Promise((resolve) => {
    // El setTimeout simula los 2 segundos que tarda Python en hacer la matemática
    setTimeout(() => {
      const respuestaJSON = [
        { local: "England", visitante: "Spain", mercado: "Gana Spain", prob: 0.60, tipo: "1x2" },
        { local: "Italy", visitante: "Belgium", mercado: "Menos de 2.5", prob: 0.70, tipo: "goles" }
      ];
      // Resolve entrega los datos cuando Python termina
      resolve(respuestaJSON);
    }, 2000); 
  });
}

// 2. Nuestro Frontend (Lo que será React)
// Al poner 'async', le damos el superpoder a la función de ser paciente
async function iniciarApp() {
  console.log("🌐 Iniciando aplicación en el navegador...");
  console.log("⏳ Solicitando predicciones a Python...\n");

  // La palabra 'await' obliga a JS a detenerse aquí hasta que la Promesa se resuelva
  const datosRecibidos = await pedirDatosAPython();
  
  console.log("✅ ¡Python ha respondido con el análisis!");
  
  // Ahora usamos lo que ya sabes: map
  const ticketVisual = datosRecibidos.map(partido => 
    `⚽ ${partido.local} vs ${partido.visitante} -> ${partido.mercado}`
  );
  
  console.log(ticketVisual);
}

// Ejecutamos la aplicación
iniciarApp();