import { Store } from "@tanstack/store";

// Get initial theme from localStorage or system preference
const getInitialTheme = () => {
  if (typeof window === "undefined") return false;

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    return savedTheme === "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

// Create a singleton store
const createThemeStore = () => {
  const store = new Store({
    isDarkMode: getInitialTheme(),
  });

  // Initialize theme on store creation
  if (store.state.isDarkMode) {
    document.documentElement.classList.add("dark");
  }

  return store;
};

// Export a singleton instance
export const themeStore = createThemeStore();

export const toggleTheme = () => {
  themeStore.setState((state) => {
    const newIsDarkMode = !state.isDarkMode;
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", newIsDarkMode ? "dark" : "light");
    return { isDarkMode: newIsDarkMode };
  });
};
