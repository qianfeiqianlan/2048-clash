

import apiClient from "./client";
import { generateBrowserId } from "./utils";

class ScoreManager {
  constructor() {
    this.BASE_STORAGE_KEY = "game2048_scores";
    this.MAX_RECORDS = 1000; 
    this.SCORE_LOADED = false;
  }

  getStorageKey() {
    const browserId = generateBrowserId();

    if (apiClient.isLoggedIn()) {
      const currentUser = apiClient.getCurrentUser();
      if (currentUser && currentUser.username && currentUser.id) {
        return `${this.BASE_STORAGE_KEY}_${currentUser.username}_${currentUser.id}_${browserId}`;
      }
    }

    return `${this.BASE_STORAGE_KEY}_${browserId}`;
  }

  generateGameId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async saveScore(score, options = {}) {
    const gameId = options.gameId || this.generateGameId();
    const timestamp = options.timestamp || Date.now();
    const uploadToServer = options.uploadToServer !== false; 

    const scoreRecord = {
      gameId,
      score,
      timestamp,
      date: new Date(timestamp).toISOString(),
      createdAt: Date.now(),
    };

    try {
      const existingScores = await this.getAllScores();
      const updatedScores = [scoreRecord, ...existingScores];
      const limitedScores = updatedScores.slice(0, this.MAX_RECORDS);
      localStorage.setItem(this.getStorageKey(), JSON.stringify(limitedScores));
    } catch (error) {
      console.error("Failed to save score locally:", error);
      throw new Error("Failed to save score locally");
    }

    if (uploadToServer && apiClient.isLoggedIn()) {
      try {
        console.log("Trying to upload score to server...");
        const uploadResult = await apiClient.uploadScore(scoreRecord);

        if (uploadResult.success) {
          console.log("✅ Score uploaded successfully:", uploadResult.data);
          
          const updatedRecord = {
            ...scoreRecord,
            serverId: uploadResult.data.id,
            userId: uploadResult.data.userId,
            uploadedAt: Date.now(),
          };

          this.updateLocalRecord(gameId, updatedRecord);

          return updatedRecord;
        } else {
          console.warn("⚠️ Score upload failed:", uploadResult.message);
          
          const failedRecord = {
            ...scoreRecord,
            uploadFailed: true,
            uploadError: uploadResult.message,
          };
          this.updateLocalRecord(gameId, failedRecord);
          return failedRecord;
        }
      } catch (error) {
        console.error("❌ Score upload error:", error);
        
        const errorRecord = {
          ...scoreRecord,
          uploadFailed: true,
          uploadError: error.message,
        };
        this.updateLocalRecord(gameId, errorRecord);
        return errorRecord;
      }
    } else if (uploadToServer && !apiClient.isLoggedIn()) {
      console.log("User not logged in, save to local storage only");
      const localOnlyRecord = {
        ...scoreRecord,
        localOnly: true,
      };
      this.updateLocalRecord(gameId, localOnlyRecord);
      return localOnlyRecord;
    }

    return scoreRecord;
  }

  async updateLocalRecord(gameId, updatedRecord) {
    try {
      const scores = await this.getAllScores();
      const updatedScores = scores.map((record) =>
        record.gameId === gameId ? updatedRecord : record
      );
      localStorage.setItem(this.getStorageKey(), JSON.stringify(updatedScores));
    } catch (error) {
      console.error("Failed to update local record:", error);
    }
  }

  async getAllScores() {
    try {
      
      if (!this.SCORE_LOADED && apiClient.isLoggedIn()) {
        console.log("Starting to sync score data...");

        try {
          
          const currentUser = apiClient.getCurrentUser();
          if (!currentUser || !currentUser.id) {
            console.warn("Cannot get user ID, skip data sync");
            return this.getLocalScores();
          }

          const localScores = this.getLocalScores();

          if (localScores.length > 0) {
            console.log(
              `Found ${localScores.length} local scores, starting upload to server...`
            );
            const uploadResult = await apiClient.uploadMultipleScores(
              localScores
            );

            if (uploadResult.success) {
              console.log("✅ Local score upload successful");
            } else {
              console.warn("⚠️ Local score upload failed:", uploadResult.message);
            }
          }

          console.log("Getting user scores from server...");
          const serverResult = await apiClient.getUserScores(currentUser.id);

          if (
            serverResult.success &&
            serverResult.data &&
            serverResult.data.scores
          ) {
            const serverScores = serverResult.data.scores;
            console.log(`Got ${serverScores.length} scores from server`);

            const formattedScores = serverScores.map((score) => ({
              gameId: score.gameId,
              score: score.score,
              timestamp: score.timestamp,
              date: score.date,
              createdAt: score.createdAt,
              serverId: score.id,
              userId: score.userId,
              uploadedAt: Date.now(),
            }));

            localStorage.setItem(
              this.getStorageKey(),
              JSON.stringify(formattedScores)
            );
            console.log("✅ Server scores saved to local storage");

            this.SCORE_LOADED = true;

            return formattedScores;
          } else {
            console.warn("⚠️ Failed to get scores from server:", serverResult.message);
            
            return localScores;
          }
        } catch (error) {
          console.error("❌ Data sync error:", error);
          
          return this.getLocalScores();
        }
      }

      return this.getLocalScores();
    } catch (error) {
      console.error("Failed to read score records:", error);
      return [];
    }
  }

