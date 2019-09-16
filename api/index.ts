import express from "express";
import morgan from "morgan";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors);
app.use(morgan("combined"));
app.use("/services", express.static(__dirname + "/dist/cdn/services"));

app.listen(port, () => {
  console.log(`CDN running in https://localhost:${port}`);
});
