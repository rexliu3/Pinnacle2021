// Copyright 2021 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Loader } from "@googlemaps/js-api-loader";
import axios from "axios";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";

/*const firebaseApp = initializeApp({
  apiKey: "AIzaSyCUvjvEYUfKivJPJ8xS6inRXlHW4pW0HfA",
  authDomain: "pinnacle2021v2.firebaseapp.com",
  projectId: "pinnacle2021v2",
  storageBucket: "pinnacle2021v2.appspot.com",
  messagingSenderId: "347442946979",
  appId: "1:347442946979:web:a12be8ec3003ec7cb9f016",
  measurementId: "G-9FL3CCBLF5",
});*/

const firebaseApp = initializeApp({
  apiKey: "AIzaSyDtxnvVm5xzuZnK8Xco7HliIEEbJ7AH78k",
  authDomain: "pinnacle2021v7.firebaseapp.com",
  projectId: "pinnacle2021v7",
  storageBucket: "pinnacle2021v7.appspot.com",
  messagingSenderId: "775863602352",
  appId: "1:775863602352:web:7bd0ca25c090262b2c7f75",
  measurementId: "G-ZHX7TCR4H0"
})


const apiOptions = {
  apiKey: "AIzaSyA3ACCckrmeyEyl2ZUw72B3dU3UGlCuQCE",
  version: "beta",
  map_ids: ["56e39613eced90d4"],
  libraries: ["visualization", "places"],
};

const mapOptions = {
  tilt: 40,
  heading: 0,
  zoom: 18,
  center: { lat: 34.074949, lng: -118.441318 },
  mapId: "56e39613eced90d4",
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: true,
  rotateControl: true,
  fullscreenControl: true,
};

var svgMarker;
var symbol;
var polyline;
var image;

var querySnapshot;
var map, heatmap;
var gotData = false;
var createdMarkers = false;
var showingMarkers = false;
var showingHeatmap = false;
var markers = [];

// <--- Helper Functions
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const adjustMap = function (mode, amount) {
  switch (mode) {
    case "tilt":
      map.setTilt(map.getTilt() + amount);
      break;
    case "rotate":
      map.setHeading(map.getHeading() + amount);
      break;
    default:
      break;
  }
};
// End of Helper Functions --->

function setGradient() {
  const gradient = [
    "rgba(0, 255, 255, 0)",
    "rgba(0, 255, 255, 1)",
    "rgba(0, 191, 255, 1)",
    "rgba(0, 127, 255, 1)",
    "rgba(0, 63, 255, 1)",
    "rgba(0, 0, 255, 1)",
    "rgba(0, 0, 223, 1)",
    "rgba(0, 0, 191, 1)",
    "rgba(0, 0, 159, 1)",
    "rgba(0, 0, 127, 1)",
    "rgba(63, 0, 91, 1)",
    "rgba(127, 0, 63, 1)",
    "rgba(191, 0, 31, 1)",
    "rgba(255, 0, 0, 1)",
  ];

  heatmap.set("gradient", gradient);
}
function setRadius(radius) {
  heatmap.set("radius", radius);
}
function setOpacity(opacity) {
  heatmap.set("opacity", opacity);
}

// <--- Listeners
function setTilt() {
  adjustMap("tilt", 80);
}
// End of Listeners --->

