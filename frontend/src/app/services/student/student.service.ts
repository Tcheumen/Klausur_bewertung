import { Injectable, NgZone } from '@angular/core';
import { Student } from '../../models/student';
import { Threshold } from '../../models/threshold';
import { getBewertung, getNote } from '../../utils/evaluation';

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  constructor(private ngZone: NgZone) { }

  // Préparation d'un étudiant après l'import CSV
  prepareStudent(data: Student): Student {
    return {
      ...data,
      total: 0,
      bewertung: 0,
      note: '',
      scores: data.scores || {}
    };
  }

  // Mise à jour de la note et évaluation
  updateBewertung(student: Student, thresholds: Threshold[]): void {
    if (!student.scores) student.scores = {};
    student.total = Object.values(student.scores)
      .map(score => (isNaN(score) || score === null || score === undefined ? 0 : Number(score)))
      .reduce((sum, score) => sum + score, 0);

    if (student.total === 0) {
      student.bewertung = null;
      student.note = '';
      return;
    }

    student.bewertung = getBewertung(student.total, thresholds);
    student.note = isNaN(student.bewertung) ? '' : getNote(student.bewertung);
  }

  // Chargement des seuils (depuis preload/IPC)
  loadThresholds(callback: (thresholds: Threshold[]) => void): void {
    (window as any).electronAPI.send('load-thresholds');
    (window as any).electronAPI.receive('thresholds-loaded', callback);
  }

  // Sauvegarde globale
 saveEvaluationData(
  data: any,
  onSuccess: () => void,
  onError?: (error: any) => void
): void {
  const electron = (window as any).electronAPI;

  // 🌐 Fallback : pas d'Electron → on simule un succès immédiat
  if (!electron || typeof electron.send !== 'function' || typeof electron.receive !== 'function') {
    this.ngZone.run(() => onSuccess());
    return;
  }

  // Contexte Electron normal
  electron.send('save-evaluation-data', data);

  // Gestionnaires
  const successHandler = () => {
    this.ngZone.run(() => onSuccess());
    // Optionnel : nettoyer les listeners si ton preload expose removeListener
    electron.removeListener?.('evaluation-saved', successHandler);
    if (onError && electron.removeListener) {
      electron.removeListener('evaluation-save-error', errorHandler);
    }
  };

  const errorHandler = (error: any) => {
    if (!onError) { return; }
    this.ngZone.run(() => onError(error));
    electron.removeListener?.('evaluation-save-error', errorHandler);
    electron.removeListener?.('evaluation-saved', successHandler);
  };

  electron.receive('evaluation-saved', successHandler);

  if (onError) {
    electron.receive('evaluation-save-error', errorHandler);
  }
}


}
