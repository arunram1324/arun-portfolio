import { Component, signal, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioDataService } from '../../../core/services/portfolio-data.service';
import { MessageService } from '../../../core/services/message.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Project, VoiceQAItem } from '../../../core/models/portfolio.model';

@Component({
  selector: 'app-marttin-template',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marttin-template.component.html',
  styleUrls: ['./marttin-template.component.scss']
})
export class MarttinTemplateComponent {
  public selectedCategory = signal<string>('All');

  // Contact Form State
  public messageForm = {
    name: '',
    email: '',
    subject: 'Freelance Project',
    message: ''
  };
  public isSubmitting = signal<boolean>(false);
  public isSuccess = signal<boolean>(false);

  // In-Page Lightbox Modal State
  public activeModalProject = signal<Project | null>(null);
  public isPlaying = signal<boolean>(false);
  public videoLoadError = signal<boolean>(false);

  @ViewChild('videoPlayer') public videoPlayerRef?: ElementRef<HTMLVideoElement>;

  // Virtual Twin Voice AI State
  public isSpeaking = signal<boolean>(false);
  public activeVoiceQA = signal<VoiceQAItem | null>(null);
  public spokenTranscript = signal<string>('Click any prompt below or speak to interact with Arun’s Virtual Twin.');

  public filteredProjects = computed(() => {
    const list = this.portfolioData.projects();
    const cat = this.selectedCategory();
    if (cat === 'All') return list;
    return list.filter(p => p.category === cat || p.tags.includes(cat));
  });

  constructor(
    public portfolioData: PortfolioDataService,
    public messageService: MessageService,
    public themeService: ThemeService,
    public toastService: ToastService
  ) {}

  public async onSubmitMessage(): Promise<void> {
    if (!this.messageForm.name.trim() || !this.messageForm.email.trim() || !this.messageForm.message.trim()) {
      this.toastService.show('Please fill in your name, email, and message.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      await this.messageService.sendMessage(this.messageForm);
      this.isSuccess.set(true);
      this.toastService.show('Message sent successfully! Arun will reach out soon.');
      this.messageForm = {
        name: '',
        email: '',
        subject: 'Freelance Project',
        message: ''
      };
      setTimeout(() => this.isSuccess.set(false), 6000);
    } catch (e) {
      this.toastService.show('Failed to send message. Please reach out directly via email.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public selectCategory(cat: string): void {
    this.selectedCategory.set(cat);
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
    this.videoLoadError.set(true);
  }

  public triggerVoiceQA(qa: VoiceQAItem): void {
    this.activeVoiceQA.set(qa);
    this.spokenTranscript.set(qa.voiceAnswer);
    this.speakText(qa.voiceAnswer);
  }

  private speakText(text: string): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => this.isSpeaking.set(true);
      utterance.onend = () => this.isSpeaking.set(false);
      utterance.onerror = () => this.isSpeaking.set(false);
      window.speechSynthesis.speak(utterance);
    }
  }

  public copyContact(text: string, label: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.toastService.show(`Copied ${label} to clipboard!`);
    }
  }

  public scrollTo(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  @HostListener('document:keydown.escape')
  public handleEscape(): void {
    if (this.activeModalProject()) {
      this.closeProjectModal();
    }
  }
}
