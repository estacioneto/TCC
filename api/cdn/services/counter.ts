import { IDataSource, Stored } from "db-types";

let x = 1;
const COUNTER_COLLECTION = "counter";

export default {
  getCounters(db: IDataSource) {
    return db.read(COUNTER_COLLECTION);
  },
  async getCounterById(db: IDataSource, options: any): Promise<Stored<number>> {
    const id = +options.params.id;
    const counters = await db.read<number>(COUNTER_COLLECTION);
    const counter = counters.find(counter => counter.id === id);

    if (!counter) {
      throw {
        status: 404,
        message: "No counter was found with the given id"
      };
    }

    return counter;
  },
  async incrementCounter(db: IDataSource, options: any) {
    const counter = await this.getCounterById(db, options);
    const id = +options.params.id;
    return db.update(COUNTER_COLLECTION, id, counter.data + 1);
  }
};
