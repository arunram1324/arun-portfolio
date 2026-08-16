import { Component, signal, computed } from '@angular/core';
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
import { AnalyticsService } from '../../core/services/analytics.service';
import { MessageService } from '../../core/services/message.service';
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
  ContactMessage,
  TypographySettings,
  PortfolioTemplateMode,
  SectionVisibilitySettings,
  AutoReplySettings,
  PortfolioVersionSnapshot
} from '../../core/models/portfolio.model';
import { VersionControlService } from '../../core/services/version-control.service';

import { ResumeService } from '../../core/services/resume.service';

type AdminTab = 'analytics' | 'messages' | 'versions' | 'templates' | 'visibility' | 'voice-ai' | 'projects' | 'skills' | 'tools' | 'experience' | 'profile' | 'contact' | 'typography' | 'theme';

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
  public activeTab = signal<AdminTab>('analytics');
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

  // Messages State
  public selectedMessage = signal<ContactMessage | null>(null);
  public isMessageModalOpen = signal<boolean>(false);
  public messageFilter = signal<'all' | 'unread'>('all');
  public isAutoReplyDrawerOpen = signal<boolean>(false);
  public autoReplyForm: AutoReplySettings = { enabled: true, subjectTemplate: '', bodyTemplate: '' };
  public replyPreviewBody = signal<string>('');
  public replyPreviewSubject = signal<string>('');

  public filteredMessages = computed(() => {
    const list = this.messageService.messages();
    const filter = this.messageFilter();
    return filter === 'unread' ? list.filter(m => !m.read) : list;
  });

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
  public contactInfoForm!: ContactInfo;
  public contactLinkForm: ContactLink = this.getEmptyContactLink();
  public contactLinkEditIndex = -1;
  public newIndustryTag = signal<string>('');
  public newProjectCat = signal<string>('');

  // Version Control State
  public isCreateSnapshotModalOpen = signal<boolean>(false);
  public snapshotForm = {
    version: 'v4.3.0',
    title: '',
    description: '',
    highlight1: '',
    highlight2: '',
    highlight3: ''
  };

  constructor(
    public portfolioData: PortfolioDataService,
    public analyticsService: AnalyticsService,
    public messageService: MessageService,
    public versionControl: VersionControlService,
    public resumeService: ResumeService,
    private authService: AuthService,
    public themeService: ThemeService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.profileForm = { ...this.portfolioData.profileInfo() };
    this.contactInfoForm = { ...this.portfolioData.contactInfo() };

    if (!this.authService.verifyStoredSession() || !this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  // --- Version Control Actions ---
  public openCreateSnapshotModal(): void {
    const nextVer = this.getNextSuggestedVersion();
    this.snapshotForm = {
      version: nextVer,
      title: 'Release ' + nextVer,
      description: 'Snapshot of all current portfolio data, styling, and CMS configurations.',
      highlight1: 'Portfolio content & projects backup',
      highlight2: 'Voice AI knowledge & Q&A state',
      highlight3: 'Theme & Typography layout settings'
    };
    this.isCreateSnapshotModalOpen.set(true);
  }

  public closeCreateSnapshotModal(): void {
    this.isCreateSnapshotModalOpen.set(false);
  }

  public getNextSuggestedVersion(): string {
    const current = this.versionControl.currentVersion();
    const parts = current.replace('v', '').split('.');
    if (parts.length >= 2) {
      const minor = parseInt(parts[1], 10) + 1;
      return `v${parts[0]}.${minor}.0`;
    }
    return 'v4.3.0';
  }

  public async submitCreateSnapshot(): Promise<void> {
    if (!this.snapshotForm.version.trim() || !this.snapshotForm.title.trim()) {
      this.toastService.show('Please provide a version tag and title.');
      return;
    }

    const highlights = [
      this.snapshotForm.highlight1.trim(),
      this.snapshotForm.highlight2.trim(),
      this.snapshotForm.highlight3.trim()
    ].filter(Boolean);

    await this.versionControl.createSnapshot(
      this.snapshotForm.version,
      this.snapshotForm.title,
      this.snapshotForm.description,
      highlights
    );

    this.closeCreateSnapshotModal();
  }

  public confirmRollback(snapshot: PortfolioVersionSnapshot): void {
    this.openConfirm({
      title: `Rollback to ${snapshot.version}?`,
      message: `Are you sure you want to restore the portfolio state to "${snapshot.title}" (${snapshot.version})? All projects, tools, profile info, and styles will be restored to this exact snapshot.`,
      confirmBtnText: 'Restore & Rollback',
      isDanger: true,
      action: () => {
        this.versionControl.restoreSnapshot(snapshot);
      }
    });
  }

  public confirmDeleteSnapshot(snapshot: PortfolioVersionSnapshot): void {
    this.openConfirm({
      title: `Delete Snapshot ${snapshot.version}?`,
      message: `Are you sure you want to permanently delete this snapshot? This cannot be undone.`,
      confirmBtnText: 'Delete Snapshot',
      isDanger: true,
      action: () => {
        this.versionControl.deleteSnapshot(snapshot.id);
      }
    });
  }

  public onExportBackup(): void {
    this.versionControl.exportBackupJson();
  }

  public onImportBackupFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        this.openConfirm({
          title: 'Restore Portfolio from JSON Backup?',
          message: `This will overwrite current portfolio data with the backup file "${file.name}". Do you want to proceed?`,
          confirmBtnText: 'Import & Restore',
          isDanger: true,
          action: () => {
            this.versionControl.importBackupJson(content);
          }
        });
      }
    };
    reader.readAsText(file);
    input.value = '';
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

  // --- Messages Inbox Actions ---
  public viewMessage(msg: ContactMessage): void {
    this.selectedMessage.set(msg);
    this.isMessageModalOpen.set(true);
    
    // Generate personalized response from dynamic auto-reply template
    this.refreshReplyPreview(msg);

    if (!msg.read) {
      this.messageService.markAsRead(msg.id, true);
    }
  }

  public refreshReplyPreview(msg: ContactMessage): void {
    const settings = this.portfolioData.autoReplySettings();
    const renderedSubject = (settings.subjectTemplate || 'Thank you for reaching out, {{name}}! — Arun K R')
      .replace(/\{\{name\}\}/gi, msg.name || 'there')
      .replace(/\{\{subject\}\}/gi, msg.subject || 'your inquiry')
      .replace(/\{\{email\}\}/gi, msg.email || '');

    const renderedBody = (settings.bodyTemplate || `Hi {{name}},\n\nThank you for reaching out through my portfolio regarding "{{subject}}".\n\nI have received your message and will review the details. You can expect to hear back from me within 24 hours.\n\nBest regards,\nArun K R\nLead Product Designer`)
      .replace(/\{\{name\}\}/gi, msg.name || 'there')
      .replace(/\{\{subject\}\}/gi, msg.subject || 'your inquiry')
      .replace(/\{\{email\}\}/gi, msg.email || '');

    this.replyPreviewSubject.set(renderedSubject);
    this.replyPreviewBody.set(renderedBody);
  }

  public closeMessageModal(): void {
    this.isMessageModalOpen.set(false);
    this.selectedMessage.set(null);
  }

  public toggleMessageRead(msg: ContactMessage, event: Event): void {
    event.stopPropagation();
    this.messageService.markAsRead(msg.id, !msg.read);
    this.toastService.show(msg.read ? 'Marked as unread' : 'Marked as read');
  }

  public replyMessage(msg: ContactMessage): void {
    this.refreshReplyPreview(msg);
    const subject = encodeURIComponent(this.replyPreviewSubject() || `Re: ${msg.subject}`);
    const body = encodeURIComponent(this.replyPreviewBody());
    window.open(`mailto:${msg.email}?subject=${subject}&body=${body}`, '_blank');
    this.toastService.show(`Email composer opened for ${msg.email}`);
  }

  public copyReplyText(): void {
    this.toastService.copyToClipboard(this.replyPreviewBody(), 'Response draft copied to clipboard!');
  }

  public openAutoReplySettings(): void {
    this.autoReplyForm = { ...this.portfolioData.autoReplySettings() };
    this.isAutoReplyDrawerOpen.set(true);
  }

  public closeAutoReplySettings(): void {
    this.isAutoReplyDrawerOpen.set(false);
  }

  public saveAutoReplySettings(): void {
    if (!this.autoReplyForm.subjectTemplate.trim() || !this.autoReplyForm.bodyTemplate.trim()) {
      this.toastService.show('Please fill in both subject and body templates.');
      return;
    }
    this.portfolioData.updateAutoReplySettings(this.autoReplyForm);
    this.toastService.show('Quick reply template updated and synced with cloud!');
    this.closeAutoReplySettings();

    // If a message is currently open, refresh its preview
    const currentMsg = this.selectedMessage();
    if (currentMsg) {
      this.refreshReplyPreview(currentMsg);
    }
  }

  public getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  public confirmDeleteMessage(msg: ContactMessage, event?: Event): void {
    if (event) event.stopPropagation();
    this.openConfirm({
      title: 'Delete Message',
      message: `Are you sure you want to delete the message from "${msg.name}"? This cannot be undone.`,
      confirmBtnText: 'Delete Message',
      isDanger: true,
      action: () => {
        this.messageService.deleteMessage(msg.id);
        if (this.selectedMessage()?.id === msg.id) {
          this.closeMessageModal();
        }
        this.toastService.show('Message deleted successfully.');
      }
    });
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
    if (!this.contactLinkForm.label.trim()) {
      alert('Please enter category/platform label!');
      return;
    }
    if (!this.contactLinkForm.value?.trim() && !this.contactLinkForm.href.trim()) {
      alert('Please enter display value or link URL!');
      return;
    }
    if (!this.contactLinkForm.value?.trim()) {
      this.contactLinkForm.value = this.contactLinkForm.href;
    }
    if (!this.contactLinkForm.href.trim()) {
      this.contactLinkForm.href = this.contactLinkForm.value;
    }

    if (this.isEditMode() && this.contactLinkEditIndex >= 0) {
      this.portfolioData.updateContactLink(this.contactLinkEditIndex, { ...this.contactLinkForm });
      this.toastService.show('Contact Link Updated!');
    } else {
      this.portfolioData.addContactLink({ ...this.contactLinkForm });
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
      icon: 'mail',
      label: 'Email',
      value: '',
      href: '',
      action: 'copy'
    };
  }
}
