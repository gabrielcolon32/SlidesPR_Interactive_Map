import { fetchedStationData, processFiles } from "./fetchStationData.js";
import { stations } from "./stationInfo.js";

let currentDataType = "soilSaturation"; // Default data type

document.addEventListener("DOMContentLoaded", async function () {
  createOverlay();
  const { map, layers } = initializeMap();

  // Set the initial data type and update the label
  updateMapLabel(getLabelText(currentDataType));
  const stations = await initializeStations(map, currentDataType);
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
      [21.0, -68.0],
      [16.0, -65.0],
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

  const precipitationLayer = L.esri
    .imageMapLayer({
      url: 'https://mapservices.weather.noaa.gov/raster/rest/services/obs/mrms_qpe/ImageServer/exportImage?renderingRule={"rasterFunction":"rft_12hr"}',
      opacity: 0.5,
      attribution: "Precipitation data © NOAA",
    })
    .addTo(map);

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
  let isMouseOverSusceptibilityLegend = false;

  const legendContainer = document.getElementById(
    "precipitation-legend-container"
  );
  const susceptibilityLegendContainer = document.getElementById(
    "susceptibility-legend-container"
  );

  legendContainer.addEventListener("mouseenter", () => {
    isMouseOverLegend = true;
  });

  legendContainer.addEventListener("mouseleave", () => {
    isMouseOverLegend = false;
  });

  susceptibilityLegendContainer.addEventListener("mouseenter", () => {
    isMouseOverSusceptibilityLegend = true;
  });

  susceptibilityLegendContainer.addEventListener("mouseleave", () => {
    isMouseOverSusceptibilityLegend = false;
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
      !isMouseOverLegend &&
      !isMouseOverSusceptibilityLegend
    ) {
      document.getElementById("map-overlay").style.display = "flex";
      clearTimeout(overlayTimeout);
      overlayTimeout = setTimeout(() => {
        document.getElementById("map-overlay").style.display = "none";
      }, 1000);
    }
  });
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

// Debounce function to prevent multiple rapid clicks
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Function to get the current data type
function getDataType() {
  return currentDataType;
}

// Function to set the current data type
function setDataType(newDataType) {
  currentDataType = newDataType;
}

// Event Listeners Setup
function setupEventListeners(map, layers, stations) {
  let stationsVisible = true; // Track visibility state

  document.getElementById("rainfall-button").addEventListener(
    "click",
    debounce(async () => {
      await processFiles();
      setDataType("rainfall");
      changeData(stations, getDataType(), map);
      updateMapLabel(getLabelText(getDataType()));
    }, 300)
  );

  document.getElementById("soilSaturation-button").addEventListener(
    "click",
    debounce(async () => {
      await processFiles();
      setDataType("soilSaturation");
      changeData(stations, getDataType(), map);
      updateMapLabel(getLabelText(getDataType()));
    }, 300)
  );

  /**
   * Syncs the visual state of a checkbox button.
   * @param {string|HTMLElement} buttonOrId - The button element or its ID.
   * @param {boolean} checked - Whether the checkbox should appear checked.
   */
  function syncCheckbox(buttonOrId, checked) {
    const button =
      typeof buttonOrId === "string"
        ? document.getElementById(buttonOrId)
        : buttonOrId;
    button.setAttribute("data-checked", checked);
    button.classList.toggle("checked", checked);
  }

  /**
   * Handles toggling of checkboxes for layers, legends, and attribution.
   * @param {HTMLElement} button - The checkbox button element.
   * @param {Object|string} target - The layer object or element ID to toggle.
   * @param {'layer'|'element'} type - What kind of thing to toggle.
   * @param {Object} [options] - Optional extra options (e.g., map reference).
   */
  function toggleCheckboxAction(button, target, type, options = {}) {
    const isChecked = button.getAttribute("data-checked") === "true";
    const newChecked = !isChecked;
    syncCheckbox(button, newChecked);

    if (type === "layer") {
      if (newChecked) {
        target.addTo(options.map);
      } else {
        options.map.removeLayer(target);
      }
    } else if (type === "element") {
      // Toggle display of an element (legend, attribution, etc.)
      const el =
        typeof target === "string" ? document.getElementById(target) : target;
      el.style.display = newChecked ? "block" : "none";
    }
  }

  // Sync on load
  syncCheckbox("susceptibilityLayer", map.hasLayer(layers.susceptibilityLayer));
  syncCheckbox("precipitationLayer", map.hasLayer(layers.precipitationLayer));
  syncCheckbox(
    "toggle-attributions",
    document
      .getElementById("toggle-attributions")
      .getAttribute("data-checked") === "true"
  );
  syncCheckbox(
    "susceptibilityLegendToggle",
    document
      .getElementById("susceptibility-legend-container")
      .getAttribute("data-checked") === "true"
  );
  syncCheckbox(
    "precipitationLegendToggle",
    document
      .getElementById("precipitation-legend-container")
      .getAttribute("data-checked") === "true"
  );
  syncCheckbox("stationsToggle", stationsVisible);

  // Layer toggles
  document.getElementById("susceptibilityLayer").addEventListener(
    "click",
    debounce((event) => {
      toggleCheckboxAction(event.target, layers.susceptibilityLayer, "layer", {
        map,
      });
    }, 300)
  );

  document.getElementById("precipitationLayer").addEventListener(
    "click",
    debounce((event) => {
      toggleCheckboxAction(event.target, layers.precipitationLayer, "layer", {
        map,
      });
    }, 300)
  );

  // Attribution toggle
  const attributionControl = document.querySelector(
    ".leaflet-control-attribution"
  );
  const toggleButton = document.getElementById("toggle-attributions");
  attributionControl.style.display = "none";
  toggleButton.addEventListener(
    "click",
    debounce((event) => {
      toggleCheckboxAction(event.target, attributionControl, "element");
    }, 300)
  );

  // Legend toggles
  document.getElementById("precipitationLegendToggle").addEventListener(
    "click",
    debounce((event) => {
      toggleCheckboxAction(
        event.target,
        "precipitation-legend-container",
        "element"
      );
    }, 300)
  );

  document.getElementById("susceptibilityLegendToggle").addEventListener(
    "click",
    debounce((event) => {
      toggleCheckboxAction(
        event.target,
        "susceptibility-legend-container",
        "element"
      );
    }, 300)
  );

  document.getElementById("stationsToggle").addEventListener(
    "click",
    debounce((event) => {
      stationsVisible = !stationsVisible;
      // Toggle all station markers
      stations.forEach((station) => {
        if (station.marker) {
          if (stationsVisible) {
            station.marker.addTo(map);
          } else {
            map.removeLayer(station.marker);
          }
        }
      });
      // Sync the checkbox state
      syncCheckbox(event.target, stationsVisible);
    }, 300)
  );

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

  // Prevent double-click on legend from zooming the map
  document
    .getElementById("precipitation-legend-container")
    .addEventListener("dblclick", function (event) {
      event.stopPropagation();
    });

  document
    .getElementById("susceptibility-legend-container")
    .addEventListener("dblclick", function (event) {
      event.stopPropagation();
    });

  // Event delegation for image toggling
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("arrow")) {
      toggleImage(event);
    }
  });

  function enableImageSwipe() {
    document.querySelectorAll(".image-container").forEach((container) => {
      let startX = null;

      container.addEventListener("touchstart", function (e) {
        if (e.touches.length === 1) {
          startX = e.touches[0].clientX;
        }
      });

      container.addEventListener("touchend", function (e) {
        if (startX === null) return;
        const endX = e.changedTouches[0].clientX;
        const diffX = endX - startX;
        if (Math.abs(diffX) > 50) {
          // Minimum swipe distance
          // Swipe left: show next image, Swipe right: show previous image
          toggleImage({
            target: container.querySelector(
              diffX < 0 ? ".right-arrow" : ".left-arrow"
            ),
            stopPropagation: () => {},
          });
        }
        startX = null;
      });
    });
  }

  // Call this after popups are created or updated
  window.enableImageSwipe = enableImageSwipe;

  // After creating/updating a popup, call:
  enableImageSwipe();

  // Close sidebar when clicking outside of it
  document.addEventListener("click", (event) => {
    const sidebar = document.getElementById("sidebar");
    const hamburgerButton = document.getElementById("hamburger-button");
    if (
      !sidebar.contains(event.target) &&
      !hamburgerButton.contains(event.target) &&
      !sidebar.classList.contains("closed")
    ) {
      sidebar.classList.add("closed");
    }
  });

  // Event listener for zoom changes
  map.on("zoomend", () => {
    changeData(stations, getDataType(), map);
  });

  document
    .getElementById("sidebar-toggle")
    .addEventListener("click", toggleSidebarWithDelay);
  document
    .getElementById("hamburger-button")
    .addEventListener("click", toggleSidebarWithDelay);
}

