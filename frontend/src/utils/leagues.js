// Mapeo exhaustivo de países a códigos ISO para FlagCDN (https://flagcdn.com)
export const CODIGOS_BANDERAS = {
  // Español
  "Colombia": "co",
  "España": "es",
  "Inglaterra": "gb-eng",
  "Italia": "it",
  "Alemania": "de",
  "Francia": "fr",
  "Argentina": "ar",
  "Brasil": "br",
  "Europa": "eu",
  "Escocia": "gb-sct",
  "Portugal": "pt",
  "Países Bajos": "nl",
  "Holanda": "nl",
  "Bélgica": "be",
  "Turquía": "tr",
  "Austria": "at",
  "Suiza": "ch",
  "Grecia": "gr",
  "República Checa": "cz",
  "Chequia": "cz",
  "Dinamarca": "dk",
  "Suecia": "se",
  "Noruega": "no",
  "Polonia": "pl",
  "Croacia": "hr",
  "Ucrania": "ua",
  "Rusia": "ru",
  "México": "mx",
  "Estados Unidos": "us",
  "EE. UU.": "us",
  "Uruguay": "uy",
  "Chile": "cl",
  "Perú": "pe",
  "Ecuador": "ec",
  "Paraguay": "py",
  "Bolivia": "bo",
  "Venezuela": "ve",
  "Japón": "jp",
  "Corea del Sur": "kr",
  "Arabia Saudita": "sa",
  "Gales": "gb-wls",
  "Irlanda": "ie",
  "Irlanda del Norte": "gb-nir",
  "Canadá": "ca",
  "Australia": "au",
  "Marruecos": "ma",
  "Egipto": "eg",
  "Túnez": "tn",
  "Argelia": "dz",
  "Sudáfrica": "za",
  "Nigeria": "ng",
  "Kenia": "ke",
  "Uganda": "ug",
  "Tanzania": "tz",
  "Costa Rica": "cr",
  "Honduras": "hn",
  "Guatemala": "gt",
  "Panamá": "pa",
  "Kazajistán": "kz",
  "Bielorrusia": "by",
  "Bulgaria": "bg",
  "Rumania": "ro",
  "China": "cn",

  // English API-Sports countries
  "England": "gb-eng",
  "Spain": "es",
  "Germany": "de",
  "Italy": "it",
  "France": "fr",
  "Brazil": "br",
  "Netherlands": "nl",
  "Belgium": "be",
  "Turkey": "tr",
  "Switzerland": "ch",
  "Greece": "gr",
  "Czech-Republic": "cz",
  "Denmark": "dk",
  "Sweden": "se",
  "Norway": "no",
  "Poland": "pl",
  "Croatia": "hr",
  "Ukraine": "ua",
  "Russia": "ru",
  "Mexico": "mx",
  "USA": "us",
  "Japan": "jp",
  "South-Korea": "kr",
  "Saudi-Arabia": "sa",
  "Scotland": "gb-sct",
  "Wales": "gb-wls",
  "Canada": "ca",
  "Morocco": "ma",
  "Egypt": "eg",
  "Tunisia": "tn",
  "Algeria": "dz",
  "South-Africa": "za",
  "Kazakhstan": "kz",
  "Belarus": "by",
  "Romania": "ro"
};

// Bases de datos de clubes para desambiguación heurística inteligente
const CLUBES_PREMIER_INGLATERRA = [
  "arsenal", "aston villa", "bournemouth", "brentford", "brighton", "chelsea",
  "crystal palace", "everton", "fulham", "ipswich", "leicester", "liverpool",
  "manchester city", "manchester united", "newcastle", "nottingham forest",
  "southampton", "tottenham", "west ham", "wolves", "wolverhampton", "leeds",
  "sunderland", "burnley", "sheffield utd", "luton"
];

const CLUBES_LALIGA_ESPANA = [
  "real madrid", "barcelona", "atletico madrid", "atlético madrid", "athletic club",
  "real sociedad", "real betis", "betis", "villarreal", "valencia", "sevilla",
  "celta vigo", "celta", "osasuna", "getafe", "rayo vallecano", "mallorca",
  "girona", "las palmas", "alaves", "alavés", "espanyol", "leganes", "valladolid"
];

