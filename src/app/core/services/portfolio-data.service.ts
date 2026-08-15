import { Injectable, signal, effect } from '@angular/core';
import { WorkExperience, Project, ToolItem, SkillCategory, ContactLink, ContactInfo, TypographySettings, VoiceQAItem, ProfileInfo, PortfolioTemplateMode, SectionVisibilitySettings } from '../models/portfolio.model';

const STORAGE_PREFIX = 'ak_portfolio_cms_';

const DEFAULT_SECTION_VISIBILITY: SectionVisibilitySettings = {
  showHero: true,
  showVirtualTwin: true,
  showProjects: true,
  showExperience: true,
  showSkillsTools: true,
  showContact: true
};

const DEFAULT_PROFILE: ProfileInfo = {
  name: 'ARUN K R',
  role: 'UX UI Designer / Product Designer',
  headline: 'UX/UI Designer | 3+ Years Experience',
  bio: 'I specialize in designing high-impact FinTech, ERP, and CRM solutions where task efficiency and system clarity drive business results. From onboarding flows to complex reporting modules, I bridge the gap between user behavior and technical feasibility.',
  photoUrl: 'arun-profile.jpg',
  industries: ['Fintech', 'HealthTech', 'EdTech', 'AgriTech', 'E-commerce', 'TravelTech']
};

const DEFAULT_EXPERIENCES: WorkExperience[] = [
  {
    period: 'Present',
    company: 'Pentica IT Service (OPC) Pvt.Ltd',
    role: 'UX/UI & Product Designer',
    current: true,
    description: 'Leading end-to-end product design for high-scale enterprise FinTech and ERP platforms. Conducting in-depth user journey mapping, usability testing, and architecting multi-brand design systems that reduced engineering handoff cycles by 40%.'
  },
  {
    period: 'Feb 2024 – Feb 2025',
    company: 'Azotos Software Technology Pvt.Ltd',
    role: 'UI/UX Designer',
    description: 'Spearheaded the redesign of complex SaaS workflows and data visualization dashboards. Streamlined multi-tier approval flows and onboarding wizards, resulting in a 28% increase in daily task completion rates.'
  },
  {
    period: 'Jun 2023 – Jan 2024',
    company: 'Azotos Software Technology Pvt.Ltd',
    role: 'Junior UI/UX Designer',
    description: 'Collaborated closely with product managers and engineers to build responsive web apps and cross-platform mobile interfaces. Created interactive micro-prototypes in ProtoPie and maintained atomic Figma design components.'
  }
];

