import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../core/services/navigation.service';
import { PortfolioDataService } from '../../core/services/portfolio-data.service';
import { LandingComponent } from '../landing/landing.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { TopbarComponent } from '../../layout/topbar/topbar.component';
import { BottomNavComponent } from '../../layout/bottom-nav/bottom-nav.component';
import { VirtualTwinComponent } from '../virtual-twin/virtual-twin.component';
import { SelfIntroComponent } from '../self-intro/self-intro.component';
import { WorkExperienceComponent } from '../work-experience/work-experience.component';
import { ProjectsComponent } from '../projects/projects.component';
import { ToolsComponent } from '../tools/tools.component';
import { SkillsComponent } from '../skills/skills.component';
import { ContactComponent } from '../contact/contact.component';
import { MarttinTemplateComponent } from '../templates/marttin-template/marttin-template.component';
import { NitroTemplateComponent } from '../templates/nitro-template/nitro-template.component';

@Component({
  selector: 'app-portfolio-shell',
  standalone: true,
  imports: [
    CommonModule,
    LandingComponent,
    SidebarComponent,
    TopbarComponent,
    BottomNavComponent,
    VirtualTwinComponent,
    SelfIntroComponent,
    WorkExperienceComponent,
    ProjectsComponent,
    ToolsComponent,
    SkillsComponent,
    ContactComponent,
    MarttinTemplateComponent,
    NitroTemplateComponent
  ],
  templateUrl: './portfolio-shell.component.html',
  styleUrls: ['./portfolio-shell.component.scss']
})
export class PortfolioShellComponent {
  constructor(
    public navService: NavigationService,
    public portfolioData: PortfolioDataService
  ) {}

  public onOverlayClick(): void {
    this.navService.closeMobileDrawer();
  }
}
