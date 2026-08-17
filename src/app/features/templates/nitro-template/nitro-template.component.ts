import { Component, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioDataService } from '../../../core/services/portfolio-data.service';
import { MessageService } from '../../../core/services/message.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ResumeService } from '../../../core/services/resume.service';
import { VirtualTwinService } from '../../../core/services/virtual-twin.service';
import { Project } from '../../../core/models/portfolio.model';

@Component({
  selector: 'app-nitro-template',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nitro-template.component.html',
  styleUrls: ['./nitro-template.component.scss']
})
export class NitroTemplateComponent {
  public selectedCategory = signal<string>('All');
  public activeTab = signal<'all' | 'case-studies' | 'systems' | 'mobile'>('all');

  // Contact Form State
  public messageForm = {
    name: '',
    email: '',
    subject: 'Project Inquiry',
    message: ''
  };
  public isSubmitting = signal<boolean>(false);
  public isSuccess = signal<boolean>(false);

  // In-Page Lightbox Modal State
  public activeModalProject = signal<Project | null>(null);
  public isPlaying = signal<boolean>(false);
  public videoLoadError = signal<boolean>(false);

  @ViewChild('videoPlayer') public videoPlayerRef?: ElementRef<HTMLVideoElement>;

  // Virtual Twin Quick Interaction
  public quickAiPrompt = signal<string>('');
  public aiQuickResponse = signal<string>('');
  public isAiThinking = signal<boolean>(false);

  public filteredProjects = computed(() => {
    const list = this.portfolioData.projects();
    const cat = this.selectedCategory();
    if (cat === 'All') return list;
    return list.filter(p => p.category === cat || p.tags.includes(cat));
  });

  public readonly designPrinciples = [
    {
      step: '01',
      title: 'Discover & Empathize',
      tag: 'Research',
      desc: 'Conducting in-depth user interviews, competitive benchmarking, and identifying friction points to uncover real product opportunities.'
    },
    {
      step: '02',
      title: 'Define & Strategize',
      tag: 'Architecture',
      desc: 'Structuring intuitive information architecture, task flows, persona journeys, and measurable business KPI benchmarks.'
    },
    {
      step: '03',
      title: 'Design & Systematize',
      tag: 'Figma Tokens',
      desc: 'Crafting pixel-perfect components with atomic variables, auto-layout, and multi-tier tokens adhering to strict WCAG AAA standards.'
    },
    {
      step: '04',
      title: 'Prototype & Validate',
      tag: 'Validation',
      desc: 'Building high-fidelity micro-interactions in ProtoPie and running unmoderated usability tests on Maze before engineering handoff.'
    },
    {
      step: '05',
      title: 'Developer Handoff & QA',
      tag: 'Engineering',
      desc: 'Providing tokenized specs, component state tables, and conducting Design QA with frontend engineers to guarantee 100% fidelity.'
    }
  ];

  public readonly services = [
    {
      icon: '🚀',
      title: '0-to-1 MVP Product Design',
      desc: 'Transforming napkin ideas into investor-ready, high-converting interactive prototypes within 2 to 4 weeks.',
      deliverables: ['User Flow Mapping', 'Wireframes & High-Fi Prototypes', 'Clickable Demo', 'Design Specs']
    },
    {
      icon: '🏢',
      title: 'Enterprise SaaS & ERP Systems',
      desc: 'Simplifying high-density data tables, multi-step workflows, and complex dashboards into frictionless experiences.',
      deliverables: ['Information Architecture', 'Density Optimization', 'Role-Based Views', 'Design QA']
    },
    {
      icon: '🎨',
      title: 'Design Systems & Multi-Brand Tokens',
      desc: 'Architecting scalable Figma component libraries with variables, dark/light mode modes, and dev-ready tokens.',
      deliverables: ['200+ Core Components', 'Multi-Tier Tokens', 'Documentation Guidelines', 'Code Alignment']
    },
    {
      icon: '⚡',
      title: 'Mobile App UX/UI (iOS & Android)',
      desc: 'Designing thumb-friendly, accessible mobile experiences with fluid micro-interactions and high retention UX.',
      deliverables: ['Native iOS & Material Guidelines', 'Micro-interactions', 'App Store Assets', 'Handoff']
    }
  ];