async function initMap() {
  const mapDiv = document.getElementById("map");
  const apiLoader = new Loader(apiOptions);
  await apiLoader.load();

  map = new google.maps.Map(mapDiv, mapOptions);

  svgMarker = {
    path: "M10.453 14.016l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM12 2.016q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z",
    fillColor: "blue",
    fillOpacity: 0.6,
    strokeWeight: 0,
    rotation: 0,
    scale: 1,
    anchor: new google.maps.Point(0, 35),
  };

  symbol = {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 8,
    strokeColor: "#005086",
  };

  var directionsService = new google.maps.DirectionsService();
  var testDirectionsService = new google.maps.DirectionsService();
  var directionsRenderer = new google.maps.DirectionsRenderer({
    draggable: true,
    map,
  });

  var element = document.getElementById("searchButton");
  var service = new google.maps.places.PlacesService(map);
  element.onclick = async function (event) {
    await searchDirections(directionsService, testDirectionsService, directionsRenderer, service);
  };

  document
    .getElementById("toggle-markers")
    .addEventListener("change", (event) => {
      if (createdMarkers) {
        if (showingMarkers) {
          hideMarkers();
        } else {
          showMarkers();
        }
        showingMarkers = !showingMarkers;
      } else {
        addMarkers();
        showingMarkers = true;
      }
    });

  document
    .getElementById("toggle-heatmap")
    .addEventListener("change", (event) => {
      if (gotData === true) {
        if (showingHeatmap) {
          heatmap.setMap(null);
        } else {
          heatmap.setMap(heatmap.getMap() ? null : map);
        }
        showingHeatmap = !showingHeatmap;
      } else {
        addHeatMap();
        showingHeatmap = true;
      }
    });
  document.getElementById("tilt").addEventListener("click", setTilt);

  const inputOrigin = document.getElementById("origin");
  const searchBoxOrigin = new google.maps.places.SearchBox(inputOrigin);
  map.addListener("bounds_changed", () => {
    searchBoxOrigin.setBounds(map.getBounds());
  });
  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBoxOrigin.addListener("places_changed", () => {
    const places = searchBoxOrigin.getPlaces();

    if (places.length == 0) {
      return;
    }

    // For each place, get the icon, name and location.
    const bounds = new google.maps.LatLngBounds();

    places.forEach((place) => {
      if (!place.geometry || !place.geometry.location) {
        console.log("Returned place contains no geometry");
        return;
      }

      const icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25),
      };

      // Create a marker for each place.
      markers.push(
        new google.maps.Marker({
          map,
          icon,
          title: place.name,
          position: place.geometry.location,
        })
      );
      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    map.fitBounds(bounds);
  });

  const inputDestination = document.getElementById("destination");
  const searchBoxDestination = new google.maps.places.SearchBox(
    inputDestination
  );
  map.addListener("bounds_changed", () => {
    searchBoxDestination.setBounds(map.getBounds());
  });

  return map;
}

function animateCircle(line) {
  let count = 0;

  window.setInterval(() => {
    count = (count + 0.2) % 200;

    const icons = line.get("icons");

    icons[0].offset = count / 2 + "%";
    line.set("icons", icons);
  }, 20);
}

// Search fastest path directions
async function searchDirections(
  directionsService,
  testDirectionsService,
  directionsRenderer,
  service
) {
  var start = document.getElementById("origin").value; // "1580 Point W Blvd, Coppell, TX";
  var end = document.getElementById("destination").value; // "8450 N Belt Line Rd, Irving, TX";

  if (isNaN(start.charAt(0))) {
    // Place Name
    var request = {
      query: start,
      fields: ["name", "geometry"],
    };
    service.findPlaceFromQuery(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        for (let i = 0; i < results.length; i++) {
          createMarker(results[i]);
        }
        start = results[0].geometry.location;
      }
    });

    request = {
      query: end,
      fields: ["name", "geometry"],
    };

    service.findPlaceFromQuery(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        for (let i = 0; i < results.length; i++) {
          createMarker(results[i]);
        }
        end = results[0].geometry.location;
      }
    });
  }

  if (start !== "" && end !== "") {
    directionsRenderer.setMap(map);
    directionsRenderer.setPanel(document.getElementById("directionsPanel"));

    // Get Path
    var request = {
      origin: start,
      destination: end,
      travelMode: "WALKING",
    };

    var pathsThing = [];
    testDirectionsService.route(request, function (response, status) {
      if (status == "OK") {
        var legs = response.routes[0].legs;
        for (let i = 0; i < legs.length; i++) {
          var steps = legs[i].steps;
          for (let j = 0; j < steps.length; j++) {
            var nextSegment = steps[j].path;
            for (let k = 0; k < nextSegment.length; k++) {
              pathsThing.push(nextSegment[k]);
            }
          }
        }
    }});
    var pts = await getWaypoints(start, end, pathsThing);

    request = {
      origin: start,
      destination: end,
      travelMode: "WALKING",
      waypoints: pts,
    };

    directionsService.route(request, function (response, status) {
      if (status == "OK") {
        polyline = new google.maps.Polyline({
          path: [],
          strokeColor: "#0000FF",
          strokeWeight: 3,
          icons: [
            {
              icon: symbol,
              offset: "100%",
            },
          ],
        });
        var bounds = new google.maps.LatLngBounds();

        var legs = response.routes[0].legs;
        for (let i = 0; i < legs.length; i++) {
          var steps = legs[i].steps;
          for (let j = 0; j < steps.length; j++) {
            var nextSegment = steps[j].path;
            for (let k = 0; k < nextSegment.length; k++) {
              polyline.getPath().push(nextSegment[k]);
              bounds.extend(nextSegment[k]);
            }
          }
        }
        polyline.setMap(map);
        directionsRenderer.setDirections(response);
        animateCircle(polyline);
      }
    });

    directionsRenderer.addListener("directions_changed", () => {
      const directions = directionsRenderer.getDirections();
      if (directions) {
        computeTotalDistance(directions);
      }
    });
    displayRoute(start, end, directionsService, directionsRenderer, pts);
    adjustMap("tilt", 67.5);

    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: start }, function (results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        var latitude = results[0].geometry.location.lat();
        var longitude = results[0].geometry.location.lng();
        map.setCenter({ lat: latitude, lng: longitude });
      }
    });
  }
}

