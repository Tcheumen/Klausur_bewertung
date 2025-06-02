import { Injectable } from '@angular/core';
import { Student } from '../../models/student';

@Injectable({
  providedIn: 'root'
})
export class FileImportService {

  constructor() { }

  parseCSV(content: string): Student[] {
    const lines = content.split('\n').filter(line => line.trim() != '');
    const result: Student[] = lines.slice(1).map(line => {
      const cols = line.split(';');
      return {
        mtknr: cols[0], nachname: cols[1], vorname: cols[2],
        pversuch: cols[3], pvermerk: cols[4], sitzplatz: cols[5],
        scores: {}
      };
    });
    return result;
  }
}

  

