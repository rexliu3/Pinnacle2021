const crimeHotspot = require('spotcrime');

// ucla
const loc = {
  lat: 34.0689,
  lon: -118.4452
};

const radius = 100; // this is miles

crimeHotspot.getCrimes(loc, radius).then((crimes) => {
  // add to firestore here
  console.log(crimes);
}); 