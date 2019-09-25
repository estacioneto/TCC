import find from "lodash/find";
import remove from "lodash/remove";
import localForage from "localforage";

import { IDataSource, DBSchema, Stored } from "db-types";

export class DataSource implements IDataSource {

  async ready(): Promise<boolean> {
    // return !!(await DataSource.db);
    return true;
  }

  async create<T>(collection: string, data: T) {
    const c = (await localForage.getItem<Stored<T>[]>(collection)) || [];
    return localForage.setItem<Stored<T>[]>(
      collection,
      c.concat({ id: Date.now().toString(), data })
    );
  }

  async read<T>(collection: string, id?: string) {
    // TODO: Handle error
    const c = await localForage.getItem<Stored<T>[]>(collection);
    return (id ? find(c, { id }) : c) || null;
  }

  async update<T>(collection: string, id: string, data: T) {
    const c = await localForage.getItem<Stored<T>[]>(collection);
    if (c) {
      const stored = find<Stored<T>>(c, { id });
      if (stored) {
        Object.assign(stored, { data });
        await localForage.setItem<Stored<T>[]>(collection, c);
        return stored;
      } else {
        throw Error("Not found");
      }
    } else {
      throw Error("Couldn't find collection");
    }
  }

  async delete<T>(collection: string, id?: string) {
    const storedCollection = await localForage.getItem<Stored<T>[]>(collection);
    const [entity] = id
      ? remove(storedCollection, {
          id
        })
      : [];
    await localForage.setItem<Stored<T>[]>(collection, storedCollection);
    return entity || [];
  }
}
