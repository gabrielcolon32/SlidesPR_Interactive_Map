import stationData from './stationData.js';

document.addEventListener("DOMContentLoaded", function () {
  
  // Function to initialize the Leaflet map
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
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

// Image overlays
var imageBounds = [[18.0, -67.0], [18.5, -65.5]]; 
var images = {
  image1: L.imageOverlay('susceptibility_map_draft.jpg', imageBounds),
  image2: L.imageOverlay('url_to_your_image2.jpg', imageBounds),
  image3: L.imageOverlay('url_to_your_image3.jpg', imageBounds)
};

  // Handle dropdown change to switch image overlays
  document.getElementById('layerSelect').addEventListener('change', function(e) {
    var selectedImage = e.target.value;
    // Remove all images
    Object.values(images).forEach(function(image) {
      map.removeLayer(image);
    });
    // Add the selected image
    images[selectedImage].addTo(map);
    console.log(selectedImage);
  });

  // Updated stations with new names and coordinates
  var stations = [
    { name: "Adjuntas", coords: [18.1629, -66.7231] },
    { name: "Añasco", coords: [18.2844, -67.1424] },
    { name: "Barranquitas", coords: [18.1886, -66.3071] },
    { name: "Cayey", coords: [18.111, -66.166] },
    { name: "Ciales", coords: [18.3367, -66.4682] },
    { name: "Lares", coords: [18.2958, -66.8782] },
    { name: "Maricao", coords: [18.1823, -66.9818] },
    { name: "Maunabo", coords: [18.0086, -65.9011] },
    { name: "Mayagüez", coords: [18.2013, -67.1397] },
    { name: "Naguabo", coords: [18.2113, -65.7358] },
    { name: "Naranjito", coords: [18.3, -66.25] },
    { name: "Orocovis", coords: [18.23, -66.3883] },
    { name: "Ponce", coords: [18.0111, -66.6141] },
    { name: "San Lorenzo", coords: [18.1897, -65.9721] },
    { name: "Toro Negro", coords: [18.1723, -66.495] },
    { name: "Utuado", coords: [18.2681, -66.7005] },
    { name: "Yabucoa", coords: [18.0919, -65.8802] },
    { name: "Yauco", coords: [18.034, -66.8497] },
  ];

  // Check if the device is a touch device
  function isTouchDevice() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }

  // Function to initialize markers and handle interactions
  function initializeMarkers(map, dataType) {
    stations.forEach(function (station) {
      var customIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style='background-color: rgba(117, 92, 12, 0.6); padding: 5px; border-radius: 5px; text-align: center; display: flex; justify-content: center; align-items: center; height: 100%;'>
          <span style='font-size: 24px;'>
            ${stationData[station.name][dataType]}
          </span>
          ${dataType === "rainfall" ? " mm" : ""}
        </div>`,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
      });

      var marker = L.marker(station.coords, { icon: customIcon }).addTo(map);
      var popupContent = `<b>${station.name}</b><br>${dataType}: ${stationData[station.name][dataType]}<br>Date Installed: ${stationData[station.name].dateInstalled}<br>`;
      marker.bindPopup(popupContent);

      marker.on("click", function () {
        this.openPopup();
      });

      if (isTouchDevice()) {
        // For touch devices, use click to toggle popups
        marker.on("click", function(e) {
          if (this.getPopup().isOpen()) {
            this.closePopup();
          } else {
            this.openPopup();
          }
        });
      } else {
        // For non-touch devices, use mouseover to open and mouseout to close popups
        marker.on("mouseover", function(e) {
          this.openPopup();
        });
        marker.on("mouseout", function(e) {
          this.closePopup();
        });
      }

      station.marker = marker;
    });

    return stations;
  }

  // Function to handle data switching
  function changeData(stations, dataType) {
    stations.forEach(function (station) {
      var marker = station.marker;
      var popupContent = `<b>${station.name}</b><br>${dataType}: ${stationData[station.name][dataType]}<br>Date Installed: ${stationData[station.name].dateInstalled}<br>`;
      marker.setPopupContent(popupContent);

      var newIconHTML = `<div style='background-color: rgba(117, 92, 12, 0.6); padding: 5px; border-radius: 5px; text-align: center; display: flex; justify-content: center; align-items: center; height: 100%;'>
        <span style='font-size: 24px;'>${stationData[station.name][dataType]}</span>${dataType === "rainfall" ? " mm" : ""}
      </div>`;

      marker.setIcon(L.divIcon({
        className: "custom-div-icon",
        html: newIconHTML,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
      }));
    });
  }

  // Main initialization function
  function initialize() {
    var map = initializeMap();
    var stations = initializeMarkers(map, "rainfall");

    // Event listeners for data switching buttons
    document.getElementById("rainfall-button").addEventListener("click", function () {
      changeData(stations, "rainfall");
    });

    document.getElementById("soilSaturation-button").addEventListener("click", function () {
      changeData(stations, "soilSaturation");
    });

    document.getElementById("landslide-button").addEventListener("click", function () {
      changeData(stations, "landslideSusceptibility");
    });
  }

  // Initialize the map and markers
  initialize();
});