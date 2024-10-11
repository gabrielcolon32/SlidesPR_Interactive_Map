import { fetchedStationData, processFiles } from "./fetchStationData.js";
import { stations } from "./stationInfo.js";

document.addEventListener("DOMContentLoaded", async function () {
  createOverlay();
  const { map, layers } = initializeMap();
  const stations = await initializeStations(map);
  setupEventListeners(map, layers, stations);
  uncheckPrecipitationLayer();
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
  const map = L.map("map", {
    center: [18.220833, -66.420149],
    zoom: 10,
    maxBounds: [
      [19.0, -68.0],
      [17.0, -65.0],
    ],
    minZoom: 9,
    maxZoom: 18,
    scrollWheelZoom: false,
    zoomControl: false,
  });

  L.control.zoom({ position: "topright" }).addTo(map);

  const layers = addBaseLayers(map);
  addCustomControls(map);
  setupScrollZoom(map);

  return { map, layers };
}

function addBaseLayers(map) {
  const worldImageryLayer = L.tileLayer(
    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "Tiles © Esri — Source: Esri, PRLHMO, UPRM, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      maxZoom: 18,
    }
  ).addTo(map);

  const susceptibilityLayer = L.esri
    .tiledMapLayer({
      url: "https://tiles.arcgis.com/tiles/TQ9qkk0dURXSP7LQ/arcgis/rest/services/Susceptibilidad_Derrumbe_PR/MapServer",
      opacity: 0.5,
      attribution: "Susceptibility data © Esri",
    })
    .addTo(map);
  susceptibilityLayer.bringToFront();

  susceptibilityLayer.on("tileerror", (error) =>
    console.error("Tile error:", error)
  );

  const municipalityLayer = L.esri
    .featureLayer({
      url: "https://services5.arcgis.com/TQ9qkk0dURXSP7LQ/arcgis/rest/services/LIMITES_LEGALES_MUNICIPIOS/FeatureServer/0",
      opacity: 0.2,
      color: "black",
      attribution: "Municipality boundaries © Esri",
    })
    .addTo(map);

  municipalityLayer.on("error", (error) =>
    console.error("Feature layer error:", error)
  );

  const precipitationLayer = L.esri.imageMapLayer({
    url: "https://mapservices.weather.noaa.gov/raster/rest/services/obs/mrms_qpe/ImageServer",
    opacity: 0.7,
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
  };
}

function addCustomControls(map) {
  const legendControl = L.control({ position: "bottomright" });

  legendControl.onAdd = function () {
    const div = L.DomUtil.create("div", "legend-control");
    div.innerHTML = `
      <div id="legend-dropdown" class="dropdown">
        <div id="legend-content" class="dropdown-content"></div>
      </div>
    `;
    div.style.display = "none";
    return div;
  };

  legendControl.addTo(map);

  const buttonControl = L.control({ position: "bottomleft" });

  buttonControl.onAdd = function () {
    const div = L.DomUtil.create("div", "button-bar");
    div.innerHTML = `
      <button id="soilSaturation-button">Soil Saturation</button>
      <button id="rainfall-button">Precipitation</button>
    `;
    return div;
  };

  buttonControl.addTo(map);
}

function setupScrollZoom(map) {
  let overlayTimeout;
  let isMouseOverLegend = false;

  const legendImage = document.getElementById("legend-image");

  legendImage.addEventListener("mouseenter", () => {
    isMouseOverLegend = true;
  });

  legendImage.addEventListener("mouseleave", () => {
    isMouseOverLegend = false;
  });

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey) {
      map.scrollWheelZoom.enable();
      document.getElementById("map-overlay").style.display = "none";
      clearTimeout(overlayTimeout);
    }
  });

  document.addEventListener("keyup", (event) => {
    if (!event.ctrlKey) {
      map.scrollWheelZoom.disable();
    }
  });

  map.getContainer().addEventListener("wheel", (event) => {
    if (!event.ctrlKey && !isMouseOverLegend) {
      const overlay = document.getElementById("map-overlay");
      overlay.style.display = "flex";
      clearTimeout(overlayTimeout);
      overlayTimeout = setTimeout(() => {
        overlay.style.display = "none";
      }, 2000);
    }
  });
}

