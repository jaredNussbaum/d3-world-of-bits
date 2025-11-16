// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css"; // student-controlled page style

// Fix missing marker images
import "./_leafletWorkaround.ts"; // fixes for missing Leaflet images

// Import our luck function
import luck from "./_luck.ts";

// Create basic UI elements

const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
document.body.append(controlPanelDiv);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);
const RANGE = 6;
// Our classroom location
const PLAYER_POS = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);

// Tunable gameplay parameters
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 25;
const CACHE_SPAWN_PROBABILITY = 0.1;

// Create the map (element with id "map" is defined in index.html)
const map = leaflet.map(mapDiv, {
  center: PLAYER_POS,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Populate the map with a background tile layer
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

// Add a marker to represent the player
const playerMarker = leaflet.marker(PLAYER_POS);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

// Display the player's points
let current_num = 0;
set_current_held_points(0);

function spawnCache(i: number, j: number) {
  // Convert cell numbers into lat/lng bounds
  const origin = PLAYER_POS;
  const bounds = leaflet.latLngBounds([
    [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
    [origin.lat + (i + 1) * TILE_DEGREES, origin.lng + (j + 1) * TILE_DEGREES],
  ]);

  let cachePoints = Math.pow(
    2,
    Math.floor(luck([i, j, "initialValue"].toString()) * 4),
  );

  // Add a rectangle to the map to represent the cache
  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);

  // Display text on the cache
  const tooltip = leaflet.tooltip({ permanent: true, direction: "center" })
    .setContent(cachePoints.toString());
  rect.bindTooltip(tooltip);

  // Click mouseevent
  rect.on("click", () => {
    if (distance_to(i, j) <= RANGE) {
      if (current_num == 0) {
        set_current_held_points(cachePoints);
        rect.remove();
      } else {
        if (current_num == cachePoints) {
          cachePoints *= 2;
          tooltip.setContent(cachePoints.toString());
          set_current_held_points(0);
        } else {
          set_current_held_points(0);
        }
      }
    }
  });
}
function set_current_held_points(x: number) {
  current_num = x;
  if (current_num == 0) {
    statusPanelDiv.innerHTML = "Currently Holding Nothing";
    current_num = 0;
    return;
  }
  statusPanelDiv.innerHTML = "Currently Holding: " + current_num;
}
function distance_to(i: number, j: number) {
  return Math.sqrt((i ** 2) + (j ** 2));
}

// Look around the player's neighborhood for caches to spawn
for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    // If location i,j is lucky enough, spawn a cache!
    if (luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY) {
      spawnCache(i, j);
    }
  }
}