const DEFAULT_PROJECT_CATEGORIES: string[] = [
  'All',
  'Mobile Apps',
  'Web Apps',
  'Posters & Branding',
  'Video & Motion',
  'Industry'
];

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'map-man-mobile',
    name: 'MAP – MAN Driver Pro',
    category: 'Mobile Apps',
    description: 'Driver companion mobile interface with live GPS telemetry and real-time alerts.',
    tags: ['Mobile UX', 'Live Telemetry', 'Figma'],
    metrics: '500+ Active Fleets',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image'
  },
  {
    id: 'gym-pos-kiosk',
    name: 'GYM – POS Kiosk',
    category: 'Industry',
    description: 'Touch-first point-of-sale and member management tablet kiosk.',
    tags: ['Fitness POS', 'Touch First', 'ProtoPie'],
    metrics: '< 4s Member Check-in',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image'
  },
  {
    id: 'fintrack-mobile',
    name: 'FinTrack Wealth App',
    category: 'Mobile Apps',
    description: 'Gen Z personal wealth tracking and predictive budgeting mobile interface.',
    tags: ['Mobile UX', 'Design System', 'ProtoPie'],
    metrics: '4.8 ★ App Rating',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image'
  },
  {
    id: 'shopflow-web',
    name: 'ShopFlow E-Commerce',
    category: 'Web Apps',
    description: 'Conversion-optimized checkout funnel and dynamic cart drawers.',
    tags: ['UX Research', 'Checkout Optimization', 'Figma'],
    metrics: '+34% Conversion Lift',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image'
  },
  {
    id: 'nexus-branding',
    name: 'Nexus Brand Guidelines',
    category: 'Posters & Branding',
    description: 'Modern typography scale, vector iconography, and high-contrast brand visuals.',
    tags: ['Visual Identity', 'Poster Design', 'Illustrator'],
    metrics: 'Multi-Brand Scale',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image'
  },
  {
    id: 'mapman-motion',
    name: 'MAP-MAN Promo & Motion',
    category: 'Video & Motion',
    description: 'Dynamic UI micro-interactions, 3D route teasers, and product walkthrough video.',
    tags: ['After Effects', 'Lottie Motion', 'Premiere Pro'],
    metrics: '100k+ Views',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    mediaType: 'video'
  },
  {
    id: 'gym-member-app',
    name: 'GYM – Member App',
    category: 'Mobile Apps',
    description: 'Workout tracking and class subscription renewal mobile app.',
    tags: ['Workout Tracker', 'Mobile App', 'Analytics'],
    metrics: '+38% Renewals',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image'
  },
  {
    id: 'nexus-ds-web',
    name: 'Nexus Design System',
    category: 'Web Apps',
    description: 'Enterprise multi-theme design system with 200+ accessible components.',
    tags: ['Design Tokens', 'WCAG AAA', 'Figma Variables'],
    metrics: '200+ Components',
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image'
  },
  {
    id: 'agritech-mobile',
    name: 'AgriTech Advisory',
    category: 'Mobile Apps',
    description: 'Multilingual crop diagnostics and weather intelligence mobile platform.',
    tags: ['AgriTech', 'Localization', 'Mobile First'],
    metrics: '100k+ Active Farmers',
    image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image'
  },
  {
    id: 'health-pos-industry',
    name: 'HealthPulse Kiosk',
    category: 'Industry',
    description: 'Clinical touch kiosk for rapid OPD registrations and billing.',
    tags: ['HealthTech', 'Touch UI', 'Hardware Interop'],
    metrics: '< 2m Patient Onboarding',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image'
  }
];

const DEFAULT_TOOLS: ToolItem[] = [
  { id: 'figma', name: 'Figma', type: 'UI / UX Design & Systems', category: 'design' },
  { id: 'protopie', name: 'ProtoPie', type: 'Advanced Prototyping', category: 'design' },
  { id: 'adobexd', name: 'Adobe XD', type: 'Wireframing & UI', category: 'design' },
  { id: 'illustrator', name: 'Adobe Illustrator', type: 'Vector & Iconography', category: 'design' },
  { id: 'photoshop', name: 'Adobe Photoshop', type: 'Photo & Asset Editing', category: 'design' },
  { id: 'aftereffects', name: 'After Effects', type: 'Motion & Micro-interactions', category: 'design' },
  { id: 'spline', name: 'Spline 3D', type: '3D Web Experiences', category: '3d' },
  { id: 'framer', name: 'Framer', type: 'Interactive Web & No-Code', category: 'dev' },
  { id: 'principle', name: 'Principle', type: 'Timeline Animation', category: 'design' },
  { id: 'figjam', name: 'FigJam', type: 'Whiteboarding & User Flows', category: 'research' },
  { id: 'miro', name: 'Miro', type: 'User Journey Mapping', category: 'research' },
  { id: 'notion', name: 'Notion', type: 'Product Specs & Wiki', category: 'research' },
  { id: 'maze', name: 'Maze', type: 'Usability Testing', category: 'research' },
  { id: 'html5', name: 'HTML5', type: 'Semantic Markup', category: 'dev' },
  { id: 'css3', name: 'CSS3 & SCSS', type: 'Modern Responsive Layouts', category: 'dev' },
  { id: 'javascript', name: 'JavaScript ES6+', type: 'Frontend Logic', category: 'dev' },
  { id: 'typescript', name: 'TypeScript', type: 'Type-Safe Development', category: 'dev' },
  { id: 'angular', name: 'Angular 19', type: 'Component Framework', category: 'dev' },
  { id: 'vscode', name: 'VS Code / Cursor', type: 'Development Environment', category: 'dev' },
  { id: 'github', name: 'GitHub', type: 'Version Control', category: 'dev' }
];

