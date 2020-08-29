import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { XlsxExportOptions, XlsxExportResult, XlsxExportSheet } from 'xlsx/dist';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class XlsxService {

  constructor(private http: HttpClient, private ngZone: NgZone) {}

/**
   * 导入Excel并输出JSON，支持 `<input type="file">`、URL 形式
   * @param rABS 加载数据方式 `readAsBinaryString` （默认） 或 `readAsArrayBuffer`，[更多细节](http://t.cn/R3n63A0)
   */
  import(
    fileOrUrl: File | string,
    rABS: 'readAsBinaryString' | 'readAsArrayBuffer' = 'readAsBinaryString',
  ): Promise<{ [key: string]: any[][] }> {
    return new Promise<{ [key: string]: any[][] }>((resolve, reject) => {
     // from url
     if (typeof fileOrUrl === 'string') {
      this.http.request('GET', fileOrUrl, { responseType: 'arraybuffer' }).subscribe(
        (res: ArrayBuffer) => {
          this.ngZone.run(() => resolve(this.read(new Uint8Array(res), { type: 'array' })));
        },
        (err: any) => {
          reject(err);
        },
      );
      return;
    }
    // from file
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      this.ngZone.run(() => resolve(this.read(e.target.result, { type: 'binary' })));
    };
    reader[rABS](fileOrUrl);
    });
  }

  async export(options: XlsxExportOptions): Promise<XlsxExportResult> {
    return new Promise<XlsxExportResult>((resolve, reject) => {
      this.ngZone.runOutsideAngular(() => {
        const wb: any = XLSX.utils.book_new();
        if (Array.isArray(options.sheets)) {
          (options.sheets as XlsxExportSheet[]).forEach((value: XlsxExportSheet, index: number) => {
            const ws: any = XLSX.utils.aoa_to_sheet(value.data);
            XLSX.utils.book_append_sheet(wb, ws, value.name || `Sheet${index + 1}`);
          });
        } else {
          wb.SheetNames = Object.keys(options.sheets);
          wb.Sheets = options.sheets;
        }

        if (options.callback) options.callback(wb);

        const wbout: ArrayBuffer = XLSX.write(wb, {
          bookType: 'xlsx',
          bookSST: false,
          type: 'array',
          ...options.opts,
        });
        const filename = options.filename || 'export.xlsx';
        saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename);

        resolve({ filename, wb });
      });
    });
  }



  private read(data: any, options: { type: 'array' | 'binary' }): { [key: string]: any[][] } {
    const ret: any = {};
    this.ngZone.runOutsideAngular(() => {
      const wb = XLSX.read(data, options);
      wb.SheetNames.forEach((name: string) => {
        const sheet: any = wb.Sheets[name];
        ret[name] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      });
    });
    return ret;
  }


  /**
   * 数据转符号名
   * - `1` => `A`
   * - `27` => `AA`
   * - `703` => `AAA`
   */
  numberToSchema(val: number): string {
    const startCode = 'A'.charCodeAt(0);
    let res = '';

    do {
      --val;
      res = String.fromCharCode(startCode + (val % 26)) + res;
      val = (val / 26) >> 0;
    } while (val > 0);

    return res;
  }

}
