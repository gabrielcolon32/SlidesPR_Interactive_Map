const dataURL = "/files/network/data/"; // Base URL for CSV files

// Initial station info without predefined properties
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

// Hardcoded list of files to fetch
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

const BATCH_SIZE = 5; // Adjust batch size as needed

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
    cache[fileName] = csvText; // Cache the data
    parseCSV(csvText, fileName);
  } catch (error) {
    console.error(`Error fetching file ${fileName}:`, error);
  }
}

// Parse CSV data and update station info
function parseCSV(csvText, fileName) {
  const rows = csvText.trim().split("\n");

  if (rows.length < 5) {
    console.error("CSV file does not contain enough rows.");
    return;
  }

  // Extract headers from the second row
  const headers = rows[1].split(",").map((header) => header.trim());

  // Extract values from the last row
  const values = rows[rows.length - 1].split(",").map((value) => value.trim());

  // Get station name from the file name
  const stationName = fileName.split("_")[0].toLowerCase();

  if (!stationInfo[stationName]) {
    console.warn(`Station ${stationName} not found in stationInfo.`);
    return;
  }

  console.log(`Parsing CSV data for station ${stationName}`);

  // Update the station info with the latest values
  headers.forEach((header, index) => {
    if (index === 0) return; // Skip TIMESTAMP column

    const propertyName = header.trim();
    const value = values[index]?.trim();

    // Add new properties to the station if they don't exist
    if (!(propertyName in stationInfo[stationName])) {
      stationInfo[stationName][propertyName] = "";
    }

    // Update property value
    stationInfo[stationName][propertyName] = value || "";
  });

  // Ensure TIMESTAMP is updated
  stationInfo[stationName].TIMESTAMP = values[0]?.trim();

  console.log(
    `Updated stationInfo for ${stationName}:`,
    stationInfo[stationName]
  );
}

// Process all files in the list
async function processFiles() {
  try {
    console.log(`Processing files:`, fileNames);

    for (let i = 0; i < fileNames.length; i += BATCH_SIZE) {
      const batch = fileNames.slice(i, i + BATCH_SIZE);
      const fileDataPromises = batch.map((fileName) =>
        fetchFileData(fileName)
      );
      await Promise.all(fileDataPromises);
    }

    console.log("Final Station Data:", stationInfo);
    return stationInfo;
  } catch (error) {
    console.error("Error processing files:", error);
  }
}

// Call the function to test
processFiles();