const GM_API_KEY = "AIzaSyA3ACCckrmeyEyl2ZUw72B3dU3UGlCuQCE";
// const DIRECTIONS_URL =
// "https://maps.googleapis.com/maps/api/directions/json";
const GEOCODE_BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

const HERE_API_KEY = "L7M1JMYFgiLZn8L4rPcST0SwAe7De0dWUC5mqQxbwLM";
const HERE_BASE_URL =
    "https://route.ls.hereapi.com/routing/7.2/calculateroute.json";

const CRIME_RADIUS_METERS = 500;
const CRIME_RADIUS = (CRIME_RADIUS_METERS / 6378000) * (180 / 3.14);

const axios = require('axios').default;

async function pathgen(start, end) {
  let getCoordinatesFromName =
      async (address) => {
    path = `${GEOCODE_BASE_URL}?address=${address}&key=${GM_API_KEY}`;
    return axios.get(path).then((res) => res.data.results[0].geometry.location);
  }

  let startCoord = await getCoordinatesFromName(start);
  let endCoord = await getCoordinatesFromName(end);

  path = `https://route.ls.hereapi.com/routing/7.2/calculateroute.json?apiKey=${
      HERE_API_KEY}&waypoint0=geo!${startCoord.lat},${
      startCoord.lng}&waypoint1=geo!${endCoord.lat},${
      endCoord.lng}&mode=fastest;pedestrian;traffic:disabled&avoidareas=${
      getAvoidAreaString(start, end)}`;

  console.log(path, "\n");

  return axios.get(path).then((res) => res.data.response.route[0]);
}

function getAvoidAreaString(start, end) {
  let getBoxAroundAvoidCoord = (coord) => {
    let res = "";
    res += (parseFloat(coord.lat) + CRIME_RADIUS).toString() + ",";
    res += (parseFloat(coord.lng) + CRIME_RADIUS).toString() + ";";
    res += (parseFloat(coord.lat) - CRIME_RADIUS).toString() + ",";
    res += (parseFloat(coord.lng) - CRIME_RADIUS).toString() + "!";
    return res;
  };

  // let res = "";
  // for (ca of getCrimeAreas(start, end)) {
  //   res += getBoxAroundAvoidCoord(ca);
  // }

  // if (str[str.length - 1] == "!")
  //   res = res.substring(0, res.length - 1);
  // return res;
  return "52.517100760,13.3905424488;52.5169701849,13.391808451";
}

pathgen("ubc exchange bus loop", "yvr international airport").then((res) => {
  console.log(res);
  // console.log(res.leg[0].maneuver);
});

// console.log(getBoxAroundAvoidCoord({lat : 52.517100760, lng : 13.3905424488},
//                                    {lat : 52.5169701849, lng
//                                    : 13.391808451}));
