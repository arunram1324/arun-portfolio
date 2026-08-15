import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../shared/services/toast.service';

type LoginStep = 'email' | 'otp';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public step = signal<LoginStep>('email');
  public email = signal<string>('arunram1324@gmail.com');
  public otp = signal<string>('');
  public errorMessage = signal<string>('');
  public isLoading = signal<boolean>(false);

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    private toastService: ToastService,
    private router: Router
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/admin']);
    }
  }

  public async onSendOtp(): Promise<void> {
    this.errorMessage.set('');
    if (!this.email().trim()) {
      this.errorMessage.set('Please enter your email address.');
      return;
    }

    this.isLoading.set(true);
    const res = await this.authService.sendOtp(this.email());
    this.isLoading.set(false);

    if (res.success) {
      this.step.set('otp');
      this.toastService.show(`OTP code sent to ${this.email()}. Please check your email inbox!`);
    } else {
      this.errorMessage.set(res.message || 'Failed to send OTP.');
    }
  }

  public async onVerifyOtp(): Promise<void> {
    this.errorMessage.set('');
    if (!this.otp().trim()) {
      this.errorMessage.set('Please enter the 6-digit verification code from your email.');
      return;
    }

    this.isLoading.set(true);
    await new Promise(r => setTimeout(r, 300));

    const res = this.authService.verifyOtp(this.email(), this.otp());
    this.isLoading.set(false);

    if (res.success) {
      this.toastService.show('Verification Successful! Welcome, Arun.');
      this.router.navigate(['/admin']);
    } else {
      this.errorMessage.set(res.message || 'Invalid verification code.');
    }
  }

  public changeEmail(): void {
    this.step.set('email');
    this.otp.set('');
    this.errorMessage.set('');
  }

  public backToHome(): void {
    this.router.navigate(['/']);
  }
}
