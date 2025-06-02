import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Threshold } from '../../models/threshold';
import { ThresholdsService } from '../../services/thresholds/thresholds.service';

@Component({
  selector: 'app-thresholds',
  imports: [CommonModule, FormsModule],
  templateUrl: './thresholds.component.html',
  styleUrls: ['../../../assets/css/styles.css']
})
export class ThresholdsComponent implements OnInit {

  thresholds: Threshold[] = [];
  newThreshold: Threshold = { points: 0, percentage: 0, note: 0 };
  errorMessage = '';
  saveMessage = '';
  isSaved = false;
  loading = true;

  constructor(private thresholdService: ThresholdsService, private router: Router) { }

  ngOnInit(): void {
    this.thresholdService.loadThresholds((data) => {
      this.thresholds = data;
      this.loading = false;
    });
  }


  addThreshold(): void {
    const exists = this.thresholds.some(
      t => t.percentage === this.newThreshold.percentage
    );
    if (exists) {
      this.errorMessage = 'Fehler beim Hinzufügen des Schwellenwerts oder dieser Schwellenwert existiert bereits.';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.thresholds.push({ ...this.newThreshold });
    this.newThreshold = { points: 0, percentage: 0, note: 0 };
    this.errorMessage = '';
    this.isSaved = false;
  }


  deleteThreshold(percentage: number): void {
    try {
      this.thresholds = this.thresholds.filter(t => t.percentage != percentage);
      this.isSaved = false;
    } catch (error) {
      this.errorMessage = 'Fehler beim Löschen des Schwellenwerts.';
      console.error('Fehler beim Löschen:', error);
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }


  saveAllThresholds(): void {
    this.thresholds.sort((a, b) => a.percentage - b.percentage);

    this.thresholdService.saveThresholds(this.thresholds, () => {
      this.saveMessage = 'Alle Schwellenwerte wurden gespeichert.';
      this.isSaved = true;
      setTimeout(() => this.saveMessage = '', 3000);
    }, (error: any) => {
      this.errorMessage = 'Fehler beim Speichern der Schwellenwerte.';
      console.error('Fehler beim Speichern der Schwellenwerte:', error);
      setTimeout(() => this.errorMessage = '', 3000);
    });
  }


  navigateToPrevious(): void {
    this.router.navigate(['/module']);
  }

  navigateToNext(): void {
    this.router.navigate(['/upload']);
  }
}
