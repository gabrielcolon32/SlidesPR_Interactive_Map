document.addEventListener('DOMContentLoaded', function() {
  var map = L.map('map', {
    center: [18.220833, -66.290149], // Centered on Puerto Rico
    zoom: 10,
    maxBounds: [[17.9, -68.0], [18.6, -65.0]], // Limits the map view to Puerto Rico area
    minZoom: 10, // Prevents zooming out too far
    maxZoom: 18, // Limits how much the user can zoom in
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Image overlays
  var imageBounds = [[17.9, -66.3], [18.6, -65.8]];
  var images = {
    image1: L.imageOverlay('url_to_your_image1.jpg', imageBounds),
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
  });

  // Updated stations with new names and coordinates
  var stations = [
    { name: "Adjuntas", coords: [18.1629, -66.7231] },
    { name: "Añasco", coords: [18.2844, -67.1424] },
    { name: "Barranquitas", coords: [18.1886, -66.3071] },
    { name: "Cayey", coords: [18.1110, -66.1660] },
    { name: "Ciales", coords: [18.3367, -66.4682] },
    { name: "Lares", coords: [18.2958, -66.8782] },
    { name: "Maricao", coords: [18.1823, -66.9818] },
    { name: "Maunabo", coords: [18.0086, -65.9011] },
    { name: "Mayagüez", coords: [18.2013, -67.1397] },
    { name: "Naguabo", coords: [18.2113, -65.7358] },
    { name: "Naranjito", coords: [18.3000, -66.2500] },
    { name: "Orocovis", coords: [18.2300, -66.3883] },
    { name: "Ponce", coords: [18.0111, -66.6141] },
    { name: "San Lorenzo", coords: [18.1897, -65.9721] },
    { name: "Toro Negro", coords: [18.1723, -66.4950] },
    { name: "Utuado", coords: [18.2681, -66.7005] },
    { name: "Yabucoa", coords: [18.0519, -65.8802] },
    { name: "Yauco", coords: [18.0340, -66.8497] }
  ];

  stations.forEach(function(station) {
    var marker = L.marker(station.coords).addTo(map);
    var popupContent = `
      <b>${station.name}</b><br>
      Soil Saturation: <br>
      Rainfall Last 24hrs: <br>
      Geologic Unit: <br>
      Soil Unit: <br>
      Elevation: <br>
      Slope: <br>
      Landslide Susceptibility: <br>
      Date Installed: <br>
    `;
    marker.bindPopup(popupContent);
  
    // Function to determine if the device is touch-capable
    function isTouchDevice() {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    }
  
    if (isTouchDevice()) {
      // For touch devices, use click to toggle popups
      marker.on('click', function(e) {
        if (this.getPopup().isOpen()) {
          this.closePopup();
        } else {
          this.openPopup();
        }
      });
    } else {
      // For non-touch devices, use mouseover to open and mouseout to close popups
      marker.on('mouseover', function(e) {
        this.openPopup();
      });
      marker.on('mouseout', function(e) {
        this.closePopup();
      });
      } 
  });
});