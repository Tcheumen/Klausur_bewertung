import { Injectable } from '@angular/core';
import { getElectronAPI } from '../../electron.token';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly e = getElectronAPI();
  private readonly DEFAULT_TIMEOUT_MS = 30_000;

  // ---------- Helpers ----------
  private withTimeout<T>(p: Promise<T>, ms = this.DEFAULT_TIMEOUT_MS): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`Export timeout after ${ms}ms`)), ms);
      p.then(v => { clearTimeout(t); resolve(v); }, err => { clearTimeout(t); reject(err); });
    });
  }

  private base64ToBlob(base64: string, mime: string): Blob {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  // =========================================================
  // ===============   API publique du service   =============
  // =========================================================

  /** CSV (mime: text/csv) */
  exportCsvData(): Promise<Blob> {
    // 1) Chemin préféré : invoke/handle (déterministe)
    if (this.e?.export?.run) {
      const run = this.e.export.run({ type: 'csv' }) as Promise<{ ok: boolean; data?: string; error?: string }>;
      return this.withTimeout(run).then(res => {
        if (!res.ok || !res.data) throw new Error(res.error ?? 'Export CSV failed');
        return new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      });
    }

    // 2) Fallback : protocole événementiel existant
    const electron: any = (window as any).electronAPI;
    if (!electron || !electron.send || !electron.once) {
      return Promise.reject(new Error('Electron API non disponible'));
    }

    const p = new Promise<Blob>((resolve, reject) => {
      electron.once('export-csv-success', (csv: string) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        resolve(blob);
      });
      electron.once('export-csv-error', (error: string) => reject(new Error(error)));
      electron.send('export-csv');
    });

    return this.withTimeout(p);
  }

  /** Excel (mime: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet) */
  exportExcelData(): Promise<Blob> {
    if (this.e?.export?.run) {
      const run = this.e.export.run({ type: 'xlsx' }) as Promise<{ ok: boolean; base64?: string; error?: string }>;
      return this.withTimeout(run).then(res => {
        if (!res.ok || !res.base64) throw new Error(res.error ?? 'Export Excel failed');
        return this.base64ToBlob(res.base64, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      });
    }

    const electron: any = (window as any).electronAPI;
    if (!electron || !electron.send || !electron.once) {
      return Promise.reject(new Error('Electron API non disponible'));
    }

    const p = new Promise<Blob>((resolve, reject) => {
      electron.once('export-excel-success', (base64: string) => {
        resolve(this.base64ToBlob(base64, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));
      });
      electron.once('export-excel-error', (error: string) => reject(new Error(error)));
      electron.send('export-excel');
    });

    return this.withTimeout(p);
  }

  /** PDF (mime: application/pdf) */
  exportPDF(): Promise<Blob> {
    if (this.e?.export?.run) {
      const run = this.e.export.run({ type: 'pdf' }) as Promise<{ ok: boolean; base64?: string; error?: string }>;
      return this.withTimeout(run).then(res => {
        if (!res.ok || !res.base64) throw new Error(res.error ?? 'Export PDF failed');
        return this.base64ToBlob(res.base64, 'application/pdf');
      });
    }

    const electron: any = (window as any).electronAPI;
    if (!electron || !electron.send || !electron.once) {
      return Promise.reject(new Error('Electron API non disponible'));
    }

    const p = new Promise<Blob>((resolve, reject) => {
      electron.once('export-pdf-success', (base64: string) => {
        resolve(this.base64ToBlob(base64, 'application/pdf'));
      });
      electron.once('export-pdf-error', (error: string) => reject(new Error(error)));
      electron.send('export-pdf');
    });

    return this.withTimeout(p);
  }
}
