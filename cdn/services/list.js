// TODO: Bundle the services so importScripts can work with imports
// What about using rollup?

const schema = {
  clients: {
    counter: {
      url: "/counter",
      services: ["/counter.js"],
      methods: {
        GET: "getCounter"
      }
    }
  },
  getHandlers: () => {
    return {
      counter: {
        getCounter(db) {
          return db.get("counter");
        }
      }
    };
  }
};
