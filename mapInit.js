import { fetchedStationData, processFiles } from "./fetchStationData.js";
import { stations } from "./stationInfo.js";

document.addEventListener("DOMContentLoaded", async function () {
  createOverlay();
  const { map, layers } = initializeMap();
  const stations = await initializeStations(map);
  setupEventListeners(map, layers, stations);
  // uncheckPrecipitationLayer();

  // Set the initial data type and update the label
  const initialDataType = "soilSaturation"; // Change this to your desired initial data type
  updateMapLabel(getLabelText(initialDataType));
  changeData(stations, initialDataType);
});

// Overlay Creation
function createOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "map-overlay";
  overlay.innerText = "Press ctrl + scroll to zoom";
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

  return { map, layers };
}

function updateMapLabel(text) {
  const label = document.getElementById("map-label");
  label.innerText = text;
  label.style.display = text ? "block" : "none";
}

function getLabelText(dataType) {
  if (dataType === "rainfall") {
    return "LAST 12-HOUR PRECIPITATION";
  } else if (dataType === "soilSaturation") {
    return "SOIL SATURATION";
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

  const susceptibilityLayer = L.esri
    .tiledMapLayer({
      url: "https://tiles.arcgis.com/tiles/TQ9qkk0dURXSP7LQ/arcgis/rest/services/Susceptibilidad_Derrumbe_PR/MapServer",
      opacity: 0.5,
      attribution: "Dr. Stephen Hughes, PRLHMO",
    })

  susceptibilityLayer.on("tileerror", (error) =>
    console.error("Tile error:", error)
  );

  const hillshadeLayer = L.esri.tiledMapLayer({
    url: "https://tiles.arcgis.com/tiles/TQ9qkk0dURXSP7LQ/arcgis/rest/services/Hillshade_Puerto_Rico/MapServer",
    opacity: 0.5,
    attribution: "Hillshade data © Esri",
  }).addTo(map);

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
  }).addTo(map);

  precipitationLayer.on("tileerror", (error) =>
    console.error("Tile error:", error)
  );

  return {
    worldImageryLayer,
    susceptibilityLayer,
    municipalityLayer,
    precipitationLayer,
    hillshadeLayer
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
async function initializeStations(map) {
  await processFiles();
  return initializeMarkers(map, "soilSaturation");
}

function toggleImage(event) {
  event.stopPropagation();
  const container = event.target.closest(".image-container");
  const images = container.querySelectorAll(".popup-image");
  images.forEach((img) => img.classList.toggle("hidden"));
}

window.toggleImage = toggleImage;

// Event Listeners Setup
function setupEventListeners(map, layers, stations) {
  let dataType;
  document
    .getElementById("rainfall-button")
    .addEventListener("click", async () => {
      await processFiles();
      dataType = "rainfall"
      changeData(stations, dataType);
      updateMapLabel(getLabelText(dataType));
    });

  document
    .getElementById("soilSaturation-button")
    .addEventListener("click", async () => {
      await processFiles();
      dataType = "soilSaturation"
      changeData(stations, dataType);
      updateMapLabel(getLabelText(dataType));

    });
    
  document
    .getElementById("susceptibilityLayer")
    .addEventListener("change", (event) => {
      const { susceptibilityLayer } = layers;
      if (event.target.checked) {
        susceptibilityLayer.addTo(map);
      } else {
        map.removeLayer(susceptibilityLayer);
      }
    });

  document
    .getElementById("precipitationLayer")
    .addEventListener("change", (event) => {
      const { precipitationLayer } = layers;
      if (event.target.checked) {
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
    if (attributionControl.style.display === "none") {
      attributionControl.style.display = "block";
    } else {
      attributionControl.style.display = "none";
    }
  });

  document
    .getElementById("legendToggle")
    .addEventListener("change", (event) => {
      const legendContainer = document.getElementById("legend-container");
      legendContainer.style.display = event.target.checked ? "block" : "none";
    });

  document
    .getElementById("susceptibilityLegendToggle")
    .addEventListener("change", (event) => {
      const susceptibilityLegendContainer = document.getElementById(
        "susceptibility-legend-container"
      );
      susceptibilityLegendContainer.style.display = event.target.checked
        ? "block"
        : "none";
    });

  document.getElementById("sidebar-toggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("closed");
  });

  document.getElementById("hamburger-button").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("closed");
  });
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

    const wcKey =
      station.name === "toronegro"
        ? Object.keys(stationData).find((key) =>
            key.toString().startsWith('"wc5')
          )
        : Object.keys(stationData).find((key) =>
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
        ${dataType === "rainfall" ? "inches" : ""}
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

    const wcKey =
      station.name === "toronegro"
        ? Object.keys(stationData).find((key) =>
            key.toString().startsWith('"wc5')
          )
        : Object.keys(stationData).find((key) =>
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
      backgroundColor = "rgb(0,179,255,0.9)"; // Light Blue
    } else {
      backgroundColor = "rgb(175,152,0,0.9)"; // Brown
    }

    var newIconHTML = `<div style="background-color: ${backgroundColor}; color: white; padding: 5px; border-radius: 5px; display: flex; flex-direction: column; text-align: center; justify-content: center; align-items: center; height: 100%;">
        <span style="font-size: ${fontSize}; color: white;">
          ${value}
        </span>
        ${dataType === "rainfall" ? "<span>inches</span>" : ""}
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
