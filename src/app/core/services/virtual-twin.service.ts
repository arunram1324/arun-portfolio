import { Injectable, signal } from '@angular/core';
import { ChatMessage } from '../models/portfolio.model';
import { ToastService } from '../../shared/services/toast.service';
import { PortfolioDataService } from './portfolio-data.service';

@Injectable({
  providedIn: 'root'
})
export class VirtualTwinService {
  public messages = signal<ChatMessage[]>([]);
  public isTyping = signal<boolean>(false);
  public isStreaming = signal<boolean>(false);
  public streamingChunk = signal<string>('');

  private readonly email = 'arunkr.design@gmail.com';
  private readonly linkedin = 'https://linkedin.com/in/arunkr';

  constructor(
    private toastService: ToastService,
    private portfolioData: PortfolioDataService
  ) {}

  /**
   * Spoken responses for Voice AI Stage (Concise, punchy, conversational, recruiter & client optimized)
   */
  public getVoiceAnswer(query: string): string {
    const q = query.toLowerCase().trim();

    // Check custom CMS Voice Q&As first!
    const customItems = this.portfolioData.voiceKnowledge();
    for (const item of customItems) {
      const kws = item.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      const matches = kws.some(kw => q.includes(kw));
      if (matches && item.voiceAnswer) {
        return item.voiceAnswer;
      }
    }

    // 1. Contact / Hire / Email
    if (/contact|email|reach|hire|call|interview|talk to arun|phone|get in touch/.test(q)) {
      this.toastService.copyToClipboard(this.email, 'Email copied to clipboard!');
      return "I would love to connect! I have copied my email, arunkr dot design at gmail dot com, to your clipboard. You can also find me on LinkedIn at linkedin dot com slash in slash arunkr.";
    }

    // 2. Freelance / Client Work / Pricing / Turnaround
    if (/freelance|client|project cost|pricing|rate|hourly|charge|budget|turnaround|contract|timeline|how long|mvp/.test(q)) {
      return "Yes! I actively take on freelance design sprints and 0 to 1 MVPs for startups. My typical turnaround is 2 to 4 weeks for complete interactive prototypes with milestone-based pricing.";
    }

    // 3. Design Process & Research Methodology
    if (/process|methodology|approach|how do you design|workflow|research|double diamond|testing|user flow|maze/.test(q)) {
      return "My design process follows a 5-step framework: Discover user pain points, Define strategy, Systematize in Figma with tokens, Prototype in ProtoPie, and conduct usability testing in Maze before developer handoff.";
    }

    // 4. Developer Collaboration & Code
    if (/developer|engineer|handoff|code|angular|frontend|html|css|typescript|javascript|dev mode/.test(q)) {
      return "I have hands-on frontend knowledge in HTML, CSS, TypeScript, and Angular. I build Figma design systems with tokenized variables and component states, ensuring zero-friction developer handoffs.";
    }

    // 5. Specific Case Study: MAP-MAN
    if (/map|logistics|fleet|route|dispatch/.test(q)) {
      return "In MAP-MAN, I designed a real-time fleet dispatch dashboard that reduced dispatch latency by 22 percent and now powers over 500 active delivery units.";
    }

    // 6. Specific Case Study: GYM-POS
    if (/gym|pos|fitness|retail|tablet|check in/.test(q)) {
      return "For GYM-POS, I designed a touch-first tablet kiosk that brought member check-in time down to under 4 seconds and boosted renewals by 38 percent.";
    }

    // 7. Specific Case Studies: ShopFlow & FinTrack
    if (/shopflow|ecommerce|checkout|conversion|fintrack|wealth/.test(q)) {
      return "ShopFlow's checkout redesign delivered a 34 percent conversion lift, while FinTrack achieved a 4.8-star rating on app stores.";
    }

    // 8. General Case Studies
    if (/case stud|portfolio|featured|project/.test(q)) {
      return "My key case studies include MAP-MAN logistics, GYM-POS point-of-sale, ShopFlow e-commerce, FinTrack wealth app, and the Nexus Design System.";
    }

    // 9. Design Systems & Tokens
    if (/design system|token|variables|figma token|atomic|component library|nexus/.test(q)) {
      return "I built the Nexus Design System featuring over 200 accessible Figma components, multi-tier tokens for light and dark themes, and full WCAG AAA compliance.";
    }

    // 10. Tools & Stack
    if (/tool|software|figma|protopie|xd|illustrator|photoshop|spline|after effects|framer|stack/.test(q)) {
      return "My core toolkit includes Figma with tokens and variables, ProtoPie, Spline 3D, Adobe Illustrator, Photoshop, and After Effects.";
    }

    // 11. Notice Period & Availability & Location
    if (/notice period|joining|availability|when can you start|location|relocate|chennai|remote|full time/.test(q)) {
      return "I am based in Chennai, India, and open for global remote, hybrid, or on-site Senior Product Designer roles. I am available for immediate joining or standard short notice.";
    }

    // 12. Salary & Compensation
    if (/salary|ctc|compensation|expectation|pay/.test(q)) {
      return "I am open to competitive compensation aligned with senior product design market standards, and happy to discuss details during an interview call.";
    }

    // 13. Tamil / Tanglish Voice Support
    if (/vanakkam|mapla|tamil|epdi|nalla/.test(q)) {
      return "Vanakkam mapla! Naan Arun oda Virtual Twin. Ennoda UI UX design projects, process, illana hiring pathi neenga enkitta direct-ah kekalam!";
    }

    // 14. Self Intro / Background
    if (/who are you|tell me about yourself|intro|about you|arun|bio|summary|experience|years/.test(q)) {
      return "I'm Arun K R, a UX and Product Designer with over 3 years of experience. I specialize in designing enterprise FinTech, ERP, and CRM digital solutions.";
    }

    // 15. Greetings
    if (/hi|hello|hey|good morning|good afternoon|good evening/.test(q)) {
      return "Hey there! I'm Arun K R's Virtual Twin Voice AI. Ask me anything about my design process, case studies, availability, or how we can collaborate!";
    }

    // Fallback
    return "I can walk you through my design process, case study metrics, developer collaboration, or availability for your team. What would you like to explore?";
  }

