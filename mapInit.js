import { fetchedStationData, processFiles } from "./fetchStationData.js";
import { stations } from "./stationInfo.js";

document.addEventListener("DOMContentLoaded", async function () {
  // Create the overlay element
  const overlay = document.createElement("div");
  overlay.id = "map-overlay";
  overlay.innerText = "Press ctrl + scroll to zoom";
  document.getElementById("map").appendChild(overlay); // Append to the map container

  /**
   * Initializes the Leaflet map with predefined settings.
   * @returns {Object} The initialized map object.
   */
  function initializeMap() {
    var map = L.map("map", {
      center: [18.220833, -66.420149],
      zoom: 10,
      maxBounds: [
        [19.0, -68.0],
        [17.0, -65.0],
      ],
      minZoom: 9,
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
        overlay.style.display = "none";
      }
    });

    document.addEventListener("keyup", function (event) {
      if (!event.ctrlKey) {
        map.scrollWheelZoom.disable();
      }
    });

    // Show overlay on scroll without Ctrl key
    map.getContainer().addEventListener("wheel", function (event) {
      if (!event.ctrlKey) {
        overlay.style.display = "flex";
        setTimeout(() => {
          overlay.style.display = "none";
        }, 1000); // Hide after 1 second
      }
    });

    return map;
  }

  /**
   * Initializes markers on the map based on station data.
   * @param {Object} map - The Leaflet map object.
   * @param {string} dataType - The type of data to display (e.g., "rainfall", "soilSaturation").
   * @returns {Array} The array of station objects with markers.
   */
  function initializeMarkers(map, dataType) {
    stations.forEach(function (station) {
      const stationData = JSON.parse(
        JSON.stringify(fetchedStationData[station.name])
      );
      if (!stationData) {
        return;
      }

      // Calculate the saturation percentage
      const wcKey =
        station.name === "toronegro"
          ? Object.keys(stationData).find((key) =>
              key.toString().startsWith('"wc5')
            )
          : Object.keys(stationData).find((key) =>
              key.toString().startsWith('"wc4')
            );
      const saturationPercentage = wcKey
        ? ((stationData[wcKey] / station.vwc_max) * 100).toFixed(0) + "%"
        : "N/A";

      // Get the 12-hour rain total
      const rainTotal =
        parseFloat(stationData["12hr_rain_mm_total"]).toFixed(0) || "N/A";

      // Get the timestamp and format it
      const timestamp = stationData["TIMESTAMP"] || "N/A";
      let formattedTimestamp = "N/A";
      if (timestamp !== "N/A") {
        // Format the timestamp here
      }

      // Construct the popup content with station information
      const popupContent = `
      <div class="leaflet-popup-content">
        <figure>
          <img src="/files/images/${station.name}.jpg" alt="${station.display_name}">
          <figcaption>${station.display_name} Station</figcaption>
        </figure>
        <div class="info">
          <h2>Details and Data</h2>
          <ul>
            <li><strong>Landslide Susceptibility:</strong> ${station.landslideSusceptibility}</li>
            <li><strong>Elevation:</strong>${station.elevation}</li>
            <li><strong>Saturation Level:</strong> ${saturationPercentage}</li>
            <li><strong>Precipitation (Last-12hr):</strong> ${rainTotal}mm</li>
            <li><strong>Soil Unit:</strong> ${station.soilUnit}</li>
          </ul>
        </div>
      </div>
      `;

      // Determine the icon background color based on saturation level
      const backgroundColor =
        dataType === "soilSaturation" && parseFloat(saturationPercentage) >= 90
          ? "rgba(4, 28, 63, 0.9)"
          : dataType === "soilSaturation"
          ? "rgba(10, 41, 95, 0.9)"
          : "rgba(10, 41, 95, 0.9)";

      // Create a custom icon
      var customIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: ${backgroundColor}; color: white; padding: 5px; border-radius: 5px; display: flex; flex-direction: column; text-align: center; justify-content: center; align-items: center; height: 100%;">
          <span style="font-size: 24px; color: white;">
            ${dataType === "rainfall" ? rainTotal : saturationPercentage}
          </span>
          ${dataType === "rainfall" ? "mm" : ""}
          </div>`,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
      });

      // Add marker to the map with popup
      var marker = L.marker(station.coords, { icon: customIcon }).addTo(map);
      marker.bindPopup(popupContent);

      // Center the map on the center of the popup when it is opened
      marker.on("popupopen", function () {
        const popupElement = marker.getPopup().getElement();
        if (popupElement) {
          const popupHeight = popupElement.offsetHeight;
          const popupWidth = popupElement.offsetWidth;
          const offset = map.latLngToContainerPoint(marker.getLatLng());
          const newOffset = L.point(offset.x, offset.y - popupHeight / 2);
          const newLatLng = map.containerPointToLatLng(newOffset);
          map.setView(newLatLng, map.getZoom(), { animate: true });
        }
      });

      // Set the marker property on the station object
      station.marker = marker;
    });

    return stations;
  }

  function changeData(stations, dataType) {
    stations.forEach(function (station) {
      const stationData = JSON.parse(
        JSON.stringify(fetchedStationData[station.name])
      );
      if (!stationData) {
        console.warn(`No data found for station: ${station.name}`);
        return; // Skip this station if no data is found
      }

      var marker = station.marker;
      var value;

      // Calculate the saturation percentage
      const wcKey =
        station.name === "toronegro"
          ? Object.keys(stationData).find((key) =>
              key.toString().startsWith('"wc5')
            )
          : Object.keys(stationData).find((key) =>
              key.toString().startsWith('"wc4')
            );
      const saturationPercentage = wcKey
        ? ((stationData[wcKey] / station.vwc_max) * 100).toFixed(0) + "%"
        : "N/A";

      // Get the 12-hour rain total
      const rainTotal =
        parseFloat(stationData["12hr_rain_mm_total"]).toFixed(0) || "N/A";

      // Get the timestamp and format it
      const timestamp = stationData["TIMESTAMP"] || "N/A";
      let formattedTimestamp = "N/A";
      if (timestamp !== "N/A") {
        const cleanedTimestamp = timestamp.replace(/['"]/g, ""); // Remove quotes from timestamp
        const parsedDate = Date.parse(cleanedTimestamp);
        if (!isNaN(parsedDate)) {
          formattedTimestamp = new Date(parsedDate).toLocaleString();
        }
      }

      // Check data type and assign value accordingly
      if (dataType === "rainfall") {
        value = rainTotal;
      } else if (dataType === "soilSaturation") {
        value = saturationPercentage;
      } else {
        value = "N/A";
      }

      // Construct the popup content with station information
      const popupContent = `
      <div class="leaflet-popup-content">
        <figure>
          <img src="/files/images/${station.name}.jpg" alt="${station.display_name}">
          <figcaption>${station.display_name} Station</figcaption>
        </figure>
        <div class="info">
          <h2>Details and Data</h2>
          <ul>
            <li><strong>Landslide Susceptibility:</strong> ${station.landslideSusceptibility}</li>
            <li><strong>Elevation:</strong> ${station.elevation}</li>
            <li><strong>Saturation Level:</strong> ${saturationPercentage}</li>
            <li><strong>Precipitation (Last-12hr):</strong> ${rainTotal}mm</li>
            <li><strong>Soil Unit:</strong> ${station.soilUnit}</li>
          </ul>
        </div>
      </div>
      `;

      marker.setPopupContent(popupContent);
      var popup = marker.getPopup();

      // Center the map on the center of the popup when it is opened
      marker.on("popupopen", function () {
        const popupElement = popup.getElement();
        if (popupElement) {
          const popupHeight = popupElement.offsetHeight;
          const popupWidth = popupElement.offsetWidth;
          const offset = map.latLngToContainerPoint(marker.getLatLng());
          const newOffset = L.point(offset.x, offset.y - popupHeight / 2);
          const newLatLng = map.containerPointToLatLng(newOffset);
          map.setView(newLatLng, map.getZoom(), { animate: true });
        }
      });

      // Determine the icon background color based on saturation level
      const backgroundColor =
        dataType === "soilSaturation" && parseFloat(saturationPercentage) >= 90
          ? "rgba(4, 28, 63, 0.9)"
          : dataType === "soilSaturation"
          ? "rgba(10, 41, 95, 0.9)"
          : "rgba(10, 41, 95, 0.9)";

      var newIconHTML = `<div style="background-color: ${backgroundColor}; color: white; padding: 5px; border-radius: 5px; display: flex; flex-direction: column; text-align: center; justify-content: center; align-items: center; height: 100%;">
          <span style="font-size: 24px; color: white;">
            ${value}
          </span>
          ${dataType === "rainfall" ? "<span>mm</span>" : ""}
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
    await processFiles(); // Fetch and process station data
    var map = initializeMap();
    var stations = initializeMarkers(map, "soilSaturation");

    // Event listeners for data switching buttons
    document
      .getElementById("rainfall-button")
      .addEventListener("click", async function () {
        await processFiles();
        changeData(stations, "rainfall");
      });

    document
      .getElementById("soilSaturation-button")
      .addEventListener("click", async function () {
        await processFiles();
        changeData(stations, "soilSaturation");
      });
  }

  // Initialize the map and markers
  initialize();
});
