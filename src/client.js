import axios from "axios";

const BASE_URL = {
  LOCAL: "http://localhost:8787/",
  PROD: "https://tinca-hono.devops-a89.workers.dev",
};

const API_CONFIG = {
  // BASE_URL: BASE_URL[process.env.TINCA_ENV || "LOCAL"],
  BASE_URL: BASE_URL[process.env.TINCA_ENV || "PROD"],
  TIMEOUT: 10000,
  ENDPOINTS: {
    LOGIN: "/user/login",
    HELLO: "",
    SCORE: "/score",
    SCORE_MULTIPLE: "/score/multiple",
    LEADERBOARD: "/score/leaderboard",
  },
};

const STORAGE_KEYS = {
  USER_INFO: "userInfo",
  TOKEN: "token",
};

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
      console.warn("User unauthorized, cleared local auth info");
    }
    return Promise.reject(error);
  }
);

const storageManager = {
  setUserInfo: (userInfo) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
    } catch (error) {
      console.error("Failed to save user info:", error);
    }
  },

  getUserInfo: () => {
    try {
      const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error("Failed to get user info:", error);
      return null;
    }
  },

  setToken: (token) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } catch (error) {
      console.error("Failed to save token:", error);
    }
  },

  getToken: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error("Failed to get token:", error);
      return null;
    }
  },

  clearAuth: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    } catch (error) {
      console.error("Failed to clear auth info:", error);
    }
  },

  isLoggedIn: () => {
    return !!(storageManager.getToken() && storageManager.getUserInfo());
  },
};

class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  async login(username, password) {
    try {
      if (!username || !password) {
        throw new Error("用户名和密码不能为空");
      }

      const loginData = {
        username: username.trim(),
        password: password,
      };

      console.log("Sending login request:", {
        url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`,
        data: loginData,
      });

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.LOGIN,
        loginData
      );

      console.log("Login response:", {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
      });

      if (
        (response.status === 200 || response.status === 201) &&
        response.data.data
      ) {
        const { userInfo, token } = response.data.data;

        if (userInfo) {
          storageManager.setUserInfo(userInfo);
        }
        if (token) {
          storageManager.setToken(token);
        }

        return {
          success: true,
          data: {
            userInfo,
            token,
          },
          message: "Login successful",
        };
      } else {
        throw new Error("Login response格式错误");
      }
    } catch (error) {
      let errorMessage = "Login failed";

      if (error.response) {
        const status = error.response.status;
        switch (status) {
          case 400:
            errorMessage = "请求参数错误";
            break;
          case 401:
            errorMessage = "用户名或密码错误";
            break;
          case 500:
            errorMessage = "服务器内部错误";
            break;
          default:
            errorMessage = `请求失败 (${status})`;
        }
      } else if (error.request) {
        errorMessage = "网络连接失败，请检查网络设置";
      } else {
        errorMessage = error.message || "未知错误";
      }

      return {
        success: false,
        data: null,
        message: errorMessage,
        error: error,
      };
    }
  }

  logout() {
    storageManager.clearAuth();
    return {
      success: true,
      message: "已退出登录",
    };
  }

  getCurrentUser() {
    return storageManager.getUserInfo();
  }

  isLoggedIn() {
    return storageManager.isLoggedIn();
  }

  getCurrentToken() {
    return storageManager.getToken();
  }

  async uploadScore(scoreData) {
    try {
      if (!this.isLoggedIn()) {
        return {
          success: false,
          data: null,
          message: "请先登录后再上传分数",
        };
      }

      if (
        !scoreData ||
        typeof scoreData.score !== "number" ||
        !scoreData.gameId
      ) {
        return {
          success: false,
          data: null,
          message: "分数数据格式错误",
        };
      }

      const uploadData = {
        gameId: scoreData.gameId,
        score: scoreData.score,
        timestamp: scoreData.timestamp || Date.now(),
        date: scoreData.date || new Date().toISOString().split("T")[0],
      };

      console.log("Upload score request:", {
        url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SCORE}`,
        data: uploadData,
      });

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.SCORE,
        uploadData
      );

      console.log("Score upload response:", {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });

