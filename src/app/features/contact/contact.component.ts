import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioDataService } from '../../core/services/portfolio-data.service';
import { ToastService } from '../../shared/services/toast.service';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { ContactLink } from '../../core/models/portfolio.model';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, PanelCardComponent],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  constructor(
    public portfolioData: PortfolioDataService,
    private toastService: ToastService
  ) {}

  public onContactClick(event: MouseEvent, link: ContactLink): void {
    if (link.action === 'copy') {
      event.preventDefault();
      this.toastService.copyToClipboard('arun.uxdesigner@example.com', 'Email copied to clipboard!');
    }
  }
}
