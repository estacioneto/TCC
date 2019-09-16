import path from "path";

import low from "lowdb";
import FileAsync from "lowdb/adapters/FileAsync";

import { IDataSource, DBSchema, Stored } from "db-types";

export class DataSource implements IDataSource {
  private static _db: low.LowdbAsync<DBSchema>;
  private static get db(): Promise<low.LowdbAsync<DBSchema>> {
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

  async read<T>(collection: string) {
    return (await DataSource.db).get(collection).value();
  }

  async update<T>(collection: keyof DBSchema, id: string | number, data: T) {
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