// Function to get the color based on precipitation total
function getPrecipitationColor(rainTotalInches) {
  if (rainTotalInches <= 0.05) return "rgb(0, 236, 236, 0.9)"; // Cyan
  if (rainTotalInches <= 0.1) return "rgb(0, 200, 240, 0.9)"; // Light Blue
  if (rainTotalInches <= 0.15) return "rgb(0, 160, 255, 0.9)"; // Blue
  if (rainTotalInches <= 0.2) return "rgb(0, 60, 255, 0.9)"; // Dark Blue
  if (rainTotalInches <= 0.4) return "rgb(0, 255, 0, 0.9)"; // Light Green
  if (rainTotalInches <= 0.6) return "rgb(0, 220, 0, 0.9)"; // Green
  if (rainTotalInches <= 0.8) return "rgb(0, 153, 0, 0.9)"; // Dark Green
  if (rainTotalInches <= 1.0) return "rgb(0, 141, 0, 0.9)"; // Forest-Green
  if (rainTotalInches <= 1.25) return "rgb(255, 255, 0, 0.9)"; // Yellow
  if (rainTotalInches <= 1.5) return "rgb(240, 210, 0, 0.9)"; // Dark Yellow
  if (rainTotalInches <= 1.75) return "rgb(231, 180, 0, 0.9)"; // Gold
  if (rainTotalInches <= 2.0) return "rgb(200, 120, 0, 0.9)"; // Dark Brown
  if (rainTotalInches <= 2.5) return "rgb(255, 160, 160, 0.9)"; // Light Pink
  if (rainTotalInches <= 3.0) return "rgb(255, 60, 60, 0.9)"; // Dark Pink
  if (rainTotalInches <= 3.5) return "rgb(230, 0, 0, 0.9)"; // Red
  if (rainTotalInches <= 4.0) return "rgb(180, 0, 0, 0.9)"; // Dark Red
  if (rainTotalInches <= 4.5) return "rgb(250, 0, 255, 0.9)"; // Magenta
  if (rainTotalInches <= 5.0) return "rgb(217, 0, 217, 0.9)"; // Purple
  if (rainTotalInches <= 5.5) return "rgb(164, 0, 164, 0.9)"; // Dark Purple
  if (rainTotalInches <= 6.0) return "rgb(120, 0, 120, 0.9)"; // Violet
  if (rainTotalInches <= 6.5) return "rgb(255, 0, 255, 0.9)"; // White
  if (rainTotalInches <= 7.0) return "rgb(192, 192, 255, 0.9)"; // Dark Blue-Grey
  if (rainTotalInches <= 8.0) return "rgb(192, 255, 255, 0.9)"; // Sky Blue
  return "rgb(255, 255, 192)"; // Pale Yellow for above 8.00 inches
}

