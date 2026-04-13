const BUILDING_COORDS = [50.28862, 18.67750];
const INITIAL_ZOOM = 19;
const LABEL_MIN_ZOOM = 20;

let indoorLayer = null;
let labelLayer = null;
let buildingData = null;

const customData = {
  "Aula C": {
    label: "Aula C – Sesja plenarna",
    info: "10:00–12:00"
  },
  "16": {
    label: "Sala 16 – Warsztaty",
    info: "grupa A"
  }
};

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

const levelSelect = document.getElementById("level");

fetch("building.geojson")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Nie udało się wczytać building.geojson");
    }
    return response.json();
  })
  .then((data) => {
    buildingData = data;

    renderLevel(buildingData, levelSelect ? levelSelect.value : "0", true);

    if (levelSelect) {
      levelSelect.addEventListener("change", (e) => {
        renderLevel(buildingData, e.target.value, true);
      });
    }

    map.on("zoomend", () => {
      if (buildingData) {
        renderLevel(buildingData, levelSelect ? levelSelect.value : "0", false);
      }
    });

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
  if (featureLevel === undefined || featureLevel === null) {
    return false;
  }

  const levels = String(featureLevel)
    .split(";")
    .map((s) => s.trim());

  return levels.includes(String(selectedLevel));
}

function renderLevel(data, selectedLevel, shouldFitBounds = false) {
  if (indoorLayer) {
    map.removeLayer(indoorLayer);
  }

  if (labelLayer) {
    map.removeLayer(labelLayer);
  }

  labelLayer = L.layerGroup();

  const showLabels = map.getZoom() >= LABEL_MIN_ZOOM;

  indoorLayer = L.geoJSON(data, {
    filter: (feature) => {
      const p = feature.properties || {};

      const isIndoor =
        p.indoor === "room" ||
        p.indoor === "area" ||
        p.indoor === "corridor";

      if (!isIndoor) {
        return false;
      }

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
      const originalName = p.name || p.ref || "Pomieszczenie";
      const lvl = p.level || "brak";

      const custom = customData[originalName];
      const title = custom?.label || originalName;
      const extra = custom?.info || "";

      layer.bindPopup(`
        <strong>${title}</strong><br>
        Poziom: ${lvl}
        ${extra ? `<br>${extra}` : ""}
      `);

      if (showLabels) {
        const labelText = p.ref || p.name || "";

        if (labelText && typeof layer.getBounds === "function") {
          const bounds = layer.getBounds();

          if (bounds.isValid()) {
            const center = bounds.getCenter();

            const label = L.marker(center, {
              icon: L.divIcon({
                className: "room-label",
                html: `<span>${labelText}</span>`,
                iconSize: null
              }),
              interactive: false
            });

            labelLayer.addLayer(label);
          }
        }
      }
    }
  }).addTo(map);

  labelLayer.addTo(map);

  if (shouldFitBounds) {
    const bounds = indoorLayer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    } else {
      map.setView(BUILDING_COORDS, INITIAL_ZOOM);
    }
  }
}


map.locate({ setView: true, maxZoom: 19 });

map.on("locationfound", (e) => {
  const radius = e.accuracy;

  L.marker(e.latlng)
    .addTo(map)
    .bindPopup("Tu jesteś (dokładność: " + Math.round(radius) + " m)")
    .openPopup();

  L.circle(e.latlng, radius).addTo(map);
});

map.on("locationerror", () => {
  alert("Nie udało się pobrać lokalizacji.");
});