import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioDataService } from '../../../core/services/portfolio-data.service';
import { ResumeService } from '../../../core/services/resume.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-resume-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resume-modal.component.html',
  styleUrls: ['./resume-modal.component.scss']
})
export class ResumeModalComponent {
  constructor(
    public portfolioData: PortfolioDataService,
    public resumeService: ResumeService,
    public themeService: ThemeService
  ) {}

  public onDownload(): void {
    this.resumeService.downloadPdfResume();
  }

  public onPrint(): void {
    window.print();
  }

  public onClose(): void {
    this.resumeService.closeResumeModal();
  }

  public getContactEmail(): string {
    const links = this.portfolioData.contactLinks();
    const mailLink = links.find(l => l.icon === 'mail' || (l.label && l.label.toLowerCase().includes('email')));
    if (mailLink && mailLink.value) return mailLink.value;
    return 'arunram1324@gmail.com';
  }

  public getContactPhone(): string {
    const links = this.portfolioData.contactLinks();
    const phoneLink = links.find(l => l.icon === 'phone' || (l.label && l.label.toLowerCase().includes('phone')));
    if (phoneLink && phoneLink.value) return phoneLink.value;
    return '+91 98765 43210';
  }
}
