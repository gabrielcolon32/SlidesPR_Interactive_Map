import { fetchedStationData, processFiles } from "./fetchStationData.js";
import { stations } from "./stationInfo.js";

document.addEventListener("DOMContentLoaded", async function () {
  createOverlay();
  const { map, layers } = initializeMap();

  // Set the initial data type and update the label
  const initialDataType = "soilSaturation"; // Change this to your desired initial data type
  updateMapLabel(getLabelText(initialDataType));
  const stations = await initializeStations(map);
  setupEventListeners(map, layers, stations);
  // uncheckPrecipitationLayer();
});

// Overlay Creation
function createOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "map-overlay";
  overlay.innerText = "Press ctrl + scroll to zoom";
  overlay.style.textAlign = "center";
  document.getElementById("map").appendChild(overlay);
}

// Map Initialization
function initializeMap() {
  const isSmallDevice = window.innerWidth <= 768;
  const initialZoom = isSmallDevice ? 8.0 : 10; // Zoom out for small devices
  const map = L.map("map", {
    center: [18.220833, -66.420149],
    zoom: initialZoom,
    maxBounds: [
      [19.0, -68.0],
      [17.0, -65.0],
    ],
    minZoom: 7,
    maxZoom: 18,
    scrollWheelZoom: false,
    zoomControl: false, // Disable default zoom control
  });

  // Add zoom control below the hamburger button
  L.control.zoom({ position: "topleft" }).addTo(map);

  // Add scale control
  L.control.scale({ position: "bottomleft" }).addTo(map);

  const layers = addBaseLayers(map);
  setupScrollZoom(map);

  // Event listener for zoom changes
  map.on("zoomend", () => {
    updateIconSizes(map, stations);
  });

  return { map, layers };
}

function updateIconSizes(map, stations) {
  const zoomLevel = map.getZoom();
  const isSmallDevice = window.innerWidth <= 768;

  // Adjust icon size and anchor based on zoom level
  let iconSize, iconAnchor, fontSize;
  if (isSmallDevice) {
    iconSize = [20 + zoomLevel * 0.5, 20 + zoomLevel * 0.5];
    iconAnchor = [10 + zoomLevel * 0.25, 10 + zoomLevel * 0.25];
    fontSize = 10 + zoomLevel * 0.2 + "px";
  } else {
    iconSize = [50 + zoomLevel * 1.5, 50 + zoomLevel * 1.5];
    iconAnchor = [25 + zoomLevel * 1.1, 25 + zoomLevel * 1.1];
    fontSize = 24 + zoomLevel * 0.7+ "px";
  }

  stations.forEach((station) => {
    const stationData = fetchedStationData[station.name];
    if (!stationData) {
      console.warn(`No data found for station: ${station.name}`);
      return;
    }

    const wcKey = Object.keys(stationData).find((key) =>
      key.toString().startsWith('"wc4')
    );
    const saturationPercentage = wcKey
      ? ((stationData[wcKey] / station.vwc_max) * 100).toFixed(0)
      : "N/A";

    const rainTotalMM =
      parseFloat(stationData["12hr_rain_mm_total"]).toFixed(0) || "N/A";
    const rainTotalInches =
      rainTotalMM !== "N/A" ? (rainTotalMM / 25.4).toFixed(2) : "N/A";

    const value =
      station.dataType === "rainfall" ? rainTotalInches : saturationPercentage + "%";

    let backgroundColor;
    if (saturationPercentage >= 90) {
      backgroundColor = "rgb(0,28,104,0.9)"; // Blue
    } else if (saturationPercentage >= 80) {
      backgroundColor = "rgba(0,179,255,0.9)"; // Light Blue
    } else {
      backgroundColor = "rgb(175,152,0,0.9)"; // Brown
    }

    const newIconHTML = `<div style="background-color: ${backgroundColor}; color: white; padding: 5px; border-radius: 5px; display: flex; flex-direction: column; text-align: center; justify-content: center; align-items: center; height: 100%;">
      <span style="font-size: ${fontSize}; color: white;">
        ${value}
      </span>
    </div>`;
    station.marker.setIcon(
      L.divIcon({
        className: "custom-div-icon",
        html: newIconHTML,
        iconSize: iconSize,
        iconAnchor: iconAnchor,
      })
    );
  });
}

function updateMapLabel(text) {
  const label = document.getElementById("map-label");
  label.innerText = text;
  label.style.display = text ? "block" : "none";
  label.style.textAlign = "center";
}