// <--- Heatmap and Markers Functions
// Get data points for heatmap creation
function getPoints() {
  var points = [];
  querySnapshot.forEach((doc) => {
    if (
      doc.data().latitude !== undefined &&
      doc.data().longitude !== undefined
    ) {
      points.push(
        new google.maps.LatLng(doc.data().latitude, doc.data().longitude)
      );
    }
  });
  return points;
}

async function addHeatMap() {
  const db = getFirestore();
  querySnapshot = await getDocs(collection(db, "fbi"));

  heatmap = new google.maps.visualization.HeatmapLayer({
    data: getPoints(),
    map: map,
  });
  setGradient();
  setRadius(50);
  setOpacity(0.8);
  adjustMap("tilt", 67.5);
  gotData = true;
}

async function addMarkers() {
  if (gotData === true) {
    querySnapshot.forEach((doc) => {
      if (
        doc.data().latitude !== undefined &&
        doc.data().longitude !== undefined
      ) {
        const contentString =
          '<div id="content">' +
          '<div id="siteNotice">' +
          "</div>" +
          '<h1 id="firstHeading" class="firstHeading">' +
          capitalizeFirstLetter(doc.data().offense) +
          "</h1>" +
          '<div id="bodyContent">' +
          "<p><b>Date Year: </b>" +
          doc.data().data_year +
          "</p>" +
          "</div>" +
          "</div>";

        const infoWindow = new google.maps.InfoWindow({
          content: contentString,
        });

        infoWindow.addListener("closeclick", () => {
          adjustMap("tilt", 67.5);
        });

        image = {
          url: "http://www.simpleimageresizer.com/_uploads/photos/5923593c/car-min_1_35x35.png",
          // This marker is 100 pixels wide by 35 pixels high.
          size: new google.maps.Size(100, 35),
          // The origin for this image is (0, 0).
          origin: new google.maps.Point(0, 0),
          // The anchor for this image is the base of the flagpole at (0, 32).
          anchor: new google.maps.Point(0, 32),
        };

        if (
          doc.data().offense === "violent-crime" ||
          doc.data().offense === "homicide"
        ) {
          image.url =
            "http://www.simpleimageresizer.com/_uploads/photos/5923593c/Pngtree_knife_icon_circle_5278662-removebg-preview_35x35.png";
        } else if (
          doc.data().offense === "aggravated-assault" ||
          doc.data().offense === "rape" ||
          doc.data().offense === "rape-legacy"
        ) {
          image.url =
            "http://www.simpleimageresizer.com/_uploads/photos/5923593c/assault_1_35x35.png";
        } else if (doc.data().offense === "arson") {
          image.url =
            "http://www.simpleimageresizer.com/_uploads/photos/5923593c/arson-removebg-preview_35x35.png";
        } else if (
          doc.data().offense === "burglary" ||
          doc.data().offense === "larceny" ||
          doc.data().offense === "robbery"
        ) {
          image.url =
            "http://www.simpleimageresizer.com/_uploads/photos/5923593c/burglary_35x35.png";
        }

        const marker = new google.maps.Marker({
          position: { lat: doc.data().latitude, lng: doc.data().longitude },
          map,
          icon: image,
          title: capitalizeFirstLetter(doc.data().offense),
        });

        marker.addListener("click", () => {
          infoWindow.open({
            anchor: marker,
            map,
            shouldFocus: false,
          });
        });

        markers.push(marker);
      }
    });
    createdMarkers = true;
  } else {
    alert("Create Heatmap First!");
    document.getElementById("toggle-markers").checked = false;
  }
}
// ---> End of Heatmap and Markers Functions

