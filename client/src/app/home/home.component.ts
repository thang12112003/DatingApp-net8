import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RegisterComponent } from '../register/register.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RegisterComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  registerMode = false;
  private router = inject(Router);

  registerToggle() {
    this.registerMode = !this.registerMode;
  }

  login() {
    this.router.navigateByUrl('/login');
  }

  cancelRegisterMode(event: boolean) {
    this.registerMode = event;
  }
}