const DEFAULT_SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: 'ux-ui',
    categoryName: 'UX / UI Design',
    icon: 'ux-ui',
    description: 'Human-centered product design, user research methodologies, and scalable design token systems.',
    skills: [
      'UX Research & User Personas',
      'User Journey Mapping & Flows',
      'Wireframing & Information Architecture',
      'Design Systems (Variables & Tokens)',
      'High-Fidelity Interactive Prototyping',
      'Usability Testing & A/B Testing',
      'WCAG Accessibility (AA/AAA)',
      'Design-to-Dev Handoff & Specs'
    ]
  },
  {
    id: 'web-dev',
    categoryName: 'Web Development',
    icon: 'web-dev',
    description: 'Engineering responsive, pixel-perfect web interfaces using modern frameworks and component architectures.',
    skills: [
      'HTML5 Semantic Markup',
      'CSS3 & Modern SCSS Architecture',
      'JavaScript (ES6+) & Modern Web APIs',
      'TypeScript & Typed Architecture',
      'Angular Framework (Standalone & Signals)',
      'Responsive & Mobile-First Layouts',
      'REST API Integration & State Handling',
      'Git & Version Control Workflows'
    ]
  },
  {
    id: 'mobile-dev',
    categoryName: 'Mobile App Development & Prototyping',
    icon: 'mobile-dev',
    description: 'Native mobile design standards, gesture-driven touch interactions, and high-fidelity device prototypes.',
    skills: [
      'iOS Human Interface Guidelines (HIG)',
      'Android Material Design 3',
      'ProtoPie Advanced Sensor & Micro-Prototyping',
      'Principle Motion & Transition Design',
      'Touch & Haptic Feedback Architecture',
      'Cross-Platform Adaptive UI Patterns'
    ]
  },
  {
    id: 'video-motion',
    categoryName: 'Video Editing & Motion Design',
    icon: 'video-motion',
    description: 'Dynamic UI motion graphics, animated micro-interactions, and engaging product showcase videos.',
    skills: [
      'Adobe After Effects (Motion Design)',
      'Adobe Premiere Pro (Video Editing)',
      'Lottie / JSON Micro-Interactions',
      'Product Walkthrough & Demo Videos',
      'Social Media Reels & Promo Edits',
      'Keyframe Transitions & Visual Storytelling'
    ]
  }
];

