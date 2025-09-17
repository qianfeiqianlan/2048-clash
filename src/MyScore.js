import React, { useState, useEffect } from "react";
import "./MyScore.css";
import { getTranslation } from "./languages";
import { formatNumber, formatDateTime } from "./utils";

const MyScore = ({ userInfo, gameScore, language = "zh" }) => {
  const [scores, setScores] = useState([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    bestScore: 0,
    averageScore: 0,
    winRate: 0,
    currentStreak: 0,
    bestStreak: 0,
  });

  useEffect(() => {
    
    const savedScores = JSON.parse(localStorage.getItem("userScores") || "[]");
    setScores(savedScores);

    if (savedScores.length > 0) {
      const bestScore = Math.max(...savedScores.map((s) => s.score));
      const averageScore =
        savedScores.reduce((sum, s) => sum + s.score, 0) / savedScores.length;
      const wins = savedScores.filter((s) => s.score >= 2048).length;
      const winRate = (wins / savedScores.length) * 100;

      setStats({
        totalGames: savedScores.length,
        bestScore,
        averageScore: Math.round(averageScore),
        winRate: Math.round(winRate),
        currentStreak: 0, 
        bestStreak: 0,
      });
    }
  }, []);

  const saveScore = (score) => {
    const newScore = {
      id: Date.now(),
      score,
      date: new Date().toISOString(),
      timestamp: Date.now(),
    };

    const updatedScores = [newScore, ...scores].slice(0, 50); 
    setScores(updatedScores);
    localStorage.setItem("userScores", JSON.stringify(updatedScores));
  };

  const formatDate = (dateString) => {
    return formatDateTime(dateString, language);
  };

  return (
    <div className="my-score-container">
      <div className="score-header">
        <h2>{getTranslation(language, "myScoreRecords")}</h2>
        <p>
          {getTranslation(language, "welcomeBack")},{" "}
          {userInfo?.username || getTranslation(language, "player")}
        </p>
      </div>

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
          <div className="stat-icon">📊</div>
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
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{stats.winRate}%</div>
            <div className="stat-label">
              {getTranslation(language, "winRate")}
            </div>
          </div>
        </div>
      </div>

      <div className="recent-scores">
        <h3>{getTranslation(language, "recentGameRecords")}</h3>
        <div className="scores-list">
          {scores.length === 0 ? (
            <div className="no-scores">
              <p>{getTranslation(language, "noGameRecords")}</p>
              <p>{getTranslation(language, "startGameCreateFirstRecord")}</p>
            </div>
          ) : (
            scores.slice(0, 10).map((score) => (
              <div key={score.id} className="score-item">
                <div className="score-info">
                  <div className="score-value">
                    {formatNumber(score.score, language)}
                  </div>
                  <div className="score-date">{formatDate(score.date)}</div>
                </div>
                <div
                  className={`score-badge ${
                    score.score >= 2048 ? "win" : "lose"
                  }`}
                >
                  {score.score >= 2048
                    ? getTranslation(language, "victory")
                    : getTranslation(language, "defeat")}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyScore;
