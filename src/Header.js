import React from "react";
import Login from "./Login";
import Tabs from "./Tabs";
import LanguageSwitch from "./LanguageSwitch";
import "./Header.css";

const Header = ({
  isLoggedIn,
  onLogin,
  onLogout,
  activeTab,
  onTabChange,
  isLoading,
  userInfo,
  language,
  onLanguageChange,
}) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo">
            <div className="logo-icon">2048</div>
            <div className="logo-text">
              <span className="logo-title">Clash</span>
              <span className="logo-subtitle">Global Skill Rank</span>
            </div>
          </div>
        </div>

        <div className="header-center">
          <Tabs
            activeTab={activeTab}
            onTabChange={onTabChange}
            language={language}
          />
        </div>

        <div className="header-actions">
          <LanguageSwitch
            currentLanguage={language}
            onLanguageChange={onLanguageChange}
          />
          <Login
            isLoggedIn={isLoggedIn}
            onLogin={onLogin}
            onLogout={onLogout}
            isLoading={isLoading}
            userInfo={userInfo}
            language={language}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
