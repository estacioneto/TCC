import { DataSource } from "../datasource";

console.log("yey");
console.log(self);
const db = new DataSource();
self.addEventListener("install", async event => {
  console.log(event);
  console.log("installed!");
  console.log("creating counter 1", await db.create("counter", 1));
  console.log("reading counters", await db.read("counter"));
});
