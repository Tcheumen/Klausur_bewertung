import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModuleInfo } from '../../models/moduleInfo';
import { ApiService } from '../../services/module_info/api.service';


@Component({
  selector: 'app-module-info',
  imports: [CommonModule, FormsModule],
  templateUrl: './module-info.component.html',
  styleUrls: ['./module-info.component.scss']
})
export class ModuleInfoComponent implements OnInit {

  moduleInfo: ModuleInfo = {
    moduleTitle: '',
    moduleNumber: '',
    examDate: '',
    examiners: []
  };

  saveMessage = '';
  isSaved = false;
  isEditing = false;
  errorMessage = '';


  constructor(private apiService: ApiService,private router: Router) { }

  ngOnInit(): void {
    this.apiService.loadModuleInfo((data) => {
      this.moduleInfo = data;
      this.isEditing = true;
    });

    this.apiService.onSaveSuccess(() => {
      this.saveMessage = "Modul gespeichert!";
      this.isSaved = true;
    });
  }

  saveModule(form: any): void {
    if (!form.valid) {
      this.saveMessage = '';
      this.isSaved = false;
      this.errorMessage = 'Bitte füllen Sie alle Pflichtfelder aus.';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.apiService.saveModuleInfo(this.moduleInfo);
    this.saveMessage = 'Modul wurde erfolgreich hinzugefügt!';
    this.errorMessage = '';
    this.isSaved = true;
    setTimeout(() => this.saveMessage = '', 3000);
  }


  navigateToNext(): void {
    this.router.navigate(['/threshold']);
  }

}
