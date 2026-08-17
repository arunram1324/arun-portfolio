import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpeechSynthesisService {
  public isSpeaking = signal<boolean>(false);
  public isSupported = signal<boolean>(false);

  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.isSupported.set(true);
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();

    // Prefer high-quality conversational English voices
    const preferredNames = ['Google US English', 'Samantha', 'Karen', 'Daniel', 'Alex', 'en-US'];
    for (const name of preferredNames) {
      const match = this.voices.find(v => v.name.includes(name) || v.lang === name);
      if (match) {
        this.selectedVoice = match;
        break;
      }
    }
    if (!this.selectedVoice && this.voices.length > 0) {
      this.selectedVoice = this.voices.find(v => v.lang.startsWith('en')) || this.voices[0];
    }
  }

  public speak(text: string, onStart?: () => void, onEnd?: () => void): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    this.cancel();

    // Clean text: strip markdown, asterisks, bullet points, and urls for natural spoken voice
    const cleanText = text
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[•\-\#\`\>]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking.set(true);
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking.set(false);
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking.set(false);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  public cancel(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking.set(false);
    }
  }
}
