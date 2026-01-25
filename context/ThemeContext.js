import React, { createContext, useContext } from "react";
import { darkColors } from "../theme";

// Theme Context with full functionality
export const ThemeContext = createContext({
  isDark: true,
  toggleTheme: () => {},
  colors: darkColors,
});

export const useAppTheme = () => useContext(ThemeContext);
