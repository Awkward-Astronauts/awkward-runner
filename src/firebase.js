import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from 'firebase/database';
import { getHiScoreLayout } from './htmlLayouts.js';

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: 'awkward-astronaut-api.firebaseapp.com',
  databaseURL: 'https://awkward-astronaut-api-default-rtdb.firebaseio.com/',
  projectId: 'awkward-astronaut-api',
  storageBucket: 'awkward-astronaut-api.appspot.com',
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
export const hiScoreRef = ref(db, 'twitterHiScore');
console.log('hiScoreRef', hiScoreRef);
export let hiScoreValues = null;
const hiScoreDiv = document.getElementById('hi-score');

onValue(hiScoreRef, (snapshot) => {
  console.log('snapshot', snapshot.val());
  if(snapshot.exists()) {
    hiScoreValues = snapshot.val();
    hiScoreDiv.innerHTML = getHiScoreLayout(hiScoreValues);
  } else {
    console.log('DOES NOT EXIST');
    hiScoreDiv.innerHTML = "Well this is awkward... We can't seem to find the Hi Scores!";
  }
});

