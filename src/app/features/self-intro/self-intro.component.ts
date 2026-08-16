import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../core/services/navigation.service';
import { PortfolioDataService } from '../../core/services/portfolio-data.service';
import { ResumeService } from '../../core/services/resume.service';

@Component({
  selector: 'app-self-intro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './self-intro.component.html',
  styleUrls: ['./self-intro.component.scss']
})
export class SelfIntroComponent {
  constructor(
    public navService: NavigationService,
    public portfolioData: PortfolioDataService,
    public resumeService: ResumeService
  ) {}

  public exploreWork(): void {
    this.navService.navigateTo('proj');
  }

  public chatWithTwin(): void {
    this.navService.navigateTo('vt');
  }
}
