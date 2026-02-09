console.log("✅ offerwalls/index.js cargado");

import { initTheorem } from "./theorem.js";
import { initTimeWall } from "./timewall.js";

const PROVIDER = "timewall"; // "theorem" | "timewall"

// ✅ Lo llama app.js cuando ya hay sesión y user listo
window.initOfferwall = async function initOfferwall(user) {
  console.log("✅ initOfferwall llamado con user:", user);

  if (PROVIDER === "timewall") {
    await initTimeWall(user);
    return;
  }

  await initTheorem(user);
};
