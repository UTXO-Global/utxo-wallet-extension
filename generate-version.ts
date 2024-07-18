const fs = require("fs");
const { format } = require("date-fns");

const timestamp = format(new Date(), "yyyyMMdd-HHmmss");

const versionInfo = {
  timestamp,
};

fs.writeFileSync("./version.json", JSON.stringify(versionInfo, null, 2));
