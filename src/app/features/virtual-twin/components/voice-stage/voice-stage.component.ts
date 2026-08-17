import { Component, OnInit, OnDestroy, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpeechRecognitionService } from '../../../../core/services/speech-recognition.service';
import { SpeechSynthesisService } from '../../../../core/services/speech-synthesis.service';
import { VirtualTwinService } from '../../../../core/services/virtual-twin.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-voice-stage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voice-stage.component.html',
  styleUrls: ['./voice-stage.component.scss']
})
export class VoiceStageComponent implements OnInit, OnDestroy {
  @Output() triggerQuestion = new EventEmitter<string>();

  public statusText = signal<string>('Ready to chat?');
  public badgeText = signal<string>('Listening…');
  public isBlobListening = signal<boolean>(false);
  public isBlobSpeaking = signal<boolean>(false);

  public readonly hintPrompts = [
    { label: '💬 "Who are you?"', text: 'Who are you?' },
    { label: '📁 "Show projects"', text: 'Show me your projects' },
    { label: '📧 "Contact details"', text: 'What are your contact details?' },
    { label: '🛠️ "Skills & tools"', text: 'What are your skills and tools?' }
  ];

  constructor(
    public speechRec: SpeechRecognitionService,
    public speechSynth: SpeechSynthesisService,
    public vtService: VirtualTwinService,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.speechRec.setOnFinalText((finalText) => {
      this.handleUserInput(finalText);
    });
  }

  ngOnDestroy(): void {
    this.stopVoiceSession();
  }

  public toggleSession(): void {
    if (this.speechRec.isListening()) {
      this.stopVoiceSession();
    } else {
      this.startVoiceSession();
    }
  }

  public startVoiceSession(): void {
    const started = this.speechRec.start();
    if (started) {
      this.isBlobListening.set(true);
      this.isBlobSpeaking.set(false);
      this.statusText.set('Listening…');
      this.badgeText.set('Listening…');
    } else {
      this.statusText.set('Speech recognition not available');
    }
  }

  public stopVoiceSession(): void {
    this.speechRec.stop();
    this.speechSynth.cancel();
    this.isBlobListening.set(false);
    this.isBlobSpeaking.set(false);
    this.statusText.set('Ready to chat?');
  }

  public onHintTap(text: string): void {
    if (this.speechRec.isListening()) {
      this.handleUserInput(text);
    } else {
      this.triggerQuestion.emit(text);
    }
  }

  private isProcessingInput = false;

  private async handleUserInput(text: string): Promise<void> {
    if (!text || text.trim().length < 2 || this.isProcessingInput) return;
    this.isProcessingInput = true;

    this.speechRec.pause();
    this.statusText.set('Arun AI Thinking… 🧠');
    this.badgeText.set('Thinking…');
    this.isBlobListening.set(false);
    this.isBlobSpeaking.set(false);

    try {
      const reply = await this.vtService.getVoiceAnswerAsync(text);
      this.speakResponse(reply);
    } catch (err) {
      const fallback = this.vtService.getVoiceAnswer(text);
      this.speakResponse(fallback);
    }
  }

  private speakResponse(replyText: string): void {
    // Stop microphone while Arun's AI speaks to eliminate acoustic echo feedback
    this.speechRec.pause();
    this.statusText.set('Arun Speaking…');
    this.badgeText.set('Speaking…');
    this.isBlobSpeaking.set(true);
    this.isBlobListening.set(false);

    this.speechSynth.speak(
      replyText,
      () => {
        // onStart
        this.isBlobSpeaking.set(true);
      },
      () => {
        // onEnd -> Resume microphone if session is active
        this.isBlobSpeaking.set(false);
        this.isProcessingInput = false;
        if (this.speechRec.isListening()) {
          this.isBlobListening.set(true);
          this.statusText.set('Listening…');
          this.badgeText.set('Listening…');
          this.speechRec.resume();
        } else {
          this.statusText.set('Ready to chat?');
        }
      }
    );
  }
}