// Sets the map on all markers in the array.
function setMapOnAll(map) {
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

// Removes the markers from the map, but keeps them in the array.
function hideMarkers() {
  setMapOnAll(null);
}

// Shows any markers currently in the array.
function showMarkers() {
  setMapOnAll(map);
}

function displayRoute(origin, destination, service, display, pts) {
  service
    .route({
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.WALKING,
      avoidTolls: true,
      waypoints: pts,
    })
    .then((result) => {
      display.setDirections(result);
    })
    .catch((e) => {
      alert("Could not display directions due to: " + e);
    });
}

function computeTotalDistance(result) {
  let total = 0;
  const myroute = result.routes[0];

  if (!myroute) {
    return;
  }

  for (let i = 0; i < myroute.legs.length; i++) {
    total += myroute.legs[i].distance.value;
  }

  total = total / 1000;
  // document.getElementById("total").innerHTML = total + " km";
}

function initWebglOverlayView(map) {
  let scene, renderer, camera, loader;
  const webglOverlayView = new google.maps.WebglOverlayView();

  webglOverlayView.onAdd = () => {
    // set up the scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75); // soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
    directionalLight.position.set(0, 10, 50);
    scene.add(directionalLight);

    // load the model
    loader = new GLTFLoader();
    const source = "pin.gltf";
    loader.load(source, (gltf) => {
      gltf.scene.scale.set(25, 25, 25);
      gltf.scene.rotation.x = (180 * Math.PI) / 180; // rotations are in radians
      scene.add(gltf.scene);
    });
  };

  webglOverlayView.onContextRestored = (gl) => {
    // create the three.js renderer, using the
    // maps's WebGL rendering context.
    renderer = new THREE.WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      ...gl.getContextAttributes(),
    });
    renderer.autoClear = false;

    // wait to move the camera until the 3D model loads
    loader.manager.onLoad = () => {
      renderer.setAnimationLoop(() => {
        map.moveCamera({
          tilt: mapOptions.tilt,
          heading: mapOptions.heading,
          zoom: mapOptions.zoom,
        });

        // rotate the map 360 degrees
        if (mapOptions.tilt < 67.5) {
          mapOptions.tilt += 0.5;
        } else if (mapOptions.heading <= 5) {
          mapOptions.heading += 0.2;
          mapOptions.zoom -= 0.0005;
        } else {
          renderer.setAnimationLoop(null);
        }
      });
    };
  };

  webglOverlayView.onDraw = (gl, coordinateTransformer) => {
    // update camera matrix to ensure the model is georeferenced correctly on the map
    const matrix = coordinateTransformer.fromLatLngAltitude(
      mapOptions.center,
      120
    );
    camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

    webglOverlayView.requestRedraw();
    renderer.render(scene, camera);

    // always reset the GL state
    renderer.resetState();
  };
  webglOverlayView.setMap(map);
}

(async () => {
  const map = await initMap();
  initWebglOverlayView(map);
})();