const DEFAULT_VOICE_QA: VoiceQAItem[] = [
  {
    id: 'v_1',
    keywords: 'design process, methodology, how do you design, research, double diamond',
    questionLabel: 'What is your design process and UX research methodology?',
    voiceAnswer: 'My design process follows a 5-step framework: Discover user pain points, Define strategy, Systematize in Figma with tokens, Prototype in ProtoPie, and conduct usability testing in Maze before developer handoff.',
    textAnswer: 'My design process follows a structured 5-phase framework:\n1. Discover & Empathize (User interviews & competitive audits)\n2. Define & Strategize (Information architecture & journey mapping)\n3. Systematize in Figma (Atomic tokens & auto-layout)\n4. Prototype & Test (ProtoPie animations & Maze testing)\n5. Dev Handoff & QA (Token synchronization & sprint QA).',
    category: 'process'
  },
  {
    id: 'v_2',
    keywords: 'notice period, availability, when can you start, location, remote, chennai, join',
    questionLabel: 'What is your notice period, availability and work preference?',
    voiceAnswer: 'I am based in Chennai, India, and open for global remote, hybrid, or on-site Senior Product Designer roles. I am available for immediate joining or standard short notice.',
    textAnswer: '• Location: Chennai, Tamil Nadu, India\n• Work Mode: Open for Global Remote, Hybrid, or On-site\n• Availability: Immediate / Standard short notice period\n• Target Roles: Senior UX/UI Designer, Product Designer, Design System Lead.',
    category: 'hiring'
  },
  {
    id: 'v_3',
    keywords: 'freelance, client, contract, pricing, rate, charge, cost, mvp, turnaround',
    questionLabel: 'Are you available for freelance projects or contract MVP design?',
    voiceAnswer: 'Yes! I actively take on freelance design sprints and 0 to 1 MVPs for startups. My typical turnaround is 2 to 4 weeks for complete interactive prototypes with milestone-based pricing.',
    textAnswer: 'Yes! I collaborate with founders on selective freelance projects:\n• Services: 0-to-1 MVP Design, Mobile App UX/UI, SaaS Dashboards & Design Systems\n• Turnaround: 2 to 4 weeks for full clickable prototype\n• Billing: Milestone-based fixed quote or weekly sprint retainer.\nContact: arunkr.design@gmail.com',
    category: 'hiring'
  },
  {
    id: 'v_4',
    keywords: 'map, logistics, fleet, route, dispatch, mapman',
    questionLabel: 'Can you walk me through the MAP-MAN logistics project?',
    voiceAnswer: 'In MAP-MAN, I designed a real-time fleet dispatch dashboard that reduced dispatch latency by 22 percent and now powers over 500 active delivery units.',
    textAnswer: 'MAP – MAN Logistics Platform:\n• Problem: Dispatchers struggled with multi-window clutter and slow 8-step routing.\n• Solution: Split-view map telemetry and 2-click dispatch workflows.\n• Impact: Reduced dispatch latency by 22% and supports 500+ active fleets.',
    category: 'case-study'
  },
  {
    id: 'v_5',
    keywords: 'gym, pos, check in, tablet, fitness, retail',
    questionLabel: 'Tell me about the GYM-POS point-of-sale project.',
    voiceAnswer: 'For GYM-POS, I designed a touch-first tablet kiosk that brought member check-in time down to under 4 seconds and boosted renewals by 38 percent.',
    textAnswer: 'GYM – POS Pro Experience:\n• Problem: Long front-desk queues during peak gym hours.\n• Solution: Touch-first tablet interface with rapid QR check-in & member billing.\n• Impact: Check-in dropped to < 4s and renewals rose by +38%.',
    category: 'case-study'
  },
  {
    id: 'v_6',
    keywords: 'developer, engineer, code, handoff, angular, frontend, html, css, typescript',
    questionLabel: 'How do you collaborate with frontend developers and engineers?',
    voiceAnswer: 'I have hands-on frontend knowledge in HTML, CSS, TypeScript, and Angular. I build Figma design systems with tokenized variables and component states, ensuring zero-friction developer handoffs.',
    textAnswer: 'Developer collaboration is a core strength:\n• Technical Alignment: Hands-on in HTML5/CSS3/SCSS, TypeScript, and Angular.\n• Figma Tokens: 1:1 mapped variables for colors, typography, spacing, and component states.\n• Design QA: Active code review and browser PR verification.',
    category: 'experience'
  }
];

const DEFAULT_CONTACTS: ContactLink[] = [
  { icon: 'mail', label: 'arunram1324@gmail.com', href: 'mailto:arunram1324@gmail.com', action: 'copy' },
  { icon: 'linkedin', label: 'linkedin.com/in/arunkr', href: 'https://linkedin.com/in/arunkr', action: 'link' },
  { icon: 'dribbble', label: 'dribbble.com/arunkr', href: 'https://dribbble.com/arunkr', action: 'link' },
  { icon: 'globe', label: '@arunkr_design', href: 'https://twitter.com/arunkr_design', action: 'link' }
];

const DEFAULT_CONTACT_INFO: ContactInfo = {
  subtitle: "I'm always excited to connect for full-time product design roles, freelance collaborations, or design system consultations.",
  availabilityTitle: "Available for Opportunities",
  availabilitySubtitle: "Accepting freelance design sprints & full-time roles",
  isAvailable: true
};