const CLUBES_BUNDESLIGA_ALEMANIA = [
  "bayern münchen", "bayern munchen", "bayern", "bayer leverkusen", "leverkusen",
  "borussia dortmund", "dortmund", "rb leipzig", "leipzig", "eintracht frankfurt",
  "vfb stuttgart", "stuttgart", "sc freiburg", "freiburg", "1899 hoffenheim", "hoffenheim",
  "union berlin", "werder bremen", "borussia mönchengladbach", "monchengladbach",
  "fc augsburg", "augsburg", "vfl wolfsburg", "wolfsburg", "fsv mainz 05", "mainz",
  "st. pauli", "holstein kiel", "hamburger sv", "sc paderborn 07", "sv elversberg", "heidenheim", "bochum"
];

const CLUBES_SERIE_A_ITALIA = [
  "inter", "milan", "juventus", "napoli", "roma", "lazio", "atalanta", "fiorentina",
  "bologna", "torino", "genoa", "monza", "verona", "hellas verona", "udinese",
  "parma", "cagliari", "empoli", "lecce", "venezia", "como", "frosinone", "sassuolo", "salernitana"
];

const CLUBES_LIGUE1_FRANCIA = [
  "paris saint germain", "psg", "marseille", "monaco", "lille", "lyon", "nice",
  "lens", "rennes", "reims", "brest", "stade brestois", "strasbourg", "toulouse", "nantes",
  "montpellier", "le havre", "auxerre", "angers", "saint etienne", "saint-étienne", "lorient", "paris fc", "le mans"
];

const CLUBES_LIGA_ARGENTINA = [
  "river plate", "boca juniors", "racing club", "independiente", "san lorenzo",
  "estudiantes", "velez sarsfield", "huracan", "talleres", "godoy cruz", "lanus",
  "rosario central", "newell's", "belgrano", "argentinos juniors", "platense",
  "instituto", "banfield", "tigre", "central cordoba", "barracas central",
  "defensa y justicia", "gimnasia l.p.", "union", "estudiantes de rio cuarto"
];

const CLUBES_LIGA_COLOMBIA = [
  "millonarios", "santa fe", "atletico nacional", "atlético nacional", "america de cali",
  "américa de cali", "junior", "deportivo cali", "deportivo pereira", "independiente medellin",
  "medellin", "deportes tolima", "tolima", "once caldas", "la equidad", "aguilas doradas",
  "bucaramanga", "deportivo pasto", "internacional de bogota", "alianza", "envigado", "jaguares"
];

const CLUBES_SERIE_A_BRASIL = [
  "flamengo", "palmeiras", "botafogo", "fortaleza", "internacional", "são paulo",
  "sao paulo", "bahia", "cruzeiro", "vasco da gama", "vasco", "remo", "atlético mineiro",
  "atletico mineiro", "corinthians", "grêmio", "gremio", "criciúma", "fluminense",
  "vitória", "vitoria", "juventude", "cuiabá", "cuiaba", "atlético goianiense", "santos", "bragantino", "athletico paranaense"
];

const CLUBES_ESCOCIA = [
  "celtic", "rangers", "heart of midlothian", "hearts", "hibernian", "aberdeen",
  "kilmarnock", "dundee utd", "dundee", "falkirk", "st mirren", "motherwell"
];

const CLUBES_AUSTRIA = [
  "salzburg", "red bull salzburg", "sturm graz", "austria vienna", "rapid vienna",
  "lask", "wolfsberger", "wsg wattens", "ried", "altach", "hartberg", "klagenfurt"
];

function contieneClub(nombre = "", lista = []) {
  if (!nombre) return false;
  const n = nombre.toLowerCase().trim();
  return lista.some(c => {
    if (c === "inter") return (n.includes("inter ") || n.endsWith("inter") || n === "inter") && !n.includes("miami") && !n.includes("internazionale");
    if (c === "lille") return (n.includes("lille ") || n.endsWith("lille") || n === "lille") && !n.includes("lillehammer");
    if (c === "angers") return (n.includes("angers") || n.endsWith("angers")) && !n.includes("rangers");
    if (c === "union") return n.includes("union") && !n.includes("philadelphia");
    return n.includes(c);
  });
}

