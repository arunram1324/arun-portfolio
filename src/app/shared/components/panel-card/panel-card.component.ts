import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-panel-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './panel-card.component.html',
  styleUrls: ['./panel-card.component.scss']
})
export class PanelCardComponent {
  @Input() title: string = '';
  @Input() monogram: string = '';
  @Input() customClass: string = '';
}
