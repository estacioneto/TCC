import path from "path";

import low from "lowdb";
import FileAsync from "lowdb/adapters/FileAsync";

import { IDataSource, DBSchema, Stored } from "db-types";

const DB_FILE = `db.${process.env.NODE_ENV === "test" ? "test." : ""}json`;

export class DataSource implements IDataSource {
  private static _db: low.LowdbAsync<DBSchema>;
  private static get db(): Promise<low.LowdbAsync<DBSchema>> {
    if (DataSource._db) {
      return (async () => DataSource._db)();
    }

    return (async () => {
      const dbJson = new FileAsync(path.join(__dirname, DB_FILE));
      DataSource._db = await low(dbJson);
      return DataSource._db;
    })();
  }

  async ready(): Promise<boolean> {
    return !!(await DataSource.db);
  }

  async create<T>(collection: string, data: T) {
    if (!(await (await DataSource.db).has(collection).value())) {
      await (await DataSource.db).set(collection, []).write();
    }
    return (await DataSource.db)
      .get(collection)
      .push({ id: Date.now().toString(), data })
      .write();
  }

  async read<T>(collection: string, id?: string) {
    if (!(await (await DataSource.db).has(collection).value())) {
      return null;
    }

    const c = (await DataSource.db).get(collection);

    return (await (id ? c.find({ id }).value() : c.value())) || null;
  }

  async update<T>(collection: keyof DBSchema, id: string, data: T) {
    return (await DataSource.db)
      .get(collection)
      .find({ id })
      .assign({ data })
      .write();
  }

  async delete<T>(collection: string, id?: string) {
    const db = await DataSource.db;
    if (id) {
      const entity = db
        .get(collection)
        .find({ id })
        .value();

      return db
        .get(collection)
        .remove({ id })
        .write()
        .then(() => entity);
    }

    return db
      .update(collection, () => [])
      .write()
      .then(() => []);
  }
}
