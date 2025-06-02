import { Injectable } from '@angular/core';
import { ModuleInfo } from '../../models/moduleInfo';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor() { }

  private get isElectron(): boolean {
    return typeof window !== 'undefined' && !!(window as any).electronAPI;
  }

  saveModuleInfo(moduleInfo: ModuleInfo): void {
    if (this.isElectron) {
      (window as any).electronAPI.send('save-module-info', moduleInfo);
    } else {
      console.warn('Electron API non disponible - saveModuleInfo ignoré');
    }
  }

  onSaveSuccess(callback: () => void): void {
    if (this.isElectron) {
      (window as any).electronAPI.receive('module-save-success', callback);
    }
  }

  loadModuleInfo(callback: (data: ModuleInfo) => void): void {
    if (this.isElectron) {
      (window as any).electronAPI.send('load-module-info');
      (window as any).electronAPI.receive('module-info-loaded', callback);
    } else {
      console.warn('Electron API non disponible - loadModuleInfo ignoré');
    }
  }
}
