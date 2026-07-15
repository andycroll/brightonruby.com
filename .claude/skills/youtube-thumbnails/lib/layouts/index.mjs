// Layout registry. Add a new archetype by dropping a module in this directory
// (exporting `talk(ctx)`, `cover(ctx)`, `label`) and registering it here.
import classic from "./classic.mjs";
import poster from "./poster.mjs";
import ticket from "./ticket.mjs";

export const layouts = { classic, poster, ticket };

export function getLayout(name) {
  const l = layouts[name || "classic"];
  if (!l) {
    throw new Error(`Unknown layout "${name}". Available: ${Object.keys(layouts).join(", ")}`);
  }
  return l;
}
