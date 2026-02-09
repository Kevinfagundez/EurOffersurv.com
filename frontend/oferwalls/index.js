console.log("✅ offerwalls/index.js cargado");

import { initTheorem } from "./theorem.js";
import { initTimeWall } from "./timewall.js";

const PROVIDER = "timewall"; // "theorem" | "timewall"

window.initOfferwall = async function (user) {
  console.log("✅ initOfferwall llamado con user:", user);

  if (PROVIDER === "timewall") {
    await initTimeWall(user);
    return;
  }

  await initTheorem(user);
};
