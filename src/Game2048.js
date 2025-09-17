import React, { useEffect, useRef, useState, useCallback } from "react";
import "./Game2048.css";
import scoreManager from "./score.js";
import { getTranslation } from "./languages";
import { formatNumber, formatDate } from "./utils";

const colorpalette = {
  0: "#6e5f74",
  2: "#00d0a4",
  4: "#dd7373",
  8: "#7d53de",
  16: "#6622cc",
  32: "#00bfb2",
  64: "#c06ff2",
  128: "#340068",
  256: "#3e92cc",
  512: "#d8315b",
  1024: "#1c0b19",
  2048: "#1c0b19",
};

const Game2048 = ({ userInfo, language = "zh" }) => {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const loadScoreDataRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [topScores, setTopScores] = useState([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    bestScore: 0,
    averageScore: 0,
    lowestScore: 0,
    winRate: 0,
  });
  const [recentScores, setRecentScores] = useState([]);
  const [isGameActive, setIsGameActive] = useState(true); 
  const [uploadStatus, setUploadStatus] = useState(null); 

  const loadScoreData = useCallback(async () => {
    try {
      
      const topThree = await scoreManager.getTopScores(3);
      setTopScores(topThree);

      const recent = await scoreManager.getRecentScores(10);
      console.log(recent);

      setRecentScores(recent);

      const statistics = await scoreManager.getStatistics();
      setStats({
        totalGames: statistics.totalGames,
        bestScore: statistics.highestScore,
        averageScore: statistics.averageScore,
        lowestScore: statistics.lowestScore,
        winRate: statistics.winRate,
      });
    } catch (error) {
      console.error("Failed to load score data:", error);
    }
  }, []);

  useEffect(() => {
    loadScoreData().catch((error) => {
      console.error("Failed to load score data:", error);
    });
  }, [loadScoreData]);

  useEffect(() => {
    loadScoreDataRef.current = loadScoreData;
  }, [loadScoreData]);

  const handleKeyDown = useCallback(
    (event) => {
      if (/Arrow/i.test(event.key) && event.key) {
        event.preventDefault();
        
        if (gameRef.current && isGameActive) {
          gameRef.current.combind(event.key);
        }
      }
    },
    [isGameActive]
  );

  useEffect(() => {
    if (gameRef.current && canvasRef.current) {
      setTimeout(() => {
        gameRef.current.start();
      }, 200);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.font = "50px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    class Game {
      constructor(ctx, language) {
        this.ctx = ctx;
        this.language = language;
        this.board = new Array(4).fill(0).map(() => new Array(4).fill(0));
        this.score = 0;
      }

      start() {
        this.ctx.clearRect(0, 0, 600, 600);
        this.board = new Array(4).fill(0).map(() => new Array(4).fill(0));
        this.score = 0;
        this.addNumberAndDraw();
        setGameOver(false);
        setCurrentScore(this.score);
        setIsGameActive(true); 
      }

      async saveGameScore() {
        try {
          console.log("Starting to save game score:", this.score);
          setUploadStatus({
            type: "uploading",
            message: getTranslation(language, "uploadingScore"),
          });

          const savedRecord = await scoreManager.saveScore(this.score);
          console.log("Score saved:", savedRecord);

          if (loadScoreDataRef.current) {
            loadScoreDataRef.current();
          }

          if (savedRecord.uploadFailed) {
            console.warn(
              "⚠️ Score upload failed, saved locally:",
              savedRecord.uploadError
            );
            setUploadStatus({
              type: "error",
              message: `${getTranslation(language, "uploadFailed")}: ${
                savedRecord.uploadError
              }`,
              canRetry: true,
            });
          } else if (savedRecord.serverId) {
            console.log("✅ Score successfully uploaded to server");
            setUploadStatus({
              type: "success",
              message: getTranslation(language, "uploadSuccess"),
            });
          } else if (savedRecord.localOnly) {
            console.log("ℹ️ User not logged in, score saved locally only");
            setUploadStatus({
              type: "info",
              message: getTranslation(language, "uploadInfo"),
            });
          }

          setTimeout(() => {
            setUploadStatus(null);
          }, 3000);
        } catch (error) {
          console.error("Failed to save score:", error);
          setUploadStatus({
            type: "error",
            message: getTranslation(language, "saveScoreFailed"),
            canRetry: true,
          });
        }
      }

      addNumberAndDraw() {
        let available = this.board.flatMap((row, i) =>
          row.map((v, j) => (v === 0 ? [i, j] : null)).filter((v) => v !== null)
        );
        if (available.length === 0) return;
        let [newI, newJ] =
          available[Math.floor(Math.random() * available.length)];
        this.board[newI][newJ] = 2;

        for (var i = 0; i < this.board.length; i++) {
          for (var j = 0; j < this.board[i].length; j++) {
            this.ctx.fillStyle = colorpalette[this.board[i][j]];
            this.ctx.fillRect(j * 150 + 5, i * 150 + 5, 140, 140);
            if (this.board[i][j] > 0) {
              this.ctx.fillStyle = "#fff";
              this.ctx.fillText(this.board[i][j], j * 150 + 75, i * 150 + 75);
            }
          }
        }
        return [newI, newJ];
      }

      combind(direction) {
        let mergeX = (i, j, k) => {
          if (this.board[k][j] !== 0) {
            if (this.board[i][j] === 0) {
              this.board[i][j] = this.board[k][j];
              this.board[k][j] = 0;
            } else if (this.board[i][j] === this.board[k][j]) {
              this.board[i][j] *= 2;
              this.score += this.board[i][j];
              this.board[k][j] = 0;
            }
          }
        };
        let mergeY = (i, j, k) => {
          if (this.board[i][k] !== 0) {
            if (this.board[i][j] === 0) {
              this.board[i][j] = this.board[i][k];
              this.board[i][k] = 0;
            } else if (this.board[i][j] === this.board[i][k]) {
              this.board[i][j] *= 2;
              this.score += this.board[i][j];
              this.board[i][k] = 0;
            }
          }
        };
        if (direction === "ArrowUp") {
          for (let i = 0; i < this.board.length; i++) {
            for (let j = 0; j < this.board[i].length; j++) {
              for (let k = i + 1; k < this.board.length; k++) {
                mergeX(i, j, k);
              }
            }
          }
        } else if (direction === "ArrowDown") {
          for (let i = this.board.length - 1; i >= 0; i--) {
            for (let j = 0; j < this.board[i].length; j++) {
              for (let k = i - 1; k >= 0; k--) {
                mergeX(i, j, k);
              }
            }
          }
        } else if (direction === "ArrowLeft") {
          for (let i = 0; i < this.board.length; i++) {
            for (let j = 0; j < this.board[i].length; j++) {
              for (let k = j + 1; k < this.board[i].length; k++) {
                mergeY(i, j, k);
              }
            }
          }
        } else if (direction === "ArrowRight") {
          for (let i = 0; i < this.board.length; i++) {
            for (let j = this.board[i].length - 1; j >= 0; j--) {
              for (let k = j - 1; k >= 0; k--) {
                mergeY(i, j, k);
              }
            }
          }
        }
        const result = this.addNumberAndDraw();
        setCurrentScore(this.score);
        if (result === undefined) {
          setGameOver(true);
          setIsGameActive(false); 
          
          this.saveGameScore();
        }
      }
    }

    const game = new Game(ctx, language);
    gameRef.current = game;

    setTimeout(() => {
      game.start();
    }, 100);
  }, [language]);

  const restart = () => {
    setGameOver(false);
    setIsGameActive(true); 
    if (gameRef.current) {
      gameRef.current.start();
    }
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-title-section">
          <h2 className="game-title">
            {getTranslation(language, "gameTitle")}
          </h2>
        </div>
        {gameOver && (
          <div className="game-overlay">
            <div className="gameover">
              <h2 className="gameover-title">
                {getTranslation(language, "gameOver")}
              </h2>
              <div className="gameover-score">
                <div className="gameover-score-label">
                  {getTranslation(language, "currentScore")}
                </div>
                <div className="gameover-score-value">
                  {formatNumber(currentScore, language)}
                </div>
              </div>
              <button className="restart" onClick={restart}>
                {getTranslation(language, "restart")}
              </button>

              {}
              {uploadStatus && (
                <div
                  className={`upload-status upload-status-${uploadStatus.type}`}
                >
                  <div className="upload-status-icon">
                    {uploadStatus.type === "uploading" && "⏳"}
                    {uploadStatus.type === "success" && "✅"}
                    {uploadStatus.type === "error" && "❌"}
                    {uploadStatus.type === "info" && "ℹ️"}
                  </div>
                  <div className="upload-status-message">
                    {uploadStatus.message}
                  </div>
                  {uploadStatus.canRetry && (
                    <button
                      className="upload-retry-btn"
                      onClick={() => {
                        setUploadStatus({
                          type: "uploading",
                          message: getTranslation(language, "retryingUpload"),
                        });
                        if (gameRef.current) {
                          gameRef.current.saveGameScore();
                        }
                      }}
                    >
                      {getTranslation(language, "retry")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="game-content">
        <div className="game-canvas-container">
          <canvas
            ref={canvasRef}
            id="game"
            width={600}
            height={600}
            className="game-canvas"
            style={{ display: "block" }}
          />
        </div>

        <div className="right-panel">
          <div className="stats-panel">
            <div className="current-score">
              <div className="score-label">
                {getTranslation(language, "currentScore")}
              </div>
              <div className="score-value">
                {formatNumber(currentScore, language)}
              </div>
            </div>

            <div className="player-stats">
              <h3 className="stats-title">
                📊 {getTranslation(language, "myStats")}
              </h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">🎮</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.totalGames}</div>
                    <div className="stat-label">
                      {getTranslation(language, "totalGames")}
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {formatNumber(stats.bestScore, language)}
                    </div>
                    <div className="stat-label">
                      {getTranslation(language, "bestScore")}
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {formatNumber(stats.averageScore, language)}
                    </div>
                    <div className="stat-label">
                      {getTranslation(language, "averageScore")}
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📉</div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {formatNumber(stats.lowestScore, language)}
                    </div>
                    <div className="stat-label">
                      {getTranslation(language, "lowestScore")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="top-scores">
              <h3 className="top-scores-title">
                🏆 {getTranslation(language, "bestScores")}
              </h3>
              <div className="podium">
                {topScores.length === 0 ? (
                  <div className="no-scores">
                    <p>{getTranslation(language, "noGameRecords")}</p>
                    <p>{getTranslation(language, "startGameCreateRecord")}</p>
                  </div>
                ) : (
                  topScores.map((score, index) => (
                    <div
                      key={score.id}
                      className={`podium-item rank-${index + 1}`}
                    >
                      <div className="podium-rank">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </div>
                      <div className="podium-score">
                        {formatNumber(score.score, language)}
                      </div>
                      <div className="podium-date">
                        {formatDate(score.date, language, {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="recent-scores">
            <h3 className="recent-scores-title">
              📋 {getTranslation(language, "recentScores")}
            </h3>
            <div className="scores-list">
              {recentScores.length === 0 ? (
                <div className="no-scores">
                  <p>{getTranslation(language, "noGameRecords")}</p>
                  <p>{getTranslation(language, "startGameCreateRecords")}</p>
                </div>
              ) : (
                recentScores.slice(0, 8).map((score) => (
                  <div key={score.id} className="score-item">
                    <div className="score-info">
                      <div className="score-value">
                        {formatNumber(score.score, language)}
                      </div>
                      <div className="score-date">
                        {formatDate(score.date, language, {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div
                      className={`score-badge ${
                        score.score >= 9999999
                          ? "win"
                          : score.score >= 1000
                          ? "medal"
                          : "medal"
                      }`}
                    >
                      {score.score >= 9999999
                        ? getTranslation(language, "victory")
                        : score.score >= 3000
                        ? "🥇"
                        : score.score >= 1000
                        ? "🥈"
                        : "🥉"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game2048;
