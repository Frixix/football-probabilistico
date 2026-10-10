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

  // 1. Torneos Élite y Ligas Top
  if (t.includes("primera a") || t.includes("betplay") || t.includes("copa colombia")) {
    return { pais: "Colombia", flagCode: "co", prioridad: 1, esTop: true };
  }
  if (t.includes("champions league")) {
    return { pais: "Europa", flagCode: null, prioridad: 2, esTop: true };
  }
  if (t.includes("premier league") && (p === "england" || !p || p === "mundo" || t.includes("english"))) {
    // Verificar si es la Premier League inglesa y no de otro país
    if (!t.includes("fkf") && !t.includes("uganda") && !t.includes("cup")) {
      return { pais: "Inglaterra", flagCode: "gb-eng", prioridad: 3, esTop: true };
    }
  }
  if (t.includes("la liga") || (t.includes("primera division") && (p === "spain" || p === "españa"))) {
    return { pais: "España", flagCode: "es", prioridad: 4, esTop: true };
  }
  // Liga Profesional de Argentina (Liga de élite y máxima categoría)
  if (
    t.includes("liga profesional") || 
    t.includes("torneo betano") || 
    t.includes("copa de la liga") || 
    t.includes("copa argentina") ||
    t.includes("superliga") ||
    (t.includes("primera division") && (p === "argentina" || t.includes("argentina"))) ||
    (p === "argentina" && !t.includes("b metropolitana") && !t.includes("federal") && !t.includes("reserva") && !t.includes("nacional"))
  ) {
    return { pais: "Argentina", flagCode: "ar", prioridad: 5, esTop: true };
  }
  if (t.includes("libertadores") || t.includes("sudamericana")) {
    return { pais: "Sudamérica", flagCode: null, prioridad: 6, esTop: true };
  }
  if (t.includes("serie a") && (p === "italy" || p === "italia" || !p || p === "mundo")) {
    if (!t.includes("brazil") && !t.includes("ecuador")) {
      return { pais: "Italia", flagCode: "it", prioridad: 7, esTop: true };
    }
  }
  if (t.includes("bundesliga") && !t.includes("2.")) {
    return { pais: "Alemania", flagCode: "de", prioridad: 8, esTop: true };
  }
  if (t.includes("ligue 1") && (p === "france" || p === "francia" || !p || p === "mundo")) {
    // Si no es Argelia
    if (!t.includes("algeria") && !t.includes("algerie")) {
      return { pais: "Francia", flagCode: "fr", prioridad: 9, esTop: true };
    }
  }
  if (t.includes("europa league") || t.includes("conference league")) {
    return { pais: "Europa", flagCode: null, prioridad: 10, esTop: true };
  }
  if (t.includes("major league soccer") || (t.includes("mls") && !t.includes("next"))) {
    return { pais: "EE. UU.", flagCode: "us", prioridad: 11, esTop: true };
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
