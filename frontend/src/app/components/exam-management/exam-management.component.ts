import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Student } from '../../models/student';
import { Threshold } from '../../models/threshold';
import { getBewertung, getNote } from '../../utils/evaluation';
import { FileImportService } from '../../services/file_import/file-import.service';
import { StudentService } from '../../services/student/student.service';
import { TaskService } from '../../services/task/task.service';
import { CsvExportComponent } from '../csv-export/csv-export.component';
import { ExportExcelComponent } from '../export-excel/export-excel.component';
import { PdfExportComponent } from '../pdf-export/pdf-export.component';


@Component({
  selector: 'app-exam-management',
  imports: [CommonModule, FormsModule, CsvExportComponent, ExportExcelComponent, PdfExportComponent ],
  templateUrl: './exam-management.component.html',
  styleUrls: ['../../../assets/css/styles.css']
})
export class ExamManagementComponent implements OnInit {

  @ViewChild(CsvExportComponent) exportCsvComp!: CsvExportComponent;
  @ViewChild(ExportExcelComponent) exportExcelComp!: ExportExcelComponent;
  @ViewChild(PdfExportComponent) exportPdfComp!: PdfExportComponent;

  thresholds: Threshold[] = [];
  file: File | null = null;
  saveMessage = '';
  fileError = '';
  isFileUploaded = false;
  isSaved = false;

  students: Student[] = [];
  tasks: string[] = [];
  taskWeights: { [key: string]: number } = {};

  newTask = '';
  newTaskWeight = 0;
  taskMessage = '';
  taskError = '';
  scoreErrors: { [matrikel: string]: { [task: string]: string } } = {};

  constructor(
    private fileService: FileImportService,
    private studentService: StudentService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.studentService.loadThresholds(thresholds => {
      this.thresholds = thresholds;
      this.updateAllBewertungen();
    });
  }

  addTask(): void {
    const addedTaskName = this.newTask;
    if (!this.newTask || this.newTaskWeight <= 0) {
      this.taskError = 'Bitte geben Sie den Namen der Aufgabe und ihre Gewichtung an.';
      setTimeout(() => { this.taskMessage = ''; this.taskError = ''; }, 3000);
      return;
    }
    if (this.tasks.includes(this.newTask)) {
      this.taskError = `"${this.newTask}" existiert bereits`;
      setTimeout(() => { this.taskMessage = ''; this.taskError = ''; }, 3000);
      return;
    }
    this.tasks.push(addedTaskName);
    this.taskWeights[addedTaskName] = this.newTaskWeight;
    this.newTask = '';
    this.newTaskWeight = 0;
    this.taskError = '';
    this.taskMessage = `"${addedTaskName}" hinzugefügt;`
    setTimeout(() => this.taskMessage = '', 3000);
  }

  removeTask(task: string): void {
    this.tasks = this.tasks.filter(t => t !== task);
    delete this.taskWeights[task];
    this.saveMessage = `"${task}" erfolgreich gelöscht!`;
    setTimeout(() => this.saveMessage = '', 3000);
  }



  saveData(): void {
    this.studentService.saveEvaluationData(
      {
        students: this.students,
        tasks: this.tasks,
        taskWeights: this.taskWeights,
        thresholds: this.thresholds
      },
      () => {
        // Success callback
        this.isSaved = true;
        this.saveMessage = 'Daten erfolgreich gespeichert!';
        setTimeout(() => this.saveMessage = '', 3000);
      },
      (error: any) => {
        // Error callback
        this.isSaved = false;
        this.saveMessage = 'Fehler beim Speichern von Daten.';
        console.error('Fehler beim Speichern:', error);
        setTimeout(() => this.saveMessage = '', 3000);
      }
    );
  }


  updateAllBewertungen(): void {
    this.students.forEach(student => this.studentService.updateBewertung(student, this.thresholds));
  }

  onFileSelected(event: any): void {
    this.file = event.target.files[0];
    this.fileError = '';
  }

  uploadFile(): void {
    if (!this.file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const decoder = new TextDecoder('iso-8859-1'); // ou 'windows-1252' si besoin
        const content = decoder.decode(arrayBuffer); // décode correctement les caractères spéciaux

        this.students = this.fileService.parseCSV(content).map(s => this.studentService.prepareStudent(s));
        this.isFileUploaded = true;
        this.saveMessage = 'Datei erfolgreich geladen!';
        this.fileError = '';
        this.updateAllBewertungen();
        setTimeout(() => this.saveMessage = '', 3000);
      } catch {
        this.fileError = 'Fehler beim Importieren der Datei. Überprüfen Sie das CSV-Format.';
        setTimeout(() => this.fileError = '', 3000);
      }
    };

    // ⚠️ Important : lire en binaire (ArrayBuffer) pour que TextDecoder fonctionne
    reader.readAsArrayBuffer(this.file);
  }

  updateScore(student: Student, task: string, value: number): void {
    const maxValue = this.taskWeights[task] || 0;
    const studentId = student.mtknr.toString();

    if (!this.scoreErrors[studentId]) {
      this.scoreErrors[studentId] = {};
    }

    if (value > maxValue) {
      this.scoreErrors[studentId][task] = `Die Note darf ${maxValue} für ${task} nicht überschreiten`;
      student.scores[task] = 0;
    } else {
      this.scoreErrors[studentId][task] = '';
      student.scores[task] = value >= 0 ? value : 0;
    }

    student.total = Object.values(student.scores).reduce((sum, score) => sum + (score || 0), 0);
    this.studentService.updateBewertung(student, this.thresholds);
  }

  exportCSV(): void {
    if (this.exportCsvComp) {
      this.exportCsvComp.downloadCsvData();
    } else {
      console.warn('❗ exportCsvComp est null');
    }
  }

  exportEXcel(): void {
    if (this.exportExcelComp) {
      this.exportExcelComp.downloadExcelData();
    }
  }

  exportPdf(): void {
    if (this.exportPdfComp) {
      this.exportPdfComp.downloadPDF();
    }
  }

  navigateToPrevious(): void {
    this.router.navigate(['/threshold']);
  }

  navigateToStart(): void {
    this.router.navigate(['/module']);
  }

}