// Station Initialization
async function initializeStations(map) {
  await processFiles();
  return initializeMarkers(map, "soilSaturation");
}

// Event Listeners Setup
function setupEventListeners(map, layers, stations) {
  document
    .getElementById("rainfall-button")
    .addEventListener("click", async () => {
      await processFiles();
      changeData(stations, "rainfall");
    });

  document
    .getElementById("soilSaturation-button")
    .addEventListener("click", async () => {
      await processFiles();
      changeData(stations, "soilSaturation");
    });

  document
    .getElementById("worldImageryLayer")
    .addEventListener("change", (event) => {
      const { worldImageryLayer } = layers;
      if (event.target.checked) {
        worldImageryLayer.addTo(map);
      } else {
        map.removeLayer(worldImageryLayer);
      }
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
    .getElementById("municipalityLayer")
    .addEventListener("change", (event) => {
      const { municipalityLayer } = layers;
      if (event.target.checked) {
        municipalityLayer.addTo(map);
      } else {
        map.removeLayer(municipalityLayer);
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

  document
    .getElementById("legendToggle")
    .addEventListener("change", (event) => {
      const legendContainer = document.getElementById("legend-container");
      legendContainer.style.display = event.target.checked ? "block" : "none";
    });

  document.getElementById("sidebar-toggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("closed");
  });

  document.getElementById("gear-button").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("closed");
  });
}

function uncheckPrecipitationLayer() {
  document.getElementById("precipitationLayer").checked = false;
}

// Marker Initialization
function initializeMarkers(map, dataType) {
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
      ? ((stationData[wcKey] / station.vwc_max) * 100).toFixed(0) + "%"
      : "N/A";

    const rainTotal =
      parseFloat(stationData["12hr_rain_mm_total"]).toFixed(0) || "N/A";

    const timestamp = stationData["TIMESTAMP"] || "N/A";
    let formattedTimestamp = "N/A";
    if (timestamp !== "N/A") {
      // Format the timestamp here
    }

    const popupContent = `
    <a href="https://derrumbe.net/${
      station["url-name"]
    }" target="_blank" class="leaflet-popup-link">
      <div class="leaflet-popup-content-wrapper">
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

    const backgroundColor =
      dataType === "soilSaturation" && parseFloat(saturationPercentage) >= 90
        ? "rgba(4, 28, 63, 0.9)"
        : dataType === "soilSaturation"
        ? "rgba(10, 41, 95, 0.9)"
        : "rgba(10, 41, 95, 0.9)";

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
        map.setView(newLatLng, map.getZoom(), { animate: true });
      }
    });

    station.marker = marker;
  });

  return stations;
}

// Data Change Handling
function changeData(stations, dataType) {
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
      ? ((stationData[wcKey] / station.vwc_max) * 100).toFixed(0) + "%"
      : "N/A";

    const rainTotal =
      parseFloat(stationData["12hr_rain_mm_total"]).toFixed(0) || "N/A";

    const timestamp = stationData["TIMESTAMP"] || "N/A";
    let formattedTimestamp = "N/A";
    if (timestamp !== "N/A") {
      const cleanedTimestamp = timestamp.replace(/['"]/g, "");
      const parsedDate = Date.parse(cleanedTimestamp);
      if (!isNaN(parsedDate)) {
        formattedTimestamp = new Date(parsedDate).toLocaleString();
      }
    }

    if (dataType === "rainfall") {
      value = rainTotal;
    } else if (dataType === "soilSaturation") {
      value = saturationPercentage;
    } else {
      value = "N/A";
    }

    const popupContent = `
    <a href="https://derrumbe.net/${
      station["url-name"]
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

    marker.on("popupopen", function () {
      const popupElement = popup.getElement();
      if (popupElement) {
        const popupHeight = popupElement.offsetHeight;
        const popupWidth = popupElement.offsetWidth;
      }
    });

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
