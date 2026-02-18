(() => {
  try {
    const saved = window.localStorage.getItem("ag-theme-v2");
    document.documentElement.setAttribute("data-theme", saved === "light" ? "light" : "dark");
  } catch {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
