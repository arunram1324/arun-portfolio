import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { 
  PortfolioDataService, 
  THEME_COLOR_PRESETS, 
  HEADING_FONT_PRESETS, 
  BODY_FONT_PRESETS 
} from '../../core/services/portfolio-data.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../shared/services/toast.service';
import { 
  Project, 
  ToolItem, 
  SkillCategory, 
  WorkExperience, 
  VoiceQAItem, 
  ProfileInfo,
  ContactLink,
  ContactInfo,
  TypographySettings,
  PortfolioTemplateMode,
  SectionVisibilitySettings
} from '../../core/models/portfolio.model';

type AdminTab = 'templates' | 'visibility' | 'voice-ai' | 'projects' | 'skills' | 'tools' | 'experience' | 'profile' | 'contact' | 'typography' | 'theme';

interface ConfirmConfig {
  title: string;
  message: string;
  confirmBtnText: string;
  isDanger: boolean;
  action: () => void;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent {
  public activeTab = signal<AdminTab>('voice-ai');
  public themePresets = THEME_COLOR_PRESETS;
  public headingFontPresets = HEADING_FONT_PRESETS;
  public bodyFontPresets = BODY_FONT_PRESETS;

  // Custom UI Confirmation Modal state
  public confirmModalOpen = signal<boolean>(false);
  public confirmConfig = signal<ConfirmConfig | null>(null);

  // Content Modal / Form state
  public isModalOpen = signal<boolean>(false);
  public modalType = signal<AdminTab>('voice-ai');
  public isEditMode = signal<boolean>(false);

  // Form Models
  public voiceForm: VoiceQAItem = this.getEmptyVoiceQA();
  public projectForm: Project = this.getEmptyProject();
  public toolForm: ToolItem = this.getEmptyTool();
  public skillCatForm: SkillCategory = this.getEmptySkillCat();
  public newSkillName = signal<string>('');
  public selectedSkillCatId = signal<string>('ux-ui');
  public expForm: WorkExperience = this.getEmptyExp();
  public expEditIndex = -1;
  public profileForm!: ProfileInfo;
  public newIndustryTag = signal<string>('');
  public newProjectCat = signal<string>('');

  // Contact / Get in Touch Form Models
  public contactInfoForm!: ContactInfo;
  public contactLinkForm: ContactLink = this.getEmptyContactLink();
  public contactLinkEditIndex = -1;

  constructor(
    public authService: AuthService,
    public portfolioData: PortfolioDataService,
    public themeService: ThemeService,
    public toastService: ToastService,
    private router: Router
  ) {
    this.profileForm = { ...this.portfolioData.profileInfo() };
    this.contactInfoForm = { ...this.portfolioData.contactInfo() };
    if (!this.authService.verifyStoredSession() || !this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  public setTab(tab: AdminTab): void {
    this.activeTab.set(tab);
    if (tab === 'profile') {
      this.profileForm = { ...this.portfolioData.profileInfo() };
    }
    if (tab === 'contact') {
      this.contactInfoForm = { ...this.portfolioData.contactInfo() };
    }
  }

  // --- Custom Confirmation Dialog Engine ---
  public openConfirm(config: { title: string; message: string; confirmBtnText?: string; isDanger?: boolean; action: () => void }): void {
    this.confirmConfig.set({
      title: config.title,
      message: config.message,
      confirmBtnText: config.confirmBtnText || 'Confirm',
      isDanger: config.isDanger !== false,
      action: config.action
    });
    this.confirmModalOpen.set(true);
  }

  public closeConfirm(): void {
    this.confirmModalOpen.set(false);
    this.confirmConfig.set(null);
  }

  public onExecuteConfirm(): void {
    const config = this.confirmConfig();
    if (config && config.action) {
      config.action();
    }
    this.closeConfirm();
  }

  // --- Multi-Template Switcher ---
  public selectTemplate(template: PortfolioTemplateMode): void {
    this.portfolioData.setActiveTemplate(template);
    this.toastService.show(`Live Portfolio layout switched to "${template === 'marttin' ? 'Marttin (Framer Minimalist)' : 'Bento OS Multi-Panel App'}"!`);
  }

  // --- Granular Section Visibility & Privacy Controls ---
  public toggleVisibility(key: keyof SectionVisibilitySettings): void {
    const current = this.portfolioData.sectionVisibility();
    const updated = !current[key];
    this.portfolioData.updateSectionVisibility({ [key]: updated });
    const label = key.replace('show', '');
    this.toastService.show(`${label} section is now ${updated ? 'Visible' : 'Hidden from Recruiters & Visitors'}`);
  }

  // --- Dynamic Typography Engine ---
  public setHeadingFont(family: string): void {
    this.portfolioData.updateTypography({ headingFont: family });
    this.toastService.show(`Heading font set to "${family}"`);
  }

  public setBodyFont(family: string): void {
    this.portfolioData.updateTypography({ bodyFont: family });
    this.toastService.show(`Description & Body font set to "${family}"`);
  }

  public setHeadingWeight(weight: string): void {
    this.portfolioData.updateTypography({ headingWeight: weight });
    this.toastService.show(`Heading font weight set to ${weight}`);
  }

  public setHeadingLetterSpacing(spacing: string): void {
    this.portfolioData.updateTypography({ headingLetterSpacing: spacing });
    this.toastService.show(`Heading letter spacing updated`);
  }

  // --- Dynamic Theme Customization ---
  public selectThemeColor(hex: string): void {
    this.portfolioData.setAccentColor(hex);
    this.toastService.show(`Theme Accent updated to ${hex}!`);
  }

  public onCustomColorInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.value) {
      this.portfolioData.setAccentColor(input.value);
    }
  }

  // --- Media File Uploaders (Images & MP4/WebM Videos via FileReader -> Base64 / Data URL) ---
  public onProjectMediaUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|ogg)$/i);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          if (isVideo) {
            this.projectForm.mediaType = 'video';
            this.projectForm.videoUrl = result;
            this.projectForm.image = result;
            this.toastService.show('Project Video file loaded successfully!');
          } else {
            this.projectForm.mediaType = 'image';
            this.projectForm.image = result;
            this.projectForm.videoUrl = '';
            this.toastService.show('Project Image loaded successfully!');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  }

  public removeProjectMedia(): void {
    this.projectForm.image = '';
    this.projectForm.videoUrl = '';
    this.projectForm.mediaType = 'image';
  }

  public onProjectPosterUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          this.projectForm.image = result;
          this.toastService.show('Project Thumbnail Poster loaded!');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  public removeProjectPoster(): void {
    this.projectForm.image = '';
  }

  public onProfilePhotoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          this.profileForm.photoUrl = result;
          this.portfolioData.updateProfile({ photoUrl: result });
          this.toastService.show('Profile photo updated successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // --- Modal Openers ---
  public openAddVoice(): void {
    this.voiceForm = this.getEmptyVoiceQA();
    this.isEditMode.set(false);
    this.modalType.set('voice-ai');
    this.isModalOpen.set(true);
  }

  public openEditVoice(item: VoiceQAItem): void {
    this.voiceForm = { ...item };
    this.isEditMode.set(true);
    this.modalType.set('voice-ai');
    this.isModalOpen.set(true);
  }

  public openAddProject(): void {
    this.projectForm = this.getEmptyProject();
    this.isEditMode.set(false);
    this.modalType.set('projects');
    this.isModalOpen.set(true);
  }

  public openEditProject(proj: Project): void {
    this.projectForm = { ...proj, tags: [...proj.tags] };
    this.isEditMode.set(true);
    this.modalType.set('projects');
    this.isModalOpen.set(true);
  }

  public openAddTool(): void {
    this.toolForm = this.getEmptyTool();
    this.isEditMode.set(false);
    this.modalType.set('tools');
    this.isModalOpen.set(true);
  }

  public openEditTool(tool: ToolItem): void {
    this.toolForm = { ...tool };
    this.isEditMode.set(true);
    this.modalType.set('tools');
    this.isModalOpen.set(true);
  }

  public openAddExp(): void {
    this.expForm = this.getEmptyExp();
    this.expEditIndex = -1;
    this.isEditMode.set(false);
    this.modalType.set('experience');
    this.isModalOpen.set(true);
  }

  public openEditExp(item: WorkExperience, index: number): void {
    this.expForm = { ...item };
    this.expEditIndex = index;
    this.isEditMode.set(true);
    this.modalType.set('experience');
    this.isModalOpen.set(true);
  }

  public openAddContactLink(): void {
    this.contactLinkForm = this.getEmptyContactLink();
    this.contactLinkEditIndex = -1;
    this.isEditMode.set(false);
    this.modalType.set('contact');
    this.isModalOpen.set(true);
  }

  public openEditContactLink(link: ContactLink, index: number): void {
    this.contactLinkForm = { ...link };
    this.contactLinkEditIndex = index;
    this.isEditMode.set(true);
    this.modalType.set('contact');
    this.isModalOpen.set(true);
  }

  public closeModal(): void {
    this.isModalOpen.set(false);
  }

  // --- Save & Delete Actions with Custom UI Confirmations ---
  public saveVoiceQA(): void {
    if (!this.voiceForm.keywords.trim() || !this.voiceForm.voiceAnswer.trim()) {
      alert('Please fill out trigger keywords and voice answer!');
      return;
    }

    if (this.isEditMode()) {
      this.portfolioData.updateVoiceQA(this.voiceForm);
      this.toastService.show('Voice AI Response Updated!');
    } else {
      this.voiceForm.id = 'v_' + Date.now();
      this.portfolioData.addVoiceQA(this.voiceForm);
      this.toastService.show('New Voice AI Response Added!');
    }
    this.closeModal();
  }

  public deleteVoiceQA(id: string): void {
    this.openConfirm({
      title: 'Delete Voice AI Question',
      message: 'Are you sure you want to permanently remove this Voice AI response from your knowledge base?',
      confirmBtnText: 'Delete Response',
      isDanger: true,
      action: () => {
        this.portfolioData.deleteVoiceQA(id);
        this.toastService.show('Voice AI item removed.');
      }
    });
  }

  public saveProject(): void {
    if (!this.projectForm.name.trim() || !this.projectForm.description.trim()) {
      alert('Please enter project name and description!');
      return;
    }

    if (this.isEditMode()) {
      this.portfolioData.updateProject(this.projectForm);
      this.toastService.show('Project Updated!');
    } else {
      this.projectForm.id = 'p_' + Date.now();
      this.portfolioData.addProject(this.projectForm);
      this.toastService.show('New Project Added!');
    }
    this.closeModal();
  }

  public deleteProject(id: string): void {
    this.openConfirm({
      title: 'Delete Case Study',
      message: 'Are you sure you want to permanently delete this project case study from your portfolio?',
      confirmBtnText: 'Delete Project',
      isDanger: true,
      action: () => {
        this.portfolioData.deleteProject(id);
        this.toastService.show('Project removed.');
      }
    });
  }

  public addProjectCategory(): void {
    const cat = this.newProjectCat().trim();
    if (!cat) return;
    this.portfolioData.addProjectCategory(cat);
    this.newProjectCat.set('');
    this.toastService.show(`Category "${cat}" added!`);
  }

  public deleteProjectCategory(cat: string): void {
    if (cat === 'All') return;
    this.openConfirm({
      title: `Delete Category "${cat}"`,
      message: `Are you sure you want to remove the "${cat}" category filter tab? Projects in this category will still be preserved.`,
      confirmBtnText: 'Delete Category',
      isDanger: true,
      action: () => {
        this.portfolioData.deleteProjectCategory(cat);
        this.toastService.show(`Category "${cat}" removed.`);
      }
    });
  }

  public saveTool(): void {
    if (!this.toolForm.name.trim() || !this.toolForm.type.trim()) {
      alert('Please enter tool name and type!');
      return;
    }

    if (this.isEditMode()) {
      this.portfolioData.updateTool(this.toolForm);
      this.toastService.show('Tool Updated!');
    } else {
      this.toolForm.id = this.toolForm.id.trim() || this.toolForm.name.toLowerCase().replace(/\s+/g, '-');
      this.portfolioData.addTool(this.toolForm);
      this.toastService.show('New Tool Added!');
    }
    this.closeModal();
  }

  public deleteTool(id: string): void {
    this.openConfirm({
      title: 'Delete Tool',
      message: 'Are you sure you want to delete this tool item from your Design & Dev toolkit?',
      confirmBtnText: 'Delete Tool',
      isDanger: true,
      action: () => {
        this.portfolioData.deleteTool(id);
        this.toastService.show('Tool removed.');
      }
    });
  }

  // --- Skills Manager ---
  public addSkillToSelected(): void {
    const name = this.newSkillName().trim();
    if (!name) return;
    this.portfolioData.addSkillToCategory(this.selectedSkillCatId(), name);
    this.newSkillName.set('');
    this.toastService.show('Skill added to category!');
  }

  public removeSkill(catId: string, skill: string): void {
    this.openConfirm({
      title: `Remove Skill "${skill}"`,
      message: `Are you sure you want to remove this skill badge?`,
      confirmBtnText: 'Remove Skill',
      isDanger: true,
      action: () => {
        this.portfolioData.removeSkillFromCategory(catId, skill);
        this.toastService.show('Skill removed.');
      }
    });
  }

  // --- Experience Actions ---
  public saveExp(): void {
    if (!this.expForm.company.trim() || !this.expForm.role.trim()) {
      alert('Please enter company name and role!');
      return;
    }

    if (this.isEditMode() && this.expEditIndex >= 0) {
      this.portfolioData.updateExperience(this.expEditIndex, this.expForm);
      this.toastService.show('Experience Updated!');
    } else {
      this.portfolioData.addExperience(this.expForm);
      this.toastService.show('New Experience Added!');
    }
    this.closeModal();
  }

  public deleteExp(index: number): void {
    this.openConfirm({
      title: 'Delete Experience Record',
      message: 'Are you sure you want to permanently delete this work history record?',
      confirmBtnText: 'Delete Experience',
      isDanger: true,
      action: () => {
        this.portfolioData.deleteExperience(index);
        this.toastService.show('Experience entry removed.');
      }
    });
  }

  // --- Profile Actions ---
  public saveProfile(): void {
    this.portfolioData.updateProfile(this.profileForm);
    this.toastService.show('Profile & Bio Updated!');
  }

  public addIndustry(): void {
    const tag = this.newIndustryTag().trim();
    if (!tag) return;
    if (!this.profileForm.industries.includes(tag)) {
      this.profileForm.industries.push(tag);
      this.portfolioData.updateProfile(this.profileForm);
      this.newIndustryTag.set('');
      this.toastService.show('Industry tag added.');
    }
  }

  public removeIndustry(tag: string): void {
    this.openConfirm({
      title: `Remove Industry "${tag}"`,
      message: `Are you sure you want to remove this industry tag?`,
      confirmBtnText: 'Remove Tag',
      isDanger: true,
      action: () => {
        this.profileForm.industries = (this.profileForm.industries || []).filter((t: string) => t !== tag);
        this.portfolioData.updateProfile(this.profileForm);
        this.toastService.show('Industry tag removed.');
      }
    });
  }

  // --- Contact & Socials Actions ---
  public saveContactInfo(): void {
    this.portfolioData.updateContactInfo(this.contactInfoForm);
    this.toastService.show('Contact & Availability Info Saved!');
  }

  public saveContactLink(): void {
    if (!this.contactLinkForm.label.trim() || !this.contactLinkForm.href.trim()) {
      alert('Please enter contact label and link/email address!');
      return;
    }

    if (this.isEditMode() && this.contactLinkEditIndex >= 0) {
      this.portfolioData.updateContactLink(this.contactLinkEditIndex, this.contactLinkForm);
      this.toastService.show('Contact Link Updated!');
    } else {
      this.portfolioData.addContactLink(this.contactLinkForm);
      this.toastService.show('New Contact Link Added!');
    }
    this.closeModal();
  }

  public deleteContactLink(index: number): void {
    this.openConfirm({
      title: 'Delete Contact Link',
      message: 'Are you sure you want to permanently delete this social/contact link?',
      confirmBtnText: 'Delete Link',
      isDanger: true,
      action: () => {
        this.portfolioData.deleteContactLink(index);
        this.toastService.show('Contact link removed.');
      }
    });
  }

  // --- Factory Reset ---
  public onResetDefaults(): void {
    this.openConfirm({
      title: 'Reset All Portfolio Data to Defaults',
      message: 'Are you sure you want to reset all portfolio data back to default settings? All custom projects, uploaded photos, voice AI answers, theme accents, and custom typography will be reverted.',
      confirmBtnText: 'Reset Everything',
      isDanger: true,
      action: () => {
        this.portfolioData.resetToDefaults();
        this.profileForm = { ...this.portfolioData.profileInfo() };
        this.contactInfoForm = { ...this.portfolioData.contactInfo() };
        this.toastService.show('Portfolio reset to factory defaults.');
      }
    });
  }

  public onLogoutClick(): void {
    this.openConfirm({
      title: 'Sign Out of CMS Portal',
      message: 'Are you sure you want to log out of the admin CMS portal? You will need to request an OTP code to log back in.',
      confirmBtnText: 'Log Out',
      isDanger: false,
      action: () => this.authService.logout()
    });
  }

  public viewPublicSite(): void {
    this.router.navigate(['/']);
  }

  // Helpers
  private getEmptyVoiceQA(): VoiceQAItem {
    return {
      id: '',
      keywords: '',
      questionLabel: '',
      voiceAnswer: '',
      textAnswer: '',
      category: 'general'
    };
  }

  private getEmptyProject(): Project {
    return {
      id: '',
      name: '',
      description: '',
      category: 'Mobile Apps',
      tags: ['UX Research', 'Figma'],
      metrics: '',
      image: '',
      videoUrl: '',
      mediaType: 'image'
    };
  }

  private getEmptyTool(): ToolItem {
    return {
      id: '',
      name: '',
      type: '',
      category: 'design'
    };
  }

  private getEmptySkillCat(): SkillCategory {
    return {
      id: 'custom-' + Date.now(),
      categoryName: '',
      icon: '✨',
      description: '',
      skills: []
    };
  }

  private getEmptyExp(): WorkExperience {
    return {
      period: '2025 – Present',
      company: '',
      role: 'Product Designer',
      description: '',
      current: false
    };
  }

  private getEmptyContactLink(): ContactLink {
    return {
      icon: '📧',
      label: '',
      href: '',
      action: 'link'
    };
  }
}
