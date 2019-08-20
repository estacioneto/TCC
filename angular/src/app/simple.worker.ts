export class SimpleWorker {
  x = 1;
  getNext(): number {
    for (let i = 0; i < 1e9; i++) {
      this.x++;
    }
    return this.x;
  }
}
