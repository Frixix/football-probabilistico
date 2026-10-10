// Mapeo exhaustivo de países a códigos ISO para FlagCDN (https://flagcdn.com)
export const CODIGOS_BANDERAS = {
  "Colombia": "co",
  "España": "es",
  "Inglaterra": "gb-eng",
  "Italia": "it",
  "Alemania": "de",
  "Francia": "fr",
  "Argentina": "ar",
  "Brasil": "br",
  "México": "mx",
  "Perú": "pe",
  "Ecuador": "ec",
  "Uruguay": "uy",
  "Chile": "cl",
  "Paraguay": "py",
  "Bolivia": "bo",
  "Venezuela": "ve",
  "Estados Unidos": "us",
  "EE. UU.": "us",
  "Portugal": "pt",
  "Países Bajos": "nl",
  "Bélgica": "be",
  "Turquía": "tr",
  "Arabia Saudita": "sa",
  "Japón": "jp",
  "Corea del Sur": "kr",
  "Nigeria": "ng",
  "Argelia": "dz",
  "Uganda": "ug",
  "Kenia": "ke",
  "Tanzania": "tz",
  "República Checa": "cz",
  "Chequia": "cz",
  "Bulgaria": "bg",
  "China": "cn",
  "Ucrania": "ua",
  "Noruega": "no",
  "Suecia": "se",
  "Suiza": "ch",
  "Austria": "at",
  "Grecia": "gr",
  "Escocia": "gb-sct",
  "Gales": "gb-wls",
  "Marruecos": "ma",
  "Egipto": "eg",
  "Sudáfrica": "za",
  "Costa Rica": "cr",
  "Honduras": "hn",
  "Guatemala": "gt",
  "Panamá": "pa"
};

/**
 * Infiere país, bandera y prioridad de un torneo.
 * Cuanto menor sea el número de prioridad, más arriba aparece.
 * Partidos de ligas menores, regionales o poco conocidas reciben prioridad >= 85 (aparecen al final).
 */
