const express = require("express");
const morgan = require("morgan");

const app = express();
const port = process.env.PORT || 3000;

app.use(morgan("combined"));
app.use("/services", express.static(__dirname + "/dist/services"));

app.listen(port, () => {
  console.log(`CDN running in https://localhost:${port}`);
});
