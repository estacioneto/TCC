import { Component, OnInit } from '@angular/core';
import * as Comlink from 'comlink';

import { SimpleWorker as W } from './simple.worker';

const SimpleWorker = Comlink.wrap<typeof W>(
  new Worker('./app.worker', { type: 'module' })
);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'angular with workers';
  description = '';
  instance: any = null;
  value = 1;
  counter = 1;

  async ngOnInit() {
    this.instance = await new SimpleWorker();
    this.value = await this.instance.x;
    setInterval(() => this.counter++, 500);
  }

  async onClick() {
    this.description = 'Calculating in other thread...';
    this.value = await this.instance.getNext();
    this.description = '';
  }
}
