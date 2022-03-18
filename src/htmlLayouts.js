export function getHiScoreLayout(hiScoreValues) {
  let hiScoreHTML = `
        <table>
            <thead>
                <tr>
                    <th class="hiScoreHeader" colspan="4">Leaderboard</th>
                </tr>
            </thead>
    `;
  for(const entry in hiScoreValues) {
    hiScoreHTML += `
        <tr>
          <td class="placeNumber">${parseInt(entry) + 1}.</td>
          <td class="initials">${Object.keys(hiScoreValues[entry])[0]}</td>
          <td class="dash">-</td>
          <td class="score">${Object.values(hiScoreValues[entry])[0]}</td>
        </tr>
    `;
  }
  hiScoreHTML += `</table>`;
  return hiScoreHTML ;
}

export function getInitialsInput(gameScore) {
  return `
    <span class="new-hi-score">New Hi Score!</span>
    <span class="game-score">${gameScore}!!!</span>
    <span class="input-initials">Input up to 3 Initials</span>
    <div class="cursor">
      <input type="text" id="initials" minlength="1" maxlength="3" pattern="[A-Za-z]{1,3}" autofocus required />
    </div>
    <div>
      <button type="button" id="initials-submit"">Submit</button>
    </div>
    `;
}
