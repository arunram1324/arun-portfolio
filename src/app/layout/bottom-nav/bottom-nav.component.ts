import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../core/services/navigation.service';
import { NavPage } from '../../core/models/portfolio.model';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss']
})
export class BottomNavComponent {
  // Dynamically filter mobile quick navigation tabs based on visibility settings
  public visibleMobileNav = computed(() => {
    const visible = this.navService.visibleNavItems();
    return visible.map(item => ({
      id: item.id,
      label: item.shortLabel,
      icon: item.icon
    }));
  });

  constructor(public navService: NavigationService) {}

  public onTabClick(page: NavPage): void {
    this.navService.navigateTo(page);
  }
}
