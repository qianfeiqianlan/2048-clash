

export const formatNumber = (number, language = "zh") => {
  const locale = language === "zh" ? "zh-CN" : "en-US";
  return number.toLocaleString(locale);
};

export const formatDate = (dateString, language = "zh", options = {}) => {
  const locale = language === "zh" ? "zh-CN" : "en-US";
  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };
  return new Date(dateString).toLocaleDateString(locale, defaultOptions);
};

export const formatDateTime = (dateString, language = "zh", options = {}) => {
  const locale = language === "zh" ? "zh-CN" : "en-US";
  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };
  return new Date(dateString).toLocaleDateString(locale, defaultOptions);
};

export const generateBrowserId = () => {
  
  const existingId = localStorage.getItem("browser_unique_id");
  if (existingId) {
    return existingId;
  }

  const features = [
    navigator.userAgent,
    navigator.language,
    // screen.width + "x" + screen.height,
    // screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.platform,
    navigator.hardwareConcurrency || "unknown",
  ];

  const hash = features
    .join("|")
    .split("")
    .reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

  const randomSuffix = Math.random().toString(36).substr(2, 9);
  const browserId = `browser_${Math.abs(hash).toString(36)}_${randomSuffix}`;

  localStorage.setItem("browser_unique_id", browserId);

  return browserId;
};
