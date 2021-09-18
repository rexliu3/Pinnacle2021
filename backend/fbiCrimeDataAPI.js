const axios = require('axios');

const admin = require('firebase-admin');

async function makeRequest() {
    const config = {
        method: 'get',
        url: 'https://api.usa.gov/crime/fbi/sapi/api/summarized/state/CA/burglary/2015/2019',
        headers: { 'x-api-key': 'M1zMUlFO4u7awm7Vw9YAxgLEbd1erLrI58l4Uv3Y' }
    }

    let res = await axios(config)
    console.log(res.data);
    return res.data
}

const data = makeRequest();

admin.initializeApp();
const db = admin.firestore();

const collectionRef = db.collection('fbi');
console.log(data)
console.log(collectionRef)

data.forEach((crime) => {
    collectionRef.add(crime);
});


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
/*const firebaseConfig = {
  apiKey: "AIzaSyAIx4fWlxvkL6AF_Vc3QcMS60LVxXOaOOg",
  authDomain: "pinnacle2021-b6e50.firebaseapp.com",
  projectId: "pinnacle2021-b6e50",
  storageBucket: "pinnacle2021-b6e50.appspot.com",
  messagingSenderId: "12249211641",
  appId: "1:12249211641:web:429ccd4271bd42b3e77828",
  measurementId: "G-8F4Z9J2M4R"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();*/



