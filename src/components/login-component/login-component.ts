import {Component, inject} from '@angular/core';
import {AuthService} from '../../services/auth-service';
import {LucideAngularModule, Plane} from 'lucide-angular';

@Component({
  selector: 'app-login-component',
  imports: [
    LucideAngularModule
  ],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
})
export class LoginComponent {
auth = inject(AuthService);
  protected readonly Plane = Plane;

  async  login(){
   await this.auth.loginWithGoogle();
  }

  logout(){
    this.auth.logout();
  }
}
