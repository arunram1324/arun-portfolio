import { Injectable, signal } from '@angular/core';

export interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class SpeechRecognitionService {
  public isSupported = signal<boolean>(false);
  public isListening = signal<boolean>(false);
  public transcript = signal<string>('Click the mic and start talking');
  public interimTranscript = signal<string>('');
  public error = signal<string | null>(null);

  private recognition: any = null;
  private onFinalCallback?: (text: string) => void;

  constructor() {
    this.initRecognition();
  }

  private initRecognition(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.isSupported.set(true);
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: SpeechRecognitionResultEvent) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            if (res.isFinal) {
              final += res[0].transcript;
            } else {
              interim += res[0].transcript;
            }
          }

          if (interim) {
            this.interimTranscript.set(interim);
            this.transcript.set(interim);
          }

          if (final) {
            this.transcript.set(final);
            this.interimTranscript.set('');
            if (this.onFinalCallback) {
              this.onFinalCallback(final.trim());
            }
          }
        };

        this.recognition.onerror = (e: any) => {
          if (e.error === 'not-allowed') {
            this.error.set('Mic permission denied. Please allow microphone access.');
            this.stop();
          }
        };

        this.recognition.onend = () => {
          if (this.isListening()) {
            // Auto-restart if user still has session active
            try {
              this.recognition.start();
            } catch (err) {
              // ignore
            }
          }
        };
      } catch (err) {
        this.isSupported.set(false);
      }
    } else {
      this.isSupported.set(false);
    }
  }

  public setOnFinalText(cb: (text: string) => void): void {
    this.onFinalCallback = cb;
  }

  public start(): boolean {
    if (!this.recognition) return false;
    this.error.set(null);
    this.isListening.set(true);
    this.transcript.set('Listening...');
    try {
      this.recognition.start();
      return true;
    } catch (e) {
      return false;
    }
  }

  public pause(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  public resume(): void {
    if (this.recognition && this.isListening()) {
      try {
        this.recognition.start();
      } catch (e) {}
    }
  }

  public stop(): void {
    this.isListening.set(false);
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.transcript.set('Click the mic and start talking');
  }
}
