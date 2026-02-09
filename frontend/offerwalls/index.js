console.log("✅ offerwalls/index.js cargado");

import { initTheorem } from "./theorem.js";
import { initTimeWall } from "./timewall.js";

const PROVIDER = "timewall"; // "theorem" | "timewall"

document.addEventListener("DOMContentLoaded", async () => {
  if (PROVIDER === "timewall") {
    await initTimeWall();
  } else {
    await initTheorem();
  }
});
