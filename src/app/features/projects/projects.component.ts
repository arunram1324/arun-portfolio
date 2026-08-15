import { Component, signal, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioDataService } from '../../core/services/portfolio-data.service';
import { Project } from '../../core/models/portfolio.model';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent {
  public selectedCategory = signal<string>('All');
  public currentPage = signal<number>(0);
  public pageSize = 6;

  // Selected project for interactive in-page Video / Mockup Lightbox Modal
  public activeModalProject = signal<Project | null>(null);
  public isPlaying = signal<boolean>(false);
  public videoLoadError = signal<boolean>(false);

  @ViewChild('videoPlayer') public videoPlayerRef?: ElementRef<HTMLVideoElement>;

  public filteredProjects = computed(() => {
    const list = this.portfolioData.projects();
    const cat = this.selectedCategory();
    if (cat === 'All') return list;
    return list.filter(p => p.category === cat || p.tags.includes(cat));
  });

  public visibleProjects = computed(() => {
    const list = this.filteredProjects();
    const start = this.currentPage() * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  public maxPages = computed(() => {
    const len = this.filteredProjects().length;
    return Math.max(1, Math.ceil(len / this.pageSize));
  });

  constructor(public portfolioData: PortfolioDataService) {}

  public selectCategory(cat: string): void {
    this.selectedCategory.set(cat);
    this.currentPage.set(0);
  }

  public next(): void {
    if (this.currentPage() < this.maxPages() - 1) {
      this.currentPage.update(p => p + 1);
    }
  }

  public prev(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
    }
  }

  public openProject(project: Project): void {
    this.activeModalProject.set(project);
    this.isPlaying.set(false);
    this.videoLoadError.set(false);

    if (this.isVideoProject(project)) {
      setTimeout(() => {
        const video = this.videoPlayerRef?.nativeElement;
        if (video) {
          video.load();
          video.play().then(() => {
            this.isPlaying.set(true);
          }).catch(() => {
            // Autoplay with sound restricted by browser policy; user can click large center play button
            this.isPlaying.set(false);
          });
        }
      }, 150);
    }
  }

  public closeProjectModal(): void {
    const video = this.videoPlayerRef?.nativeElement;
    if (video) {
      video.pause();
    }
    this.activeModalProject.set(null);
    this.isPlaying.set(false);
  }

  public togglePlay(event?: Event): void {
    if (event) event.stopPropagation();
    const video = this.videoPlayerRef?.nativeElement;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => this.isPlaying.set(true)).catch(() => this.isPlaying.set(false));
    } else {
      video.pause();
      this.isPlaying.set(false);
    }
  }

  public isVideoProject(p: Project | null): boolean {
    if (!p) return false;
    return !!(
      p.videoUrl || 
      p.mediaType === 'video' || 
      p.category === 'Video & Motion' ||
      (p.image && (p.image.startsWith('data:video') || p.image.endsWith('.mp4') || p.image.endsWith('.webm') || p.image.endsWith('.mov')))
    );
  }

  public getVideoSrc(p: Project | null): string {
    if (!p) return '';
    if (p.videoUrl && p.videoUrl.trim()) return p.videoUrl;
    if (p.image && (p.image.startsWith('data:video') || p.image.endsWith('.mp4') || p.image.endsWith('.webm') || p.image.endsWith('.mov'))) {
      return p.image;
    }
    if (p.category === 'Video & Motion') {
      return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    }
    return '';
  }

  public onVideoError(event: Event): void {
    console.warn('Video failed to load or decode:', event);
    this.videoLoadError.set(true);
  }

  @HostListener('document:keydown.escape')
  public handleEscape(): void {
    if (this.activeModalProject()) {
      this.closeProjectModal();
    }
  }
}