  getLocalScores() {
    try {
      const scores = localStorage.getItem(this.getStorageKey());
      return scores ? JSON.parse(scores) : [];
    } catch (error) {
      console.error("Failed to read local score records:", error);
      return [];
    }
  }

  async getStatistics() {
    const scores = await this.getAllScores();

    if (scores.length === 0) {
      return {
        totalGames: 0,
        highestScore: 0,
        averageScore: 0,
        lowestScore: 0,
        totalScore: 0,
        winCount: 0,
        winRate: 0,
      };
    }

    const scoreValues = scores.map((record) => record.score);
    const totalScore = scoreValues.reduce((sum, score) => sum + score, 0);
    const winCount = scoreValues.filter((score) => score >= 2048).length;

    return {
      totalGames: scores.length,
      highestScore: Math.max(...scoreValues),
      averageScore: Math.round(totalScore / scores.length),
      lowestScore: Math.min(...scoreValues),
      totalScore,
      winCount,
      winRate: Math.round((winCount / scores.length) * 100),
    };
  }

  async getRecentScores(count = 10) {
    const scores = await this.getAllScores();
    return scores.slice(0, count);
  }

  async getTopScores(count = 3) {
    const scores = await this.getAllScores();
    return scores.sort((a, b) => b.score - a.score).slice(0, count);
  }

  async getScoreByGameId(gameId) {
    const scores = await this.getAllScores();
    return scores.find((record) => record.gameId === gameId) || null;
  }

  async deleteScore(gameId) {
    const scores = await this.getAllScores();
    const filteredScores = scores.filter((record) => record.gameId !== gameId);

    if (filteredScores.length === scores.length) {
      return false; 
    }

    try {
      localStorage.setItem(
        this.getStorageKey(),
        JSON.stringify(filteredScores)
      );
      return true;
    } catch (error) {
      console.error("Failed to delete record:", error);
      return false;
    }
  }

  clearAllScores() {
    try {
      localStorage.removeItem(this.getStorageKey());
      return true;
    } catch (error) {
      console.error("Failed to clear records:", error);
      return false;
    }
  }

  async exportData() {
    const scores = await this.getAllScores();
    return JSON.stringify(
      {
        exportTime: new Date().toISOString(),
        totalRecords: scores.length,
        scores,
      },
      null,
      2
    );
  }

  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      if (!data.scores || !Array.isArray(data.scores)) {
        throw new Error("Invalid data format");
      }

      const isValid = data.scores.every(
        (record) =>
          record.gameId && typeof record.score === "number" && record.timestamp
      );

      if (!isValid) {
        throw new Error("Data format validation failed");
      }

