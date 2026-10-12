import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioDataService } from '../../core/services/portfolio-data.service';
import { ToolItem } from '../../core/models/portfolio.model';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [CommonModule, PanelCardComponent],
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss']
})
export class ToolsComponent {
  constructor(public portfolioData: PortfolioDataService) {}

  public getToolIconKey(tool: ToolItem): string {
    const id = (tool.id || '').toLowerCase().trim();
    const name = (tool.name || '').toLowerCase().trim();
    
    if (id === 'flutter' || id.includes('flutter') || name.includes('flutter')) return 'flutter';
    if (id === 'figma' || name.includes('figma')) return 'figma';
    if (id === 'protopie' || name.includes('protopie')) return 'protopie';
    if (id === 'adobexd' || name.includes('xd')) return 'adobexd';
    if (id === 'illustrator' || name.includes('illustrator')) return 'illustrator';
    if (id === 'photoshop' || name.includes('photoshop')) return 'photoshop';
    if (id === 'aftereffects' || name.includes('after effects')) return 'aftereffects';
    if (id === 'premierepro' || name.includes('premiere')) return 'premierepro';
    if (id === 'davinciresolve' || name.includes('davinci')) return 'davinciresolve';
    if (id === 'spline' || name.includes('spline')) return 'spline';
    if (id === 'framer' || name.includes('framer')) return 'framer';
    if (id === 'principle' || name.includes('principle')) return 'principle';
    if (id === 'figjam' || name.includes('figjam')) return 'figjam';
    if (id === 'miro' || name.includes('miro')) return 'miro';
    if (id === 'notion' || name.includes('notion')) return 'notion';
    if (id === 'maze' || name.includes('maze')) return 'maze';
    if (id === 'html5' || name.includes('html')) return 'html5';
    if (id === 'css3' || name.includes('css') || name.includes('scss')) return 'css3';
    if (id === 'javascript' || name.includes('javascript') || name === 'js') return 'javascript';
    if (id === 'typescript' || name.includes('typescript') || name === 'ts') return 'typescript';
    if (id === 'angular' || name.includes('angular')) return 'angular';
    if (id === 'vscode' || name.includes('vscode') || name.includes('vs code')) return 'vscode';
    if (id === 'github' || name.includes('github') || name.includes('git')) return 'github';
    
    return id;
  }
}
