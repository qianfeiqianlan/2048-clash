import React, { useState, useEffect } from "react";
import "./Login.css";
import { getTranslation } from "./languages";

const Login = ({
  onLogin,
  isLoggedIn,
  onLogout,
  isLoading,
  userInfo,
  language = "zh",
}) => {
  const [isLoginFormVisible, setIsLoginFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password.trim()) {
      setLoginError(getTranslation(language, "pleaseEnterUsernamePassword"));
      return;
    }

    if (isSubmitting) {
      return; 
    }

    try {
      setIsSubmitting(true);
      setLoginError("");

      await onLogin(formData);

      setIsLoginFormVisible(false);
      setFormData({ username: "", password: "" });
    } catch (error) {
      console.error("Login processing failed:", error);
      setLoginError(getTranslation(language, "loginErrorMsg"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isLoginFormVisible) {
        setIsLoginFormVisible(false);
      }
    };

    if (isLoginFormVisible) {
      document.addEventListener("keydown", handleKeyDown);
      
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isLoginFormVisible]);

  if (isLoggedIn) {
    return (
      <div className="login-container">
        <div className="user-info">
          <span className="username">
            {getTranslation(language, "welcome")},{" "}
            {userInfo?.username ||
              userInfo?.name ||
              getTranslation(language, "username")}
          </span>
          <button
            className="logout-btn"
            onClick={handleLogout}
            disabled={isLoading}
          >
            {isLoading
              ? getTranslation(language, "processing")
              : getTranslation(language, "logout")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <button
        className="login-toggle-btn"
        onClick={() => setIsLoginFormVisible(!isLoginFormVisible)}
      >
        {getTranslation(language, "login")}
      </button>

      {isLoginFormVisible && (
        <div
          className="login-overlay"
          onClick={() => setIsLoginFormVisible(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="login-form-container"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setIsLoginFormVisible(false)}
            >
              ×
            </button>
            <div className="login-form-header">
              <h3>2048 Clash</h3>
              <p>{getTranslation(language, "globalSkillRank")}</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {}
              {loginError && <div className="error-message">{loginError}</div>}

              <div className="input-group">
                <input
                  type="text"
                  name="username"
                  placeholder={getTranslation(language, "username")}
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
                  placeholder={getTranslation(language, "password")}
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
                  ? getTranslation(language, "loggingIn")
                  : getTranslation(language, "loginButton")}
              </button>
            </form>

            <div className="login-form-footer">
              <p>{getTranslation(language, "experienceGlobal")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
