export class SimpleWorker {
  x = 1;
  getNext(): number {
    return this.x++;
  }
}
