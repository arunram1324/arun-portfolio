import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VirtualTwinService } from '../../../../core/services/virtual-twin.service';

@Component({
  selector: 'app-chat-stage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-stage.component.html',
  styleUrls: ['./chat-stage.component.scss']
})
export class ChatStageComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('inputField') private inputField?: ElementRef<HTMLTextAreaElement>;

  public inputText: string = '';
  private shouldScrollToBottom: boolean = false;

  constructor(public vtService: VirtualTwinService) {}

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  public onSend(): void {
    const text = this.inputText.trim();
    if (!text || this.vtService.isStreaming()) return;

    this.inputText = '';
    this.resetTextareaHeight();
    this.shouldScrollToBottom = true;
    this.vtService.sendMessage(text);
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  public onInputResize(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  public sendPrompt(prompt: string): void {
    this.inputText = prompt;
    this.onSend();
  }

  private resetTextareaHeight(): void {
    if (this.inputField) {
      this.inputField.nativeElement.style.height = '';
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }
  }
}
