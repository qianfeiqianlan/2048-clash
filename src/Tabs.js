import React from "react";
import "./Tabs.css";
import { getTranslation } from "./languages";

const Tabs = ({ activeTab, onTabChange, language = "zh" }) => {
  const tabs = [
    { id: "game", labelKey: "game", icon: "🎮" },
    { id: "globalRank", labelKey: "globalRank", icon: "🌍" },
  ];

  return (
    <div className="tabs-container">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-item ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">
            {getTranslation(language, tab.labelKey)}
          </span>
        </button>
      ))}
    </div>
  );
};

export default Tabs;