export const HEADING_FONT_PRESETS = [
  { name: 'DM Sans', family: 'DM Sans', category: 'Clean Geometric' },
  { name: 'Plus Jakarta Sans', family: 'Plus Jakarta Sans', category: 'Modern Tech' },
  { name: 'Inter', family: 'Inter', category: 'Neutral & Crisp' },
  { name: 'Outfit', family: 'Outfit', category: 'Bold Display' },
  { name: 'Space Grotesk', family: 'Space Grotesk', category: 'Futuristic Tech' },
  { name: 'Syne', family: 'Syne', category: 'Editorial & Distinct' },
  { name: 'Poppins', family: 'Poppins', category: 'Friendly Geometric' },
  { name: 'Montserrat', family: 'Montserrat', category: 'Architectural' }
];

export const BODY_FONT_PRESETS = [
  { name: 'DM Sans', family: 'DM Sans', category: 'Clean Geometric' },
  { name: 'Inter', family: 'Inter', category: 'Optimal Legibility' },
  { name: 'Plus Jakarta Sans', family: 'Plus Jakarta Sans', category: 'Modern Tech' },
  { name: 'Roboto', family: 'Roboto', category: 'Neutral & Standard' },
  { name: 'Open Sans', family: 'Open Sans', category: 'Friendly & Clear' },
  { name: 'Source Sans 3', family: 'Source Sans 3', category: 'Editorial & Crisp' }
];

const DEFAULT_TYPOGRAPHY: TypographySettings = {
  headingFont: 'DM Sans',
  bodyFont: 'DM Sans',
  headingWeight: '700',
  headingLetterSpacing: '-0.02em'
};

export const THEME_COLOR_PRESETS = [
  { name: 'Royal Blue', hex: '#1A56F0' },
  { name: 'Electric Purple', hex: '#8B5CF6' },
  { name: 'Indigo Neon', hex: '#6366F1' },
  { name: 'Emerald Green', hex: '#10B981' },
  { name: 'Sunset Amber', hex: '#F59E0B' },
  { name: 'Crimson Red', hex: '#EF4444' },
  { name: 'Cyan Teal', hex: '#06B6D4' },
  { name: 'Electric Lime', hex: '#D9F21A' }
];

@Injectable({
  providedIn: 'root'
})
export class PortfolioDataService {
  // Reactive Signals for entire portfolio state
  public profileInfo = signal<ProfileInfo>(this.load('profile', DEFAULT_PROFILE));
  public experiences = signal<WorkExperience[]>(this.load('experiences', DEFAULT_EXPERIENCES));
  public projects = signal<Project[]>(this.load('projects', DEFAULT_PROJECTS));
  public projectCategories = signal<string[]>(this.load('project_categories', DEFAULT_PROJECT_CATEGORIES));
  public tools = signal<ToolItem[]>(this.load('tools', DEFAULT_TOOLS));
  public skillCategories = signal<SkillCategory[]>(this.load('skills', DEFAULT_SKILL_CATEGORIES));
  public voiceKnowledge = signal<VoiceQAItem[]>(this.load('voice_qa', DEFAULT_VOICE_QA));
  public contactLinks = signal<ContactLink[]>(this.load('contact', DEFAULT_CONTACTS));
  public contactInfo = signal<ContactInfo>(this.load('contact_info', DEFAULT_CONTACT_INFO));
  public typography = signal<TypographySettings>(this.load('typography', DEFAULT_TYPOGRAPHY));
  public accentColor = signal<string>(this.load('accent_color', '#1A56F0'));
  public activeTemplate = signal<PortfolioTemplateMode>(this.load('active_template', 'marttin'));
  public sectionVisibility = signal<SectionVisibilitySettings>(this.load('section_visibility', DEFAULT_SECTION_VISIBILITY));

