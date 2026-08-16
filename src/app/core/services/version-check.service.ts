import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VersionCheckService {
  private currentHash = '';
  private checkInterval: any = null;

  constructor() {
    this.initVersionCheck();
  }

  private initVersionCheck(): void {
    if (typeof window === 'undefined') return;

    // Detect current running bundle hash from document scripts
    this.currentHash = this.detectCurrentScriptHash();

    // Check on startup
    setTimeout(() => this.checkForNewVersion(), 3000);

    // Check when user returns to tab / focuses window
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkForNewVersion();
      }
    });

    // Periodic check every 10 minutes
    this.checkInterval = setInterval(() => {
      this.checkForNewVersion();
    }, 10 * 60 * 1000);
  }

  private detectCurrentScriptHash(): string {
    const scripts = Array.from(document.querySelectorAll('script[src]')) as HTMLScriptElement[];
    const mainScript = scripts.find(s => s.src.includes('main-') || s.src.includes('main.'));
    if (mainScript) {
      const match = mainScript.src.match(/main-([A-Za-z0-9]+)\.js/);
      if (match) return match[1];
    }
    return '';
  }

  public async checkForNewVersion(): Promise<void> {
    if (!this.currentHash) {
      this.currentHash = this.detectCurrentScriptHash();
      return;
    }

    try {
      // Fetch latest index.html with timestamp to bypass intermediate browser/CDN caching
      const response = await fetch(`./index.html?_cb=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) return;

      const html = await response.text();
      const match = html.match(/main-([A-Za-z0-9]+)\.js/);

      if (match && match[1]) {
        const latestHash = match[1];
        if (latestHash !== this.currentHash) {
          console.log(`[VersionCheck] New build detected: ${latestHash} (current: ${this.currentHash}). Auto-reloading...`);
          // Unregister any old service workers and reload seamlessly
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
            }
          }
          window.location.reload();
        }
      }
    } catch (e) {
      // Ignore network errors during background check
    }
  }
}
