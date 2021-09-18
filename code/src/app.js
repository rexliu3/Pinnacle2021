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
  apiKey: "AIzaSyAIx4fWlxvkL6AF_Vc3QcMS60LVxXOaOOg",
  authDomain: "pinnacle2021-b6e50.firebaseapp.com",
  projectId: "pinnacle2021-b6e50",
  storageBucket: "pinnacle2021-b6e50.appspot.com",
  messagingSenderId: "12249211641",
  appId: "1:12249211641:web:429ccd4271bd42b3e77828",
  measurementId: "G-8F4Z9J2M4R",
});

const db = getFirestore();
const querySnapshot = await getDocs(collection(db, "fbi"));

const apiOptions = {
  apiKey: "AIzaSyA3ACCckrmeyEyl2ZUw72B3dU3UGlCuQCE",
  version: "beta",
  map_ids: ["56e39613eced90d4"],
};

const mapOptions = {
  tilt: 0,
  heading: 0,
  zoom: 18,
  center: { lat: 32.9270316, lng: -96.9962565 },
  mapId: "56e39613eced90d4",
  mapTypeControlOptions: {},
 
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function initMap() {
  const mapDiv = document.getElementById("map");
  const apiLoader = new Loader(apiOptions);
  await apiLoader.load();

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

  var map = new google.maps.Map(mapDiv, mapOptions);
  await addMarkers(map, adjustMap);

  var directionsService = new google.maps.DirectionsService();
  var directionsRenderer = new google.maps.DirectionsRenderer({
    draggable: true,
    map,
  });

  var element = document.getElementById("searchButton");
  element.onclick = function (event) {
    searchDirections(map, directionsService, directionsRenderer, adjustMap);
  };

  return map;
}

function searchDirections(
  map,
  directionsService,
  directionsRenderer,
  adjustMap
) {
  var start = document.getElementById("origin").value; // "1580 Point W Blvd, Coppell, TX";
  var end = document.getElementById("destination").value; // "8450 N Belt Line Rd, Irving, TX";

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
  }
}

async function addMarkers(map, adjustMap) {
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
  });
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
        } else if (mapOptions.heading <= 360) {
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
  searchIcon = document.getElementById("searchIcon");

/*searchBox.onclick = function () {
  if (!searchBox.classList.contains('active')) {
    searchBox.classList.toggle('active');
  }
};*/

locationIcon.onclick = function () {
  searchBox.classList.toggle("active");
};

searchIcon.onclick = function () {
  if (!searchBox.classList.contains("active")) {
    searchBox.classList.toggle("active");
  }
};