      localStorage.setItem(this.getStorageKey(), JSON.stringify(data.scores));
      return true;
    } catch (error) {
      console.error("Failed to import data:", error);
      return false;
    }
  }

  async getScoresByDateRange(startDate, endDate) {
    const scores = await this.getAllScores();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    return scores.filter((record) => {
      const recordTime = record.timestamp;
      return recordTime >= startTime && recordTime <= endTime;
    });
  }

  async getTodayScores() {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    return await this.getScoresByDateRange(startOfDay, endOfDay);
  }

  async getThisWeekScores() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return await this.getScoresByDateRange(startOfWeek, endOfWeek);
  }

  async retryFailedUploads() {
    if (!apiClient.isLoggedIn()) {
      return {
        success: false,
        message: "Please login first before retrying upload",
        retriedCount: 0,
      };
    }

    const scores = await this.getAllScores();
    const failedScores = scores.filter(
      (score) => score.uploadFailed && !score.serverId
    );

    if (failedScores.length === 0) {
      return {
        success: true,
        message: "No scores need to retry",
        retriedCount: 0,
      };
    }

    console.log(`Found ${failedScores.length} failed upload scores, starting retry...`);

    let successCount = 0;
    let failCount = 0;

    for (const score of failedScores) {
      try {
        const uploadResult = await apiClient.uploadScore(score);

        if (uploadResult.success) {
          const updatedRecord = {
            ...score,
            serverId: uploadResult.data.id,
            userId: uploadResult.data.userId,
            uploadedAt: Date.now(),
            uploadFailed: false,
            uploadError: null,
          };

          this.updateLocalRecord(score.gameId, updatedRecord);
          successCount++;
          console.log(`✅ Retry successful: ${score.gameId}`);
        } else {
          failCount++;
          console.warn(
            `❌ Retry failed: ${score.gameId} - ${uploadResult.message}`
          );
        }
      } catch (error) {
        failCount++;
        console.error(`❌ Retry error: ${score.gameId} - ${error.message}`);
      }
    }

    return {
      success: failCount === 0,
      message: `Retry completed: ${successCount} successful, ${failCount} failed`,
      retriedCount: successCount,
      failedCount: failCount,
    };
  }

  async batchUploadScores(scores = null) {
    if (!apiClient.isLoggedIn()) {
      return {
        success: false,
        message: "Please login first before uploading scores",
        uploadedCount: 0,
      };
    }

    const scoresToUpload = scores || (await this.getAllScores());
    const localOnlyScores = scoresToUpload.filter(
      (score) => score.localOnly || (!score.serverId && !score.uploadFailed)
    );

    if (localOnlyScores.length === 0) {
      return {
        success: true,
        message: "No scores need to upload",
        uploadedCount: 0,
      };
    }

    console.log(`Starting batch upload ${localOnlyScores.length} scores from server...`);

    try {
      const uploadResult = await apiClient.uploadMultipleScores(
        localOnlyScores
      );

      if (uploadResult.success) {
        
        const serverScores = uploadResult.data;
        serverScores.forEach((serverScore, index) => {
          const localScore = localOnlyScores[index];
          if (localScore) {
            const updatedRecord = {
              ...localScore,
              serverId: serverScore.id,
              userId: serverScore.userId,
              uploadedAt: Date.now(),
              uploadFailed: false,
              uploadError: null,
            };
            this.updateLocalRecord(localScore.gameId, updatedRecord);
          }
        });

        console.log(`✅ Batch upload successful: ${serverScores.length} scores`);
        return {
          success: true,
          message: `Batch upload successful: ${serverScores.length} scores`,
          uploadedCount: serverScores.length,
        };
      } else {
        console.error("❌ Batch upload failed:", uploadResult.message);
        return {
          success: false,
          message: uploadResult.message,
          uploadedCount: 0,
        };
      }
    } catch (error) {
      console.error("❌ Batch upload error:", error);
      return {
        success: false,
        message: error.message,
        uploadedCount: 0,
      };
    }
  }

  async syncFromServer(userId) {
    if (!apiClient.isLoggedIn()) {
      return {
        success: false,
        message: "Please login first before syncing scores",
        syncedCount: 0,
      };
    }

    try {
      const result = await apiClient.getUserScores(userId);

      if (result.success && result.data.scores) {
        const serverScores = result.data.scores;
        const localScores = await this.getAllScores();

        let syncedCount = 0;
        serverScores.forEach((serverScore) => {
          const exists = localScores.some(
            (localScore) =>
              localScore.serverId === serverScore.id ||
              (localScore.gameId === serverScore.gameId &&
                localScore.score === serverScore.score)
          );

          if (!exists) {
            const localRecord = {
              gameId: serverScore.gameId,
              score: serverScore.score,
              timestamp: serverScore.timestamp,
              date: serverScore.date,
              createdAt: serverScore.createdAt,
              serverId: serverScore.id,
              userId: serverScore.userId,
              uploadedAt: Date.now(),
            };

            const updatedScores = [localRecord, ...localScores];
            const limitedScores = updatedScores.slice(0, this.MAX_RECORDS);
            localStorage.setItem(
              this.getStorageKey(),
              JSON.stringify(limitedScores)
            );
            localScores.unshift(localRecord);
            syncedCount++;
          }
        });

        console.log(`✅ Synced ${syncedCount} scores from server`);
        return {
          success: true,
          message: `Sync completed: added ${syncedCount} scores from server`,
          syncedCount,
        };
      } else {
        return {
          success: false,
          message: result.message || "Sync failed",
          syncedCount: 0,
        };
      }
    } catch (error) {
      console.error("❌ Score sync error:", error);
      return {
        success: false,
        message: error.message,
        syncedCount: 0,
      };
    }
  }
}

const scoreManager = new ScoreManager();

export default scoreManager;
export { ScoreManager };
