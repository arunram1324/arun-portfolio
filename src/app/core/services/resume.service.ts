import { Injectable, signal } from '@angular/core';
import { jsPDF } from 'jspdf';
import { PortfolioDataService } from './portfolio-data.service';
import { ToastService } from '../../shared/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class ResumeService {
  public isResumeModalOpen = signal<boolean>(false);
  public isGeneratingPdf = signal<boolean>(false);

  constructor(
    private portfolioData: PortfolioDataService,
    private toastService: ToastService
  ) {}

  public openResumeModal(): void {
    this.isResumeModalOpen.set(true);
  }

  public closeResumeModal(): void {
    this.isResumeModalOpen.set(false);
  }

  // --- 1-Click Dynamic ATS-Compliant PDF Resume Generator ---
  public async downloadPdfResume(): Promise<void> {
    const profile = this.portfolioData.profileInfo();

    // If user configured a custom resume URL in Admin, open it directly
    if (profile.customResumeUrl && profile.customResumeUrl.trim().startsWith('http')) {
      window.open(profile.customResumeUrl.trim(), '_blank');
      this.toastService.show('Opening official resume document...');
      return;
    }

    this.isGeneratingPdf.set(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
      const margin = 16;
      const contentWidth = pageWidth - (margin * 2);

      let y = margin;

      // Color Tokens (RGB)
      const colorAccent = [26, 86, 240]; // #1A56F0 Royal Blue
      const colorDark = [30, 41, 59]; // #1E293B Slate 800
      const colorMuted = [100, 116, 139]; // #64748B Slate 500
      const colorLine = [226, 232, 240]; // #E2E8F0 Slate 200

      // Helper to check page break
      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // Helper for Section Headers
      const addSectionHeader = (title: string) => {
        checkPageBreak(14);
        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(colorAccent[0], colorAccent[1], colorAccent[2]);
        doc.text(title.toUpperCase(), margin, y);

        y += 2;
        doc.setDrawColor(colorLine[0], colorLine[1], colorLine[2]);
        doc.setLineWidth(0.4);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
      };

      // ================= 1. HEADER SECTION =================
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
      doc.text(profile.name || 'ARUN K R', margin, y + 2);

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(colorAccent[0], colorAccent[1], colorAccent[2]);
      doc.text(profile.role ? profile.role.toUpperCase() : 'LEAD UX/UI & PRODUCT DESIGNER', margin, y);

      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);

      const contactInfo = this.portfolioData.contactInfo();
      const email = this.getContactEmail();
      const phone = this.getContactPhone();
      const location = 'Bangalore, India';
      const webUrl = 'arunram1324.github.io/arun-portfolio';
      const linkedin = 'linkedin.com/in/arunkr';

      const contactBar = `📍 ${location}  |  ✉️ ${email}  |  📞 ${phone}  |  🌐 ${webUrl}  |  💼 ${linkedin}`;
      doc.text(contactBar, margin, y);

      y += 3;
      doc.setDrawColor(colorAccent[0], colorAccent[1], colorAccent[2]);
      doc.setLineWidth(0.8);
      doc.line(margin, y, pageWidth - margin, y);
      y += 4;

      // ================= 2. PROFESSIONAL SUMMARY =================
      addSectionHeader('Professional Summary');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);

      const summaryText = profile.bio || 'Product Designer with 3+ years of experience leading UI/UX for FinTech, ERP, and CRM platforms. Proven track record in user research, complex workflow simplification, and scalable multi-brand design systems that accelerate product delivery.';
      const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
      doc.text(splitSummary, margin, y);
      y += (splitSummary.length * 4.5) + 1;

      // ================= 3. WORK EXPERIENCE =================
      addSectionHeader('Work Experience');
      const experiences = this.portfolioData.experiences();

      for (const exp of experiences) {
        checkPageBreak(22);

        // Role & Period Row
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
        doc.text(exp.role, margin, y);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
        doc.text(exp.period, pageWidth - margin, y, { align: 'right' });

        y += 4.2;

        // Company Row
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(colorAccent[0], colorAccent[1], colorAccent[2]);
        doc.text(exp.company, margin, y);

        y += 4.5;

        // Description
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
        const splitDesc = doc.splitTextToSize(exp.description, contentWidth);
        doc.text(splitDesc, margin, y);
        y += (splitDesc.length * 4.2) + 3;
      }

      // ================= 4. CORE SKILLS & EXPERTISE =================
      addSectionHeader('Core Competencies & Skills');
      const skillCats = this.portfolioData.skillCategories();

      for (const cat of skillCats) {
        checkPageBreak(10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
        
        const catTitle = `${cat.categoryName}: `;
        doc.text(catTitle, margin, y);
        const titleWidth = doc.getTextWidth(catTitle);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
        const skillsList = (cat.skills || []).join('  •  ');
        const splitSkills = doc.splitTextToSize(skillsList, contentWidth - titleWidth);
        doc.text(splitSkills, margin + titleWidth, y);
        y += (splitSkills.length * 4.2) + 1.5;
      }

      // ================= 5. TOOLS & TECHNOLOGIES =================
      addSectionHeader('Tools & Software');
      const tools = this.portfolioData.tools();
      const toolNames = tools.map(t => `${t.name} (${t.type})`).join('  •  ');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
      const splitTools = doc.splitTextToSize(toolNames, contentWidth);
      doc.text(splitTools, margin, y);
      y += (splitTools.length * 4.2) + 2;

      // ================= 6. KEY FEATURED PROJECTS =================
      addSectionHeader('Featured Case Studies & Key Projects');
      const projects = this.portfolioData.projects().slice(0, 3);

      for (const proj of projects) {
        checkPageBreak(15);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
        doc.text(proj.name, margin, y);

        if (proj.metrics) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(colorAccent[0], colorAccent[1], colorAccent[2]);
          doc.text(`[${proj.metrics}]`, pageWidth - margin, y, { align: 'right' });
        }

        y += 4;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
        const pDesc = `${proj.description} (Tech/Tools: ${proj.tags.join(', ')})`;
        const splitPDesc = doc.splitTextToSize(pDesc, contentWidth);
        doc.text(splitPDesc, margin, y);
        y += (splitPDesc.length * 4.2) + 2.5;
      }

      // ================= 7. DOMAINS & INDUSTRIES =================
      if (profile.industries && profile.industries.length) {
        checkPageBreak(12);
        addSectionHeader('Domain & Industry Expertise');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
        const domainText = profile.industries.join('  •  ');
        doc.text(domainText, margin, y);
        y += 6;
      }

      // Footer: Generated Note
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
      const footerText = `Generated dynamically from Arun K R Live Portfolio (${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`;
      doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: 'center' });

      // Save PDF
      const filename = `Arun_K_R_Product_Designer_Resume_${new Date().getFullYear()}.pdf`;
      doc.save(filename);
      this.toastService.show('ATS-Compliant Resume downloaded successfully! 📄✨');
    } catch (e) {
      console.error('PDF Generation Error:', e);
      this.toastService.show('Failed to generate PDF. Please try again.');
    } finally {
      this.isGeneratingPdf.set(false);
    }
  }

  private getContactEmail(): string {
    const links = this.portfolioData.contactLinks();
    const mailLink = links.find(l => l.icon === 'mail' || (l.label && l.label.toLowerCase().includes('email')));
    if (mailLink && mailLink.value) return mailLink.value;
    return 'arunram1324@gmail.com';
  }

  private getContactPhone(): string {
    const links = this.portfolioData.contactLinks();
    const phoneLink = links.find(l => l.icon === 'phone' || (l.label && l.label.toLowerCase().includes('phone')));
    if (phoneLink && phoneLink.value) return phoneLink.value;
    return '+91 98765 43210';
  }
}
