import { Injectable } from '@angular/core';
declare const window: any;

@Injectable({
  providedIn: 'root'
})
export class ExportService {

 exportCsvData(): Promise<Blob> {
  const electron = (window as any).electronAPI;

  if (!electron || !electron.send || !electron.receive) {
    console.error('❌ Electron API non disponible');
    return Promise.reject(new Error('Electron API non disponible'));
  }

  return new Promise((resolve, reject) => {
    electron.once('export-csv-success', (csv: string) => {
      console.log('📄 CSV reçu dans ExportService'); // 👈
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      resolve(blob);
    });

    electron.once('export-csv-error', (error: string) => {
      reject(new Error(error));
    });


    try {
      electron.send('export-csv');
    } catch (e) {
      reject(e);
    }
  });
}

  
  exportExcelData(): Promise<Blob> {
    const electron = (window as any).electronAPI;

    if (!electron || !electron.send || !electron.once) {
      console.error('❌ Electron API non disponible');
      return Promise.reject(new Error('Electron API non disponible'));
    }

    return new Promise((resolve, reject) => {
      electron.once('export-excel-success', (base64: string) => {
        console.log('📦 Données Excel base64 reçues');
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        resolve(blob);
      });

      electron.once('export-excel-error', (error: string) => {
        console.error('❌ Erreur reçue depuis Electron :', error);
        reject(new Error(error));
      });

      console.log('📤 Envoi de la requête à Electron...');
      electron.send('export-excel');
    });
  }


  exportPDF(): Promise<Blob> {
    const electron = (window as any).electronAPI;

    if (!electron || !electron.send || !electron.once) {
      console.error('❌ Electron API non disponible');
      return Promise.reject(new Error('Electron API non disponible'));
    }

    return new Promise((resolve, reject) => {
      electron.once('export-pdf-success', (base64: string) => {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        resolve(blob);
      });

      electron.once('export-pdf-error', (error: string) => {
        reject(new Error(error));
      });

      console.log('📤 Envoi export-pdf vers Electron...');
      electron.send('export-pdf');
    });
  }



}