  constructor(
    public portfolioData: PortfolioDataService,
    public messageService: MessageService,
    public resumeService: ResumeService,
    public vtService: VirtualTwinService,
    public themeService: ThemeService,
    public toastService: ToastService
  ) {}

  public scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          video.currentTime = 0;
          video.play().then(() => this.isPlaying.set(true)).catch(() => this.isPlaying.set(false));
        }
      }, 100);
    }
  }

  public closeModal(): void {
    if (this.videoPlayerRef?.nativeElement) {
      this.videoPlayerRef.nativeElement.pause();
    }
    this.activeModalProject.set(null);
    this.isPlaying.set(false);
  }

  public isVideoProject(project: Project): boolean {
    const media = project.videoUrl || project.image || '';
    return project.mediaType === 'video' || media.endsWith('.mp4') || media.endsWith('.webm') || media.includes('/videos/');
  }

  public togglePlayVideo(): void {
    const video = this.videoPlayerRef?.nativeElement;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => this.isPlaying.set(true)).catch(() => this.isPlaying.set(false));
    } else {
      video.pause();
      this.isPlaying.set(false);
    }
  }

  public onVideoError(): void {
    this.videoLoadError.set(true);
    this.isPlaying.set(false);
  }

  public copyEmail(): void {
    const emailLink = this.portfolioData.contactLinks().find(l => l.action === 'copy' || l.label.toLowerCase().includes('email'));
    const email = emailLink?.value || 'arunram1324@gmail.com';
    this.toastService.copyToClipboard(email, 'Email copied to clipboard! ✉️');
  }

  public async askQuickAi(promptText?: string): Promise<void> {
    const query = promptText || this.quickAiPrompt().trim();
    if (!query || this.isAiThinking()) return;

    this.isAiThinking.set(true);
    this.aiQuickResponse.set('');

    try {
      const reply = await this.vtService.aiTwin.generateAiResponse(query, false);
      this.aiQuickResponse.set(reply);
      this.quickAiPrompt.set('');
    } catch (err) {
      this.aiQuickResponse.set("I'm Arun's Virtual Twin AI. I specialize in enterprise FinTech, ERP product design, and scalable Figma design systems.");
    } finally {
      this.isAiThinking.set(false);
    }
  }

  public async onSubmitMessage(): Promise<void> {
    if (!this.messageForm.name.trim() || !this.messageForm.email.trim() || !this.messageForm.message.trim()) {
      this.toastService.show('Please fill in your name, email, and project message.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      const autoReplySettings = this.portfolioData.autoReplySettings();
      const autoReplyText = (autoReplySettings.bodyTemplate || `Hi {{name}},\n\nThank you for reaching out regarding "{{subject}}".\n\nI have received your message and will review the details. You can expect to hear back from me within 24 hours.\n\nBest regards,\nArun K R\nLead Product Designer`)
        .replace(/\{\{name\}\}/gi, this.messageForm.name)
        .replace(/\{\{subject\}\}/gi, this.messageForm.subject)
        .replace(/\{\{email\}\}/gi, this.messageForm.email);

      await this.messageService.sendMessage(this.messageForm, autoReplyText);
      this.isSuccess.set(true);
      this.toastService.show('Message sent successfully! A confirmation reply was sent to your email.');
      this.messageForm = {
        name: '',
        email: '',
        subject: 'Project Inquiry',
        message: ''
      };
      setTimeout(() => this.isSuccess.set(false), 6000);
    } catch (e) {
      this.toastService.show('Failed to send message. Please reach out directly via email.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
