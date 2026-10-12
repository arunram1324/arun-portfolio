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

  public onDownloadDocx(): void {
    this.resumeService.downloadDocxResume();
  }

  public onPrint(): void {
    window.print();
  }

  public onClose(): void {
    this.resumeService.closeResumeModal();
  }

  public getUniqueSkills(skills: string[]): string[] {
    return this.resumeService.getUniqueSkills(skills);
  }

  public getExperienceBullets(description: string): string[] {
    return this.resumeService.getExperienceBullets(description);
  }

  public getCategorizedTools(): { name: string; tools: string[] }[] {
    return this.resumeService.getCategorizedTools();
  }

  public getContactEmail(): string {
    return this.resumeService.getContactEmail();
  }

  public getContactPhone(): string {
    return this.resumeService.getContactPhone();
  }

  public getLinkedIn(): string {
    return this.resumeService.getLinkedIn();
  }

  public getLocation(): string {
    return this.resumeService.getLocation();
  }

  public getWebsite(): string {
    return this.resumeService.getWebsite();
  }
}
