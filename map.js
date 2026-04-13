const BUILDING_COORDS = [50.28862, 18.67750];
const INITIAL_ZOOM = 19;

const map = L.map("map", {
  zoomControl: true,
  scrollWheelZoom: true,
  doubleClickZoom: true,
  boxZoom: true,
  keyboard: true,
  dragging: true,
  touchZoom: true
}).setView(BUILDING_COORDS, INITIAL_ZOOM);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap",
  maxZoom: 22,
  maxNativeZoom: 19
}).addTo(map);

L.control.scale().addTo(map);

let indoorLayer = null;
const levelSelect = document.getElementById("level");

fetch("building.geojson")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Nie udało się wczytać building.geojson");
    }
    return response.json();
  })
  .then((data) => {
    console.log("GeoJSON wczytany:", data);

    renderLevel(data, levelSelect ? levelSelect.value : "0");

    if (levelSelect) {
      levelSelect.addEventListener("change", (e) => {
        renderLevel(data, e.target.value);
      });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  })
  .catch((error) => {
    console.error("Błąd:", error);

    L.marker(BUILDING_COORDS)
      .addTo(map)
      .bindPopup("Nie udało się wczytać building.geojson")
      .openPopup();
  });

function hasLevel(featureLevel, selectedLevel) {
  if (featureLevel === undefined || featureLevel === null) return false;

  const levels = String(featureLevel)
    .split(";")
    .map((s) => s.trim());

  return levels.includes(String(selectedLevel));
}

function renderLevel(data, selectedLevel) {
  if (indoorLayer) {
    map.removeLayer(indoorLayer);
  }

  indoorLayer = L.geoJSON(data, {
    filter: (feature) => {
      const p = feature.properties || {};

      const isIndoor =
        p.indoor === "room" ||
        p.indoor === "area" ||
        p.indoor === "corridor";

      if (!isIndoor) return false;

      return hasLevel(p.level, selectedLevel);
    },

    style: (feature) => {
      const p = feature.properties || {};

      if (p.indoor === "corridor") {
        return {
          weight: 1,
          opacity: 1,
          fillOpacity: 0.25
        };
      }

      return {
        weight: 1,
        opacity: 1,
        fillOpacity: 0.55
      };
    },

    onEachFeature: (feature, layer) => {
      const p = feature.properties || {};
      const title = p.name || p.ref || "Pomieszczenie";
      const lvl = p.level || "brak";

      layer.bindPopup(`<strong>${title}</strong><br>Poziom: ${lvl}`);
    }
  }).addTo(map);

  const bounds = indoorLayer.getBounds();
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [20, 20] });
  } else {
    map.setView(BUILDING_COORDS, INITIAL_ZOOM);
  }
}