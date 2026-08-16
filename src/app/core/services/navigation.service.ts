import { Injectable, signal, computed, inject } from '@angular/core';
import { NavItem, NavPage } from '../models/portfolio.model';
import { PortfolioDataService } from './portfolio-data.service';
import { AnalyticsService } from './analytics.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private portfolioData = inject(PortfolioDataService);
  private analytics = inject(AnalyticsService);

  public hasStarted = signal<boolean>(false);
  public activePage = signal<NavPage>('intro');
  public isSidebarIconMode = signal<boolean>(false);
  public isMobileDrawerOpen = signal<boolean>(false);

  constructor() {
    // Initial page impression tracking
    setTimeout(() => {
      this.analytics.trackPageView(this.activePage());
    }, 500);
  }

  public startApp(targetPage: NavPage = 'intro'): void {
    this.activePage.set(targetPage);
    this.hasStarted.set(true);
    this.analytics.trackPageView(targetPage);
  }

  public returnToLanding(): void {
    this.hasStarted.set(false);
  }

  public readonly navItems: NavItem[] = [
    { id: 'vt', label: 'Virtual Twin', shortLabel: 'Twin', tooltip: 'Virtual Twin AI', icon: 'mic' },
    { id: 'intro', label: 'Self Intro', shortLabel: 'Intro', tooltip: 'Self Introduction', icon: 'user' },
    { id: 'exp', label: 'Work Experience', shortLabel: 'Work', tooltip: 'Work Experience', icon: 'briefcase' },
    { id: 'proj', label: 'Projects', shortLabel: 'Projects', tooltip: 'Featured Projects', icon: 'grid' },
    { id: 'tools', label: 'Design Toolkit', shortLabel: 'Tools', tooltip: 'Design & Dev Tools', icon: 'tool' },
    { id: 'skills', label: 'Skills', shortLabel: 'Skills', tooltip: 'Core Capabilities', icon: 'star' },
    { id: 'contact', label: 'Contact', shortLabel: 'Contact', tooltip: 'Get in Touch', icon: 'phone' }
  ];

  // Dynamically filter nav items based on CMS Section Visibility toggles
  public visibleNavItems = computed(() => {
    const visibility = this.portfolioData.sectionVisibility();
    return this.navItems.filter(item => {
      if (item.id === 'vt' && !visibility.showVirtualTwin) return false;
      if (item.id === 'exp' && !visibility.showExperience) return false;
      if (item.id === 'proj' && !visibility.showProjects) return false;
      if ((item.id === 'tools' || item.id === 'skills') && !visibility.showSkillsTools) return false;
      if (item.id === 'contact' && !visibility.showContact) return false;
      return true;
    });
  });

  // Title lookup
  public readonly pageTitles: Record<NavPage, string> = {
    vt: 'Virtual Twin',
    intro: 'Self Intro',
    exp: 'Work Experience',
    proj: 'Projects',
    tools: 'Design Toolkit',
    skills: 'Skills',
    contact: 'Contact'
  };

  public currentTitle = computed(() => this.pageTitles[this.activePage()] || 'Portfolio');

  public navigateTo(page: NavPage): void {
    this.activePage.set(page);
    this.closeMobileDrawer();
    this.analytics.trackPageView(page);
  }

  public toggleSidebarCollapse(): void {
    this.isSidebarIconMode.update(v => !v);
  }

  public openMobileDrawer(): void {
    this.isMobileDrawerOpen.set(true);
  }

  public closeMobileDrawer(): void {
    this.isMobileDrawerOpen.set(false);
  }
}
