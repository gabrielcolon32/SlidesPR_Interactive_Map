const dataURL = "/files/network/data/latest/"; // URL to fetch data from hostinger server

const fetchedStationData = {
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

const fileNames60min = [
  "adjuntas_t60min.dat",
  "anasco_t60min.dat",
  "barranquitas_t60min.dat",
  "cayey_t60min.dat",
  "ciales_t60min.dat",
  "lares_t60min.dat",
  "maricao_t60min.dat",
  "maunabo_t60min.dat",
  "mayaguez_t60min.dat",
  "naguabo_t60min.dat",
  "naranjito_t60min.dat",
  "orocovis_t60min.dat",
  "ponce_t60min.dat",
  "sanlorenzo_t60min.dat",
  "toronegro_t60min.dat",
  "utuado_t60min.dat",
  "Yabucoa_t60min.dat",
  "yauco_t60min.dat",
];

const fileNames5min = [
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
    parseCSV(cache[fileName], fileName);
    return;
  }

  try {
    const response = await fetch(`${dataURL}${fileName}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const csvText = await response.text();
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

  if (!fetchedStationData[stationName]) {
    console.warn(`Station ${stationName} not found in stationInfo.`);
    return;
  }

  headers.forEach((header, index) => {
    if (index === 0) return; // Skip TIMESTAMP column

    const propertyName = header.trim();
    const value = values[index]?.trim();

    if (!(propertyName in fetchedStationData[stationName])) {
      fetchedStationData[stationName][propertyName] = "";
    }

    fetchedStationData[stationName][propertyName] = value || "";
  });

  fetchedStationData[stationName].TIMESTAMP = values[0]?.trim();

  // Calculate 12hr rain mm total
  const rainValues = rows.slice(-12).map(row => {
    const columns = row.split(",");
    const rainIndex = headers.indexOf('"Rain_mm_Tot"');
    return parseFloat(columns[rainIndex]) || 0;
  });

  const totalRain = rainValues.reduce((acc, val) => acc + val, 0);
  fetchedStationData[stationName]["12hr_rain_mm_total"] = totalRain.toFixed(2);

  // Calculate soil saturation (assuming it's a column in the CSV)
  const soilSaturationIndex = headers.indexOf('"Soil_Saturation"');
  if (soilSaturationIndex !== -1) {
    const soilSaturationValues = rows.map(row => {
      const columns = row.split(",");
      return parseFloat(columns[soilSaturationIndex]) || 0;
    });

    const avgSoilSaturation = soilSaturationValues.reduce((acc, val) => acc + val, 0) / soilSaturationValues.length;
    fetchedStationData[stationName]["avg_soil_saturation"] = avgSoilSaturation.toFixed(2);
  }
}

async function processFiles() {
  try {
    const allFileNames = [...fileNames5min, ...fileNames60min];

    for (let i = 0; i < allFileNames.length; i += BATCH_SIZE) {
      const batch = allFileNames.slice(i, i + BATCH_SIZE);
      const fileDataPromises = batch.map((fileName) => fetchFileData(fileName));
      await Promise.all(fileDataPromises);
    }
    console.log("Station Info:", fetchedStationData);
    return fetchedStationData;
  } catch (error) {
    console.error("Error processing files:", error);
  }
}

// Exporting stationInfo and processFiles function
export { fetchedStationData, processFiles };
