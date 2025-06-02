import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['../../../assets/css/styles.css']
})
export class HomeComponent {

  constructor(private router: Router) { }

  navigateToModules() {
    this.router.navigate(['/module']);
  }

}
