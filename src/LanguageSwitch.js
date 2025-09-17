import React from "react";
import "./LanguageSwitch.css";

const LanguageSwitch = ({ currentLanguage, onLanguageChange }) => {
  const handleLanguageToggle = () => {
    const newLanguage = currentLanguage === "zh" ? "en" : "zh";
    onLanguageChange(newLanguage);
  };

  return (
    <div className="language-switch">
      <button
        className="language-toggle-btn"
        onClick={handleLanguageToggle}
        title={currentLanguage === "zh" ? "Switch to English" : "切换到中文"}
      >
        <div className="language-icon">
          {currentLanguage === "zh" ? "中" : "EN"}
        </div>
        {}
      </button>
    </div>
  );
};

export default LanguageSwitch;
