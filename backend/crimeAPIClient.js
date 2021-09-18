const crimeHotspot = require('spotcrime');

// uc berkeley
const loc = {
  lat: 37.871666,
  lon: -122.272781
};

const radius = 0.02; // this is miles

crimeHotspot.getCrimes(loc, radius).then((crimes) => {
    // add to firestore here
    console.log(crimes);
});