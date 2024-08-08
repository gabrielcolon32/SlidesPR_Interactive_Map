import { stationInfo, processFiles } from "./stationData.js";

document.addEventListener("DOMContentLoaded", async function () {
  /**
   * Initializes the Leaflet map with predefined settings.
   * @returns {Object} The initialized map object.
   */
  function initializeMap() {
    var map = L.map("map", {
      center: [18.220833, -66.420149],
      zoom: 10,
      maxBounds: [
        [17.9, -68.0],
        [18.6, -65.0],
      ],
      minZoom: 10,
      maxZoom: 18,
      scrollWheelZoom: false, // Disable scroll wheel zoom initially
    });
  
    // Add World Imagery basemap layer
    L.tileLayer(
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        maxZoom: 18,
      }
    ).addTo(map);
  
    // Add susceptibility layer with error handling
    var susceptibilityLayer = L.esri
      .tiledMapLayer({
        url: "https://tiles.arcgis.com/tiles/TQ9qkk0dURXSP7LQ/arcgis/rest/services/Susceptibilidad_Derrumbe_PR/MapServer",
        opacity: 0.5,
      })
      .addTo(map);
  
    susceptibilityLayer.on("tileerror", function (error) {
      console.error("Tile error:", error);
    });
  
    // Add municipality layer with error handling
    var municipalityLayer = L.esri
      .featureLayer({
        url: "https://services5.arcgis.com/TQ9qkk0dURXSP7LQ/arcgis/rest/services/LIMITES_LEGALES_MUNICIPIOS/FeatureServer/0",
        opacity: 0.2,
        color: "black",
      })
      .addTo(map);
  
    municipalityLayer.on("error", function (error) {
      console.error("Feature layer error:", error);
    });
  
    // Handle Ctrl key press and release events
    document.addEventListener("keydown", function (event) {
      if (event.ctrlKey) {
        map.scrollWheelZoom.enable();
      }
    });
  
    document.addEventListener("keyup", function (event) {
      if (!event.ctrlKey) {
        map.scrollWheelZoom.disable();
      }
    });
  
    return map;
  }

  // Updated stations with new names and coordinates. vwc_max is the record max volumetric water content for each station.
  var stations = [
    { name: "adjuntas", display_name: "Adjuntas", coords: [18.1629, -66.7231], vwc_max: 0.521 },
    { name: "anasco", display_name: "Añasco", coords: [18.2844, -67.1424], vwc_max: 0.500 },
    { name: "barranquitas", display_name: "Barranquitas", coords: [18.1886, -66.3071], vwc_max: 0.263 },
    { name: "cayey", display_name: "Cayey", coords: [18.111, -66.166], vwc_max: 0.492},
    { name: "ciales", display_name: "Ciales", coords: [18.3367, -66.4682], vwc_max: 0.475},
    { name: "lares", display_name: "Lares", coords: [18.2958, -66.8782], vwc_max: 0.495},
    { name: "maricao", display_name: "Maricao", coords: [18.1823, -66.9818], vwc_max: 0.447},
    { name: "maunabo", display_name: "Maunabo", coords: [18.0086, -65.9011], vwc_max: 0.372},
    { name: "mayaguez", display_name: "Mayagüez", coords: [18.2013, -67.1397], vwc_max: 0.450 },
    { name: "naguabo", display_name: "Naguabo", coords: [18.2113, -65.7358], vwc_max: 0.439 },
    { name: "naranjito", display_name: "Naranjito", coords: [18.3, -66.25], vwc_max: 0.424 },
    { name: "orocovis", display_name: "Orocovis", coords: [18.23, -66.3883], vwc_max: 0.479},
    { name: "ponce", display_name: "Ponce", coords: [18.0111, -66.6141], vwc_max: 0.434},
    { name: "sanlorenzo", display_name: "San Lorenzo", coords: [18.1897, -65.9721], vwc_max: 0.485},
    { name: "toronegro", display_name: "Toro Negro", coords: [18.1723, -66.495], vwc_max: 0.483},
    { name: "utuado", display_name: "Utuado", coords: [18.2681, -66.7005], vwc_max: 0.450},
    { name: "yabucoa", display_name: "Yabucoa", coords: [18.0919, -65.8802], vwc_max: 0.372},
    { name: "yauco", display_name: "Yauco", coords: [18.034, -66.8497], vwc_max: 0.492},
  ];

  /**
   * Initializes markers on the map based on station data.
   * @param {Object} map - The Leaflet map object.
   * @param {string} dataType - The type of data to display (e.g., "rainfall", "soilSaturation").
   * @returns {Array} The array of station objects with markers.
   */
  function initializeMarkers(map, dataType) {
    stations.forEach(function (station) {
      const stationData = JSON.parse(JSON.stringify(stationInfo[station.name]));
      var value;
      if (!stationData) {
        console.warn(`No data found for station: ${station.name}`);
        return; // Skip this station if no data is found
      }

      if (dataType === "rainfall") {
        value = stationData["12hr_rain_mm_total"];
        value = parseFloat(value).toFixed(0); // Round to nearest int
      } else if (dataType === "soilSaturation") {
        const wcKey = station.name === "toronegro" ? 
          Object.keys(stationData).find(key => key.toString().startsWith('"wc5')) :
          Object.keys(stationData).find(key => key.toString().startsWith('"wc4'));
        if (wcKey) {
          value = (stationData[wcKey] / station.vwc_max) * 100;
          value = value.toFixed(0) + "%"; // Format as percentage
        } else {
          value = "N/A"; // Handle missing data
        }
      } else {
        value = stationData[dataType];
      }

      var customIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div>
          <span>${value}</span>
          ${dataType === "rainfall" ? "<br>mm" : ""}
        </div>`,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
      });

      // Add marker to the map
      var marker = L.marker(station.coords, { icon: customIcon }).addTo(map);
      var popupContent = `<b>${station.display_name}</b><br>${dataType}: ${value}<br>Date Installed: ${stationData["dateInstalled"]}<br>`;
      marker.bindPopup(popupContent);

      if (!station.marker) {
        station.marker = marker; // Assign marker to station object
      }

      // Add event listeners for marker popups
      marker.on("mouseover", function () {
        this.openPopup();
      });
      marker.on("mouseout", function () {
        this.closePopup();
      });
    });

    return stations;
  }

  /**
   * Updates the data displayed on the map markers.
   * @param {Array} stations - The array of station objects with markers.
   * @param {string} dataType - The type of data to display (e.g., "rainfall", "soilSaturation").
   */
  function changeData(stations, dataType) {
    stations.forEach(function (station) {
      const stationData = stationInfo[station.name];
      if (!stationData) {
        console.warn(`No data found for station: ${station.name}`);
        return; // Skip this station if no data is found
      }

      var marker = station.marker;
      var value;

      // Check data type and assign value accordingly
      if (dataType === "rainfall") {
        value = stationData["12hr_rain_mm_total"];
        value = parseFloat(value).toFixed(0); // Round to nearest int
      } else if (dataType === "soilSaturation") {
        const wcKey = station.name === "toronegro" ? 
          Object.keys(stationData).find(key => key.toString().startsWith('"wc5')) :
          Object.keys(stationData).find(key => key.toString().startsWith('"wc4'));
        if (wcKey) {
          value = (stationData[wcKey] / station.vwc_max) * 100;
          value = value.toFixed(0) + "%"; // Format as percentage
        } else {
          value = "N/A"; // Handle missing data
        }
      } else {
        value = "N/A"; // Handle invalid data type
      }

      value = value !== undefined ? value : "N/A"; // Handle missing data
      var popupContent = `<b>${station.display_name}</b><br>${dataType}: ${value}<br>Date Installed: ${stationData.dateInstalled}<br>`;
      marker.setPopupContent(popupContent);

      var newIconHTML = 
      `<div>
        <span>${value}</span>
        ${dataType === "rainfall" ? "<br>mm" : ""}
      </div>`;

      marker.setIcon(
        L.divIcon({
          className: "custom-div-icon",
          html: newIconHTML,
          iconSize: [50, 50],
          iconAnchor: [25, 25],
        })
      );
    });
  }

  /**
   * Main initialization function.
   * Fetches and processes station data, initializes the map and markers, and sets up event listeners.
   */
  async function initialize() {
    await processFiles("soilSaturation"); // Fetch and process station data
    var map = initializeMap();
    var stations = initializeMarkers(map, "soilSaturation");

    // Event listeners for data switching buttons
    document
      .getElementById("rainfall-button")
      .addEventListener("click", async function () {
        await processFiles("rainfall");
        changeData(stations, "rainfall");
      });

    document
      .getElementById("soilSaturation-button")
      .addEventListener("click", async function () {
        await processFiles("soilSaturation");
        changeData(stations, "soilSaturation");
      });
  }

  // Initialize the map and markers
  initialize();
});