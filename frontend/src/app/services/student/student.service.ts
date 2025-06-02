import { Injectable } from '@angular/core';
import { Student } from '../../models/student';
import { Threshold } from '../../models/threshold';
import { getBewertung, getNote } from '../../utils/evaluation';

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  constructor() { }

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
  saveEvaluationData(data: any, onSuccess: () => void, onError?: (error: any) => void): void {
    (window as any).electronAPI.send('save-evaluation-data', data);

    (window as any).electronAPI.receive('evaluation-saved', onSuccess);

    if (onError) {
      (window as any).electronAPI.receive('evaluation-save-error', onError);
    }
  }

}
