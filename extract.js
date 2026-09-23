const fs = require("fs");
const t = fs.readFileSync("swagger-init.js", "utf8");
const i = t.indexOf('"swaggerDoc":');
const s = t.indexOf("{", i);
let depth = 0, e = s;
for (; e < t.length; e++) {
  if (t[e] === "{") depth += 1;
  else if (t[e] === "}") { depth -= 1; if (depth === 0) { e += 1; break; } }
}
const spec = JSON.parse(t.slice(s, e));
fs.writeFileSync("openapi.json", JSON.stringify(spec, null, 2));
console.log("paths:", Object.keys(spec.paths).length);