function getLabelText(dataType) {
  if (dataType === "rainfall") {
    return "PAST 12-HOUR PRECIPITATION (Inches)";
  } else if (dataType === "soilSaturation") {
    return "SOIL SATURATION PERCENTAGE";
  } else if (dataType === "todayLandslideForecast") {
    return "TODAY'S LANDSLIDE FORECAST";
  } else if (dataType === "tomorrowLandslideForecast") {
    return "TOMORROW'S LANDSLIDE FORECAST";
  }
  return "";
}

function addBaseLayers(map) {
  const worldImageryLayer = L.tileLayer(
    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "Tiles © Esri — Source: Esri, UPRM, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      maxZoom: 18,
    }
  ).addTo(map);

  const susceptibilityLayer = L.esri.tiledMapLayer({
    url: "https://tiles.arcgis.com/tiles/TQ9qkk0dURXSP7LQ/arcgis/rest/services/Susceptibilidad_Derrumbe_PR/MapServer",
    opacity: 0.5,
    attribution: "Dr. Stephen Hughes, PRLHMO",
  });

  susceptibilityLayer.on("tileerror", (error) =>
    console.error("Tile error:", error)
  );

  const hillshadeLayer = L.esri
    .tiledMapLayer({
      url: "https://tiles.arcgis.com/tiles/TQ9qkk0dURXSP7LQ/arcgis/rest/services/Hillshade_Puerto_Rico/MapServer",
      opacity: 0.5,
      attribution: "Hillshade data © Esri",
    })
    .addTo(map);

  const municipalityLayer = L.esri
    .featureLayer({
      url: "https://services5.arcgis.com/TQ9qkk0dURXSP7LQ/arcgis/rest/services/LIMITES_LEGALES_MUNICIPIOS/FeatureServer/0",
      opacity: 0.7,
      color: "black",
    })
    .addTo(map);

  municipalityLayer.on("error", (error) =>
    console.error("Feature layer error:", error)
  );

  const precipitationLayer = L.esri.imageMapLayer({
    url: 'https://mapservices.weather.noaa.gov/raster/rest/services/obs/mrms_qpe/ImageServer/exportImage?renderingRule={"rasterFunction":"rft_12hr"}',
    opacity: 0.5,
    attribution: "Precipitation data © NOAA",
  });

  precipitationLayer.on("tileerror", (error) =>
    console.error("Tile error:", error)
  );

  return {
    worldImageryLayer,
    susceptibilityLayer,
    municipalityLayer,
    precipitationLayer,
    hillshadeLayer,
  };
}

function setupScrollZoom(map) {
  let overlayTimeout;
  let isMouseOverLegend = false;

  const legendImage = document.getElementById("legend-image");
  const susceptibilityLegendImage = document.getElementById("legend-image");

  legendImage.addEventListener("mouseenter", () => {
    isMouseOverLegend = true;
  });

  legendImage.addEventListener("mouseleave", () => {
    isMouseOverLegend = false;
  });

  susceptibilityLegendImage.addEventListener("mouseenter", () => {
    isMouseOverLegend = true;
  });

  susceptibilityLegendImage.addEventListener("mouseleave", () => {
    isMouseOverLegend = false;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Control") {
      map.scrollWheelZoom.enable();
      clearTimeout(overlayTimeout);
      document.getElementById("map-overlay").style.display = "none";
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "Control") {
      map.scrollWheelZoom.disable();
    }
  });

  map.getContainer().addEventListener("wheel", (event) => {
    if (
      !event.ctrlKey &&
      (!isMouseOverLegend || !isMouseOverSusceptibilityLegend)
    ) {
      document.getElementById("map-overlay").style.display = "flex";
      clearTimeout(overlayTimeout);
      overlayTimeout = setTimeout(() => {
        document.getElementById("map-overlay").style.display = "none";
      }, 1000);
    }
  });
}

// Station Initialization
async function initializeStations(map, dataType) {
  await processFiles();
  return initializeMarkers(map, dataType);
}

function toggleImage(event) {
  event.stopPropagation();
  const container = event.target.closest(".image-container");
  const images = container.querySelectorAll(".popup-image");
  images.forEach((img) => img.classList.toggle("hidden"));
}

window.toggleImage = toggleImage;

let sidebarToggleTimer = 200; // Store the timer to prevent rapid toggling

function toggleSidebarWithDelay() {
  // Clear any existing timer if the function is triggered again quickly
  if (sidebarToggleTimer) {
    clearTimeout(sidebarToggleTimer);
  }

  // Set a new timer to toggle the sidebar after 200ms
  sidebarToggleTimer = setTimeout(() => {
    document.getElementById("sidebar").classList.toggle("closed");
  }, 200);
}

