import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Apply theme before rendering to avoid flash（light / dark / system 三态）
const storedTheme = localStorage.getItem("treedoctor-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const resolved = storedTheme === "dark" || storedTheme === "light"
  ? storedTheme
  : prefersDark ? "dark" : "light"; // 未设置或 "system" → 跟随系统
if (resolved === "dark") {
  document.documentElement.classList.add("dark");
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
