import { Injectable, signal, effect } from '@angular/core';
import { ThemeMode } from '../models/theme.model';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'ak-portfolio-theme';
  
  public theme = signal<ThemeMode>(this.getInitialTheme());

  constructor() {
    // Sync theme change to HTML attribute & localStorage
    effect(() => {
      const current = this.theme();
      document.documentElement.setAttribute('data-theme', current);
      try {
        localStorage.setItem(this.STORAGE_KEY, current);
      } catch (e) {
        // Handle private browsing mode safely
      }
    });
  }

  public toggleTheme(): void {
    this.theme.update(prev => (prev === 'light' ? 'dark' : 'light'));
  }

  public isDark(): boolean {
    return this.theme() === 'dark';
  }

  private getInitialTheme(): ThemeMode {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY) as ThemeMode;
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch (e) {
      // Fallback
    }

    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }
}