export function obtenerInfoTorneo(nombreTorneo = "", paisAPI = "") {
  const t = nombreTorneo.toLowerCase();
  let p = (paisAPI || "").trim().toLowerCase();

  // 1. Torneos Élite y Ligas Top Solicitadas
  // 1.1 Colombia (Liga BetPlay, Primera A, Copa Colombia)
  if (t.includes("primera a") || t.includes("betplay") || t.includes("copa colombia") || (p === "colombia" && !t.includes("femenina"))) {
    return { pais: "Colombia", flagCode: "co", prioridad: 1, esTop: true };
  }
  // 1.2 Inglaterra (Premier League, FA Cup, EFL)
  if (t.includes("premier league") && (p === "england" || !p || p === "mundo" || t.includes("english"))) {
    if (!t.includes("fkf") && !t.includes("uganda") && !t.includes("cup") && !t.includes("u21") && !t.includes("u19")) {
      return { pais: "Inglaterra", flagCode: "gb-eng", prioridad: 2, esTop: true };
    }
  }
  // 1.3 España (La Liga, Copa del Rey)
  if (t.includes("la liga") || t.includes("laliga") || (t.includes("primera division") && (p === "spain" || p === "españa"))) {
    return { pais: "España", flagCode: "es", prioridad: 3, esTop: true };
  }
  // 1.4 Alemania (Bundesliga)
  if (t.includes("bundesliga") && !t.includes("u19") && !t.includes("women") && !t.includes("femenina")) {
    return { pais: "Alemania", flagCode: "de", prioridad: 4, esTop: true };
  }
  // 1.5 Italia (Serie A, Coppa Italia)
  if ((t.includes("serie a") && (p === "italy" || p === "italia" || !p || p === "mundo")) || t.includes("coppa italia")) {
    if (!t.includes("brazil") && !t.includes("brasil") && !t.includes("ecuador") && !t.includes("women")) {
      return { pais: "Italia", flagCode: "it", prioridad: 5, esTop: true };
    }
  }
  // 1.6 Francia (Ligue 1, Coupe de France)
  if ((t.includes("ligue 1") && (p === "france" || p === "francia" || !p || p === "mundo")) || t.includes("coupe de france")) {
    if (!t.includes("algeria") && !t.includes("algerie") && !t.includes("burkina") && !t.includes("ivory")) {
      return { pais: "Francia", flagCode: "fr", prioridad: 6, esTop: true };
    }
  }
  // 1.7 Argentina (Liga Profesional, Torneo Betano, Copa de la Liga, Copa Argentina)
  if (
    t.includes("liga profesional") || 
    t.includes("torneo betano") || 
    t.includes("copa de la liga") || 
    t.includes("copa argentina") ||
    t.includes("superliga") ||
    (t.includes("primera division") && (p === "argentina" || t.includes("argentina"))) ||
    (p === "argentina" && (t.includes("primera nacional") || !t.includes("b metropolitana") && !t.includes("federal") && !t.includes("reserva")))
  ) {
    return { pais: "Argentina", flagCode: "ar", prioridad: 7, esTop: true };
  }
  // 1.8 Brasil (Brasileirão Serie A, Copa do Brasil)
  if (t.includes("brasileirao") || t.includes("brasileirão") || (t.includes("serie a") && (p === "brazil" || p === "brasil")) || (p === "brazil" && t.includes("copa do brasil"))) {
    return { pais: "Brasil", flagCode: "br", prioridad: 8, esTop: true };
  }

  // Torneos Continentales Élite
  if (t.includes("champions league")) {
    return { pais: "Europa", flagCode: null, prioridad: 9, esTop: true };
  }
  if (t.includes("libertadores") || t.includes("sudamericana")) {
    return { pais: "Sudamérica", flagCode: null, prioridad: 10, esTop: true };
  }
  if (t.includes("europa league") || t.includes("conference league")) {
    return { pais: "Europa", flagCode: null, prioridad: 11, esTop: true };
  }
  if (t.includes("major league soccer") || (t.includes("mls") && !t.includes("next"))) {
    return { pais: "EE. UU.", flagCode: "us", prioridad: 12, esTop: true };
  }

  // 2. Primeras Divisiones reconocidas de América y Europa
  if (t.includes("primera nacional") || (p === "argentina" && (t.includes("nacional") || t.includes("metropolitana") || t.includes("federal")))) {
    return { pais: "Argentina", flagCode: "ar", prioridad: 20, esTop: false };
  }
  if (t.includes("brasileirao") || (t.includes("serie a") && (p === "brazil" || p === "brasil"))) {
    return { pais: "Brasil", flagCode: "br", prioridad: 16, esTop: true };
  }
  if (t.includes("liga mx")) {
    return { pais: "México", flagCode: "mx", prioridad: 17, esTop: true };
  }
  if (t.includes("primera división") || t.includes("primera division") || p === "peru") {
    if (!t.includes("rfef") && !t.includes("femenina") && !t.includes("reserva")) {
      return { pais: "Perú", flagCode: "pe", prioridad: 18, esTop: true };
    }
  }
  if (t.includes("liga pro") || p === "ecuador") {
    return { pais: "Ecuador", flagCode: "ec", prioridad: 19, esTop: true };
  }
  if (t.includes("eredivisie")) {
    return { pais: "Países Bajos", flagCode: "nl", prioridad: 22, esTop: false };
  }
  if (t.includes("primeira liga")) {
    return { pais: "Portugal", flagCode: "pt", prioridad: 23, esTop: false };
  }

  // 3. Divisiones de Ascenso y Torneos Secundarios de países conocidos
  if (t.includes("championship") || t.includes("fa cup") || t.includes("efl")) {
    return { pais: "Inglaterra", flagCode: "gb-eng", prioridad: 35, esTop: false };
  }
  if (t.includes("primera división rfef") || t.includes("rfef") || t.includes("segunda division")) {
    return { pais: "España", flagCode: "es", prioridad: 36, esTop: false };
  }
  if (t.includes("usl championship") || t.includes("usl")) {
    return { pais: "EE. UU.", flagCode: "us", prioridad: 40, esTop: false };
  }
  if (t.includes("fnl") || t.includes("czech") || t.includes("3. liga")) {
    return { pais: "República Checa", flagCode: "cz", prioridad: 45, esTop: false };
  }

  // 4. Ligas de Primera División de África y otras regiones
  if (t.includes("ligue 1") || t.includes("algeria")) {
    return { pais: "Argelia", flagCode: "dz", prioridad: 60, esTop: false };
  }
  if (t.includes("npfl") || t.includes("nigeria")) {
    return { pais: "Nigeria", flagCode: "ng", prioridad: 62, esTop: false };
  }

  // 5. Partidos y Ligas Menos Conocidas (Segundas divisiones exóticas, ligas regionales) -> AL FINAL
  if (t.includes("ligue 2")) {
    return { pais: "Argelia", flagCode: "dz", prioridad: 85, esTop: false };
  }
  if (t.includes("second league") || t.includes("bulgaria")) {
    return { pais: "Bulgaria", flagCode: "bg", prioridad: 86, esTop: false };
  }
  if (t.includes("fkf") || t.includes("kenya") || t.includes("kenia")) {
    return { pais: "Kenia", flagCode: "ke", prioridad: 88, esTop: false };
  }
  if (t.includes("premier league") && (t.includes("uganda") || p === "uganda" || t.includes("entebbe") || t.includes("kcca") || t.includes("ura"))) {
    return { pais: "Uganda", flagCode: "ug", prioridad: 89, esTop: false };
  }
  if (t.includes("goiano") || t.includes("paulista") || t.includes("carioca") || t.includes("- 2")) {
    return { pais: "Brasil Regional", flagCode: "br", prioridad: 90, esTop: false };
  }
  if (t.includes("tanzania") || t.includes("ligi kuu bara")) {
    return { pais: "Tanzania", flagCode: "tz", prioridad: 92, esTop: false };
  }
  if (t.includes("friendlies") || t.includes("amistoso")) {
    return { pais: "Amistosos", flagCode: null, prioridad: 95, esTop: false };
  }

  // Fallback general para torneos desconocidos -> AL FINAL
  const paisInferido = paisAPI && paisAPI !== "Mundo" && paisAPI !== "World" ? paisAPI : "Internacional";
  const flagCode = CODIGOS_BANDERAS[paisInferido] || null;
  return { pais: paisInferido, flagCode, prioridad: 99, esTop: false };
}

export function obtenerUrlBandera(flagCode) {
  if (!flagCode) return null;
  return `https://flagcdn.com/w40/${flagCode.toLowerCase()}.png`;
}
