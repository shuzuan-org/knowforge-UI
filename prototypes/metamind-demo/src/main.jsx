import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./Workbench.jsx";
import "./series-colors.css";
import "./series-radii.css";
import "./series-actions.css";
import "./action-icons.css";
import "./navigation-type.css";
import "./chinese-font.css";
import "./reference-typography.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
