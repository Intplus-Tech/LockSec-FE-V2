const a = require("./openapi.previous.json");
const b = require("./openapi.json");
const show = (label, o) => console.log("\n### " + label + "\n" + JSON.stringify(o, null, 1));

console.log("=== /estates/profile — methods BEFORE:", Object.keys(a.paths["/estates/profile"]));
console.log("=== /estates/profile — methods AFTER: ", Object.keys(b.paths["/estates/profile"]));

show("UpdateEstateProfileInput (new)", b.components.schemas.UpdateEstateProfileInput);
show("EstateResponse — before", a.components.schemas.EstateResponse.properties);
show("EstateResponse — after", b.components.schemas.EstateResponse.properties);
show("CreateSecurityInput required — before", a.components.schemas.CreateSecurityInput.required);
show("CreateSecurityInput required — after", b.components.schemas.CreateSecurityInput.required);
