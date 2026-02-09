import { createTheoremProvider } from "./theorem.js";
import { createTimewallProvider } from "./timewall.js";

const providers = {
  theorem: createTheoremProvider(),
  timewall: createTimewallProvider(),
};

let active = null;

export async function initOfferwall(user, defaultProvider = "theorem") {
  await switchOfferwall(defaultProvider, user);
}

export async function switchOfferwall(name, user) {
  const next = providers[name];
  if (!next) throw new Error(`Provider inválido: ${name}`);

  if (active && active !== next) active.hide();

  await next.mount(user);
  next.show();

  active = next;
}
