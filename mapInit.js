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
          "Tiles © Esri — Source: Esri, PRLHMO, UPRM, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        maxZoom: 18,
      }
    ).addTo(map);

    // Add susceptibility layer with error handling
    var susceptibilityLayer = L.esri
      .tiledMapLayer({
        url: "https://tiles.arcgis.com/tiles/TQ9qkk0dURXSP7LQ/arcgis/rest/services/Susceptibilidad_Derrumbe_PR/MapServer",
        opacity: 0.5,
        attribution: "Susceptibility data © Esri",
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
        attribution: "Municipality boundaries © Esri",
      })
      .addTo(map);

    municipalityLayer.on("error", function (error) {
      console.error("Feature layer error:", error);
    });

    // Add precipitation forecast layer with error handling
    var precipitationLayer = L.esri
      .imageMapLayer({
        url: "https://mapservices.weather.noaa.gov/raster/rest/services/obs/mrms_qpe/ImageServer",
        opacity: 0.7, // You can adjust the transparency
        attribution: "Precipitation data © NOAA",
      })
      .addTo(map);

    precipitationLayer.on("tileerror", function (error) {
      console.error("Tile error:", error);
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

    // Add custom control for the legend dropdown
    var legendControl = L.control({ position: "topright" });

    legendControl.onAdd = function (map) {
      var div = L.DomUtil.create("div", "legend-control");
      div.innerHTML = `
        <div id="legend-dropdown" class="dropdown">
          <button id="legend-toggle" class="dropdown-toggle">Legend</button>
          <div id="legend-content" class="dropdown-content"></div>
        </div>
      `;
      return div;
    };

    legendControl.addTo(map);

    // Add custom control for the buttons
    var buttonControl = L.control({ position: "bottomleft" });

    buttonControl.onAdd = function (map) {
      var div = L.DomUtil.create("div", "button-bar");
      div.innerHTML = `
        <button id="soilSaturation-button">Soil Saturation</button>
        <button id="rainfall-button">Precipitation</button>
      `;
      return div;
    };

    buttonControl.addTo(map);

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
      <a href="https://derrumbe.net/${
        station.name
      }" target="_blank" class="leaflet-popup-link">
        <div class="leaflet-popup-content">
          <figure>
            <img src="/files/images/${station.name}.jpg" alt="${
        station.display_name
      }">
            <figcaption>${station.display_name} Station</figcaption>
          </figure>
          <div class="info">
            <h2>${station.name.toUpperCase()}</h2>
            <ul>
              <li><strong>Landslide Susceptibility:</strong> ${
                station.landslideSusceptibility
              }</li>
              <li><strong>Elevation:</strong> ${station.elevation}</li>
              <li><strong>Saturation Level:</strong> ${saturationPercentage}</li>
              <li><strong>Precipitation (Last-12hr):</strong> ${rainTotal}mm</li>
              <li><strong>Soil Unit:</strong> ${station.soilUnit}</li>
            </ul>
          </div>
        </div>
      </a>
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
      <a href="https://derrumbe.net/${
        station.name
      }" target="_blank" class="leaflet-popup-link">
        <div class="leaflet-popup-content">
          <figure>
            <img src="/files/images/${station.name}.jpg" alt="${
        station.display_name
      }">
            <figcaption>${station.display_name} Station</figcaption>
          </figure>
          <div class="info">
            <h2>${station.name.toUpperCase()}</h2>
            <ul>
              <li><strong>Landslide Susceptibility:</strong> ${
                station.landslideSusceptibility
              }</li>
              <li><strong>Elevation:</strong> ${station.elevation}</li>
              <li><strong>Saturation Level:</strong> ${saturationPercentage}</li>
              <li><strong>Precipitation (Last-12hr):</strong> ${rainTotal}mm</li>
              <li><strong>Soil Unit:</strong> ${station.soilUnit}</li>
            </ul>
          </div>
        </div>
      </a>
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
   * Fetches and parses legend colors from the ImageServer.
   * @returns {Array} The array of legend colors and labels.
   */
  async function fetchLegendColors() {
    const legendUrl =
      "https://mapservices.weather.noaa.gov/raster/rest/services/obs/mrms_qpe/ImageServer/legend?bandIds=&variable=&renderingRule=&f=pjson";

    try {
      const response = await fetch(legendUrl);

      // Check if the response is OK (status code 200-299)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data.layers[0].legend);

      // Extract colors and labels from the legend data
      const legendColors = data.layers[0].legend.map((item) => ({
        label: item.label,
        imageData: item.imageData,
      }));

      console.log("Legend Colors:", legendColors);
      return legendColors;
    } catch (error) {
      console.error("Error fetching legend colors:", error);
      return [];
    }
  }

  /**
   * Populates the dropdown menu with legend colors.
   * @param {Array} legendColors - The array of legend colors and labels.
   */
  function populateDropdown(legendColors) {
    const dropdownContent = document.querySelector(".dropdown-content");

    legendColors.forEach((item) => {
      const dropdownItem = document.createElement("div");
      dropdownItem.className = "dropdown-item";

      // Create an img element for the base64-encoded image
      const img = document.createElement("img");
      img.src = `data:image/png;base64,${item.imageData}`;
      img.alt = item.label;
      img.style.width = "20px";
      img.style.height = "20px";
      img.style.marginRight = "10px";

      dropdownItem.appendChild(img);
      dropdownItem.appendChild(document.createTextNode(item.label));
      dropdownContent.appendChild(dropdownItem);
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

    // Fetch legend colors and populate the dropdown menu
    const legendColors = await fetchLegendColors();
    populateDropdown(legendColors);

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
