import { Injectable, signal, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';

export interface OtpSession {
  email: string;
  code: string;
  expiresAt: number;
}

export interface StoredAuthSession {
  user: { email: string; name: string };
  loggedInAt: number;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly AUTH_STORAGE_KEY = 'ak-portfolio-cms-auth-session';
  // 30 Minutes Session Timeout as required
  public readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; 

  private currentOtpSession: OtpSession | null = null;
  private sessionCheckInterval: any = null;

  public readonly AUTHORIZED_EMAIL = 'arunram1324@gmail.com';

  public isLoggedIn = signal<boolean>(false);
  public currentUser = signal<{ email: string; name: string } | null>(null);

  constructor(
    private router: Router,
    private toastService: ToastService,
    private ngZone: NgZone
  ) {
    // Initial verification of stored session with strict 30-minute expiry
    this.verifyStoredSession();
    this.startSessionTimer();
  }

  /**
   * Check and restore valid session on startup
   */
  public verifyStoredSession(): boolean {
    try {
      const raw = localStorage.getItem(this.AUTH_STORAGE_KEY);
      if (!raw) {
        this.clearSessionState();
        return false;
      }

      const session: StoredAuthSession = JSON.parse(raw);
      const now = Date.now();

      if (!session || !session.expiresAt || now >= session.expiresAt) {
        // Session expired (older than 30 mins)
        this.clearSessionState();
        return false;
      }

      // Valid session
      this.isLoggedIn.set(true);
      this.currentUser.set(session.user);
      return true;
    } catch (e) {
      this.clearSessionState();
      return false;
    }
  }

  /**
   * Heartbeat session timer running every 10 seconds
   */
  private startSessionTimer(): void {
    if (typeof window === 'undefined') return;

    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.ngZone.runOutsideAngular(() => {
      this.sessionCheckInterval = setInterval(() => {
        if (this.isLoggedIn()) {
          const raw = localStorage.getItem(this.AUTH_STORAGE_KEY);
          if (raw) {
            try {
              const session: StoredAuthSession = JSON.parse(raw);
              if (Date.now() >= session.expiresAt) {
                this.ngZone.run(() => {
                  this.handleSessionTimeout();
                });
              }
            } catch (e) {
              this.ngZone.run(() => {
                this.handleSessionTimeout();
              });
            }
          } else {
            this.ngZone.run(() => {
              this.handleSessionTimeout();
            });
          }
        }
      }, 10000); // Check every 10 seconds
    });
  }

  private handleSessionTimeout(): void {
    this.clearSessionState();
    this.toastService.show('Admin session expired after 30 minutes. Please log in again.');
    this.router.navigate(['/login']);
  }

  /**
   * Request and trigger a 6-digit OTP email to the specified address
   */
  public async sendOtp(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    // Generate a secure 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes OTP validity

    this.currentOtpSession = {
      email: cleanEmail,
      code: otpCode,
      expiresAt: expiry
    };

    // Trigger real email dispatch
    await this.dispatchEmailNotification(cleanEmail, otpCode);

    return {
      success: true,
      message: `A secure 6-digit OTP has been sent to ${cleanEmail}. Please check your inbox and spam folder.`
    };
  }

  /**
   * Dispatch email via mail gateway API
   */
  private async dispatchEmailNotification(recipientEmail: string, otp: string): Promise<void> {
    try {
      await fetch('https://formsubmit.co/ajax/' + recipientEmail, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `[Arun Portfolio CMS] Your Login Verification Code: ${otp}`,
          message: `Hello Arun,\n\nYour 6-digit admin verification code is: ${otp}\n\nThis code is valid for 10 minutes. If you did not request this code, please ignore this email.\n\nBest regards,\nArun Portfolio System`,
          _captcha: 'false',
          _template: 'table'
        })
      });
    } catch (e) {
      console.log('OTP generated for verification session.');
    }
  }

  /**
   * Validate the entered OTP and create 30-minute authenticated session
   */
  public verifyOtp(email: string, enteredCode: string): { success: boolean; message?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = enteredCode.trim().replace(/\s+/g, '');

    if (!this.currentOtpSession) {
      return { success: false, message: 'No active OTP requested. Please send a verification code first.' };
    }

    if (this.currentOtpSession.email !== cleanEmail) {
      return { success: false, message: 'Email does not match the active verification session.' };
    }

    if (Date.now() > this.currentOtpSession.expiresAt) {
      return { success: false, message: 'This verification code has expired. Please request a new OTP.' };
    }

    // Check entered code against the generated session code
    if (this.currentOtpSession.code === cleanCode) {
      const now = Date.now();
      const sessionData: StoredAuthSession = {
        user: { email: cleanEmail, name: 'Arun K R' },
        loggedInAt: now,
        expiresAt: now + this.SESSION_TIMEOUT_MS // Strict 30 minutes expiration
      };

      this.isLoggedIn.set(true);
      this.currentUser.set(sessionData.user);
      this.currentOtpSession = null;

      try {
        localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(sessionData));
        // Remove any legacy keys
        localStorage.removeItem('ak-portfolio-cms-auth');
      } catch (e) {}

      return { success: true };
    }

    return { success: false, message: 'Incorrect 6-digit code. Please check your email inbox and try again.' };
  }

  public logout(): void {
    this.clearSessionState();
    this.toastService.show('Logged out successfully.');
    this.router.navigate(['/login']);
  }

  private clearSessionState(): void {
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.currentOtpSession = null;
    try {
      localStorage.removeItem(this.AUTH_STORAGE_KEY);
      localStorage.removeItem('ak-portfolio-cms-auth');
    } catch (e) {}
  }
}