// Event Listeners Setup
function setupEventListeners(map, layers, stations) {
  let dataType;
  let checkboxToggleTimer = 200;

  // Function to toggle checkbox with delay (used for legend and attributions)
  const toggleCheckboxWithDelay = (elementId, visibility) => {
    if (checkboxToggleTimer) {
      clearTimeout(checkboxToggleTimer); // Clear the previous timer
    }

    checkboxToggleTimer = setTimeout(() => {
      const element = document.getElementById(elementId);
      element.style.display = visibility;
    }, 200); // Delay of 200ms before toggling visibility
  };

  document
    .getElementById("rainfall-button")
    .addEventListener("click", async () => {
      await processFiles();
      dataType = "rainfall";
      changeData(stations, dataType);
      updateMapLabel(getLabelText(dataType));
    });

  document
    .getElementById("soilSaturation-button")
    .addEventListener("click", async () => {
      await processFiles();
      dataType = "soilSaturation";
      changeData(stations, dataType);
      updateMapLabel(getLabelText(dataType));
    });

  document
    .getElementById("susceptibilityLayer")
    .addEventListener("click", (event) => {
      const { susceptibilityLayer } = layers;
      const button = event.target;
      const isChecked = button.getAttribute("data-checked") === "true";
      button.setAttribute("data-checked", !isChecked);
      if (!isChecked) {
        susceptibilityLayer.addTo(map);
      } else {
        map.removeLayer(susceptibilityLayer);
      }
    });

  document
    .getElementById("precipitationLayer")
    .addEventListener("click", (event) => {
      const { precipitationLayer } = layers;
      const button = event.target;
      const isChecked = button.getAttribute("data-checked") === "true";
      button.setAttribute("data-checked", !isChecked);
      if (!isChecked) {
        precipitationLayer.addTo(map);
      } else {
        map.removeLayer(precipitationLayer);
      }
    });

  // Prevent double-click on sidebar from zooming the map
  document
    .getElementById("sidebar")
    .addEventListener("dblclick", function (event) {
      event.stopPropagation();
    });

  // Prevent double-click on sidebar button from zooming the map
  document
    .getElementById("hamburger-button")
    .addEventListener("dblclick", function (event) {
      event.stopPropagation();
    });

  // Event delegation for image toggling
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("arrow")) {
      toggleImage(event);
    }
  });

  // Toggle attributions visibility
  const attributionControl = document.querySelector(
    ".leaflet-control-attribution"
  );
  const toggleButton = document.getElementById("toggle-attributions");
  attributionControl.style.display = "none";

  toggleButton.addEventListener("click", function () {
    const isChecked = toggleButton.getAttribute("data-checked") === "true";
    toggleButton.setAttribute("data-checked", !isChecked);
    if (checkboxToggleTimer) {
      clearTimeout(checkboxToggleTimer); // Clear the previous timer
    }
    checkboxToggleTimer = setTimeout(() => {
      if (attributionControl.style.display === "none") {
        attributionControl.style.display = "block";
      } else {
        attributionControl.style.display = "none";
      }
    }, 200); // Delay of 200ms before toggling visibility
  });

  // Event listener for legend checkbox
  document
    .getElementById("legendToggle")
    .addEventListener("click", (event) => {
      const button = event.target;
      const isChecked = button.getAttribute("data-checked") === "true";
      button.setAttribute("data-checked", !isChecked);
      const visibility = !isChecked ? "block" : "none";
      toggleCheckboxWithDelay("legend-container", visibility);
    });

  // Event listener for susceptibility legend checkbox
  document
    .getElementById("susceptibilityLegendToggle")
    .addEventListener("click", (event) => {
      const button = event.target;
      const isChecked = button.getAttribute("data-checked") === "true";
      button.setAttribute("data-checked", !isChecked);
      const visibility = !isChecked ? "block" : "none";
      toggleCheckboxWithDelay("susceptibility-legend-container", visibility);
    });

  document
    .getElementById("sidebar-toggle")
    .addEventListener("click", toggleSidebarWithDelay);
  document
    .getElementById("hamburger-button")
    .addEventListener("click", toggleSidebarWithDelay);
}

function uncheckPrecipitationLayer() {
  document.getElementById("precipitationLayer").checked = false;
}

