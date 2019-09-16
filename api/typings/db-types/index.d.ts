declare module "db-types" {
  interface Stored<T> {
    id: string | number;
    data: T;
  }

  type DBSchema = { [k: string]: Stored<any>[] };

  interface IDataSource {
    ready(): Promise<boolean>;
    create<T>(collection: string, data: T): Promise<Stored<T>[]>;
    read<T>(collection: string): Promise<Stored<T>[]>;
    update<T>(
      collection: string,
      id: string | number,
      data: T
    ): Promise<Stored<T>>;
    delete<T>(collection: string, id: string | number): Promise<Stored<T>[]>;
  }
}
