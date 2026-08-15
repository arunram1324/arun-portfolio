import { Injectable, signal } from '@angular/core';

export interface ToastData {
  message: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  public isVisible = signal<boolean>(false);
  public toastData = signal<ToastData>({ message: 'Email copied!', icon: '📋' });

  private timer: any = null;

  public show(message: string, icon: string = '📋', duration: number = 2800): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.toastData.set({ message, icon });
    this.isVisible.set(true);

    this.timer = setTimeout(() => {
      this.isVisible.set(false);
    }, duration);
  }

  public copyToClipboard(text: string, successMessage: string = 'Email copied to clipboard!'): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.show(successMessage, '📋');
      }).catch(() => {
        this.show(text, '📋');
      });
    }
  }
}
