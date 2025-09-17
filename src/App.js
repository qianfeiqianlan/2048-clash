import React, { useState, useEffect } from "react";
import "./App.css";
import Header from "./Header";
import Game2048 from "./Game2048";
import GlobalRank from "./GlobalRank";
import apiClient from "./client";
import { getTranslation } from "./languages";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("game");
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState(() => {
    
    return localStorage.getItem("app-language") || "zh";
  });

  useEffect(() => {
    const checkLoginStatus = () => {
      try {
        const loggedIn = apiClient.isLoggedIn();
        const currentUser = apiClient.getCurrentUser();

        if (loggedIn && currentUser) {
          setIsLoggedIn(true);
          setUserInfo(currentUser);
        }
      } catch (error) {
        console.error("Check login status failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLogin = async (loginData) => {
    try {
      setIsLoading(true);
      const result = await apiClient.login(
        loginData.username,
        loginData.password
      );

      if (result.success) {
        setUserInfo(result.data.userInfo);
        setIsLoggedIn(true);
        console.log("Login successful:", result.data);
      } else {
        console.error("Login failed:", result.message);
        
        alert(`Login failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("登录过程中发生异常，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      const result = apiClient.logout();
      setUserInfo(null);
      setIsLoggedIn(false);
      window.location.reload();
      console.log(result.message);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem("app-language", newLanguage);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "game":
        return <Game2048 userInfo={userInfo} language={language} />;
      case "globalRank":
        return <GlobalRank userInfo={userInfo} language={language} />;
      default:
        return <Game2048 userInfo={userInfo} language={language} />;
    }
  };

  if (isLoading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{getTranslation(language, "loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Header
        isLoggedIn={isLoggedIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isLoading={isLoading}
        userInfo={userInfo}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
      <main className="app-main">{renderContent()}</main>
    </div>
  );
}

export default App;
