import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";
import "./style.css";

// Interfaces
interface Point {
  x: number;
  y: number;
}

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

const buttonPanelDiv = document.createElement("div");
buttonPanelDiv.id = "buttonPanel";
document.body.append(buttonPanelDiv);

// Our classroom location
const CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);

// Tunable gameplay parameters
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 25;
const CACHE_SPAWN_PROBABILITY = 0.1;
const RANGE = 4;

// Create the map (element with id "map" is defined in index.html)
const map = leaflet.map(mapDiv, {
  center: CLASSROOM_LATLNG,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

map.on("moveend", () => {
  generateCells();
});

// Populate the map with a background tile layer
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

const rectangleGroup = leaflet.layerGroup()
  .addTo(map);

let playerMarker = leaflet.marker(CLASSROOM_LATLNG);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

let playerPoints = 0;
statusPanelDiv.innerHTML = "No points yet...";

const playerPosition = CLASSROOM_LATLNG;

// Add caches to the map by cell numbers
function spawnCache(i: number, j: number) {
  // Convert cell numbers into lat/lng bounds
  const bounds = leaflet.latLngBounds([
    pointIndexToCoord({ x: i, y: j }),
    pointIndexToCoord({ x: i + 1, y: j + 1 }),
  ]);

  let cachePoints = Math.pow(
    2,
    Math.floor(luck([i, j, "initialValue"].toString()) * 4),
  );

  // Add a rectangle to the map to represent the cache
  const rect = leaflet.rectangle(bounds);
  rect.addTo(rectangleGroup);

  // Display text on the cache
  const tooltip = leaflet.tooltip({ permanent: true, direction: "center" })
    .setContent(cachePoints.toString());
  rect.bindTooltip(tooltip);

  rect.on("click", () => {
    if (distance_to_player(i, j) >= RANGE) return;
    if (playerPoints == 0) {
      playerPoints = cachePoints;
      rect.remove();
      statusPanelDiv.innerHTML = `You are carrying: ${playerPoints}`;
    } else if (playerPoints == cachePoints) {
      cachePoints *= 2;
      playerPoints = 0;
      statusPanelDiv.innerHTML = `Merged!`;
      check_game_won(cachePoints);
    }
    tooltip.setContent(cachePoints.toString());
  });
}

generateCells();

function generateCells() {
  rectangleGroup.clearLayers();
  const mapCenter = pointCoordToIndex(map.getCenter());
  for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
    for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
      const x = mapCenter.x + i;
      const y = mapCenter.y + j;
      if (luck([x, y].toString()) < CACHE_SPAWN_PROBABILITY) {
        spawnCache(x, y);
      }
    }
  }
}

function distance_to_player(i: number, j: number) {
  const playerPoint = pointCoordToIndex(playerPosition);
  const dx = i - playerPoint.x;
  const dy = j - playerPoint.y;
  return Math.sqrt((dx ** 2) + (dy ** 2));
}

function indexToCoord(i: number) {
  return i * TILE_DEGREES;
}

function coordToIndex(c: number) {
  return Math.floor(c / TILE_DEGREES);
}

function pointIndexToCoord(p: Point): leaflet.LatLng {
  return leaflet.latLng(indexToCoord(p.x), indexToCoord(p.y));
}

function pointCoordToIndex(ll: leaflet.LatLng): Point {
  return { x: coordToIndex(ll.lat), y: coordToIndex(ll.lng) };
}

function check_game_won(just_made: number) {
  if (just_made >= 32) {
    statusPanelDiv.innerHTML = "You won!! Great job making " + just_made;
  }
}

// USE DIRECTION CONSTANTS FOR dir TO MOVE PLAYER
function move_player(dir: Point) {
  playerPosition.lat += indexToCoord(dir.y);
  playerPosition.lng += indexToCoord(dir.x);
  playerMarker.remove();
  playerMarker = leaflet.marker(playerPosition);
  playerMarker.bindTooltip("That's you!");
  playerMarker.addTo(map);
}
// DIRECTIONAL CONSTANTS
const DIRECTION_RIGHT: Point = {
  x: 1,
  y: 0,
};
const DIRECTION_LEFT: Point = {
  x: -1,
  y: 0,
};
const DIRECTION_UP: Point = {
  x: 0,
  y: 1,
};
const DIRECTION_DOWN: Point = {
  x: 0,
  y: -1,
};

// Buttons synced to player movement
const LEFT = document.createElement("button");
LEFT.innerHTML = "MOVE: Left";
LEFT.addEventListener("click", () => {
  move_player(DIRECTION_LEFT);
});

const RIGHT = document.createElement("button");
RIGHT.innerHTML = "MOVE: Right";
RIGHT.addEventListener("click", () => {
  move_player(DIRECTION_RIGHT);
});

const UP = document.createElement("button");
UP.innerHTML = "MOVE: Up";
UP.addEventListener("click", () => {
  move_player(DIRECTION_UP);
});

const DOWN = document.createElement("button");
DOWN.innerHTML = "MOVE: Down";
DOWN.addEventListener("click", () => {
  move_player(DIRECTION_DOWN);
});
buttonPanelDiv.appendChild(LEFT);
buttonPanelDiv.appendChild(RIGHT);
buttonPanelDiv.appendChild(UP);
buttonPanelDiv.appendChild(DOWN);
