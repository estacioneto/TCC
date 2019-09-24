import { Stored } from "db-types";
import { DataSource } from ".";

describe("DataSource", () => {
  const db = new DataSource();
  const collection = Date.now().toString();

  it("should return null if the collection doesn't exist", async () => {
    expect(await db.read(collection)).toBeNull();
  });

  describe("create/read", () => {
    it("should correctly create and read an entity from a new collection", async () => {
      const entity = {
        data: "new entity"
      };

      expect(await db.read(collection)).toBeNull();
      const result = await db.create(collection, entity);
      expect(await db.read(collection)).toEqual(result);
      await db.delete(collection);
    });
  });

  describe("update", () => {
    it("should correctly update an entity from a collection", async () => {
      const entity = {
        data: "new entity"
      };

      const createResult = await db.create(collection, entity);
      expect(await db.read(collection)).toEqual(createResult);
      expect(createResult).not.toBeNull();

      const [oldEntity] = createResult;

      const newEntity = { data: "updated entity" };
      const updateResult = await db.update(collection, oldEntity.id, newEntity);
      expect(await db.read(collection, oldEntity.id)).toEqual(updateResult);
      expect(createResult).not.toEqual(updateResult);

      await db.delete(collection);
    });
  });

  describe("delete", () => {
    it("should correctly delete a single entity from a collection", async () => {
      const entity = {
        data: "deleted entity"
      };
      const entityB = {
        data: "new entity"
      };

      await db.create(collection, entity);
      const createResult = await db.create(collection, entityB);
      expect(await db.read(collection)).toEqual(createResult);
      expect(createResult).not.toBeNull();

      const [storedEntity] = createResult;

      const deletedEntity = await db.delete(collection, storedEntity.id);
      const deleteResult = await db.read(collection);

      expect(deleteResult).not.toEqual(createResult);
      expect(deleteResult).not.toContain(deletedEntity);
      expect(deleteResult).toHaveLength(createResult.length - 1);

      expect(deletedEntity).toEqual(storedEntity);

      await db.delete(collection);
    });

    it("should correctly delete a collection", async () => {
      const entity = {
        data: "new entity"
      };

      const createResult = await db.create(collection, entity);
      expect(await db.read(collection)).toEqual(createResult);
      expect(createResult).not.toBeNull();

      const deleteResult = await db.delete(collection);
      expect(deleteResult).toEqual([]);
    });
  });
});
