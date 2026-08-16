import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioDataService } from '../../core/services/portfolio-data.service';
import { MessageService } from '../../core/services/message.service';
import { ToastService } from '../../shared/services/toast.service';
import { ContactLink } from '../../core/models/portfolio.model';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  public messageForm = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    projectType: 'Freelance Project',
    timeline: '1-3 Months',
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
    const fullName = `${this.messageForm.firstName.trim()} ${this.messageForm.lastName.trim()}`.trim();
    if (!fullName || !this.messageForm.email.trim() || !this.messageForm.message.trim()) {
      this.toastService.show('Please fill in your name, email, and message.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      const isNetworking = this.messageForm.projectType === 'Networking';
      const detailedMessage = `Contact Phone: ${this.messageForm.phone || 'Not provided'}\nInquiry Type: ${this.messageForm.projectType}${isNetworking ? '' : '\nProject Timeline: ' + (this.messageForm.timeline || 'Immediate / 1-3 Months')}\n\nMessage:\n${this.messageForm.message}`;

      // Retrieve dynamic auto-reply template configured in Admin
      const autoReplySettings = this.portfolioData.autoReplySettings();
      const autoReplyText = (autoReplySettings.bodyTemplate || `Hi {{name}},\n\nThank you for reaching out through my portfolio regarding "{{subject}}".\n\nI have received your message and will review the details. You can expect to hear back from me within 24 hours.\n\nBest regards,\nArun K R\nLead Product Designer`)
        .replace(/\{\{name\}\}/gi, fullName)
        .replace(/\{\{subject\}\}/gi, this.messageForm.projectType)
        .replace(/\{\{email\}\}/gi, this.messageForm.email);

      await this.messageService.sendMessage({
        name: fullName,
        email: this.messageForm.email,
        subject: this.messageForm.projectType || 'Portfolio Contact Inquiry',
        message: detailedMessage
      }, autoReplyText);

      this.isSuccess.set(true);
      this.toastService.show('Message sent successfully! A confirmation reply was dispatched to your email.');
      this.messageForm = {
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        projectType: 'Freelance Project',
        timeline: '1-3 Months',
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
