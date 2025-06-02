import { Routes } from '@angular/router';
import { ModuleInfoComponent } from './components/module-info/module-info.component';
import { ThresholdsComponent } from './components/thresholds/thresholds.component';
import { ExamManagementComponent } from './components/exam-management/exam-management.component';
import { HomeComponent } from './components/home/home.component';



export const routes: Routes = [
   { path: 'module', component: ModuleInfoComponent },
   { path: 'threshold', component: ThresholdsComponent },
   { path: 'upload', component: ExamManagementComponent },
   { path: '', component: HomeComponent}
  
];
     