const searchBox = document.getElementById("searchBox"),
  locationIcon = document.getElementById("locationIcon"),
  searchIcon = document.getElementById("searchIcon"),
  hamburgerIcon = document.getElementById("hamburger"),
  dashContainer = document.getElementById("dashContainer"),
  searchContainer = document.getElementById("searchContainer"),
  directionsContainer = document.getElementById("directions");

locationIcon.onclick = function () {
  searchBox.classList.toggle("active");
  searchContainer.classList.toggle("grey");
  if (directionsContainer.classList.contains("active")) {
    directionsContainer.classList.toggle("active");
  }
};

searchIcon.onclick = function () {
  if (!searchBox.classList.contains("active")) {
    searchBox.classList.toggle("active");
    searchContainer.classList.toggle("grey");
  }
  directionsContainer.classList.toggle("active");
};

hamburgerIcon.onclick = function () {
  dashContainer.classList.toggle("active");
  searchContainer.classList.toggle("adjust");
  directionsContainer.classList.toggle("adjust");
};

async function onReportSubmit() {
  var crimeCategory = document.getElementById("crimeCategory").value;
  var address = document.getElementById("address").value;
  var city = document.getElementById("city").value;
  var state = document.getElementById("state").value;
  var zipCode = document.getElementById("zipcode").value;
  var name = document.getElementById("name").value;
  var phone = document.getElementById("phone").value;

  try {
    const docRef = await addDoc(collection(db, "fbi"), {
      latitude: 0,
      longitude: 0,
      data_year: 2019,
      offense: crimeCategory,
      name: name,
      phone: phone,
      zip_code: zipCode,
      city: city,
      state: state,
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

/*
 * Pathfinding algorithm
 */

// Consts
const GM_API_KEY = "AIzaSyA3ACCckrmeyEyl2ZUw72B3dU3UGlCuQCE";
const HERE_API_KEY = "yGODsdk71n9nsLYjU8SOmBh4iZpKUdCVI5yFeFKGufc";
const CRIME_RADIUS_METERS = 100;
const CRIME_RADIUS = (CRIME_RADIUS_METERS / 6378000) * (180 / 3.14);

function getCoordDiffFromMeters(meters) {
  return (meters / 6378000) * (180 / 3.14);
}

// Returns list of waypoints along route from start to end.
async function getRoute(start, end) {
  // Takes in address/name of pace, get object with latitude and longitude
  let getCoordinatesFromName = async (address) => {
    let path = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GM_API_KEY}`;
    return axios.get(path).then((res) => res.data.results[0].geometry.location);
  };

  // Asyncs
  let startCoord = await getCoordinatesFromName(start);
  let endCoord = await getCoordinatesFromName(end);
  let avoidAreaString = await getAvoidAreaString(startCoord, startCoord);

  let path = `https://route.ls.hereapi.com/routing/7.2/calculateroute.json?apiKey=${HERE_API_KEY}&waypoint0=geo!${startCoord.lat},${startCoord.lng}&waypoint1=geo!${endCoord.lat},${endCoord.lng}&mode=fastest;pedestrian;traffic:disabled&avoidareas=${avoidAreaString}`;

  return axios
    .get(path)
    .then((res) => res.data.response.route[0].waypoint)
    .then((waypoints) => {
      let res = [];
      for (let w of waypoints) {
        res.push({
          location: {
            lat: w.originalPosition.latitude,
            lng: w.originalPosition.longitude,
          },
          stopover: false,
        });
      }
      return res;
    });
}

// Returns list of waypoints along route from start to end.
async function getRouteNoObstacles(start, end) {
  // Takes in address/name of pace, get object with latitude and longitude
  let getCoordinatesFromName = async (address) => {
    let path = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GM_API_KEY}`;
    return axios.get(path).then((res) => res.data.results[0].geometry.location);
  };

  // Asyncs
  let startCoord = await getCoordinatesFromName(start);
  let endCoord = await getCoordinatesFromName(end);

  let path = `https://route.ls.hereapi.com/routing/7.2/calculateroute.json?apiKey=${HERE_API_KEY}&waypoint0=geo!${
    startCoord.lat},${startCoord.lng}&waypoint1=geo!${endCoord.lat},${endCoord.lng
  }&mode=fastest;pedestrian;traffic:disabled`;

  return axios
    .get(path)
    .then((res) => res.data.response.route[0].waypoint)
    .then((waypoints) => {
      let res = [];
      for (let w of waypoints) {
        res.push({
          location: {
            lat: w.mappedPosition.latitude,
            lng: w.mappedPosition.longitude,
          },
          stopover: false,
        });
      }
      return res;
    });
}

async function getWaypoints(start, end, path) {
  var waypoints = [];
  var closest = await getClosest(start, end);
  console.log(path)
  
  path.forEach((pathCoord) => {
    closest.forEach((crimeCoord) => {
      let distance = getDistance(pathCoord, crimeCoord) 
      console.log(distance, getCoordDiffFromMeters(500));

      if (distance < 0.1) {
        waypoints.push({
          location: new google.maps.LatLng(pathCoord.lat + getCoordDiffFromMeters(500), pathCoord.lng + getCoordDiffFromMeters(500)),
          stopover: false,
        });
      }
    });
  });

  while (waypoints.length > 5) {
    waypoints.pop();
  }

  return waypoints;
}

async function getClosest(start, end) {
  let pts = [];

  const db = getFirestore();
  querySnapshot = await getDocs(collection(db, "fbi"));
  querySnapshot.forEach((doc) => {
    let pt = { 
      lat: doc.data().latitude, 
      lng: doc.data().longitude 
    };

    // Filter for closest points
    if (pts.length === 0) {
      pts.push(pt);
    } else {
      for (let i = 0; i < pts.length; i++) {
        if (pathDistanceFromOptimal(start, end, pt) < pathDistanceFromOptimal(start, end, pts[i])) {
          pts.splice(i, 0, pt);
          break;
        }
      }
    }
    if (pts.length > 20) {
      pts.pop();
    }
  });
  return pts;
}

function getDistance(a, b) {
  var dx = Math.abs(a.lat() - b.lat);
  var dy = Math.abs(a.lng() - b.lng);

  return Math.sqrt(dx * dx + dy * dy);
}

  // Return distance of point pt from fastest path.
  // Source: wikipedia LMAO
  function pathDistanceFromOptimal(start, end, pt) {
    let x0 = pt.lat,
      y0 = pt.lng;
    let x1 = start.latitude,
      y1 = start.longitude;
    let x2 = end.latitude,
      y2 = end.longitude;

    var A = x0 - x1;
    var B = y0 - y1;
    var C = x2 - x1;
    var D = y2 - y1;

    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq != 0)
      // in case of 0 length line
      param = dot / len_sq;

    var xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    var dx = x0 - xx;
    var dy = y0 - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

// Returns areas to avoid in string format
async function getAvoidAreaString(start, end) {
  // Draw box around a coordinate in order to avoid area.
  let getBoxAroundAvoidCoord = (coord) => {
    let res = "";
    res += (parseFloat(coord.lat) + CRIME_RADIUS).toString() + ",";
    res += (parseFloat(coord.lng) - CRIME_RADIUS).toString() + ";";
    res += (parseFloat(coord.lat) - CRIME_RADIUS).toString() + ",";
    res += (parseFloat(coord.lng) + CRIME_RADIUS).toString() + "!";
    return res;
  };

  let res = "";
  let pts = [];

  const db = getFirestore();
  querySnapshot = await getDocs(collection(db, "fbi"));
  querySnapshot.forEach((doc) => {
    let pt = {
      lat: doc.data().latitude,
      lng: doc.data().longitude,
    };

    // Filter for closest points
    if (pts.length === 0) {
      pts.push(pt);
    } else {
      for (let i = 0; i < pts.length; i++) {
        if (pathDistanceFromOptimal(pt) < pathDistanceFromOptimal(pts[i])) {
          pts.splice(i, 0, pt);
          break;
        }
      }
    }
    if (pts.length > 3) {
      pts.pop();
    }
  });

  for (let pt of pts) res += getBoxAroundAvoidCoord(pt);

  // Remove last exclamation for formatting
  if (res[res.length - 1] == "!") res = res.substring(0, res.length - 1);
  return res;
}
