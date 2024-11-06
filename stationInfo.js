/**
 * Station information for various monitoring stations.
 * Each station object contains details such as name, coordinates, soil and geologic units, and more.
 * The "url-name" property is used for the website links.
 */

var stations = [
  {
    name: "adjuntas",
    "url-name": "adjuntas",
    display_name: "Adjuntas",
    coords: [18.147, -66.765],
    vwc_max: 0.521,
    geologicUnit: "Yauco Formation",
    soilUnit: "Los Guineos Clay",
    elevation: "1020m",
    slope: "45°",
    landslideSusceptibility: "Very High",
    sensorDepths: "20cm, 40cm, 60cm, 80cm",
    dateInstalled: "Mar-2022",
    collaborator: "Departamento de Recursos Naturales y Ambientales",
    plot_name: "Adjuntas.jpeg"
  },
  {
    name: "anasco",
    "url-name": "anasco",
    display_name: "Añasco",
    coords: [18.294, -67.051],
    vwc_max: 0.5,
    geologicUnit: "Río Blanco Fm.",
    soilUnit: "Consumo Clay",
    elevation: "185m",
    slope: "35°",
    landslideSusceptibility: "Very High",
    sensorDepths: "25cm, 50cm, 75cm, 100cm",
    dateInstalled: "Sep-2023",
    collaborator: "Private Landowner",
    plot_name: "Anasco.jpeg"
  },
  {
    name: "barranquitas",
    "url-name": "barranquitas",
    display_name: "Barranquitas",
    coords: [18.166, -66.300],
    vwc_max: 0.263,
    geologicUnit: "Robles Formation",
    soilUnit: "Caguabo Clay Loam",
    elevation: "540m",
    slope: "45°",
    landslideSusceptibility: "Very High",
    sensorDepths: "25cm, 53cm, 82cm, 100cm",
    dateInstalled: "Feb-2022",
    collaborator: "Para la Naturaleza",
    plot_name: "Barranquitas.jpeg"
  },
  {
    name: "cayey",
    "url-name": "cayey",
    display_name: "Cayey",
    coords: [18.109, -66.151],
    vwc_max: 0.492,
    geologicUnit: "Formation A",
    soilUnit: "Mucara Clay",
    elevation: "480m",
    slope: "35°",
    landslideSusceptibility: "High",
    sensorDepths: "21cm, 42cm, 63cm, 84cm",
    dateInstalled: "Dec-2021",
    collaborator: "USGS Geomagnetic Observatory",
    plot_name: "Cayey.jpeg"
  },
  {
    name: "ciales",
    "url-name": "ciales",
    display_name: "Ciales",
    coords: [18.312, -66.469],
    vwc_max: 0.475,
    geologicUnit: "Rio Orocovis Formation, Avispa Lava Member",
    soilUnit: "Mucara Clay",
    elevation: "310m",
    slope: "30°",
    landslideSusceptibility: "Very High",
    sensorDepths: "22.5cm, 45cm, 67.5cm, 90cm",
    dateInstalled: "Feb-2022",
    collaborator: "Private Landowner",
    plot_name: "Ciales.jpeg"
  },
  {
    name: "lares",
    "url-name": "lares",
    display_name: "Lares",
    coords: [18.248, -66.881],
    vwc_max: 0.495,
    geologicUnit: "Milagros Formation Breccia Member",
    soilUnit: "Morado Clay Loam",
    elevation: "250m",
    slope: "35°",
    landslideSusceptibility: "Very High",
    sensorDepths: "22cm, 44cm, 66cm, 88cm",
    dateInstalled: "Mar-2022",
    collaborator: "Private Landowner",
    plot_name: "Lares.jpeg"
  },
  {
    name: "maricao",
    "url-name": "maricao",
    display_name: "Maricao",
    coords: [18.174, -67.031],
    vwc_max: 0.447,
    geologicUnit: "Porphyritic Hornblende Diorite",
    soilUnit: "Mucara Clay",
    elevation: "400m",
    slope: "40°",
    landslideSusceptibility: "Very High",
    sensorDepths: "33cm, 66cm, 99cm, 130cm",
    dateInstalled: "Dec-2022",
    collaborator: "Private Landowner",
    plot_name: "Maricao.jpeg"
  },
  {
    name: "maunabo",
    "url-name": "maunabo",
    display_name: "Maunabo",
    coords: [18.035, -65.910],
    vwc_max: 0.372,
    geologicUnit: "San Lorenzo Granodiorite",
    soilUnit: "Pandura Very Stony Land Complex",
    elevation: "350m",
    slope: "35°",
    landslideSusceptibility: "Very High",
    sensorDepths: "27.5cm, 55cm, 77.5cm, 110cm",
    dateInstalled: "Feb-2022",
    collaborator: "Para la Naturaleza",
    plot_name: "Maunabo.jpeg"
  },
  {
    name: "mayaguez",
    "url-name": "mayaguez",
    display_name: "Mayagüez",
    coords: [18.220, -67.144],
    vwc_max: 0.45,
    geologicUnit: "Maricao Formation",
    soilUnit: "Mucara Clay",
    elevation: "33m",
    slope: "40°",
    landslideSusceptibility: "Very High",
    sensorDepths: "20cm, 40cm, 60cm, 80cm",
    dateInstalled: "Mar-2022",
    collaborator: "UPR Mayagüez",
    plot_name: "Mayaguez.jpeg"
  },
  {
    name: "naguabo",
    "url-name": "naguabo",
    display_name: "Naguabo",
    coords: [18.255, -65.794],
    vwc_max: 0.439,
    geologicUnit: "Rio Blanco Quartz Diorite",
    soilUnit: "Pandura Loam",
    elevation: "370m",
    slope: "40°",
    landslideSusceptibility: "Very High",
    sensorDepths: "25cm, 50cm, 75cm, 100cm",
    dateInstalled: "July-2022",
    collaborator: "Private Landowner",
    plot_name: "Naguabo.jpeg"
  },
  {
    name: "naranjito",
    "url-name": "naranjito",
    display_name: "Naranjito",
    coords: [18.296, -66.246],
    vwc_max: 0.424,
    geologicUnit: "Rio Orocovis Group, Los Negros Formation",
    soilUnit: "Mucara Clay",
    elevation: "300m",
    slope: "45°",
    landslideSusceptibility: "Very High",
    sensorDepths: "25cm, 50cm, 75cm, 100cm",
    dateInstalled: "August-2022",
    collaborator: "Municipio de Naranjito",
    plot_name: "Naranjito.jpeg"
  },
  {
    name: "orocovis",
    "url-name": "orocovis",
    display_name: "Orocovis",
    coords: [18.177, -66.415],
    vwc_max: 0.479,
    geologicUnit: "TBA",
    soilUnit: "TBA",
    elevation: "TBA",
    slope: "TBA",
    landslideSusceptibility: "TBA",
    sensorDepths: "25cm, 50cm, 75cm, 100cm",
    dateInstalled: "Apr-2024",
    collaborator: "Private Collaborator",
    plot_name: "Orocovis.jpeg"
  },
  {
    name: "ponce",
    "url-name": "ponce",
    display_name: "Ponce",
    coords: [18.083, -66.660],
    vwc_max: 0.434,
    geologicUnit: "Lago Garzas Formation",
    soilUnit: "Caguabo Gravelly Clay Loam",
    elevation: "330m",
    slope: "35°",
    landslideSusceptibility: "Very High",
    sensorDepths: "25cm, 50cm, 75cm, 100cm",
    dateInstalled: "March-2023",
    collaborator: "Para la Naturaleza",
    plot_name: "Ponce.jpeg"
  },
  {
    name: "sanlorenzo",
    "url-name": "san-lorenzo",
    display_name: "San Lorenzo",
    coords: [18.089, -66.002],
    vwc_max: 0.485,
    geologicUnit: "Formation A",
    soilUnit: "Los Guineos Clay",
    elevation: "420m",
    slope: "35°",
    landslideSusceptibility: "High",
    sensorDepths: "17.5cm, 35cm, 52.5cm, 70cm",
    dateInstalled: "Feb-2022",
    collaborator: "Para la Naturaleza",
    plot_name: "San_Lorenzo.jpeg"
  },
  {
    name: "toronegro",
    "url-name": "toro-negro",
    display_name: "Toro Negro",
    coords: [18.158, -66.565],
    vwc_max: 0.483,
    geologicUnit: "Achiote Conglomerate",
    soilUnit: "Los Guineos - Maricao Association",
    elevation: "1200m",
    slope: "45°",
    landslideSusceptibility: "Very High",
    sensorDepths: "30cm, 50cm, 90cm, 100cm",
    dateInstalled: "2018",
    collaborator: "Departamento de Recursos Naturales e Ambientales",
    plot_name: "Toro_Negro.jpeg"
  },
  {
    name: "utuado",
    "url-name": "utuado",
    display_name: "Utuado",
    coords: [18.280, -66.661],
    vwc_max: 0.45,
    geologicUnit: "Utuado Granodiorite",
    soilUnit: "Pellejas Clay Loam",
    elevation: "500m",
    slope: "40°",
    landslideSusceptibility: "Very High",
    sensorDepths: "27cm, 42cm, 57cm, 72cm",
    dateInstalled: "2018",
    collaborator: "Private Landowner",
    plot_name: "Utuado.jpeg"
  },
  {
    name: "yabucoa",
    "url-name": "yabucoa",
    display_name: "Yabucoa",
    coords: [18.110, -65.856],
    vwc_max: 0.372,
    geologicUnit: "San Lorenzo Granodiorite",
    soilUnit: "Pandura Loam",
    elevation: "260m",
    slope: "##°",
    landslideSusceptibility: "Very High",
    sensorDepths: "25cm, 50cm, 75cm, 100cm",
    dateInstalled: "Dec-2023",
    collaborator: "Private Landowner",
    plot_name: "Yabucoa.jpeg"
  },
  {
    name: "yauco",
    "url-name": "yauco",
    display_name: "Yauco",
    coords: [18.139, -66.881],
    vwc_max: 0.492,
    geologicUnit: "Yauco Mudstone",
    soilUnit: "Maricao Clay",
    elevation: "770m",
    slope: "45°",
    landslideSusceptibility: "Very High",
    sensorDepths: "25cm, 50cm, 75cm, 100cm",
    dateInstalled: "Jan-2023",
    collaborator: "Private Landowner",
    plot_name: "Yauco.jpeg"
  }
];

export { stations };