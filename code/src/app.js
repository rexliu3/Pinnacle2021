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
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseApp = initializeApp({
  apiKey: "AIzaSyCUvjvEYUfKivJPJ8xS6inRXlHW4pW0HfA",
  authDomain: "pinnacle2021v2.firebaseapp.com",
  projectId: "pinnacle2021v2",
  storageBucket: "pinnacle2021v2.appspot.com",
  messagingSenderId: "347442946979",
  appId: "1:347442946979:web:a12be8ec3003ec7cb9f016",
  measurementId: "G-9FL3CCBLF5",
});

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
};

var querySnapshot;
var map, heatmap;
var gotData = false;
var createdHeatmap = false;
var showingMarkers = false;
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

// <--- Listeners
function toggleHeatmap() {
  if (createdHeatmap) {
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
}
function changeGradient() {
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

  heatmap.set("gradient", heatmap.get("gradient") ? null : gradient);
}
function changeRadius() {
  heatmap.set("radius", heatmap.get("radius") ? null : 150);
}
function changeOpacity() {
  heatmap.set("opacity", heatmap.get("opacity") ? null : 0.2);
}
function toggleMarkers() {
  if (gotData === true) {
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
}
function setTilt() {
  adjustMap("tilt", 67.5);
}
// End of Listeners --->

async function initMap() {
  const mapDiv = document.getElementById("map");
  const apiLoader = new Loader(apiOptions);
  await apiLoader.load();

  map = new google.maps.Map(mapDiv, mapOptions);

  var directionsService = new google.maps.DirectionsService();
  var directionsRenderer = new google.maps.DirectionsRenderer({
    draggable: true,
    map,
  });

  var element = document.getElementById("searchButton");
  var service = new google.maps.places.PlacesService(map);
  element.onclick = function (event) {
    searchDirections(directionsService, directionsRenderer, service);
  };

  document
    .getElementById("toggle-markers")
    .addEventListener("click", toggleMarkers);
  document
    .getElementById("toggle-heatmap")
    .addEventListener("click", toggleHeatmap);
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
  const searchBoxDestination = new google.maps.places.SearchBox(inputDestination);
  map.addListener("bounds_changed", () => {
    searchBoxDestination.setBounds(map.getBounds());
  });
  return map;
}

// Search fastest path directions 
function searchDirections(directionsService, directionsRenderer, service) {
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
        start = results[0].geometry.location
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
        end = results[0].geometry.location
      }
    });
  }

  if (start !== "" && end !== "") {
    directionsRenderer.setMap(map);
    directionsRenderer.setPanel(document.getElementById("directionsPanel"));

    var request = {
      origin: start,
      destination: end,
      travelMode: "WALKING",
    };
    directionsService.route(request, function (response, status) {
      if (status == "OK") {
        directionsRenderer.setDirections(response);
      }
    });

    directionsRenderer.addListener("directions_changed", () => {
      const directions = directionsRenderer.getDirections();
      if (directions) {
        computeTotalDistance(directions);
      }
    });
    displayRoute(start, end, directionsService, directionsRenderer);
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
    points.push(
      new google.maps.LatLng(doc.data().latitude, doc.data().longitude)
    );
  });
  return points;
}

async function addHeatMap() {
  if (gotData === true) {
    heatmap = new google.maps.visualization.HeatmapLayer({
      data: getPoints(),
      map: map,
    });
    document
      .getElementById("change-gradient")
      .addEventListener("click", changeGradient);
    document
      .getElementById("change-opacity")
      .addEventListener("click", changeOpacity);
    document
      .getElementById("change-radius")
      .addEventListener("click", changeRadius);
    adjustMap("tilt", 67.5);
  } else {
    alert("This is a warning message!");
  }
  createdHeatmap = true;
}

async function addMarkers() {
  const db = getFirestore();
  querySnapshot = await getDocs(collection(db, "fbi"));

  querySnapshot.forEach((doc) => {
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

    const marker = new google.maps.Marker({
      position: { lat: doc.data().latitude, lng: doc.data().longitude },
      map,
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
  });
  gotData = true;
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

function displayRoute(origin, destination, service, display) {
  service
    .route({
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.WALKING,
      avoidTolls: true,
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
  document.getElementById("total").innerHTML = total + " km";
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
  searchContainer = document.getElementById("searchContainer");

locationIcon.onclick = function () {
  searchBox.classList.toggle("active");
  searchContainer.classList.toggle("grey");
};

searchIcon.onclick = function () {
  if (!searchBox.classList.contains("active")) {
    searchBox.classList.toggle("active");
    searchContainer.classList.toggle("grey")
  }
};

hamburgerIcon.onclick = function () {
  dashContainer.classList.toggle("active");
  searchContainer.classList.toggle("adjust");
};