      if (
        (response.status === 200 || response.status === 201) &&
        response.data.data
      ) {
        return {
          success: true,
          data: response.data.data,
          message: "分数上传成功",
        };
      } else {
        return {
          success: false,
          data: null,
          message: "Score upload response格式错误",
        };
      }
    } catch (error) {
      let errorMessage = "分数上传失败";

      if (error.response) {
        const status = error.response.status;
        switch (status) {
          case 400:
            errorMessage = "分数数据格式错误";
            break;
          case 401:
            errorMessage = "用户未授权，请重新登录";
            break;
          case 500:
            errorMessage = "服务器内部错误";
            break;
          default:
            errorMessage = `分数上传失败 (${status})`;
        }
      } else if (error.request) {
        errorMessage = "网络连接失败，请检查网络设置";
      } else {
        errorMessage = error.message || "未知错误";
      }

      return {
        success: false,
        data: null,
        message: errorMessage,
        error: error,
      };
    }
  }

  async uploadMultipleScores(scoresData) {
    try {
      if (!this.isLoggedIn()) {
        return {
          success: false,
          data: null,
          message: "请先登录后再上传分数",
        };
      }

      if (!Array.isArray(scoresData) || scoresData.length === 0) {
        return {
          success: false,
          data: null,
          message: "分数数据格式错误",
        };
      }

      const uploadData = {
        scores: scoresData.map((score) => ({
          gameId: score.gameId,
          score: score.score,
          timestamp: score.timestamp || Date.now(),
          date: score.date || new Date().toISOString().split("T")[0],
        })),
      };

      console.log("Batch upload scores request:", {
        url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SCORE_MULTIPLE}`,
        data: uploadData,
      });

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.SCORE_MULTIPLE,
        uploadData
      );

      console.log("Batch scores upload response:", {
        status: response.status,
        statusText: response.statusText,
        data: response.data.data,
      });

      if (
        (response.status === 200 || response.status === 201) &&
        response.data.data
      ) {
        return {
          success: true,
          data: response.data.data,
          message: "批量分数上传成功",
        };
      } else {
        return {
          success: false,
          data: null,
          message: "批量Score upload response格式错误",
        };
      }
    } catch (error) {
      let errorMessage = "批量分数上传失败";

      if (error.response) {
        const status = error.response.status;
        switch (status) {
          case 400:
            errorMessage = "分数数据格式错误";
            break;
          case 401:
            errorMessage = "用户未授权，请重新登录";
            break;
          case 500:
            errorMessage = "服务器内部错误";
            break;
          default:
            errorMessage = `批量分数上传失败 (${status})`;
        }
      } else if (error.request) {
        errorMessage = "网络连接失败，请检查网络设置";
      } else {
        errorMessage = error.message || "未知错误";
      }

      return {
        success: false,
        data: null,
        message: errorMessage,
        error: error,
      };
    }
  }

  async getUserScores(userId) {
    try {
      if (!this.isLoggedIn()) {
        return {
          success: false,
          data: null,
          message: "请先登录后再获取分数",
        };
      }

      console.log("Get user scores request:", {
        url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SCORE}?userId=${userId}`,
      });

      const response = await apiClient.get(
        `${API_CONFIG.ENDPOINTS.SCORE}?userId=${userId}`
      );

      console.log("Get user scores response:", {
        status: response.status,
        statusText: response.statusText,
        data: response.data.data,
      });

      if (response.status === 200 && response.data) {
        return {
          success: true,
          data: response.data.data,
          message: "获取用户分数成功",
        };
      } else {
        return {
          success: false,
          data: null,
          message: "Get user scores response格式错误",
        };
      }
    } catch (error) {
      let errorMessage = "获取用户分数失败";

      if (error.response) {
        const status = error.response.status;
        switch (status) {
          case 400:
            errorMessage = "请求参数错误";
            break;
          case 401:
            errorMessage = "用户未授权，请重新登录";
            break;
          case 404:
            errorMessage = "用户分数不存在";
            break;
          case 500:
            errorMessage = "服务器内部错误";
            break;
          default:
            errorMessage = `获取用户分数失败 (${status})`;
        }
      } else if (error.request) {
        errorMessage = "网络连接失败，请检查网络设置";
      } else {
        errorMessage = error.message || "未知错误";
      }

      return {
        success: false,
        data: null,
        message: errorMessage,
        error: error,
      };
    }
  }

  async getLeaderboard() {
    try {
      console.log("Get leaderboard request:", {
        url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LEADERBOARD}`,
      });

      const response = await apiClient.get(API_CONFIG.ENDPOINTS.LEADERBOARD);

      console.log("Get leaderboard response:", {
        status: response.status,
        statusText: response.statusText,
        data: response.data.data,
      });

      if (response.status === 200 && response.data) {
        return {
          success: true,
          data: response.data.data,
          message: "获取排行榜成功",
        };
      } else {
        return {
          success: false,
          data: null,
          message: "Get leaderboard response格式错误",
        };
      }
    } catch (error) {
      let errorMessage = "Failed to get leaderboard";

      if (error.response) {
        const status = error.response.status;
        switch (status) {
          case 400:
            errorMessage = "请求参数错误";
            break;
          case 500:
            errorMessage = "服务器内部错误";
            break;
          default:
            errorMessage = `Failed to get leaderboard (${status})`;
        }
      } else if (error.request) {
        errorMessage = "网络连接失败，请检查网络设置";
      } else {
        errorMessage = error.message || "未知错误";
      }

      return {
        success: false,
        data: null,
        message: errorMessage,
        error: error,
      };
    }
  }

  async testConnection() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.HELLO);
      return {
        success: true,
        data: response.data.data,
        message: "连接测试成功",
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: "连接测试失败",
        error: error,
      };
    }
  }
}

const apiClientInstance = new ApiClient();

export default apiClientInstance;
export { storageManager, API_CONFIG, STORAGE_KEYS };