  constructor() {
    // Normalize any legacy emoji icons to modern SVG icon keys
    this.contactLinks.update(links => links.map(l => ({ ...l, icon: this.normalizeIcon(l.icon) })));
    this.skillCategories.update(skills => skills.map(s => ({ ...s, icon: this.normalizeIcon(s.icon) })));

    // Apply dynamic theme color & typography immediately
    this.applyAccentColor(this.accentColor());
    this.applyTypography(this.typography());

    // Auto sync signals to localStorage
    effect(() => this.save('profile', this.profileInfo()));
    effect(() => this.save('experiences', this.experiences()));
    effect(() => this.save('projects', this.projects()));
    effect(() => this.save('project_categories', this.projectCategories()));
    effect(() => this.save('tools', this.tools()));
    effect(() => this.save('skills', this.skillCategories()));
    effect(() => this.save('voice_qa', this.voiceKnowledge()));
    effect(() => this.save('contact', this.contactLinks()));
    effect(() => this.save('contact_info', this.contactInfo()));
    effect(() => this.save('active_template', this.activeTemplate()));
    effect(() => this.save('section_visibility', this.sectionVisibility()));
    effect(() => {
      const typo = this.typography();
      this.save('typography', typo);
      this.applyTypography(typo);
    });
    effect(() => {
      const color = this.accentColor();
      this.save('accent_color', color);
      this.applyAccentColor(color);
    });
  }

  // --- Multi-Template Switcher ---
  public setActiveTemplate(template: PortfolioTemplateMode): void {
    this.activeTemplate.set(template);
  }

  // --- Granular Section Visibility & Privacy ---
  public updateSectionVisibility(settings: Partial<SectionVisibilitySettings>): void {
    this.sectionVisibility.update(prev => ({ ...prev, ...settings }));
  }

  // --- Typography Engine ---
  public updateTypography(settings: Partial<TypographySettings>): void {
    this.typography.update(t => ({ ...t, ...settings }));
  }

