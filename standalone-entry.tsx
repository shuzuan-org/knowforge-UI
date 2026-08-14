import { createRoot } from "react-dom/client";
import { KnowForgeDemo } from "./app/KnowForgeDemo";
import "./app/globals.css";

const root = document.getElementById("root");

function normalizeStandaloneBrowserZoom() {
  // Browsers remember a separate zoom level for local file pages. When this
  // standalone file is opened at (for example) 50%, its CSS viewport becomes
  // twice as wide and the whole workspace is rendered at half size. Counter
  // that file-only zoom so the exported demo keeps the same proportions as
  // the localhost version, while leaving the source app untouched.
  if (window.location.protocol !== "file:" || window.outerWidth <= 0) return;

  const browserScale = window.outerWidth / window.innerWidth;
  if (!Number.isFinite(browserScale) || browserScale < 0.25 || browserScale > 4) return;

  const correction = 1 / browserScale;
  document.documentElement.style.setProperty("--standalone-zoom", correction.toFixed(4));
  document.documentElement.classList.toggle("standalone-zoomed", Math.abs(correction - 1) > 0.04);
}

normalizeStandaloneBrowserZoom();
window.addEventListener("resize", normalizeStandaloneBrowserZoom);

if (!root) {
  throw new Error("KnowForge standalone root element was not found.");
}

createRoot(root).render(<KnowForgeDemo />);