// Marker Initialization
function initializeMarkers(map, dataType) {
  const isSmallDevice = window.innerWidth <= 768;
  const iconSize = isSmallDevice ? [20, 20] : [50, 50];
  const iconAnchor = isSmallDevice ? [10, 10] : [25, 25];
  const fontSize = isSmallDevice ? "12px" : "24px";

  stations.forEach(function (station) {
    const stationData = JSON.parse(
      JSON.stringify(fetchedStationData[station.name])
    );
    if (!stationData) {
      return;
    }

    const wcKey = Object.keys(stationData).find((key) =>
      key.toString().startsWith('"wc4')
    );
    const saturationPercentage = wcKey
      ? ((stationData[wcKey] / station.vwc_max) * 100).toFixed(0)
      : "N/A";

    const rainTotalMM =
      parseFloat(stationData["12hr_rain_mm_total"]).toFixed(0) || "N/A";
    const rainTotalInches =
      rainTotalMM !== "N/A" ? (rainTotalMM / 25.4).toFixed(2) : "N/A";

    const timestamp = stationData["TIMESTAMP"] || "N/A";
    let formattedTimestamp = "N/A";
    if (timestamp !== "N/A") {
      const cleanedTimestamp = timestamp.replace(/['"]/g, "");
      const parsedDate = Date.parse(cleanedTimestamp);
      if (!isNaN(parsedDate)) {
        const date = new Date(parsedDate);
        formattedTimestamp = date.toLocaleString([], {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }

    const popupContent = `
    <div class="custom-popup-content">
      <div class="image-container">
        <div class="arrow left-arrow" onclick="toggleImage(event)">&#9664;</div>
        <a href="/files/network/plots/${
          station.plot_name
        }" target="_blank" class="image-link">
          <img src="/files/images/${station.name}.jpg" alt="${
      station.display_name
    }" class="popup-image">
        </a>
        <a href="/files/images/${
          station.name
        }.jpg" target="_blank" class="image-link hidden">
          <img src="/files/network/plots/${station.plot_name}" alt="${
      station.display_name
    } Graph" class="popup-image hidden">
        </a>
        <div class="arrow right-arrow" onclick="toggleImage(event)">&#9654;</div>
      </div>
      <div class="info">
        <h2>${station.name.toUpperCase()}</h2>
        <ul>
          <li><strong>Last Updated:</strong> ${formattedTimestamp} AST</li>
          <li><strong>Soil Saturation:</strong> ${saturationPercentage}%</li>
          <li><strong>12 HRS Precipitation:</strong> ${rainTotalInches} inches</li>
          <li><strong>Forecast:</strong> ${station.forecast}</li>
        </ul>
        <a href="https://derrumbe.net/${
          station["url-name"]
        }" target="_blank" class="leaflet-popup-link">Click here for more details!</a>
      </div>
    </div>
    `;

    let backgroundColor;
    if (saturationPercentage >= 90) {
      backgroundColor = "rgb(0,28,104,0.9)"; // Blue
    } else if (saturationPercentage >= 80) {
      backgroundColor = "rgba(0,179,255,0.9)"; // Light Blue
    } else {
      backgroundColor = "rgb(175,152,0,0.9)"; // Brown
    }

    var customIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div style="background-color: ${backgroundColor}; color: white; padding: 5px; border-radius: 5px; display: flex; flex-direction: column; text-align: center; justify-content: center; align-items: center; height: 100%;">
        <span style="font-size: ${fontSize}; color: white;">
          ${
            dataType === "rainfall"
              ? rainTotalInches
              : saturationPercentage + "%"
          }
        </span>
        </div>`,
      iconSize: iconSize,
      iconAnchor: iconAnchor,
    });

    var marker = L.marker(station.coords, { icon: customIcon }).addTo(map);
    marker.bindPopup(popupContent);

    marker.on("popupopen", function () {
      const popupElement = marker.getPopup().getElement();
      if (popupElement) {
        const popupHeight = popupElement.offsetHeight;
        const popupWidth = popupElement.offsetWidth;
        const offset = map.latLngToContainerPoint(marker.getLatLng());
        const newOffset = L.point(offset.x, offset.y - popupHeight / 2);
        const newLatLng = map.containerPointToLatLng(newOffset);
        map.setView(newLatLng, map.getZoom(), { animate: true, duration: 1.5 }); // Slower animation
      }
    });

    station.marker = marker;
  });

  return stations;
}

// Data Change Handling
function changeData(stations, dataType) {
  const isSmallDevice = window.innerWidth <= 768;
  const iconSize = isSmallDevice ? [20, 20] : [50, 50];
  const iconAnchor = isSmallDevice ? [10, 10] : [25, 25];
  const fontSize = isSmallDevice ? "10px" : "24px";

  stations.forEach(function (station) {
    const stationData = JSON.parse(
      JSON.stringify(fetchedStationData[station.name])
    );
    if (!stationData) {
      console.warn(`No data found for station: ${station.name}`);
      return;
    }

    var marker = station.marker;
    var value;

    const wcKey = Object.keys(stationData).find((key) =>
      key.toString().startsWith('"wc4')
    );
    const saturationPercentage = wcKey
      ? ((stationData[wcKey] / station.vwc_max) * 100).toFixed(0)
      : "N/A";
    const rainTotalMM =
      parseFloat(stationData["12hr_rain_mm_total"]).toFixed(0) || "N/A";
    const rainTotalInches =
      rainTotalMM !== "N/A" ? (rainTotalMM / 25.4).toFixed(2) : "N/A";

    const timestamp = stationData["TIMESTAMP"] || "N/A";
    let formattedTimestamp = "N/A";
    if (timestamp !== "N/A") {
      const cleanedTimestamp = timestamp.replace(/['"]/g, "");
      const parsedDate = Date.parse(cleanedTimestamp);
      if (!isNaN(parsedDate)) {
        const date = new Date(parsedDate);
        formattedTimestamp = date.toLocaleString([], {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }

    if (dataType === "rainfall") {
      value = rainTotalInches;
    } else if (dataType === "soilSaturation") {
      value = saturationPercentage + "%";
    } else {
      value = "N/A";
    }

    const popupContent = `
    <div class="custom-popup-content">
      <div class="image-container">
        <div class="arrow left-arrow" onclick="toggleImage(event)">&#9664;</div>
        <a href="/files/network/plots/${
          station.plot_name
        }" target="_blank" class="image-link">
          <img src="/files/images/${station.name}.jpg" alt="${
      station.display_name
    }" class="popup-image">
        </a>
        <a href="/files/images/${
          station.name
        }.jpg" target="_blank" class="image-link hidden">
          <img src="/files/network/plots/${station.plot_name}" alt="${
      station.display_name
    } Graph" class="popup-image hidden">
        </a>
        <div class="arrow right-arrow" onclick="toggleImage(event)">&#9654;</div>
      </div>
      <div class="info">
        <h2>${station.name.toUpperCase()}</h2>
        <ul>
          <li><strong>Last Updated:</strong> ${formattedTimestamp} AST</li>
          <li><strong>Soil Saturation:</strong> ${saturationPercentage}%</li>
          <li><strong>Past 12 HRS Precipitation:</strong> ${rainTotalInches} inches</li>
          <li><strong>Forecast:</strong> ${station.forecast}</li>
        </ul>
        <a href="https://derrumbe.net/${
          station["url-name"]
        }" target="_blank" class="leaflet-popup-link">Click here for more details!</a>
      </div>
    </div>
    `;

    let backgroundColor;
    if (saturationPercentage >= 90) {
      backgroundColor = "rgb(0,28,104,0.9)"; // Blue
    } else if (saturationPercentage >= 80) {
      backgroundColor = "rgb(0,179,255,0.9)"; // Light Blue
    } else {
      backgroundColor = "rgb(175,152,0,0.9)"; // Brown
    }

    var newIconHTML = `<div style="background-color: ${backgroundColor}; color: white; padding: 5px; border-radius: 5px; display: flex; flex-direction: column; text-align: center; justify-content: center; align-items: center; height: 100%;">
        <span style="font-size: ${fontSize}; color: white;">
          ${value}
        </span>
      </div>`;

    marker.setIcon(
      L.divIcon({
        className: "custom-div-icon",
        html: newIconHTML,
        iconSize: iconSize,
        iconAnchor: iconAnchor,
      })
    );

    marker.setPopupContent(popupContent);
    var popup = marker.getPopup();

    marker.on("popupopen", function () {
      const popupElement = popup.getElement();
      if (popupElement) {
        const popupHeight = popupElement.offsetHeight;
        const popupWidth = popupElement.offsetWidth;
        const offset = map.latLngToContainerPoint(marker.getLatLng());
        const newOffset = L.point(offset.x, offset.y - popupHeight / 2);
        const newLatLng = map.containerPointToLatLng(newOffset);
        map.setView(newLatLng, map.getZoom(), { animate: true, duration: 1.5 }); // Slower animation
      }
    });
  });
}
