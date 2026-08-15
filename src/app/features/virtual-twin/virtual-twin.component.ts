import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceStageComponent } from './components/voice-stage/voice-stage.component';
import { ChatStageComponent } from './components/chat-stage/chat-stage.component';

export type VtTabMode = 'voice' | 'chat';

@Component({
  selector: 'app-virtual-twin',
  standalone: true,
  imports: [CommonModule, VoiceStageComponent, ChatStageComponent],
  templateUrl: './virtual-twin.component.html',
  styleUrls: ['./virtual-twin.component.scss']
})
export class VirtualTwinComponent {
  @ViewChild(ChatStageComponent) private chatStage?: ChatStageComponent;
  @ViewChild(VoiceStageComponent) private voiceStage?: VoiceStageComponent;

  public activeMode = signal<VtTabMode>('voice');

  public switchMode(mode: VtTabMode): void {
    if (this.activeMode() === 'voice' && mode === 'chat') {
      this.voiceStage?.stopVoiceSession();
    }
    this.activeMode.set(mode);
  }

  public handleHintFromVoice(question: string): void {
    this.switchMode('chat');
    setTimeout(() => {
      this.chatStage?.sendPrompt(question);
    }, 60);
  }
}
