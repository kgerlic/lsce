// ===============================
// Ustawienia początkowe
// ===============================

const BUILDING_COORDS = [50.2920, 18.6766];
const INITIAL_ZOOM = 18;

// Przykładowe dane pomieszczeń.
// Na razie ręczne, później można je zastąpić danymi z OSM / GeoJSON.
const rooms = [
  {
    name: "Aula B",
    level: "1",
    coords: [50.29203, 18.67656],
    description: "Sala wykładowa"
  },
  {
    name: "Aula C",
    level: "1",
    coords: [50.29201, 18.67662],
    description: "Sala wykładowa"
  },
  {
    name: "Sala 16",
    level: "1",
    coords: [50.29198, 18.67668],
    description: "Sala dydaktyczna"
  },
  {
    name: "Sala 17",
    level: "1",
    coords: [50.29196, 18.67672],
    description: "Sala dydaktyczna"
  }
];

// ===============================
// Inicjalizacja mapy
// ===============================

const map = L.map("map").setView(BUILDING_COORDS, INITIAL_ZOOM);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap"
}).addTo(map);

// Warstwa dla znaczników pomieszczeń
const roomLayer = L.layerGroup().addTo(map);

// Znacznik budynku
const buildingMarker = L.marker(BUILDING_COORDS)
  .addTo(map)
  .bindPopup("<strong>Akademicka 10</strong><br>Gliwice");

// ===============================
// Elementy interfejsu
// ===============================

const levelSelect = document.getElementById("level");
const searchInput = document.getElementById("search");

// ===============================
// Funkcje
// ===============================

function renderRooms() {
  roomLayer.clearLayers();

  const selectedLevel = levelSelect ? levelSelect.value : "1";
  const searchValue = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const visibleRooms = rooms.filter((room) => {
    const matchesLevel = room.level === selectedLevel;
    const matchesSearch =
      searchValue === "" || room.name.toLowerCase().includes(searchValue);

    return matchesLevel && matchesSearch;
  });

  visibleRooms.forEach((room) => {
    const marker = L.circleMarker(room.coords, {
      radius: 8,
      weight: 2,
      fillOpacity: 0.7
    });

    marker.bindPopup(
      `<strong>${room.name}</strong><br>Piętro: ${room.level}<br>${room.description}`
    );

    marker.addTo(roomLayer);
  });

  // Jeśli nic nie znaleziono, wróć do widoku budynku
  if (visibleRooms.length === 0) {
    map.setView(BUILDING_COORDS, INITIAL_ZOOM);
    return;
  }

  // Dopasowanie widoku do widocznych punktów
  const bounds = L.latLngBounds(visibleRooms.map((room) => room.coords));
  map.fitBounds(bounds, { padding: [40, 40] });
}

function focusRoomByName(name) {
  const room = rooms.find((r) => r.name.toLowerCase() === name.toLowerCase());
  if (!room) return;

  if (levelSelect) {
    levelSelect.value = room.level;
  }

  renderRooms();

  map.setView(room.coords, 20);
}

function initMapUI() {
  if (levelSelect) {
    levelSelect.addEventListener("change", renderRooms);
  }

  if (searchInput) {
    searchInput.addEventListener("input", renderRooms);

    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const value = searchInput.value.trim();
        if (value !== "") {
          focusRoomByName(value);
        }
      }
    });
  }
}

// ===============================
// Start
// ===============================

initMapUI();
renderRooms();