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
          <td class="initials">
            <a href="https://twitter.com/${Object.keys(hiScoreValues[entry])[0]}">
              @${Object.keys(hiScoreValues[entry])[0]}
            </a>
          </td>
          <td class="dash">-</td>
          <td class="score">${Object.values(hiScoreValues[entry])[0]}</td>
        </tr>
    `;
  }
  hiScoreHTML += `</table>`;
  console.log('hiScoreHTML');
  return hiScoreHTML ;
}

export function getInitialsInput(gameScore) {
  return `
    <span class="new-hi-score">New Hi Score!</span>
    <span class="game-score">${gameScore}!!!</span>
    <span class="input-initials">Input your Twitter username (without the "at" symbol)</span>
    <div class="cursor">
      <input type="text" id="initials" minlength="4" required />
    </div>
    <span class="press-enter">Press Enter to Submit</span>
    `;
}
