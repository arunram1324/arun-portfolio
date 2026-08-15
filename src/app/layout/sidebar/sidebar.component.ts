import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../core/services/navigation.service';
import { PortfolioDataService } from '../../core/services/portfolio-data.service';
import { NavPage } from '../../core/models/portfolio.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  constructor(
    public navService: NavigationService,
    public portfolioData: PortfolioDataService
  ) {}

  public onNavClick(page: NavPage): void {
    this.navService.navigateTo(page);
  }

  public toggleCollapse(): void {
    this.navService.toggleSidebarCollapse();
  }
}
