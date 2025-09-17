import React, { useState, useEffect } from "react";
import "./GlobalRank.css";
import apiClient from "./client";
import { getTranslation } from "./languages";
import { formatNumber } from "./utils";
import { getCountryFlag } from "./country";

const GlobalRank = ({ userInfo, language = "zh" }) => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);
  const [error, setError] = useState(null);
  const [displayCount, setDisplayCount] = useState(20);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const result = await apiClient.getLeaderboard();

        if (result.success && result.data) {
          const { topScores } = result.data;

          const formattedRankings = topScores.map((userScore, index) => ({
            id: userScore.userId,
            username: userScore.username,
            score: userScore.highestScore,
            country: getCountryFlag(userScore.country), 
            level: userScore.level,
            rank: index + 1,
          }));

          setRankings(formattedRankings);

          if (userInfo) {
            const currentUserRank = formattedRankings.find(
              (ranking) => ranking.id === userInfo.id
            );

            if (currentUserRank) {
              setUserRank({
                rank: currentUserRank.rank,
                username: currentUserRank.username,
                score: currentUserRank.score,
                country: currentUserRank.country,
                level: currentUserRank.level,
              });
            } else {
              
              // setUserRank({
              //   rank: Math.floor(Math.random() * 50) + 101,
              //   username: userInfo.username,
              //   score: Math.floor(Math.random() * 1000) + 100,
              //   country: "🌍",
              //   level: "Beginner",
              // });
            }
          }
        } else {
          console.error("Failed to get leaderboard:", result.message);
          setError(result.message);
          setRankings([]);
        }
      } catch (error) {
        console.error("Error occurred while getting leaderboard:", error);
        setError(getTranslation(language, "loadFailed"));
        setRankings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [userInfo, language]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    
    setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + 20, rankings.length));
      setLoadingMore(false);
    }, 500);
  };

  const hasMoreData = displayCount < rankings.length;

  const getLevelColor = (level) => {
    switch (level) {
      case "Legend":
        return "#ffd700";
      case "Master":
        return "#c0c0c0";
      case "Expert":
        return "#cd7f32";
      case "Advanced":
        return "#4ade80";
      case "Intermediate":
        return "#3b82f6";
      case "Beginner":
        return "#a0a0a0";
      default:
        return "#a0a0a0";
    }
  };

  const getRankIcon = (rank) => {
    if (rank <= 3) {
      const icons = ["🥇", "🥈", "🥉"];
      return icons[rank - 1];
    }
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="global-rank-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{getTranslation(language, "loadingGlobalRank")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="global-rank-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>{getTranslation(language, "loadFailed")}</h3>
          <p>{error}</p>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            {getTranslation(language, "retry")}
          </button>
        </div>
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="global-rank-container">
        <div className="empty-container">
          <div className="empty-icon">📊</div>
          <h3>{getTranslation(language, "noRankingData")}</h3>
          <p>{getTranslation(language, "beFirstPlayer")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="global-rank-container">
      <div className="rank-header">
        <h2>{getTranslation(language, "globalSkillRank")}</h2>
        <p>{getTranslation(language, "competeWithGlobalPlayers")}</p>
      </div>

      {userRank && (
        <div className="user-rank-card">
          <div className="user-rank-info">
            <div className="user-rank-icon">{getRankIcon(userRank.rank)}</div>
            <div className="user-rank-details">
              <div className="user-rank-name">{userRank.username}</div>
              <div className="user-rank-score">
                {formatNumber(userRank.score, language)}{" "}
                {getTranslation(language, "points")}
              </div>
            </div>
            <div
              className="user-rank-level"
              style={{ color: getLevelColor(userRank.level) }}
            >
              {userRank.level}
            </div>
          </div>
        </div>
      )}

      <div className="rankings-list">
        <div className="rankings-header">
          <div className="rank-col">{getTranslation(language, "rank")}</div>
          <div className="player-col">{getTranslation(language, "player")}</div>
          <div className="score-col">{getTranslation(language, "score")}</div>
          <div className="level-col">{getTranslation(language, "level")}</div>
        </div>

        {rankings.slice(0, displayCount).map((player, index) => (
          <div
            key={player.id}
            className={`ranking-item ${index < 3 ? "top-three" : ""}`}
          >
            <div className="rank-col">
              <span className="rank-number">{getRankIcon(player.rank)}</span>
            </div>
            <div className="player-col">
              <div className="player-info">
                <span className="player-flag">{player.country}</span>
                <span className="player-name">{player.username}</span>
              </div>
            </div>
            <div className="score-col">
              <span className="player-score">
                {formatNumber(player.score, language)}
              </span>
            </div>
            <div className="level-col">
              <span
                className="player-level"
                style={{ color: getLevelColor(player.level) }}
              >
                {player.level}
              </span>
            </div>
          </div>
        ))}
      </div>

      {}
      {hasMoreData && (
        <div className="load-more-container">
          <button
            className="load-more-button"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <div className="loading-spinner-small"></div>
                {getTranslation(language, "loading")}
              </>
            ) : (
              <>
                <span className="load-more-icon">⬇️</span>
                {getTranslation(language, "showMore")} (
                {rankings.length - displayCount}{" "}
                {getTranslation(language, "remaining")})
              </>
            )}
          </button>
        </div>
      )}

      <div className="rank-footer">
        <p>{getTranslation(language, "rankUpdateEvery5Min")}</p>
        <p>{getTranslation(language, "continueGameImproveRank")}</p>
      </div>
    </div>
  );
};

export default GlobalRank;