  private applyTypography(typo: TypographySettings): void {
    if (typeof document !== 'undefined') {
      const fonts = Array.from(new Set([typo.headingFont, typo.bodyFont])).filter(Boolean);
      const fontQuery = fonts.map(f => `family=${encodeURIComponent(f)}:wght@400;500;600;700;800`).join('&');
      
      let linkEl = document.getElementById('ak-dynamic-google-fonts') as HTMLLinkElement;
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.id = 'ak-dynamic-google-fonts';
        linkEl.rel = 'stylesheet';
        document.head.appendChild(linkEl);
      }
      linkEl.href = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`;

      document.documentElement.style.setProperty('--fd', `"${typo.headingFont}", sans-serif`);
      document.documentElement.style.setProperty('--fb', `"${typo.bodyFont}", sans-serif`);
      document.documentElement.style.setProperty('--heading-weight', typo.headingWeight || '700');
      document.documentElement.style.setProperty('--heading-spacing', typo.headingLetterSpacing || '-0.02em');
    }
  }

  // --- Theme Color Customization ---
  public setAccentColor(hex: string): void {
    this.accentColor.set(hex);
    this.applyAccentColor(hex);
  }

  private applyAccentColor(hex: string): void {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--accent', hex);
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16) || 26;
      const g = parseInt(cleanHex.substring(2, 4), 16) || 86;
      const b = parseInt(cleanHex.substring(4, 6), 16) || 240;
      document.documentElement.style.setProperty('--accent-subtle', `rgba(${r}, ${g}, ${b}, 0.12)`);
      document.documentElement.style.setProperty('--accent-hover', `rgba(${r}, ${g}, ${b}, 0.9)`);
    }
  }

  // --- Profile CRUD ---
  public updateProfile(updated: Partial<ProfileInfo>): void {
    this.profileInfo.update(p => ({ ...p, ...updated }));
  }

  // --- Projects CRUD ---
  public addProject(project: Project): void {
    this.projects.update(list => [project, ...list]);
  }

  public updateProject(project: Project): void {
    this.projects.update(list => list.map(p => p.id === project.id ? project : p));
  }

  public deleteProject(id: string): void {
    this.projects.update(list => list.filter(p => p.id !== id));
  }

  // --- Project Categories CRUD ---
  public addProjectCategory(category: string): void {
    const clean = category.trim();
    if (clean && !this.projectCategories().includes(clean)) {
      this.projectCategories.update(cats => [...cats, clean]);
    }
  }

  public deleteProjectCategory(category: string): void {
    if (category !== 'All') {
      this.projectCategories.update(cats => cats.filter(c => c !== category));
    }
  }

  // --- Tools CRUD ---
  public addTool(tool: ToolItem): void {
    this.tools.update(list => [...list, tool]);
  }

  public updateTool(tool: ToolItem): void {
    this.tools.update(list => list.map(t => t.id === tool.id ? tool : t));
  }

  public deleteTool(id: string): void {
    this.tools.update(list => list.filter(t => t.id !== id));
  }

  // --- Skills CRUD ---
  public addSkillToCategory(categoryId: string, skillName: string): void {
    this.skillCategories.update(cats => cats.map(c => {
      if (c.id === categoryId && !c.skills.includes(skillName.trim())) {
        return { ...c, skills: [...c.skills, skillName.trim()] };
      }
      return c;
    }));
  }

  public removeSkillFromCategory(categoryId: string, skillName: string): void {
    this.skillCategories.update(cats => cats.map(c => {
      if (c.id === categoryId) {
        return { ...c, skills: c.skills.filter(s => s !== skillName) };
      }
      return c;
    }));
  }

  public addSkillCategory(category: SkillCategory): void {
    this.skillCategories.update(cats => [...cats, category]);
  }

  public updateSkillCategory(category: SkillCategory): void {
    this.skillCategories.update(cats => cats.map(c => c.id === category.id ? category : c));
  }

  public deleteSkillCategory(id: string): void {
    this.skillCategories.update(cats => cats.filter(c => c.id !== id));
  }

  // --- Work Experience CRUD ---
  public addExperience(exp: WorkExperience): void {
    this.experiences.update(list => [exp, ...list]);
  }

  public updateExperience(index: number, exp: WorkExperience): void {
    this.experiences.update(list => list.map((item, i) => i === index ? exp : item));
  }

  public deleteExperience(index: number): void {
    this.experiences.update(list => list.filter((_, i) => i !== index));
  }

  // --- Voice AI Knowledge CRUD ---
  public addVoiceQA(item: VoiceQAItem): void {
    this.voiceKnowledge.update(list => [item, ...list]);
  }

  public updateVoiceQA(item: VoiceQAItem): void {
    this.voiceKnowledge.update(list => list.map(v => v.id === item.id ? item : v));
  }

  public deleteVoiceQA(id: string): void {
    this.voiceKnowledge.update(list => list.filter(v => v.id !== id));
  }

  // --- Contact & Get in Touch CRUD ---
  public updateContactInfo(info: Partial<ContactInfo>): void {
    this.contactInfo.update(c => ({ ...c, ...info }));
  }

  public addContactLink(link: ContactLink): void {
    this.contactLinks.update(list => [...list, link]);
  }

  public updateContactLink(index: number, link: ContactLink): void {
    this.contactLinks.update(list => list.map((item, i) => i === index ? link : item));
  }

  public deleteContactLink(index: number): void {
    this.contactLinks.update(list => list.filter((_, i) => i !== index));
  }

  // --- Factory Reset ---
  public resetToDefaults(): void {
    this.profileInfo.set(DEFAULT_PROFILE);
    this.experiences.set(DEFAULT_EXPERIENCES);
    this.projects.set(DEFAULT_PROJECTS);
    this.projectCategories.set(DEFAULT_PROJECT_CATEGORIES);
    this.tools.set(DEFAULT_TOOLS);
    this.skillCategories.set(DEFAULT_SKILL_CATEGORIES);
    this.voiceKnowledge.set(DEFAULT_VOICE_QA);
    this.contactLinks.set(DEFAULT_CONTACTS);
    this.contactInfo.set(DEFAULT_CONTACT_INFO);
    this.typography.set(DEFAULT_TYPOGRAPHY);
    this.setAccentColor('#1A56F0');

    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(STORAGE_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  }

  private normalizeIcon(icon: string): string {
    const map: Record<string, string> = {
      '📧': 'mail',
      '💼': 'linkedin',
      '🎨': 'dribbble',
      '🌐': 'globe',
      '💻': 'web-dev',
      '📱': 'mobile-dev',
      '🎬': 'video-motion'
    };
    return map[icon] || icon;
  }

  // Storage helpers
  private load<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  private save<T>(key: string, value: T): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (e) {}
  }
}
