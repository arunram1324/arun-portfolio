import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../core/services/navigation.service';
import { ThemeService } from '../../core/services/theme.service';
import { PortfolioDataService } from '../../core/services/portfolio-data.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ResumeService } from '../../core/services/resume.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  constructor(
    public navService: NavigationService,
    public themeService: ThemeService,
    public portfolioData: PortfolioDataService,
    public resumeService: ResumeService,
    private analyticsService: AnalyticsService
  ) {}

  public onStartNow(): void {
    this.analyticsService.notifyVisitorEntered();
    this.navService.startApp('intro');
  }

  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
