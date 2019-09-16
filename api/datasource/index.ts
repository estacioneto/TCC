import path from "path";

import low from "lowdb";
import FileAsync from "lowdb/adapters/FileAsync";

interface Stored<T> {
  id: string | number;
  data: T;
}

type Schema = { [k: string]: Stored<any>[] };

export class DataSource {
  private static _db: low.LowdbAsync<Schema>;
  private static get db(): Promise<low.LowdbAsync<Schema>> {
    if (DataSource._db) {
      return (async () => DataSource._db)();
    }

    return (async () => {
      const dbJson = new FileAsync(path.join(__dirname, "db.json"));
      DataSource._db = await low(dbJson);
      return DataSource._db;
    })();
  }

  async ready(): Promise<boolean> {
    return !!(await DataSource.db);
  }

  async create<T>(collection: string, data: T) {
    return (await DataSource.db)
      .update(collection, c => c.concat([{ id: Date.now(), data }]))
      .write();
  }

  async read(collection: string) {
    return (await DataSource.db).get(collection).value();
  }

  async update<T>(collection: keyof Schema, id: string | number, data: T) {
    return (await DataSource.db)
      .update(collection, c =>
        c.map((element: Stored<T>) =>
          element.id === id ? { ...element, data } : element
        )
      )
      .write();
  }

  async delete<T>(collection: string, id: string | number) {
    return (await DataSource.db)
      .update(collection, c => c.filter((e: Stored<T>) => e.id !== id))
      .write();
  }
}