// Utility function to calculate icon size, anchor, and font size
function calculateIconProperties(map) {
  const zoomLevel = map.getZoom();
  const isSmallDevice = window.innerWidth <= 768;

  let iconSize, iconAnchor, fontSize;
  if (isSmallDevice) {
    iconSize = [20 + zoomLevel * 0.5, 20 + zoomLevel * 0.5];
    iconAnchor = [10 + zoomLevel * 0.25, 10 + zoomLevel * 0.25];
    fontSize = 10 + zoomLevel * 0.2 + "px";
  } else {
    iconSize = [50 + zoomLevel * 1.5, 50 + zoomLevel * 1.5];
    iconAnchor = [25 + zoomLevel * 1.1, 25 + zoomLevel * 1.1];
    fontSize = 24 + zoomLevel * 0.7 + "px";
  }

  return { iconSize, iconAnchor, fontSize };
}

function updateStationMarker(station, map, iconProps, dataType) {
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
  let isOutdated = false;

  // Format the timestamp if it exists
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

      // Check if the timestamp is older than 24 hours
      const now = new Date();
      const hoursDifference = (now - date) / (1000 * 60 * 60);
      if (hoursDifference > 24) {
        isOutdated = true;
      }
    }
  }

  const popupContent = `
    <div class="custom-popup-content">
      <div class="image-container">
        <div class="arrow left-arrow" onclick="toggleImage(event)">
          <img src="./files/svg/left-arrow.svg" alt="Left Arrow">
        </div>
        <a href="/files/network/plots/${
          station.plot_name
        }" target="_blank" class="image-link">
          <img id="image" src="/files/images/${station.name}.jpg" alt="${
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
        <div class="arrow right-arrow" onclick="toggleImage(event)">
          <img src="./files/svg/right-arrow.svg" alt="Right Arrow">
        </div>
      </div>
      <div class="info">
        <h2>${station.name.toUpperCase()}</h2>
        <ul>
          <li><strong>Last Updated:</strong> ${formattedTimestamp} AST</li>
          <li><strong>Soil Saturation:</strong> ${saturationPercentage}%</li>
          <li><strong>12 HRS Precipitation:</strong> ${rainTotalInches} inches</li>
        </ul>
        <a href="https://derrumbe.net/${
          station["url-name"]
        }" target="_blank" class="leaflet-popup-link">Click here for more details!</a>
      </div>
    </div>
    `;

  let backgroundColor;
  let value =
    dataType === "rainfall" ? rainTotalInches : saturationPercentage + "%";

  if (isOutdated || station.hasError) {
    backgroundColor = "rgb(169, 169, 169)";
    value = "N/A";
  } else if (dataType === "rainfall") {
    backgroundColor = getPrecipitationColor(rainTotalInches);
  } else if (dataType === "soilSaturation") {
    if (saturationPercentage >= 90) {
      backgroundColor = "rgb(0,28,104,0.9)";
    } else if (saturationPercentage >= 80) {
      backgroundColor = "rgba(0,179,255,0.9)";
    } else {
      backgroundColor = "rgb(175,152,0,0.9)";
    }
  }

  const iconHTML = `<div style="background-color: ${backgroundColor}; color: white; padding: 5px; border-radius: 5px; display: flex; flex-direction: column; text-align: center; justify-content: center; align-items: center; height: 100%;">
    <span style="font-size: ${iconProps.fontSize}; color: white;">
      ${value}
    </span>
    </div>`;

  if (!station.marker) {
    // Create marker if it doesn't exist
    station.marker = L.marker(station.coords, {
      icon: L.divIcon({
        className: "custom-div-icon",
        html: iconHTML,
        iconSize: iconProps.iconSize,
        iconAnchor: iconProps.iconAnchor,
      }),
    }).addTo(map);
    station.marker.bindPopup(popupContent);

    station.marker.on("popupopen", function () {
      const popupElement = station.marker.getPopup().getElement();
      if (popupElement) {
        const popupHeight = popupElement.offsetHeight;
        const offset = map.latLngToContainerPoint(station.marker.getLatLng());
        const newOffset = L.point(offset.x, offset.y - popupHeight / 1.5);
        const newLatLng = map.containerPointToLatLng(newOffset);
        map.setView(newLatLng, map.getZoom(), { animate: true, duration: 1.5 });
      }
    });
  } else {
    // Update marker if it exists
    station.marker.setIcon(
      L.divIcon({
        className: "custom-div-icon",
        html: iconHTML,
        iconSize: iconProps.iconSize,
        iconAnchor: iconProps.iconAnchor,
      })
    );
    station.marker.setPopupContent(popupContent);
  }
}

// Function for both initialization and update
function renderMarkers(stations, map, dataType) {
  const iconProps = calculateIconProperties(map);
  stations.forEach((station) => {
    updateStationMarker(station, map, iconProps, dataType);
  });
  return stations;
}

// Replace initializeMarkers and changeData with renderMarkers
async function initializeStations(map, dataType) {
  await processFiles();
  return renderMarkers(stations, map, dataType);
}

function changeData(stations, currentDataType, map) {
  renderMarkers(stations, map, currentDataType);
}