/**
 * Infiere país, bandera, nombre limpio y prioridad rigurosa de un torneo.
 * 
 * Jerarquía oficial:
 * 1. Colombia (Primera A / Liga BetPlay)
 * 2. Inglaterra (Premier League)
 * 3. España (La Liga)
 * 4. Alemania (Bundesliga)
 * 5. Italia (Serie A)
 * 6. Francia (Ligue 1)
 * 7. Argentina (Liga Profesional)
 * 8. Brasil (Brasileirão Serie A)
 * 9-12. Torneos Continentales Élite (Champions, Libertadores, Europa, Sudamericana)
 * 15-27. Primeras Divisiones reconocidas (Escocia, Países Bajos, Portugal, México, MLS, Austria, etc.)
 * 35-45. Segundas divisiones de países principales (2. Bundesliga, Primera Nacional, Championship, etc.)
 * 50-75. Otras ligas nacionales reconocidas (Japón, Corea, Canadá, Túnez, Argelia, etc.)
 * 80-99. Ligas menores, reservas, torneos regionales y ligas exóticas (AL FINAL).
 */
export function obtenerInfoTorneo(nombreTorneo = "", paisAPI = "", equipoLocal = "", equipoVisitante = "", idLiga = null) {
  const t = (nombreTorneo || "").toLowerCase().trim();
  let p = (paisAPI || "").trim().toLowerCase();
  const eqL = (equipoLocal || "").toLowerCase().trim();
  const eqV = (equipoVisitante || "").toLowerCase().trim();
  const idL = idLiga ? Number(idLiga) : null;

  const esLocalOVis = (lista) => contieneClub(eqL, lista) || contieneClub(eqV, lista);

  // 0. Juveniles / Reservas / Amateurs Regionales -> AL FINAL (Prioridad >= 90)
  if (
    t.includes("u19") || t.includes("u21") || t.includes("u20") || t.includes("u23") ||
    t.includes("premier league 2") || t.includes("reserva") ||
    eqL.includes("u19") || eqV.includes("u19") || eqL.includes("u21") || eqV.includes("u21") ||
    eqL.includes("u23") || eqV.includes("u23")
  ) {
    return { pais: "Juvenil / Reservas", flagCode: null, prioridad: 90, esTop: false, torneoLimpio: nombreTorneo };
  }

  if (t.includes("non league") || t.includes("isthmian") || t.includes("northern") || t.includes("southern")) {
    return { pais: "Inglaterra Regional", flagCode: "gb-eng", prioridad: 92, esTop: false, torneoLimpio: nombreTorneo };
  }

  if (t.includes("liga premier serie a") || t.includes("primera premier")) {
    return { pais: "México", flagCode: "mx", prioridad: 80, esTop: false, torneoLimpio: "Liga Premier Serie A (México)" };
  }

  // =========================================================================
  // 1. TOP 8 LIGAS DE ÉLITE SOLICITADAS (Prioridad 1 - 8)
  // =========================================================================

  // 1.1 COLOMBIA (Liga BetPlay / Primera A / Copa Colombia)
  if (
    idL === 239 || 
    t.includes("betplay") || 
    t.includes("copa colombia") ||
    (t.includes("primera a") && (p === "colombia" || !p || esLocalOVis(CLUBES_LIGA_COLOMBIA))) ||
    (p === "colombia" && (t.includes("primera a") || esLocalOVis(CLUBES_LIGA_COLOMBIA)))
  ) {
    return { pais: "Colombia", flagCode: "co", prioridad: 1, esTop: true, torneoLimpio: "Liga BetPlay (Primera A)" };
  }

  // 1.2 INGLATERRA (Premier League)
  if (
    idL === 39 ||
    (t.includes("premier league") && !t.includes("canadian") && !t.includes("fkf") && !t.includes("cup") && (p === "england" || p === "inglaterra" || esLocalOVis(CLUBES_PREMIER_INGLATERRA)))
  ) {
    return { pais: "Inglaterra", flagCode: "gb-eng", prioridad: 2, esTop: true, torneoLimpio: "Premier League" };
  }

  // 1.3 ESPAÑA (La Liga EA Sports / Copa del Rey)
  if (
    idL === 140 || 
    t.includes("la liga") || 
    t.includes("laliga") ||
    (t.includes("primera division") && (p === "spain" || p === "españa" || esLocalOVis(CLUBES_LALIGA_ESPANA))) ||
    (p === "spain" && (t.includes("la liga") || esLocalOVis(CLUBES_LALIGA_ESPANA)) && !t.includes("segunda") && !t.includes("rfef"))
  ) {
    return { pais: "España", flagCode: "es", prioridad: 3, esTop: true, torneoLimpio: "La Liga EA Sports" };
  }

  // 1.4 ALEMANIA (Bundesliga - Primera División)
  if (
    idL === 78 ||
    (t.includes("bundesliga") && !t.includes("2.") && (p === "germany" || p === "alemania")) ||
    (t.includes("bundesliga") && !t.includes("2.") && esLocalOVis(CLUBES_BUNDESLIGA_ALEMANIA) && !p.includes("austria") && !esLocalOVis(CLUBES_AUSTRIA))
  ) {
    return { pais: "Alemania", flagCode: "de", prioridad: 4, esTop: true, torneoLimpio: "Bundesliga" };
  }

  // 1.5 ITALIA (Serie A - Primera División)
  if (
    idL === 135 ||
    (t.includes("serie a") && (p === "italy" || p === "italia")) ||
    (t.includes("serie a") && esLocalOVis(CLUBES_SERIE_A_ITALIA) && !p.includes("brazil") && !p.includes("brasil") && !p.includes("mexico") && !esLocalOVis(CLUBES_SERIE_A_BRASIL))
  ) {
    return { pais: "Italia", flagCode: "it", prioridad: 5, esTop: true, torneoLimpio: "Serie A" };
  }

  // 1.6 FRANCIA (Ligue 1 - Primera División)
  if (
    idL === 61 ||
    (t.includes("ligue 1") && (p === "france" || p === "francia")) ||
    (t.includes("ligue 1") && esLocalOVis(CLUBES_LIGUE1_FRANCIA) && !p.includes("tunis") && !p.includes("alger") && !p.includes("burkina") && !p.includes("ivory"))
  ) {
    return { pais: "Francia", flagCode: "fr", prioridad: 6, esTop: true, torneoLimpio: "Ligue 1" };
  }

  // 1.7 ARGENTINA (Liga Profesional / Torneo Betano / Copa de la Liga / Copa Argentina)
  if (
    idL === 128 ||
    t.includes("liga profesional") || 
    t.includes("torneo betano") || 
    t.includes("copa de la liga") || 
    t.includes("copa argentina") ||
    (p === "argentina" && (t.includes("primera division") || t.includes("primera división") || esLocalOVis(CLUBES_LIGA_ARGENTINA)) && !t.includes("nacional") && !t.includes("metropolitana") && !t.includes("federal"))
  ) {
    return { pais: "Argentina", flagCode: "ar", prioridad: 7, esTop: true, torneoLimpio: "Liga Profesional Argentina" };
  }

  // 1.8 BRASIL (Brasileirão Serie A / Copa do Brasil)
  if (
    idL === 71 ||
    t.includes("brasileirao") || 
    t.includes("brasileirão") ||
    (t.includes("serie a") && (p === "brazil" || p === "brasil" || esLocalOVis(CLUBES_SERIE_A_BRASIL))) ||
    (p === "brazil" && (t.includes("serie a") || t.includes("copa do brasil") || esLocalOVis(CLUBES_SERIE_A_BRASIL)))
  ) {
    return { pais: "Brasil", flagCode: "br", prioridad: 8, esTop: true, torneoLimpio: "Brasileirão Serie A" };
  }

  // =========================================================================
  // 2. TORNEOS CONTINENTALES ÉLITE (Prioridad 9 - 12)
  // =========================================================================
  if (idL === 2 || t.includes("champions league")) {
    return { pais: "Europa", flagCode: "eu", prioridad: 9, esTop: true, torneoLimpio: "UEFA Champions League" };
  }
  if (idL === 13 || t.includes("copa libertadores") || t.includes("libertadores")) {
    return { pais: "Sudamérica", flagCode: null, prioridad: 10, esTop: true, torneoLimpio: "Copa Libertadores" };
  }
  if (idL === 3 || idL === 848 || t.includes("europa league") || t.includes("conference league")) {
    return { pais: "Europa", flagCode: "eu", prioridad: 11, esTop: true, torneoLimpio: "UEFA Europa / Conf League" };
  }
  if (idL === 11 || t.includes("copa sudamericana") || t.includes("sudamericana")) {
    return { pais: "Sudamérica", flagCode: null, prioridad: 12, esTop: true, torneoLimpio: "Copa Sudamericana" };
  }

  // =========================================================================
  // 3. PRIMERAS DIVISIONES RECONOCIDAS (Prioridad 15 - 27)
  // =========================================================================
  if (idL === 179 || (t.includes("premiership") && (p === "scotland" || p === "escocia" || esLocalOVis(CLUBES_ESCOCIA)))) {
    return { pais: "Escocia", flagCode: "gb-sct", prioridad: 15, esTop: true, torneoLimpio: "Premiership Escocia" };
  }
  if (idL === 88 || t.includes("eredivisie") || p === "netherlands" || p === "países bajos") {
    return { pais: "Países Bajos", flagCode: "nl", prioridad: 16, esTop: true, torneoLimpio: "Eredivisie" };
  }
  if (idL === 94 || t.includes("primeira liga") || (p === "portugal" && t.includes("primeira"))) {
    return { pais: "Portugal", flagCode: "pt", prioridad: 17, esTop: true, torneoLimpio: "Primeira Liga" };
  }
  if (idL === 262 || t.includes("liga mx") || (p === "mexico" && t.includes("primera division"))) {
    return { pais: "México", flagCode: "mx", prioridad: 18, esTop: true, torneoLimpio: "Liga MX" };
  }
  if (idL === 253 || t.includes("major league soccer") || (t === "mls" && !t.includes("next"))) {
    return { pais: "EE. UU.", flagCode: "us", prioridad: 19, esTop: true, torneoLimpio: "Major League Soccer" };
  }
  if (
    idL === 218 ||
    (t.includes("bundesliga") && (p === "austria" || esLocalOVis(CLUBES_AUSTRIA)))
  ) {
    return { pais: "Austria", flagCode: "at", prioridad: 20, esTop: true, torneoLimpio: "Bundesliga Austria" };
  }

  // Otras Primeras de Sudamérica
  if (p === "uruguay" || t.includes("primera division uruguay")) {
    return { pais: "Uruguay", flagCode: "uy", prioridad: 21, esTop: true, torneoLimpio: "Primera División Uruguay" };
  }
  if (p === "chile" || t.includes("primera division chile")) {
    return { pais: "Chile", flagCode: "cl", prioridad: 22, esTop: true, torneoLimpio: "Primera División Chile" };
  }
  if (p === "peru" || p === "perú" || t.includes("liga 1") || eqL.includes("garcilaso") || eqV.includes("garcilaso")) {
    return { pais: "Perú", flagCode: "pe", prioridad: 23, esTop: true, torneoLimpio: "Liga 1 Perú" };
  }
  if (p === "ecuador" || t.includes("liga pro")) {
    return { pais: "Ecuador", flagCode: "ec", prioridad: 24, esTop: true, torneoLimpio: "Liga Pro Ecuador" };
  }
  if (p === "paraguay") return { pais: "Paraguay", flagCode: "py", prioridad: 25, esTop: true, torneoLimpio: "Primera División Paraguay" };
  if (p === "bolivia") return { pais: "Bolivia", flagCode: "bo", prioridad: 26, esTop: true, torneoLimpio: "Primera División Bolivia" };
  if (p === "venezuela") return { pais: "Venezuela", flagCode: "ve", prioridad: 27, esTop: true, torneoLimpio: "Primera División Venezuela" };

  // Primeras de Asia / Oceanía
  if (t.includes("j1 league") || p === "japan" || p === "japón") {
    return { pais: "Japón", flagCode: "jp", prioridad: 30, esTop: false, torneoLimpio: "J1 League" };
  }
  if (t.includes("k league 1") || p === "korea" || p === "corea del sur") {
    return { pais: "Corea del Sur", flagCode: "kr", prioridad: 31, esTop: false, torneoLimpio: "K League 1" };
  }

  // =========================================================================
  // 4. SEGUNDAS DIVISIONES Y COPAS DOMÉSTICAS (Prioridad 35 - 50)
  // =========================================================================
  if (t.includes("2. bundesliga")) {
    return { pais: "Alemania", flagCode: "de", prioridad: 35, esTop: false, torneoLimpio: "2. Bundesliga" };
  }
  if (t.includes("primera nacional")) {
    return { pais: "Argentina", flagCode: "ar", prioridad: 36, esTop: false, torneoLimpio: "Primera Nacional" };
  }
  if (t.includes("championship") || t.includes("fa cup") || t.includes("efl")) {
    return { pais: "Inglaterra", flagCode: "gb-eng", prioridad: 37, esTop: false, torneoLimpio: "Championship" };
  }
  if (t.includes("segunda division") || t.includes("hypermotion") || t.includes("copa del rey")) {
    return { pais: "España", flagCode: "es", prioridad: 38, esTop: false, torneoLimpio: "LaLiga Hypermotion" };
  }
  if (t.includes("serie b")) {
    const esBra = p === "brazil" || p === "brasil";
    return { pais: esBra ? "Brasil" : "Italia", flagCode: esBra ? "br" : "it", prioridad: 39, esTop: false, torneoLimpio: "Serie B" };
  }
  if (t.includes("ligue 2")) {
    return { pais: "Francia", flagCode: "fr", prioridad: 40, esTop: false, torneoLimpio: "Ligue 2" };
  }

  // Primeras de Rusia y Ucrania
  if (t.includes("premier league") && (p === "russia" || p === "rusia" || esLocalOVis(["spartak", "zenit", "krasnodar", "lokomotiv", "dinamo", "orenburg", "fakel", "krylia"]))) {
    return { pais: "Rusia", flagCode: "ru", prioridad: 45, esTop: false, torneoLimpio: "Premier League Rusia" };
  }
  if (t.includes("premier league") && (p === "ukraine" || p === "ucrania" || esLocalOVis(["shakhtar", "dynamo kyiv", "kolos", "chornomorets", "obolon", "kryvbas"]))) {
    return { pais: "Ucrania", flagCode: "ua", prioridad: 46, esTop: false, torneoLimpio: "Premier League Ucrania" };
  }

  // Segundas de Asia / América
  if (t.includes("j2 league")) return { pais: "Japón", flagCode: "jp", prioridad: 50, esTop: false, torneoLimpio: "J2 League" };
  if (t.includes("k league 2")) return { pais: "Corea del Sur", flagCode: "kr", prioridad: 51, esTop: false, torneoLimpio: "K League 2" };
  if (t.includes("canadian premier league") || p === "canada" || p === "canadá") {
    return { pais: "Canadá", flagCode: "ca", prioridad: 55, esTop: false, torneoLimpio: "Canadian Premier League" };
  }

  // =========================================================================
  // 5. OTRAS LIGAS DE PRIMERA DIVISIÓN (África / Asia / Resto) (Prioridad 60 - 75)
  // =========================================================================
  if (p === "tunisia" || p === "túnez" || esLocalOVis(["ben guerdane", "club africain", "bizertin", "monastir", "es tunis", "beja", "sfaxien"])) {
    return { pais: "Túnez", flagCode: "tn", prioridad: 65, esTop: false, torneoLimpio: "Ligue 1 Túnez" };
  }
  if (p === "algeria" || p === "argelia" || esLocalOVis(["chlef", "rouisset", "biskra", "mc alger", "oran", "setif", "kabylie", "saoura", "belouizdad", "usm alger"])) {
    return { pais: "Argelia", flagCode: "dz", prioridad: 66, esTop: false, torneoLimpio: "Ligue 1 Argelia" };
  }
  if (p === "kazakhstan" || p === "kazajistán" || esLocalOVis(["astana", "tobol", "kairat", "aktobe", "yelimay", "irtysh"])) {
    return { pais: "Kazajistán", flagCode: "kz", prioridad: 68, esTop: false, torneoLimpio: "Premier League Kazajistán" };
  }
  if (p === "belarus" || p === "bielorrusia" || esLocalOVis(["bate", "minsk", "neman", "torpedo zhodino"])) {
    return { pais: "Bielorrusia", flagCode: "by", prioridad: 69, esTop: false, torneoLimpio: "Premier League Bielorrusia" };
  }

  // Terceras divisiones de Argentina
  if (t.includes("primera b metropolitana") || (p === "argentina" && t.includes("metropolitana"))) {
    return { pais: "Argentina", flagCode: "ar", prioridad: 70, esTop: false, torneoLimpio: "Primera B Metropolitana" };
  }
  if (t.includes("torneo federal") || (p === "argentina" && t.includes("federal"))) {
    return { pais: "Argentina", flagCode: "ar", prioridad: 71, esTop: false, torneoLimpio: "Torneo Federal A" };
  }

  // =========================================================================
  // 6. LIGAS MENORES, REGIONALES O POCO RECONOCIDAS -> AL FINAL (Prioridad 85 - 99)
  // =========================================================================
  if (t.includes("premier league")) {
    const paisNom = p && p !== "mundo" && p !== "world" ? (paisAPI.charAt(0).toUpperCase() + paisAPI.slice(1)) : "Internacional";
    const flag = CODIGOS_BANDERAS[paisNom] || CODIGOS_BANDERAS[paisAPI] || null;
    return { pais: paisNom, flagCode: flag, prioridad: 88, esTop: false, torneoLimpio: `${nombreTorneo} (${paisNom})` };
  }
  if (t.includes("ligue 1")) {
    const paisNom = p && p !== "mundo" && p !== "world" ? (paisAPI.charAt(0).toUpperCase() + paisAPI.slice(1)) : "África / Internacional";
    const flag = CODIGOS_BANDERAS[paisNom] || CODIGOS_BANDERAS[paisAPI] || null;
    return { pais: paisNom, flagCode: flag, prioridad: 89, esTop: false, torneoLimpio: `${nombreTorneo} (${paisNom})` };
  }
  if (t.includes("premiership")) {
    const paisNom = p && p !== "mundo" && p !== "world" ? (paisAPI.charAt(0).toUpperCase() + paisAPI.slice(1)) : "Reino Unido";
    const flag = CODIGOS_BANDERAS[paisNom] || CODIGOS_BANDERAS[paisAPI] || null;
    return { pais: paisNom, flagCode: flag, prioridad: 85, esTop: false, torneoLimpio: `${nombreTorneo} (${paisNom})` };
  }
  if (t.includes("friendlies") || t.includes("amistoso")) {
    return { pais: "Amistosos", flagCode: null, prioridad: 98, esTop: false, torneoLimpio: "Amistosos Internacionales" };
  }

  // Fallback general para torneos desconocidos
  const paisFinal = paisAPI && paisAPI !== "Mundo" && paisAPI !== "World" ? paisAPI : "Otras Ligas";
  const flagCode = CODIGOS_BANDERAS[paisFinal] || CODIGOS_BANDERAS[paisFinal.toLowerCase()] || null;
  return { pais: paisFinal, flagCode, prioridad: 95, esTop: false, torneoLimpio: nombreTorneo };
}

export function obtenerUrlBandera(flagCode) {
  if (!flagCode) return null;
  return `https://flagcdn.com/w40/${flagCode.toLowerCase()}.png`;
}
