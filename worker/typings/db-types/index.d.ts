declare module "db-types" {
  interface Stored<T> {
    id: string;
    data: T;
  }

  type DBSchema = { [k: string]: Stored<any>[] };

  interface IDataSource {
    ready(): Promise<boolean>;
    create<T>(collection: string, data: T): Promise<Stored<T>[]>;
    read<T>(
      collection: string,
      id?: string
    ): Promise<Stored<T>[] | Stored<T> | null>;
    update<T>(collection: string, id: string, data: T): Promise<Stored<T>>;
    delete<T>(
      collection: string,
      id?: string
    ): Promise<Stored<T>[] | Stored<T>>;
  }
}
