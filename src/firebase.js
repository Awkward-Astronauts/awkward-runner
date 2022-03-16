import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: 'awkward-astronaut-api.firebaseapp.com',
  databaseURL: 'https://awkward-astronaut-api-default-rtdb.firebaseio.com/',
  projectId: 'awkward-astronaut-api',
  storageBucket: 'awkward-astronaut-api.appspot.com',
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

const hiScoreDiv = document.getElementById('hi-score');
let hiScoreHTML = ``;

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const hiScoreRef = ref(db, 'hiScore');
export let hiScoreValues = null;

onValue(hiScoreRef, (snapshot) => {
  if(snapshot.exists()) {
    // Need to save snapshot.val() somewhere to check if current player beats a hi score
    // The db will need to be updated with the new hi score and the other values pushed down
    // accordingly
    hiScoreValues = snapshot.val();
    let placeNumber = 1;
    hiScoreHTML += `
        <table>
            <thead>
                <tr>
                    <th class="hiScoreHeader" colspan="4">Leaderboard</th>
                </tr>
            </thead>
    `;
    for(const entry in snapshot.val()) {
      hiScoreHTML += `
        <tr>
          <td class="placeNumber">${placeNumber}.</td>
          <td class="initials">${entry}</td>
          <td class="dash">-</td>
          <td class="score">${snapshot.val()[entry]}</td>
        </tr>
    `;
      placeNumber++;
    }
    hiScoreHTML += `</table>`;
    hiScoreDiv.innerHTML = hiScoreHTML;
  } else {
    hiScoreDiv.innerHTML = "Well this is awkward... We can't seem to find the Hi Scores!";
  }
});

