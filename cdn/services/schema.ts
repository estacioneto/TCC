export default {
  clients: {
    counter: [
      {
        url: "/counter",
        methods: {
          GET: "getCounter"
        }
      },
      {
        url: "/counter/:id",
        methods: {
          GET: "getCounterById"
        }
      }
    ]
  }
};
