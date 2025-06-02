import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExportService } from '../../services/export_file/export.service';

@Component({
  selector: 'app-export-excel',
  imports: [CommonModule, FormsModule],
  templateUrl: './export-excel.component.html',
  styleUrls: ['../../../assets/css/styles.css']
})
export class ExportExcelComponent {

  constructor(private exporService: ExportService){}

  saveMessage: string = '';
  @Input() disabled: boolean = false;
  @Output() exportClicked = new EventEmitter<void>();

  downloadExcelData(): void {
    console.log('📥 downloadExcelData() appelé');
    this.exporService.exportExcelData().then((blob) => {
      console.log('✅ Blob reçu, téléchargement...');

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Bewertungsdaten.xlsx';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }).catch((err) => {
      console.error('❌ Erreur lors de l’export Excel :', err);
    });
  }


  onButtonClick(): void {
    console.log('🧨 onButtonExcellClicked() déclenché'); // 👈
    this.exportClicked.emit();
  }


}
