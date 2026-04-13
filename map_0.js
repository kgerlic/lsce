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

L.marker(BUILDING_COORDS)
  .addTo(map)
  .bindPopup("Akademicka 10, Gliwice")
  .openPopup();

L.control.scale().addTo(map);

setTimeout(() => {
  map.invalidateSize();
}, 300);


filter: (feature) => {
  const p = feature.properties || {};

  if (!p.level) return false;

  const levels = String(p.level).split(";");

  return (
    (p.indoor === "room" || p.indoor === "area" || p.indoor === "corridor") &&
    levels.includes(String(selectedLevel))
  );
}