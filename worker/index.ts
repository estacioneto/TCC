import express from "express";
import morgan from "morgan";
import cors from "cors";
import colors from "colors/safe";

const app = express();
const port = process.env.PORT || 8081;

app.use(cors());
app.use(morgan("combined"));
app.use("/service-worker", express.static(__dirname + "/dist/worker.js"));

(async () => {
  app.listen(port, async () => {
    console.log(
      colors.green(
        `Worker server running in ${colors.bold(`https://localhost:${port}`)}`
      )
    );
  });
})();
