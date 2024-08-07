const dataURL = "/files/network/data/";

const stationInfo = {
  adjuntas: {},
  anasco: {},
  barranquitas: {},
  cayey: {},
  ciales: {},
  lares: {},
  maricao: {},
  maunabo: {},
  mayaguez: {},
  naguabo: {},
  naranjito: {},
  orocovis: {},
  ponce: {},
  sanlorenzo: {},
  toronegro: {},
  utuado: {},
  yabucoa: {},
  yauco: {},
};

const fileNames = [
  "adjuntas_t5minute.dat",
  "anasco_t5minute.dat",
  "barranquitas_t5minute.dat",
  "cayey_t5minute.dat",
  "ciales_t5minute.dat",
  "lares_t5minute.dat",
  "maricao_t5minute.dat",
  "maunabo_t5minute.dat",
  "mayaguez_t5minute.dat",
  "naguabo_t5minute.dat",
  "naranjito_t5minute.dat",
  "orocovis_t5minute.dat",
  "ponce_t5minute.dat",
  "sanlorenzo_t5minute.dat",
  "toronegro_t5minute.dat",
  "utuado_t5minute.dat",
  "Yabucoa_t5minute.dat",
  "yauco_t5minute.dat",
];

const BATCH_SIZE = 5;

const cache = {};

async function fetchFileData(fileName) {
  if (cache[fileName]) {
    console.log(`Using cached data for ${fileName}`);
    parseCSV(cache[fileName], fileName);
    return;
  }

  try {
    const response = await fetch(`${dataURL}${fileName}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const csvText = await response.text();
    console.log(`Contents of ${fileName}:`, csvText);
    cache[fileName] = csvText;
    parseCSV(csvText, fileName);
  } catch (error) {
    console.error(`Error fetching file ${fileName}:`, error);
  }
}

function parseCSV(csvText, fileName) {
  const rows = csvText.trim().split("\n");

  if (rows.length < 2) {
    console.error("CSV file does not contain enough rows.");
    return;
  }

  const headers = rows[1].split(",").map((header) => header.trim());
  const values = rows[rows.length - 1].split(",").map((value) => value.trim());
  const stationName = fileName.split("_")[0].toLowerCase();

  if (!stationInfo[stationName]) {
    console.warn(`Station ${stationName} not found in stationInfo.`);
    return;
  }

  console.log(`Parsing CSV data for station ${stationName}`);

  headers.forEach((header, index) => {
    if (index === 0) return; // Skip TIMESTAMP column

    const propertyName = header.trim();
    const value = values[index]?.trim();

    if (!(propertyName in stationInfo[stationName])) {
      stationInfo[stationName][propertyName] = "";
    }

    stationInfo[stationName][propertyName] = value || "";
  });

  stationInfo[stationName].TIMESTAMP = values[0]?.trim();
}

async function processFiles() {
  try {
    console.log(`Processing files:`, fileNames);

    for (let i = 0; i < fileNames.length; i += BATCH_SIZE) {
      const batch = fileNames.slice(i, i + BATCH_SIZE);
      const fileDataPromises = batch.map((fileName) => fetchFileData(fileName));
      await Promise.all(fileDataPromises);
    }

    console.log("Final Station Data:", stationInfo);
    return stationInfo;
  } catch (error) {
    console.error("Error processing files:", error);
  }
}

// Exporting stationInfo and processFiles function
export { stationInfo, processFiles };
