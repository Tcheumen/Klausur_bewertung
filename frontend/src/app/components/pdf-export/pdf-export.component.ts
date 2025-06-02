import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExportService } from '../../services/export_file/export.service';

@Component({
  selector: 'app-pdf-export',
  imports: [CommonModule, FormsModule],
  templateUrl: './pdf-export.component.html',
  styleUrls: ['../../../assets/css/styles.css']
})
export class PdfExportComponent {


  saveMessage: string = '';
  @Input() disabled: boolean = false;
  @Output() exportPdfClicked = new EventEmitter<void>();

  constructor(private exportService: ExportService) { }
  
  downloadPDF(): void {
    console.log('📥 downloadPDF() appelé');
    this.exportService.exportPDF().then((blob) => {
      console.log('✅ PDF reçu, téléchargement...');
      const fileURL = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = 'Pruefungsbewertungsbericht.pdf';
      link.click();
      window.URL.revokeObjectURL(fileURL);
    }).catch(error => {
      console.error("❌ Erreur lors du téléchargement du PDF:", error);
    });
  }

    onPdfButtonClick(): void {
      console.log('🧨 onPdfButtonClick déclenché');
      this.exportPdfClicked.emit();
    }

  }

