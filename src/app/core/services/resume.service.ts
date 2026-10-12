import { Injectable, signal } from '@angular/core';
import { jsPDF } from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType
} from 'docx';
import { PortfolioDataService } from './portfolio-data.service';
import { ToastService } from '../../shared/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class ResumeService {
  public isResumeModalOpen = signal<boolean>(false);
  public isGeneratingPdf = signal<boolean>(false);
  public isGeneratingDocx = signal<boolean>(false);

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

  public getUniqueSkills(skills: string[]): string[] {
    if (!skills || !skills.length) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const s of skills) {
      if (!s) continue;
      const clean = s.trim();
      const lower = clean.toLowerCase();
      if (clean && !seen.has(lower)) {
        seen.add(lower);
        result.push(clean);
      }
    }
    return result;
  }

  public getExperienceBullets(description: string): string[] {
    if (!description || !description.trim()) return [];
    const text = description.trim();

    if (text.includes('\n')) {
      return text
        .split('\n')
        .map(s => s.replace(/^[\s•\-\*]+/, '').trim())
        .filter(s => s.length > 0);
    }

    if (text.includes('•')) {
      return text
        .split('•')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g);
    if (sentences && sentences.length > 1) {
      return sentences.map(s => s.trim()).filter(s => s.length > 0);
    }

    return [text];
  }

  public getCategorizedTools(): { name: string; tools: string[] }[] {
    const allTools = this.portfolioData.tools();
    const categories: { name: string; tools: string[] }[] = [
      {
        name: 'UI/UX Design & Prototyping',
        tools: allTools
          .filter(t => (t.category === 'design' || t.category === '3d') && !['premierepro', 'davinciresolve', 'aftereffects'].includes(t.id))
          .map(t => t.name)
      },
      {
        name: 'Motion & Video Production',
        tools: ['Adobe After Effects', 'Adobe Premiere Pro', 'DaVinci Resolve', 'Principle']
      },
      {
        name: 'Frontend & Mobile Engineering',
        tools: allTools
          .filter(t => t.category === 'dev')
          .map(t => t.name)
      },
      {
        name: 'User Research & Strategy',
        tools: allTools
          .filter(t => t.category === 'research')
          .map(t => t.name)
      }
    ];
    return categories.filter(c => c.tools.length > 0);
  }

  // --- 1-Click Dynamic ATS-Compliant PDF Resume Generator ---
  public async downloadPdfResume(): Promise<void> {
    const profile = this.portfolioData.profileInfo();

    // If user uploaded or configured a custom resume file/URL in Admin
    if (profile.customResumeUrl && profile.customResumeUrl.trim().length > 0) {
      const url = profile.customResumeUrl.trim();

      if (url.startsWith('data:application/pdf') || url.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `Arun_K_R_Product_Designer_Resume_${new Date().getFullYear()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.toastService.show('Custom PDF Resume downloaded successfully!');
        return;
      } else if (url.startsWith('http')) {
        window.open(url, '_blank');
        this.toastService.show('Opening official resume document...');
        return;
      }
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

      const email = this.getContactEmail();
      const phone = this.getContactPhone();
      const location = this.getLocation();
      const webUrl = this.getWebsite();
      const linkedin = this.getLinkedIn();

      const contactBar = `${location}  |  ${email}  |  ${phone}  |  ${webUrl}  |  ${linkedin}`;
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
      y += (splitSummary.length * 4.3) + 2;

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

        // Clean Bulleted Description
        const bullets = this.getExperienceBullets(exp.description);
        for (const bullet of bullets) {
          checkPageBreak(8);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(colorAccent[0], colorAccent[1], colorAccent[2]);
          doc.text('•', margin + 1.5, y);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
          const splitBullet = doc.splitTextToSize(bullet, contentWidth - 6);
          doc.text(splitBullet, margin + 5.5, y);
          y += (splitBullet.length * 4) + 1.2;
        }
        y += 2.2;
      }

      // ================= 4. CORE SKILLS & EXPERTISE =================
      addSectionHeader('Core Competencies & Skills');
      const skillCats = this.portfolioData.visibleSkillCategories();

      for (const cat of skillCats) {
        const uniqueSkills = this.getUniqueSkills(cat.skills || []);
        if (!uniqueSkills.length) continue;

        checkPageBreak(14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(colorAccent[0], colorAccent[1], colorAccent[2]);
        doc.text(cat.categoryName.toUpperCase(), margin, y);
        y += 4;

        // Balanced 2-Column Bullet Grid
        const half = Math.ceil(uniqueSkills.length / 2);
        const col1 = uniqueSkills.slice(0, half);
        const col2 = uniqueSkills.slice(half);
        const col1X = margin;
        const col2X = margin + (contentWidth / 2) + 2;

        const maxRows = Math.max(col1.length, col2.length);
        for (let r = 0; r < maxRows; r++) {
          checkPageBreak(6);
          const s1 = col1[r];
          const s2 = col2[r];

          if (s1) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(colorAccent[0], colorAccent[1], colorAccent[2]);
            doc.text('•', col1X + 1.5, y);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
            doc.text(s1, col1X + 4.5, y);
          }

          if (s2) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(colorAccent[0], colorAccent[1], colorAccent[2]);
            doc.text('•', col2X + 1.5, y);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
            doc.text(s2, col2X + 4.5, y);
          }
          y += 3.7;
        }
        y += 2.2;
      }

      // ================= 5. TOOLS & TECHNOLOGIES =================
      addSectionHeader('Tools & Software');
      const toolGroups = this.getCategorizedTools();

      for (const grp of toolGroups) {
        checkPageBreak(8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(colorAccent[0], colorAccent[1], colorAccent[2]);
        doc.text('•', margin + 1.5, y);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
        const grpLabel = `${grp.name}: `;
        doc.text(grpLabel, margin + 5.5, y);
        const grpLabelWidth = doc.getTextWidth(grpLabel);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
        const splitTools = doc.splitTextToSize(grp.tools.join(', '), contentWidth - 6 - grpLabelWidth);
        doc.text(splitTools, margin + 5.5 + grpLabelWidth, y);
        y += (splitTools.length * 3.8) + 1.4;
      }
      y += 1.5;

      // ================= 6. EDUCATION & LANGUAGES =================
      checkPageBreak(16);
      addSectionHeader('Education & Languages');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
      doc.text("Master's Degree in Computer Science", margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
      doc.text('2021 – 2023', pageWidth - margin, y, { align: 'right' });
      y += 4.5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
      doc.text('Languages: ', margin, y);
      const langLabelWidth = doc.getTextWidth('Languages: ');

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
      doc.text('English (B2)  •  Tamil (Native)', margin + langLabelWidth, y);
      y += 6;

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
      this.toastService.show('ATS-Compliant Resume downloaded successfully!');
    } catch (e) {
      console.error('PDF Generation Error:', e);
      this.toastService.show('Failed to generate PDF. Please try again.');
    } finally {
      this.isGeneratingPdf.set(false);
    }
  }

  // --- 1-Click ATS-Compliant Word (.docx) Resume Generator ---
  public async downloadDocxResume(): Promise<void> {
    this.isGeneratingDocx.set(true);
    try {
      const profile = this.portfolioData.profileInfo();
      const experiences = this.portfolioData.experiences();
      const skillCats = this.portfolioData.visibleSkillCategories();

      const noBorder = {
        top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        right: { style: BorderStyle.NONE, size: 0, color: 'auto' }
      };

      const createSectionHeading = (title: string): Paragraph => {
        return new Paragraph({
          children: [
            new TextRun({
              text: title.toUpperCase(),
              bold: true,
              size: 21, // 10.5pt
              color: '1A56F0',
              font: 'Calibri'
            })
          ],
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' }
          },
          spacing: { before: 240, after: 120 }
        });
      };

      const children: (Paragraph | Table)[] = [];

      // 1. Header
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: profile.name || 'ARUN K R',
              bold: true,
              size: 34, // 17pt
              color: '1E293B',
              font: 'Calibri'
            })
          ],
          spacing: { after: 40 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: profile.role ? profile.role.toUpperCase() : 'LEAD UX/UI & PRODUCT DESIGNER',
              bold: true,
              size: 20, // 10pt
              color: '1A56F0',
              font: 'Calibri'
            })
          ],
          spacing: { after: 60 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `${this.getLocation()}   |   ${this.getContactEmail()}   |   ${this.getContactPhone()}   |   ${this.getWebsite()}   |   ${this.getLinkedIn()}`,
              size: 17, // 8.5pt
              color: '64748B',
              font: 'Calibri'
            })
          ],
          spacing: { after: 160 }
        })
      );

      // 2. Professional Summary
      children.push(createSectionHeading('Professional Summary'));
      const summaryText = profile.bio || 'Product Designer with 3+ years of experience leading UI/UX for FinTech, ERP, and CRM platforms. Proven track record in user research, complex workflow simplification, and scalable multi-brand design systems that accelerate product delivery.';
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: summaryText,
              size: 19, // 9.5pt
              color: '1E293B',
              font: 'Calibri'
            })
          ],
          spacing: { after: 120 }
        })
      );

      // 3. Work Experience
      children.push(createSectionHeading('Work Experience'));
      for (const exp of experiences) {
        const expHeaderTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: noBorder,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  borders: noBorder,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: exp.role,
                          bold: true,
                          size: 20, // 10pt
                          color: '1E293B',
                          font: 'Calibri'
                        }),
                        new TextRun({
                          text: `  ·  ${exp.company}`,
                          bold: true,
                          size: 19, // 9.5pt
                          color: '1A56F0',
                          font: 'Calibri'
                        })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  borders: noBorder,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: exp.period,
                          bold: true,
                          size: 18, // 9pt
                          color: '64748B',
                          font: 'Calibri'
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        });
        children.push(expHeaderTable);

        const bullets = this.getExperienceBullets(exp.description);
        for (const b of bullets) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({
                  text: b,
                  size: 18, // 9pt
                  color: '1E293B',
                  font: 'Calibri'
                })
              ],
              spacing: { after: 40 }
            })
          );
        }

        children.push(
          new Paragraph({
            spacing: { after: 80 }
          })
        );
      }

      // 4. Core Competencies & Skills
      children.push(createSectionHeading('Core Competencies & Skills'));
      for (const cat of skillCats) {
        const unique = this.getUniqueSkills(cat.skills || []);
        if (!unique.length) continue;

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cat.categoryName,
                bold: true,
                size: 19, // 9.5pt
                color: '1A56F0',
                font: 'Calibri'
              })
            ],
            spacing: { before: 80, after: 40 }
          })
        );

        const half = Math.ceil(unique.length / 2);
        const col1 = unique.slice(0, half);
        const col2 = unique.slice(half);
        const maxRows = Math.max(col1.length, col2.length);

        const rows: TableRow[] = [];
        for (let r = 0; r < maxRows; r++) {
          const s1 = col1[r] || '';
          const s2 = col2[r] || '';

          rows.push(
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: noBorder,
                  children: s1 ? [
                    new Paragraph({
                      bullet: { level: 0 },
                      children: [
                        new TextRun({ text: s1, size: 18, color: '1E293B', font: 'Calibri' })
                      ]
                    })
                  ] : [new Paragraph({})]
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: noBorder,
                  children: s2 ? [
                    new Paragraph({
                      bullet: { level: 0 },
                      children: [
                        new TextRun({ text: s2, size: 18, color: '1E293B', font: 'Calibri' })
                      ]
                    })
                  ] : [new Paragraph({})]
                })
              ]
            })
          );
        }

        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorder,
            rows
          })
        );
      }

      // 5. Tools & Software
      children.push(createSectionHeading('Tools & Software'));
      const toolGroups = this.getCategorizedTools();
      for (const grp of toolGroups) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: `${grp.name}: `,
                bold: true,
                size: 18,
                color: '1E293B',
                font: 'Calibri'
              }),
              new TextRun({
                text: grp.tools.join(', '),
                size: 18,
                color: '475569',
                font: 'Calibri'
              })
            ],
            spacing: { after: 40 }
          })
        );
      }

      // 6. Education & Languages
      children.push(createSectionHeading('Education & Languages'));
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: noBorder,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  borders: noBorder,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Master's Degree in Computer Science",
                          bold: true,
                          size: 19,
                          color: '1E293B',
                          font: 'Calibri'
                        })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  borders: noBorder,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: '2021 – 2023',
                          bold: true,
                          size: 18,
                          color: '64748B',
                          font: 'Calibri'
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Languages: ', bold: true, size: 18, color: '1E293B', font: 'Calibri' }),
            new TextRun({ text: 'English (B2)  •  Tamil (Native)', size: 18, color: '64748B', font: 'Calibri' })
          ],
          spacing: { before: 60, after: 120 }
        })
      );

      // 7. Domain Expertise
      if (profile.industries && profile.industries.length) {
        children.push(createSectionHeading('Domain & Industry Expertise'));
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: profile.industries.join('   •   '),
                size: 18,
                color: '1E293B',
                font: 'Calibri'
              })
            ],
            spacing: { after: 120 }
          })
        );
      }

      // Footer
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Generated dynamically from Arun K R Live Portfolio (${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`,
              italics: true,
              size: 16,
              color: '94A3B8',
              font: 'Calibri'
            })
          ],
          spacing: { before: 240 }
        })
      );

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 }
            }
          },
          children
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Arun_K_R_Product_Designer_Resume_${new Date().getFullYear()}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.toastService.show('Word Document (.docx) downloaded successfully!');
    } catch (e) {
      console.error('Word Generation Error:', e);
      this.toastService.show('Failed to generate Word document. Please try again.');
    } finally {
      this.isGeneratingDocx.set(false);
    }
  }

  public getContactEmail(): string {
    const links = this.portfolioData.contactLinks();
    const mailLink = links.find(l => l.icon === 'mail' || (l.label && l.label.toLowerCase().includes('email')));
    if (mailLink && mailLink.value) return mailLink.value;
    return 'arunuxuidesigner2411@gmail.com';
  }

  public getContactPhone(): string {
    const links = this.portfolioData.contactLinks();
    const phoneLink = links.find(l => l.icon === 'phone' || (l.label && l.label.toLowerCase().includes('phone')));
    if (phoneLink && phoneLink.value) return phoneLink.value;
    return '+91 9585585107';
  }

  public getLinkedIn(): string {
    const links = this.portfolioData.contactLinks();
    const li = links.find(l => l.icon === 'linkedin' || (l.label && l.label.toLowerCase().includes('linkedin')));
    if (li && li.value) return li.value;
    return 'linkedin.com/in/arunkr';
  }

  public getLocation(): string {
    return 'Chennai, India';
  }

  public getWebsite(): string {
    return 'arunram1324.github.io/arun-portfolio';
  }
}
