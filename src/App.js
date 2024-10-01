import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { db, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit } from './firebase';
import RfcLogo from './assets/Rfc-removebg-preview.png'; // Import your logo
import './App.css';

const App = () => {
  const [playersData, setPlayersData] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [totalGoals, setTotalGoals] = useState(0);
  const [gameStatus, setGameStatus] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameSubmitted, setUsernameSubmitted] = useState(false);
  const [userHighScore, setUserHighScore] = useState(null);
  const [usernameError, setUsernameError] = useState('');
  const [topScores, setTopScores] = useState([]); // For storing top 5 scores

  const initialMultipliers = [
    { multiplier: 1, label: 'Career (1x)', count: 3 },
    { multiplier: 2, label: 'Double (2x)', count: 3 },
    { multiplier: 3, label: 'Triple (3x)', count: 2 },
    { multiplier: 4, label: 'Quad (4x)', count: 1 },
    { multiplier: 5, label: 'Five Times (5x)', count: 1 }
  ];

  const [multipliers, setMultipliers] = useState([]);

  useEffect(() => {
    Papa.parse('/stats.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setPlayersData(shuffleArray(result.data));
      },
    });

    const expandedMultipliers = [];
    initialMultipliers.forEach(({ multiplier, label, count }) => {
      for (let i = 0; i < count; i++) {
        expandedMultipliers.push({
          multiplier,
          label,
          used: false,
          buttonLabel: label
        });
      }
    });
    setMultipliers(expandedMultipliers);
  }, []);

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const handleChoice = (multiplierIndex) => {
    if (playersData.length === 0 || multipliers[multiplierIndex].used) return;

    const player = playersData[currentPlayerIndex];
    const multiplier = multipliers[multiplierIndex].multiplier;
    const newGoals = player.Goals * multiplier;
    const newTotal = totalGoals + newGoals;

    const newMultipliers = [...multipliers];
    newMultipliers[multiplierIndex] = {
      ...newMultipliers[multiplierIndex],
      used: true,
      buttonLabel: `${newMultipliers[multiplierIndex].label} - ${player.Name}: ${newGoals} G`
    };

    setMultipliers(newMultipliers);
    setTotalGoals(newTotal);

    const allMultipliersUsed = newMultipliers.every(mult => mult.used);

    if (newTotal >= 10000 && allMultipliersUsed) {
      setGameStatus('win');
      setShowPopup(true);
      updateHighScore(newTotal);
      fetchTopScores(); // Fetch top 5 scores when the game is won
    } else if (allMultipliersUsed) {
      setGameStatus('lose');
      setShowPopup(true);
    } else {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
    }
  };

  const restartGame = () => {
    setCurrentPlayerIndex(0);
    setTotalGoals(0);
    setGameStatus(null);
    setShowPopup(false);

    setPlayersData(shuffleArray(playersData));

    const resetMultipliers = multipliers.map(mult => ({
      ...mult,
      used: false,
      buttonLabel: mult.label
    }));
    setMultipliers(resetMultipliers);
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    const normalizedUsername = username.trim().toLowerCase().replace(/[^a-z]/g, '');
    const userDocRef = doc(db, 'usernames', normalizedUsername);

    const userSnapshot = await getDoc(userDocRef);
    if (userSnapshot.exists()) {
      setUsernameError('Username is taken! please choose another one.');
      return;
    } else {
      await setDoc(userDocRef, { name: username });
      setUserHighScore(0);
      setUsernameSubmitted(true);
      setUsernameError('');
      fetchTopScores(); // Fetch the top 5 scores immediately after username submission
    }
  };

  const updateHighScore = async (newScore) => {
    if (newScore < 10000) return;
    const normalizedUsername = username.trim().toLowerCase().replace(/[^a-z]/g, '');
    const userDocRef = doc(db, 'users', normalizedUsername);
    const userSnapshot = await getDoc(userDocRef);
    if (!userSnapshot.exists() || newScore > userSnapshot.data().highScore) {
      await setDoc(userDocRef, { highScore: newScore });
      setUserHighScore(newScore);
    }
  };

  const fetchTopScores = async () => {
    const scoresQuery = query(collection(db, 'users'), orderBy('highScore', 'desc'), limit(5));
    const topScoresSnapshot = await getDocs(scoresQuery);
    const topScoresData = topScoresSnapshot.docs.map((doc, index) => ({
      rank: index + 1,
      username: doc.id,
      highScore: doc.data().highScore
    }));
    setTopScores(topScoresData);
  };

  const rules = [
    "Score goals by clicking multipliers",
    "Each goal multiplies your points",
    "Reach 10,000 points to win",
    "Your score resets when you lose"
  ];

  return (
    <div className="App">
      <h1>10,000 GOALS CHALLENGE</h1>

      {!usernameSubmitted ? (
        <div className="username-input">
          <form onSubmit={handleUsernameSubmit}>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <button type="submit">Start Game</button>
          </form>
          {usernameError && <p className="error">{usernameError}</p>}

          
        </div>
      ) : (
        <>
          {showPopup && (
            <div className="popup">
              <div className="popup-content">
                {gameStatus === 'win' ? (
                  <>
                    <h2>Congratulations {username}! You Win!</h2>
                    <p>Your final score: {totalGoals} goals</p>
                    <h3>Top Scorers</h3>
                    <ul>
                      {topScores.map((score) => (
                        <li key={score.rank}>
                          {score.rank}. {score.username}: {score.highScore} G
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <h2>Sorry {username}, You Lose, Try Again!</h2>
                )}
                <button onClick={restartGame}>Restart Game</button>
              </div>
            </div>
          )}

          {!showPopup && (
            <div className="panel-container">
              <div className="box-1">
                <h2>How to Play</h2>
                <ul>
                  {rules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </ul>
              </div>

              <div className="game-box">
                <div className="player-display">
                  {playersData[currentPlayerIndex] && (
                    <h2>Player: {playersData[currentPlayerIndex].Name}</h2>
                  )}
                </div>
                <div className="multipliers vertical-multipliers">
                  {multipliers.map((multiplier, index) => (
                    <button
                      key={index}
                      className={multiplier.used ? 'used' : ''}
                      onClick={() => handleChoice(index)}
                      disabled={multiplier.used}
                    >
                      {multiplier.buttonLabel}
                    </button>
                  ))}
                </div>
              </div>

              <div className="goals-display">
                <h2>Total Goals: {totalGoals}/10000</h2>
              </div>

              
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
