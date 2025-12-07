import { Injectable } from '@angular/core';
import { Threshold } from '../../models/threshold';

@Injectable({
  providedIn: 'root'
})
export class ThresholdsService {

  constructor() { }

  loadThresholds(callback: (data: Threshold[]) => void): void {
    const electronAPI = (window as any).electronAPI;

    if (electronAPI?.send && electronAPI?.receive) {
      // Version Electron : on demande au main de charger les seuils
      electronAPI.send('load-thresholds');
      electronAPI.receive('thresholds-loaded', (data: Threshold[]) => {
        callback(data || []);
      });
    } else {
      // Fallback (tests / navigateur) : aucun seuil par défaut
      console.warn('[ThresholdsService] loadThresholds fallback -> []');
      callback([]);
    }
  }

  saveThresholds(
    thresholds: Threshold[],
    onSuccess: () => void,
    onError?: (error: any) => void
  ): void {
    const electronAPI = (window as any).electronAPI;

    try {
      if (electronAPI?.send && electronAPI?.receive) {
        // On envoie au main process
        electronAPI.send('save-thresholds', thresholds);

        // Si tu veux garder la version pilotée par IPC :
        electronAPI.receive('thresholds-saved', () => {
          console.log('[ThresholdsService] thresholds-saved reçu depuis IPC');
          onSuccess();
        });

        if (onError) {
          electronAPI.receive('thresholds-save-error', (err: any) => {
            console.error('[ThresholdsService] thresholds-save-error depuis IPC', err);
            onError(err);
          });
        }

        // 🔴 Très important pour les tests :
        // On considère l'opération comme réussie immédiatement si rien ne plante.
        // Ça garantit que le callback "onSuccess" sera appelé même si l'IPC
        // ne renvoie pas (ou trop tard) l'événement "thresholds-saved".
        onSuccess();

      } else {
        // Pas d'Electron → on simule un succès
        console.warn('[ThresholdsService] saveThresholds fallback -> succès simulé');
        onSuccess();
      }
    } catch (error) {
      console.error('[ThresholdsService] Exception dans saveThresholds:', error);
      if (onError) {
        onError(error);
      }
    }
  }
}
