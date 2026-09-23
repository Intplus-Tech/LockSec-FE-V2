const a = require("./openapi.previous.json");
const b = require("./openapi.json");

const A = Object.keys(a.paths), B = Object.keys(b.paths);
console.log("ADDED PATHS:   ", B.filter((x) => A.indexOf(x) === -1));
console.log("REMOVED PATHS: ", A.filter((x) => B.indexOf(x) === -1));

console.log("\nCHANGED ENDPOINTS:");
for (const p of B) {
  if (JSON.stringify(a.paths[p]) !== JSON.stringify(b.paths[p])) console.log("  " + p);
}

const sa = a.components.schemas, sb = b.components.schemas;
console.log("\nCHANGED SCHEMAS:");
for (const s of Object.keys(sb)) {
  if (JSON.stringify(sa[s]) !== JSON.stringify(sb[s])) console.log("  " + s);
}
console.log("NEW SCHEMAS:   ", Object.keys(sb).filter((s) => !(s in sa)));
