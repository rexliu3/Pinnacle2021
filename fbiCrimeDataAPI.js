const axios = require('axios');
const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore();


async function makeRequest() {

    const config = {
        method: 'get',
        url: 'https://api.usa.gov/crime/fbi/sapi/api/summarized/state/CA/burglary/2015/2019',
        headers: { 'x-api-key': 'M1zMUlFO4u7awm7Vw9YAxgLEbd1erLrI58l4Uv3Y' }
    }

    let res = await axios(config)

    console.log(res.data)
}

makeRequest();
// console.logs data to add to firebase


var config = {
    apiKey: "AIzaSyA3ACCckrmeyEyl2ZUw72B3dU3UGlCuQCE",
    authDomain: "projectId.firebaseapp.com",
    // For databases not in the us-central1 location, databaseURL will be of the
    // form https://[databaseName].[region].firebasedatabase.app.
    // For example, https://your-database-123.europe-west1.firebasedatabase.app
    databaseURL: "https://databaseName.firebaseio.com",
    storageBucket: "bucket.appspot.com"
};
firebase.initializeApp(config);

// Get a reference to the database service
var database = firebase.database();

