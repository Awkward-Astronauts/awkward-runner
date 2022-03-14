import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

const hiScoreDiv = document.getElementById('hi-score');
let hiScoreHTML = ``;

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const hiScoreRef = ref(db, 'hiScore');

onValue(hiScoreRef, (snapshot) => {
  if(snapshot.exists()) {
    hiScoreHTML += `<table>`;
    for(const entry in snapshot.val()) {
      hiScoreHTML += `<tr><td>${entry}</td><td>:</td></td><td>&nbsp;${snapshot.val()[entry]}</td></tr>`;
    }
    hiScoreHTML += `</table>`;
    hiScoreDiv.innerHTML = hiScoreHTML;
  } else {
    console.log('No data available');
  }
});

