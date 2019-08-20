import { Component, OnInit } from '@angular/core';
import * as Comlink from 'comlink';

import { SimpleWorker as W } from './simple.worker';

const SimpleWorker = Comlink.wrap<typeof W>(
  new Worker('./app.worker', {
    type: 'module',
  })
);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'angular';

  async ngOnInit() {
    const instance = await new SimpleWorker();
  }
}
