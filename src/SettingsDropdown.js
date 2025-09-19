import React, { useState, useRef, useEffect } from "react";
import { getTranslation } from "./languages";
import "./SettingsDropdown.css";

const SettingsDropdown = ({
  currentLanguage,
  onLanguageChange,
  isLoggedIn,
  onLogin,
  onLogout,
  isLoading,
  userInfo,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ESC 键关闭登录表单
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && showLoginForm) {
        handleCloseLoginForm();
      }
    };

    if (showLoginForm) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [showLoginForm]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageSelect = (language) => {
    onLanguageChange(language);
    setIsOpen(false);
  };

  const handleLoginClick = () => {
    setShowLoginForm(true);
    setIsOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (loginError) {
      setLoginError("");
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password.trim()) {
      setLoginError(
        getTranslation(currentLanguage, "pleaseEnterUsernamePassword") ||
          "请输入用户名和密码"
      );
      return;
    }

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setLoginError("");

      await onLogin(formData);

      setShowLoginForm(false);
      setFormData({ username: "", password: "" });
    } catch (error) {
      console.error("Login processing failed:", error);
      setLoginError(
        getTranslation(currentLanguage, "loginErrorMsg") ||
          "登录过程中发生错误，请重试"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseLoginForm = () => {
    setShowLoginForm(false);
    setFormData({ username: "", password: "" });
    setLoginError("");
    setIsSubmitting(false);
  };

  return (
    <div className="settings-dropdown" ref={dropdownRef}>
      <button
        className="settings-toggle-btn"
        onClick={handleToggle}
        title={getTranslation(currentLanguage, "settings") || "设置"}
      >
        <svg
          className="settings-icon"
          viewBox="0 0 24 24"
          fill="currentColor"
          width="20"
          height="20"
        >
          <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
        </svg>
        <svg
          className={`dropdown-arrow ${isOpen ? "open" : ""}`}
          viewBox="0 0 24 24"
          fill="currentColor"
          width="16"
          height="16"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {isOpen && (
        <div className="settings-dropdown-menu">
          {/* 用户信息部分 */}
          <div className="dropdown-section">
            {isLoggedIn && userInfo ? (
              <>
                <div className="user-info">
                  <div className="user-avatar">
                    {userInfo.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <div className="username">{userInfo.username}</div>
                    <div className="user-status">
                      {getTranslation(currentLanguage, "welcomeBack") ||
                        "欢迎回来"}
                    </div>
                  </div>
                </div>
                <button
                  className="dropdown-item logout-item"
                  onClick={handleLogoutClick}
                >
                  <svg
                    className="logout-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="18"
                    height="18"
                  >
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                  </svg>
                  <span>
                    {getTranslation(currentLanguage, "logout") || "退出"}
                  </span>
                </button>
              </>
            ) : (
              <button
                className="dropdown-item login-item"
                onClick={handleLoginClick}
                disabled={isLoading}
              >
                <svg
                  className="login-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="18"
                  height="18"
                >
                  <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v12z" />
                </svg>
                <span>
                  {isLoading
                    ? getTranslation(currentLanguage, "loggingIn") ||
                      "登录中..."
                    : getTranslation(currentLanguage, "login") || "登录"}
                </span>
              </button>
            )}
          </div>

          <div className="dropdown-divider"></div>

          {/* 语言选择部分 */}
          <div className="dropdown-section">
            <div className="dropdown-section-title">
              {getTranslation(currentLanguage, "language") || "语言"}
            </div>
            <button
              className={`dropdown-item ${
                currentLanguage === "zh" ? "active" : ""
              }`}
              onClick={() => handleLanguageSelect("zh")}
            >
              <span className="language-flag">🇨🇳</span>
              <span className="language-name">中文</span>
              {currentLanguage === "zh" && (
                <svg
                  className="check-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="16"
                  height="16"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </button>
            <button
              className={`dropdown-item ${
                currentLanguage === "en" ? "active" : ""
              }`}
              onClick={() => handleLanguageSelect("en")}
            >
              <span className="language-flag">🇺🇸</span>
              <span className="language-name">English</span>
              {currentLanguage === "en" && (
                <svg
                  className="check-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="16"
                  height="16"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 登录表单模态框 */}
      {showLoginForm && (
        <div className="login-overlay" onClick={handleCloseLoginForm}>
          <div
            className="login-form-container"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={handleCloseLoginForm}>
              ×
            </button>
            <div className="login-form-header">
              <h3>2048 Clash</h3>
              <p>
                {getTranslation(currentLanguage, "globalSkillRank") ||
                  "全球技能排行榜"}
              </p>
            </div>

            <form className="login-form" onSubmit={handleLoginSubmit}>
              {loginError && <div className="error-message">{loginError}</div>}

              <div className="input-group">
                <input
                  type="text"
                  name="username"
                  placeholder={
                    getTranslation(currentLanguage, "username") || "用户名"
                  }
                  value={formData.username}
                  onChange={handleInputChange}
                  className="login-input"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="input-group">
                <input
                  type="password"
                  name="password"
                  placeholder={
                    getTranslation(currentLanguage, "password") || "密码"
                  }
                  value={formData.password}
                  onChange={handleInputChange}
                  className="login-input"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <button
                type="submit"
                className="login-submit-btn"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting
                  ? getTranslation(currentLanguage, "loggingIn") || "登录中..."
                  : getTranslation(currentLanguage, "loginButton") || "登录"}
              </button>
            </form>

            <div className="login-form-footer">
              <p>
                {getTranslation(currentLanguage, "experienceGlobal") ||
                  "体验全球最刺激的 2048 竞技"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsDropdown;
