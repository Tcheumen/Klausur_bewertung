import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExportService } from '../../services/export_file/export.service';

@Component({
  selector: 'app-csv-export',
  imports: [CommonModule, FormsModule],
  templateUrl: './csv-export.component.html',
  styleUrls: ['../../../assets/css/styles.css']
})
export class CsvExportComponent {
 
  saveMessage: string = '';
  @Input() disabled: boolean = false;
  @Output() exportCsvClicked = new EventEmitter<void>();
 

  constructor(private exporService: ExportService) { }

  downloadCsvData(): void {
    console.log('📥 downloadCsvData() appelé'); // 👈

    this.exporService.exportCsvData().then(blob => {
      console.log('✅ Blob reçu ! Tentative de téléchargement…'); // 👈

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exam_data.csv';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }).catch((err) => {
      console.error('❌ Erreur export CSV :', err);
      this.saveMessage = 'Erreur lors de l’exportation du fichier CSV.';
    });
  }



  
  onButtonCsvClicked(): void {
    console.log('🧨 onButtonCsvClicked() déclenché'); // 👈
    this.exportCsvClicked.emit();
  }

 
}
