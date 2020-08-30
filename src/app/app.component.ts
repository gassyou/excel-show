import { XlsxService } from './core/service/xlsx/xlsx.service';
import { ElectronService } from './core/service';
import { Component } from '@angular/core';
import { AppConfig } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = 'excel-show';
  data: any;
  isPewviewMode = true;
  fileName = '';

  constructor(
    private electronService: ElectronService,
    private xlsx: XlsxService

  ) {

    console.log('AppConfig', AppConfig);

    if (electronService.isElectron) {
      console.log(process.env);
      console.log('Run in electron');
      console.log('Electron ipcRenderer', this.electronService.ipcRenderer);
      console.log('NodeJS childProcess', this.electronService.childProcess);
    } else {
      console.log('Run in browser');
    }
  }


  change(e: Event) {
    const node = e.target as HTMLInputElement;
    // this.fileName =
    console.log(node);
    this.xlsx.import(node.files![0]).then(res => {
      this.data = res;
    });
    node.value = '';
  }
}
