import { Injectable } from '@angular/core';
import { Threshold } from '../../models/threshold';

@Injectable({
  providedIn: 'root'
})
export class ThresholdsService {

  private readonly storageKey = 'thresholds';

  constructor() { }

  loadThresholds(callback: (data: Threshold[]) => void): void {
    if (window && (window as any).electronAPI) {
      (window as any).electronAPI.send('load-thresholds');
      (window as any).electronAPI.receive('thresholds-loaded', callback);
    }
  }

  saveThresholds(thresholds: Threshold[], onSuccess: () => void, onError?: (error: any) => void): void {
    if (window && (window as any).electronAPI) {
      const electronAPI = (window as any).electronAPI;

      electronAPI.send('save-thresholds', thresholds);
      electronAPI.receive('thresholds-saved', onSuccess);

      if (onError) {
        electronAPI.receive('thresholds-save-error', onError);
      }
    }
  }


}


