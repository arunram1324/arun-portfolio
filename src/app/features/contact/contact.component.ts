import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioDataService } from '../../core/services/portfolio-data.service';
import { MessageService } from '../../core/services/message.service';
import { ToastService } from '../../shared/services/toast.service';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { ContactLink } from '../../core/models/portfolio.model';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, PanelCardComponent],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  public messageForm = {
    name: '',
    email: '',
    subject: 'Freelance Project',
    message: ''
  };

  public isSubmitting = signal<boolean>(false);
  public isSuccess = signal<boolean>(false);

  constructor(
    public portfolioData: PortfolioDataService,
    private messageService: MessageService,
    private toastService: ToastService
  ) {}

  public onContactClick(event: MouseEvent, link: ContactLink): void {
    if (link.action === 'copy') {
      event.preventDefault();
      const textToCopy = link.value || link.label || link.href.replace('mailto:', '').replace('tel:', '');
      this.toastService.copyToClipboard(textToCopy, `${link.label || 'Contact'} copied to clipboard!`);
    }
  }

  public async onSubmitMessage(): Promise<void> {
    if (!this.messageForm.name.trim() || !this.messageForm.email.trim() || !this.messageForm.message.trim()) {
      this.toastService.show('Please fill in your name, email, and message.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      await this.messageService.sendMessage(this.messageForm);
      this.isSuccess.set(true);
      this.toastService.show('Message sent successfully! Arun will reach out soon.');
      this.messageForm = {
        name: '',
        email: '',
        subject: 'Freelance Project',
        message: ''
      };
      setTimeout(() => this.isSuccess.set(false), 6000);
    } catch (e) {
      this.toastService.show('Failed to send message. Please reach out directly via email.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
