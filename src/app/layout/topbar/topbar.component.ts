import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../core/services/navigation.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
  constructor(
    public navService: NavigationService,
    public themeService: ThemeService
  ) {}

  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  public openDrawer(): void {
    this.navService.openMobileDrawer();
  }

  public onProfileClick(): void {
    this.navService.navigateTo('intro');
  }
}