  /**
   * Text responses for Chat Stage
   */
  public getAnswer(query: string): string {
    const q = query.toLowerCase().trim();

    // Check custom CMS Voice/Chat Q&As first!
    const customItems = this.portfolioData.voiceKnowledge();
    for (const item of customItems) {
      const kws = item.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      const matches = kws.some(kw => q.includes(kw));
      if (matches && item.textAnswer) {
        return item.textAnswer;
      }
    }

    // 1. Contact / Hire / Email
    if (/contact|email|reach|hire|get in touch|talk to arun|phone|call|book|interview/.test(q)) {
      this.toastService.copyToClipboard(this.email, 'Email copied to clipboard!');
      return `I would love to connect with you! Here is how you can reach me:\n\n` +
        `• ✉️ **Email**: \`${this.email}\` *(copied to clipboard!)*\n` +
        `• 💼 **LinkedIn**: [linkedin.com/in/arunkr](${this.linkedin})\n` +
        `• ⚡ **Availability**: Open for Full-Time Product Design roles, Design System Consulting & Selective Freelance MVPs.\n\n` +
        `Feel free to send over a job description, project brief, or invite me for a quick intro call!`;
    }

    // 2. Freelance / Client Projects
    if (/freelance|client|project cost|pricing|rate|hourly|charge|budget|turnaround|contract|timeline|how long|mvp/.test(q)) {
      return `Yes! I actively collaborate with founders, product owners, and early-stage startups on high-impact freelance projects:\n\n` +
        `• **Services Offered**: 0-to-1 MVP Product Design, Mobile App UX/UI (iOS/Android), Complex SaaS Dashboard Redesigns, and Figma Design Systems.\n` +
        `• **Turnaround Time**: Typically **2 to 4 weeks** for end-to-end user flows, wireframes, and interactive clickable prototypes.\n` +
        `• **Pricing Model**: Transparent milestone-based project billing or weekly sprint retainers.\n\n` +
        `Let's discuss your project scope! Drop your requirements at \`${this.email}\`.`;
    }

    // 3. Design Process & Research
    if (/process|methodology|how do you design|approach|workflow|research|double diamond|wireframe|testing|user flow|maze/.test(q)) {
      return `My design process is user-centered, metric-driven, and structured into 5 cohesive phases:\n\n` +
        `1. **Discover & Empathize**: Stakeholder alignment, competitive benchmarking, user interviews, and friction point identification.\n` +
        `2. **Define & Strategize**: Information architecture, task flows, persona journey maps, and success metric definition.\n` +
        `3. **Design & Systematize**: Rapid low-fidelity sketching progressing to pixel-perfect high-fidelity Figma components with atomic variables & auto-layout.\n` +
        `4. **Prototype & Validate**: Micro-interaction modeling in ProtoPie/Framer, followed by unmoderated usability testing in Maze.\n` +
        `5. **Developer Handoff & QA**: Providing tokenized specs, component state tables, and conducting Design QA alongside frontend engineers.`;
    }

    // 4. Developer Collaboration & Code
    if (/developer|engineer|handoff|code|dev mode|angular|frontend|html|css|typescript|javascript|react|collab/.test(q)) {
      return `Developer collaboration is one of my strongest differentiators! Having hands-on frontend knowledge in **HTML5, CSS3/SCSS, TypeScript, and Angular**:\n\n` +
        `• **Zero Handoff Friction**: I build Figma files with structured Auto Layout, tokenized variables (spacing, colors, typography), and explicit component states.\n` +
        `• **Technical Feasibility**: I design solutions that are visually stunning yet practical and performant to implement in production.\n` +
        `• **Design QA**: I actively participate in sprint reviews and inspect browser PRs to ensure 100% fidelity with the Figma designs.`;
    }

    // 5. Work Experience & Career History
    if (/experience|career|history|company|pentica|azotos|years|worked|resume|background/.test(q)) {
      return `Here is a summary of my 3+ years design journey:\n\n` +
        `• **Present — Pentica IT Service (OPC) Pvt. Ltd** *(UX/UI Designer)*:\n` +
        `  Leading end-to-end design for enterprise FinTech, ERP, and CRM platforms. Built scalable design systems and standardized cross-team design-to-code pipelines.\n\n` +
        `• **Feb 2024 to Feb 2025 — Azotos Software Technology** *(UI/UX Designer)*:\n` +
        `  Spearheaded SaaS workflow optimizations, cutting user task friction by 28% and launching interactive touch prototypes.\n\n` +
        `• **Jun 2023 to Jan 2024 — Azotos Software Technology** *(Junior UI/UX Designer)*:\n` +
        `  Designed responsive cross-platform web apps, e-commerce checkout funnels, and component libraries.`;
    }

    // 6. Specific Case Studies
    if (/map|logistics|fleet|route/.test(q)) {
      return `**MAP – MAN Logistics Platform**:\n\n` +
        `• **The Problem**: Fleet dispatchers struggled with multi-window clutter and slow 8-step route assignments.\n` +
        `• **The Solution**: Designed a real-time dispatch dashboard with split-view map telemetry and 2-click dispatch workflows.\n` +
        `• **Impact**: Reduced dispatch latency by **22%** and currently powers 500+ active delivery units.`;
    }

    if (/gym|pos|fitness|retail|tablet/.test(q)) {
      return `**GYM – POS Pro Experience**:\n\n` +
        `• **The Problem**: Long counter queues during peak hours due to cumbersome desktop software.\n` +
        `• **The Solution**: Created a touch-first, high-contrast tablet kiosk optimized for tap efficiency, quick QR check-ins, and membership renewals.\n` +
        `• **Impact**: Member check-in time dropped to **< 4 seconds** and membership renewals increased by **+38%**.`;
    }

    if (/shopflow|ecommerce|e-commerce|checkout|conversion|fintrack|wealth/.test(q)) {
      return `**Key Consumer App Case Studies**:\n\n` +
        `• **ShopFlow E-Commerce**: Redesigned the multi-step checkout funnel with smart slide-over cart drawers and 1-click payments, generating a **+34% conversion lift**.\n` +
        `• **FinTrack Wealth App**: Designed a Gen Z personal finance mobile app featuring biometric smart categorization and predictive budgeting (**4.8★ App Rating**).`;
    }

    if (/case stud|portfolio|featured|project/.test(q)) {
      return `My featured design case studies span enterprise and consumer domains:\n\n` +
        `1. **MAP – MAN**: Real-time fleet tracking & route optimization (*-22% Dispatch Latency*).\n` +
        `2. **GYM – POS**: High-speed touch point-of-sale system (*< 4s Check-in time*).\n` +
        `3. **ShopFlow**: Checkout funnel optimization (*+34% Conversion Lift*).\n` +
        `4. **FinTrack**: Wealth intelligence mobile app (*4.8★ Rating*).\n` +
        `5. **Nexus Design System**: Multi-brand Figma token library (*200+ Components, WCAG AAA*).\n\n` +
        `You can explore these interactive visual cards in the **Projects** tab!`;
    }

    // 7. Design Systems & Tokens
    if (/design system|token|variables|figma token|atomic|component library|nexus/.test(q)) {
      return `Design systems are my specialty! In the **Nexus Design System** project:\n\n` +
        `• Built **200+ accessible components** in Figma with Auto Layout 5.0, nested variants, and component properties.\n` +
        `• Structured multi-tier token architectures supporting seamless Light & Dark themes.\n` +
        `• Integrated strict WCAG AAA contrast ratios and created comprehensive documentation guidelines for developer consumption.`;
    }

    // 8. Design Toolkit & Software
    if (/tool|software|figma|protopie|xd|illustrator|photoshop|spline|after effects|framer|stack/.test(q)) {
      return `My industry-standard design & prototyping stack:\n\n` +
        `• **UI/UX & Systems**: Figma (Tokens/Variables), Adobe XD, Framer\n` +
        `• **Advanced Prototyping & Motion**: ProtoPie, Principle, Adobe After Effects\n` +
        `• **Visual & 3D**: Adobe Illustrator, Photoshop, Spline 3D\n` +
        `• **Research & Strategy**: Notion, Miro, FigJam, Maze\n` +
        `• **Frontend Alignment**: HTML5, CSS3/SCSS, JavaScript, TypeScript, Angular`;
    }

    // 9. Notice Period & Availability
    if (/notice period|joining|availability|when can you start|location|relocate|chennai|remote/.test(q)) {
      return `• **Location**: Based in Chennai, Tamil Nadu, India.\n` +
        `• **Work Preference**: Open for **Global Remote** roles, Hybrid, or On-site opportunities.\n` +
        `• **Notice Period / Availability**: Available for immediate hiring / standard short notice period.\n` +
        `• **Target Roles**: Senior UX/UI Designer, Product Designer, Design System Lead.`;
    }

    // 10. Tamil / Tanglish
    if (/vanakkam|mapla|epdi|nalla|tamil|chennai/.test(q)) {
      return `Vanakkam mapla! 🙏 Naan Arun K R oda Virtual Twin. Ennoda UI/UX design background, enterprise projects (MAP-MAN, GYM-POS, ShopFlow), design systems, illana hiring/freelance pathi enkitta neenga direct-ah kekalam. Enna explore panna virumbureenga?`;
    }

    // 11. Self Introduction / Background
    if (/who are you|tell me about yourself|intro|about you|arun|bio|summary/.test(q)) {
      return `Hi! I'm Arun K R, a UX/UI & Product Designer with 3+ years of experience specializing in high-impact **FinTech, ERP, and CRM enterprise platforms**.\n\n` +
        `I bridge the gap between user behavioral research and technical execution — transforming complex multi-step business workflows into intuitive, task-efficient interfaces that drive measurable conversion and operational speed.`;
    }

    // Default Fallback
    return `That's a great question! As Arun's Virtual Twin, I can share detailed insights about:\n\n` +
      `• 🎯 **Design Process & Research Methodology**\n` +
      `• 🚀 **Case Studies & ROI Metrics** (MAP-MAN, GYM-POS, ShopFlow)\n` +
      `• ⚙️ **Figma Design Systems & Developer Handoff**\n` +
      `• 💼 **Full-Time Availability & Notice Period**\n` +
      `• 🤝 **Freelance MVP Sprints & Pricing**\n\n` +
      `What would you like to explore next?`;
  }

  public async sendMessage(userText: string): Promise<void> {
    if (!userText.trim() || this.isStreaming()) return;

    const time = this.formatTime();
    const userMsg: ChatMessage = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: userText.trim(),
      timestamp: time
    };

    this.messages.update(prev => [...prev, userMsg]);
    this.isTyping.set(true);

    const answer = this.getAnswer(userText);

    // Natural simulated AI thinking & streaming
    await new Promise(r => setTimeout(r, 380));
    this.isTyping.set(false);
    this.isStreaming.set(true);

    const words = answer.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i += 2) {
      currentText += (i === 0 ? '' : ' ') + words.slice(i, i + 2).join(' ');
      this.streamingChunk.set(currentText);
      await new Promise(r => setTimeout(r, 22 + Math.random() * 18));
    }

    const aiMsg: ChatMessage = {
      id: 'ai_' + Date.now(),
      sender: 'ai',
      text: answer,
      timestamp: this.formatTime()
    };

    this.messages.update(prev => [...prev, aiMsg]);
    this.isStreaming.set(false);
    this.streamingChunk.set('');
  }

  private formatTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
