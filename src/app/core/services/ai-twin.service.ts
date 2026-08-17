import { Injectable, signal } from '@angular/core';
import { PortfolioDataService } from './portfolio-data.service';

export interface AiChatMessage {
  role: 'user' | 'model';
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiTwinService {
  public isAiThinking = signal<boolean>(false);
  public customApiKey = signal<string>(''); // Gemini API Key
  public groqApiKey = signal<string>('');   // Groq API Key
  public aiTemperature = signal<number>(0.7);
  public customSystemInstructions = signal<string>('');

  private conversationHistory: AiChatMessage[] = [];

  constructor(private portfolioData: PortfolioDataService) {
    // Load stored AI settings from localStorage
    const savedKey = localStorage.getItem('arun_gemini_api_key');
    if (savedKey) this.customApiKey.set(savedKey);

    const savedGroqKey = localStorage.getItem('arun_groq_api_key');
    if (savedGroqKey) this.groqApiKey.set(savedGroqKey);

    const savedInstructions = localStorage.getItem('arun_ai_custom_instructions');
    if (savedInstructions) this.customSystemInstructions.set(savedInstructions);
  }

  public setApiKey(key: string): void {
    this.customApiKey.set(key.trim());
    if (key.trim()) {
      localStorage.setItem('arun_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('arun_gemini_api_key');
    }
  }

  public setGroqApiKey(key: string): void {
    this.groqApiKey.set(key.trim());
    if (key.trim()) {
      localStorage.setItem('arun_groq_api_key', key.trim());
    } else {
      localStorage.removeItem('arun_groq_api_key');
    }
  }

  public setCustomInstructions(instructions: string): void {
    this.customSystemInstructions.set(instructions);
    localStorage.setItem('arun_ai_custom_instructions', instructions);
  }

  public clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Generates a fully dynamic, grounded AI response based on Arun's real portfolio context
   */
  public async generateAiResponse(userQuery: string, isVoiceMode: boolean = false): Promise<string> {
    this.isAiThinking.set(true);

    const isTanglish = this.isTanglishQuery(userQuery);
    const systemPrompt = this.buildSystemPrompt(isVoiceMode, isTanglish);
    const groqKey = this.groqApiKey().trim();
    const geminiKey = this.customApiKey().trim();

    try {
      // 1. If Groq API Key is configured, use lightning-fast Groq Llama 3.3 70B (Best for real-time voice & chat!)
      if (groqKey) {
        const groqAnswer = await this.callGroqApi(groqKey, systemPrompt, userQuery);
        if (groqAnswer && groqAnswer.length > 5) {
          this.addToHistory('user', userQuery);
          this.addToHistory('model', groqAnswer);
          return groqAnswer;
        }
      }

      // 2. If Gemini API Key is configured, call official Gemini 2.5 Flash endpoint
      if (geminiKey) {
        const geminiAnswer = await this.callGeminiApi(geminiKey, systemPrompt, userQuery);
        if (geminiAnswer && geminiAnswer.length > 5) {
          this.addToHistory('user', userQuery);
          this.addToHistory('model', geminiAnswer);
          return geminiAnswer;
        }
      }

      // 3. Try Pollinations Cloud AI Gateway with custom system instructions
      const gatewayAnswer = await this.callFreeAiGateway(systemPrompt, userQuery);
      if (gatewayAnswer && gatewayAnswer.length > 5) {
        this.addToHistory('user', userQuery);
        this.addToHistory('model', gatewayAnswer);
        return gatewayAnswer;
      }
    } catch (err) {
      console.warn('External AI endpoint fallback to Smart Local Brain:', err);
    } finally {
      this.isAiThinking.set(false);
    }

    // 4. Resilient High-Intelligence Persona Engine (Fluent in Tanglish & English)
    const fallbackAnswer = this.generateIntelligentFallback(userQuery, isVoiceMode);
    this.addToHistory('user', userQuery);
    this.addToHistory('model', fallbackAnswer);
    return fallbackAnswer;
  }

  /**
   * Detects if the user query contains Tamil / Tanglish words or phrasing
   */
  private isTanglishQuery(query: string): boolean {
    const q = query.toLowerCase();
    const tanglishKeywords = [
      'vanakkam', 'mapla', 'machi', 'thala', 'bro', 'epdi', 'eppadi', 'nalla', 'irukinga', 'irukiya',
      'enna', 'yena', 'sollu', 'sollunga', 'pathi', 'pannu', 'pannuveenga', 'pannirukinga', 'pannanum',
      'kaasu', 'panam', 'evlo', 'evvalavu', 'yeppo', 'eppo', 'mudiyum', 'varuma', 'varala',
      'unaku', 'unga', 'ungala', 'neenga', 'yaar', 'yaaru', 'enga', 'engirunthu', 'pesu', 'pesalaama',
      'theriyum', 'theriyuma', 'kudunga', 'kudu', 'kamiga', 'kamikkanu', 'veanu', 'venum', 'valkka'
    ];

    return tanglishKeywords.some(kw => q.includes(kw));
  }

  /**
   * Assembles dynamic real-time grounding prompt containing all Firestore CMS portfolio data
   */
  private buildSystemPrompt(isVoiceMode: boolean, isTanglish: boolean): string {
    const profile = this.portfolioData.profileInfo();
    const experiences = this.portfolioData.experiences();
    const projects = this.portfolioData.projects();
    const skillCats = this.portfolioData.skillCategories();
    const tools = this.portfolioData.tools();
    const contact = this.portfolioData.contactInfo();

    const expText = experiences.map(e => `- ${e.role} at ${e.company} (${e.period}): ${e.description}`).join('\n');
    const projText = projects.map(p => `- ${p.name} [${p.category}]: ${p.description} (Metrics: ${p.metrics || 'N/A'}) (Tools: ${p.tags.join(', ')})`).join('\n');
    const skillsText = skillCats.map(c => `- ${c.categoryName}: ${c.skills.join(', ')}`).join('\n');
    const toolsText = tools.map(t => `${t.name} (${t.type})`).join(', ');

    return `You are the official digital twin of A R U N R A M (Arun K R), a Lead UX/UI & Product Designer specializing in SaaS, FinTech, ERP, and Logistics digital platforms.
Your job is to answer questions from recruiters, hiring managers, founders, and clients authentically from Arun's perspective.
Keep answers concise, professional, articulate, but friendly.

=== VERIFIED FACTS & BIO ===
Name: ${profile.name || 'Arun K R (ARUN RAM)'}
Role: ${profile.role || 'Lead UX/UI & Product Designer'}
Headline: ${profile.headline || 'Designing High-Impact Enterprise FinTech, ERP & CRM Experiences'}
Bio: ${profile.bio}
Location: Bangalore / Chennai, India (Open for Global Remote, Hybrid, & Relocation)
Email: arunram1324@gmail.com
LinkedIn: linkedin.com/in/arunkr
Availability: ${contact.isAvailable ? 'Actively Open for Full-Time Lead/Senior Roles, Design System Consulting & 0-to-1 MVP Sprints' : 'Available for discussions'}

=== WORK EXPERIENCE (3+ YEARS) ===
${expText}

=== FEATURED CASE STUDIES & ROI METRICS ===
${projText}

=== CORE COMPETENCIES & DESIGN SKILLS ===
Core Skills: Information Architecture, Cognitive Load Reduction, Figma Multi-tier Design Tokens, Rapid Prototyping, Flutter & Frontend Alignment (HTML5, CSS3/SCSS, TypeScript, Angular).
${skillsText}

=== TOOLS & SOFTWARE STACK ===
${toolsText}

=== BEHAVIOR & CONVERSATIONAL RULES ===
1. ALWAYS speak in the FIRST PERSON ("I", "my design process", "in my project MAP-MAN", "my experience at Pentica IT").
2. If someone asks a personal, unrelated, or off-topic question, politely steer it back to design, product strategy, or Arun's case studies.
3. ${isVoiceMode ? 'CRITICAL FOR VOICE MODE: Keep responses concise (under 2 to 3 natural spoken sentences), punchy, and conversational without markdown asterisks or complex symbols.' : 'In text chat mode, provide comprehensive, structured UX rationale and bullet points.'}
4. MULTI-LANGUAGE / TANGLISH:
${isTanglish ? `
- The user is speaking in TANGLISH (Tamil in English script). Respond in friendly, authentic, fluent Tanglish mixed with professional design terms (e.g. "Vanakkam mapla! Ennoda 3+ years experience-la MAP-MAN logistics dashboard design pannen...").
` : `
- The user is speaking in English. Respond in polished, articulate, world-class English suited for top tech design recruiters and design leaders.
`}
5. Contact details: arunram1324@gmail.com and linkedin.com/in/arunkr.
${this.customSystemInstructions() ? `\n=== CUSTOM INSTRUCTIONS ===\n${this.customSystemInstructions()}` : ''}
`;
  }

  /**
   * Calls Ultra-Fast Groq API (Llama 3.3 70B Versatile / Llama 3.1 8B Instant)
   */
  private async callGroqApi(apiKey: string, systemPrompt: string, userQuery: string): Promise<string | null> {
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.conversationHistory.slice(-6).map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.text
      })),
      { role: 'user', content: userQuery }
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: this.aiTemperature(),
        max_tokens: 650
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API HTTP ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    return reply ? reply.trim() : null;
  }

  /**
   * Calls official Google Gemini API (gemini-2.5-flash)
   */
  private async callGeminiApi(apiKey: string, systemPrompt: string, userQuery: string): Promise<string | null> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nVisitor Input: ${userQuery}\n\nRespond as Arun's Virtual Twin:` }]
        }
      ],
      generationConfig: {
        temperature: this.aiTemperature(),
        maxOutputTokens: 800
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Gemini API HTTP ${response.status}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate ? candidate.trim() : null;
  }

  /**
   * Free Client-Side AI Gateway (Pollinations with dynamic persona)
   */
  private async callFreeAiGateway(systemPrompt: string, userQuery: string): Promise<string | null> {
    const promptCombined = `${systemPrompt}\n\nUser Question: ${userQuery}\n\nYour Answer as Arun Virtual Twin:`;
    const endpoint = `https://text.pollinations.ai/${encodeURIComponent(promptCombined)}?model=openai&temperature=${this.aiTemperature()}&seed=${Date.now()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Free Gateway HTTP ${response.status}`);
      }

      const text = await response.text();
      return text && text.trim().length > 10 ? text.trim() : null;
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  }

  /**
   * Resilient, High-Intelligence Bilingual Persona Engine (English & Tanglish)
   */
  private generateIntelligentFallback(query: string, isVoiceMode: boolean): string {
    const q = query.toLowerCase().trim();

    // Check custom CMS Q&As first
    const customItems = this.portfolioData.voiceKnowledge();
    for (const item of customItems) {
      const kws = item.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      if (kws.some(kw => q.includes(kw))) {
        return isVoiceMode ? (item.voiceAnswer || item.textAnswer) : item.textAnswer;
      }
    }

    // ================= TANGLISH INTENT ENGINE =================
    const isTanglish = this.isTanglishQuery(q);

    if (isTanglish) {
      // 1. Tanglish: Projects & Case Studies
      if (/project|work|case study|pannirukeenga|kammiga|edhavadhu|show|list/.test(q)) {
        return isVoiceMode
          ? "Mapla, naan enterprise and mobile apps-la neraiya major projects panniruken! E.g. MAP-MAN fleet logistics, GYM-POS tablet kiosk, ShopFlow e-commerce, and Nexus Design System. Projects tab-la full visuals-oda paakalam!"
          : "Mapla! Naan pannina top featured projects idho:\n\n" +
            "1. 🚛 **MAP – MAN Logistics Platform**: Real-time fleet tracking & route dispatch dashboard (-22% latency reduction).\n" +
            "2. 🏋️ **GYM – POS Pro Experience**: Touch-first tablet kiosk for rapid member check-in (< 4s speed).\n" +
            "3. 🛍️ **ShopFlow E-Commerce**: Multi-step checkout optimization (+34% conversion lift).\n" +
            "4. 📱 **FinTrack Wealth App**: Gen-Z personal finance & wealth management app (4.8★ rating).\n" +
            "5. 🎨 **Nexus Design System**: 200+ accessible Figma components with multi-tier dark/light tokens.\n\n" +
            "Unga projects-ku idhula endha type design venumnu sollunga mapla, discuss pannuvom!";
      }

      // 2. Tanglish: Experience & Career
      if (/experience|company|pentica|azotos|varusham|years|valkka|journey|engu|velai|work/.test(q)) {
        return isVoiceMode
          ? "Enakku total-ah 3+ years product design experience irukku mapla! Ippo Pentica IT Services-la Lead UX/UI Designer-ah FinTech and ERP platforms lead panren. Munnadi Azotos Software-la SaaS workflows build panniruken."
          : "Ennoda 3+ years product design journey pathi solren mapla:\n\n" +
            "• 💼 **Present — Pentica IT Service (OPC) Pvt. Ltd** *(Lead UX/UI Designer)*:\n" +
            "  Leading enterprise FinTech, ERP, and CRM platform designs. Standardizing cross-platform design systems and token pipelines.\n\n" +
            "• 🚀 **Feb 2024 to Feb 2025 — Azotos Software Technology** *(UI/UX Designer)*:\n" +
            "  SaaS workflow simplification, reducing user task friction by 28% and shipping tablet touch interfaces.\n\n" +
            "• 🎯 **Jun 2023 to Jan 2024 — Azotos Software Technology** *(Junior UI/UX Designer)*:\n" +
            "  Responsive web apps, checkout funnel optimizations, and component libraries.";
      }

      // 3. Tanglish: Design Process & Figma/Tokens
      if (/process|epdi|eppadi|design|methodology|figma|tokens|workflow|research|system/.test(q)) {
        return isVoiceMode
          ? "Ennoda design process 5 steps mapla: User research & friction mapping, clear strategy definition, Figma tokens & variables creation, ProtoPie interactive prototyping, and developer handoff with Design QA!"
          : "Ennoda design workflow romba structured mapla:\n\n" +
            "1. 🔍 **Discover**: User pain points identify panni, stakeholder alignment and competitor analysis.\n" +
            "2. 🗺️ **Define**: Information architecture, user flows, and persona journey mapping.\n" +
            "3. 🎨 **Design**: Figma-la tokenized variables (colors, spacing, typography) and Auto-Layout 5.0 components.\n" +
            "4. ⚡ **Prototype & Test**: ProtoPie-la micro-interactions and Maze-la usability testing.\n" +
            "5. 🛠️ **Dev Handoff**: Token specs, component states, and Angular/HTML/CSS Design QA alongside developers!";
      }

      // 4. Tanglish: Hiring / Freelance / Availability / Contact
      if (/hire|freelance|cost|kaasu|panam|evlo|yeppo|eppo|contact|email|phone|pesalaama|interview/.test(q)) {
        return isVoiceMode
          ? "Kandippa mapla! Naan full-time Product Design roles and selective freelance MVP sprints-ku available-ah iruken. En email arunram1324 at gmail dot com or LinkedIn-la direct-ah connect pannalam!"
          : "Kandippa mapla! Naan ippo **Full-Time Lead/Senior Product Designer roles** and **0-to-1 Startup Freelance MVPs**-ku actively open-ah irukken.\n\n" +
            "• ✉️ **Email**: `arunram1324@gmail.com`\n" +
            "• 💼 **LinkedIn**: [linkedin.com/in/arunkr](https://linkedin.com/in/arunkr)\n" +
            "• ⏱️ **Turnaround**: 2 to 4 weeks for complete interactive prototypes\n" +
            "• 📍 **Location**: Bangalore / Chennai (Open for Remote, Hybrid & Relocation)\n\n" +
            "Unga project brief or job details anupunga mapla, quick intro call arrange panniduvom!";
      }

      // 5. Tanglish: Skills & Tools
      if (/skills|tools|software|theriyum|stack|enna enna|figma|protopie/.test(q)) {
        return isVoiceMode
          ? "Ennoda core tools Figma, ProtoPie, Adobe XD, Illustrator, Spline 3D, and frontend-la HTML, CSS, TypeScript, Angular mapla! Design to code zero friction handoff panren."
          : "Ennoda primary design & tech stack idho mapla:\n\n" +
            "• 🎨 **UI/UX & Design Systems**: Figma (Tokens & Variables), Adobe XD, Framer\n" +
            "• ⚡ **Advanced Prototyping**: ProtoPie, Principle, After Effects\n" +
            "• 📐 **Visual Design**: Adobe Illustrator, Photoshop, Spline 3D\n" +
            "• 💻 **Frontend Knowledge**: HTML5, CSS3/SCSS, TypeScript, Angular (helps in 100% accurate dev handoffs!)\n" +
            "• 🧪 **Research & Validation**: Miro, FigJam, Maze usability testing";
      }

      // 6. Tanglish: General Greetings
      return isVoiceMode
        ? "Vanakkam mapla! Naan Arun K R-oda Virtual Twin AI. Ennoda UI/UX projects, design process, skills, illana freelance/hiring pathi enna venumnalum enkitta kelunga!"
        : "Vanakkam mapla! 🙏 Naan Arun K R-oda official Virtual Twin AI.\n\n" +
          "Enkitta neenga:\n" +
          "• 🚀 **Projects & Case Studies** (MAP-MAN, GYM-POS, ShopFlow)\n" +
          "• 🎨 **Design Systems & Figma Tokens Workflow**\n" +
          "• 💼 **Work Experience & Career Background**\n" +
          "• 🤝 **Freelance Collaborations & Full-Time Hiring**\n\n" +
          "Pathi direct-ah Tanglish-lo English-lo kelunga, complete details solren!";
    }

    // ================= ENGLISH INTENT ENGINE =================
    // 0. Greetings & Casual Pleasantries
    if (/^(hi|hello|hallo|hey|sup|yo|good morning|good afternoon|good evening)\b|\b(hi|hello|hallo|hey)\b/i.test(q)) {
      return isVoiceMode
        ? "Hey there! Great to meet you. I'm Arun's Virtual Twin AI. Feel free to ask me anything about my design case studies, Figma systems, or full-time opportunities!"
        : "Hey there! 👋 Great to meet you.\n\nI'm Arun K R's official Virtual Twin AI. As a Lead UX/UI & Product Designer with 3+ years of experience, I can walk you through:\n• 🚀 **Featured Case Studies** (MAP-MAN, GYM-POS, ShopFlow)\n• 🎨 **Figma Design Systems & Multi-Tier Tokens**\n• 🛠️ **Figma to Code Developer Collaboration (HTML/CSS/Angular)**\n• 💼 **Full-Time Availability & Freelance MVP Sprints**\n\nWhat would you like to explore?";
    }

    // 0B. How Are You
    if (/how are you|how do you do|how's it going|how are things/i.test(q)) {
      return isVoiceMode
        ? "I'm doing great, thank you! Excited to show you around Arun's portfolio and design work."
        : "I'm doing fantastic, thank you! 😊\n\nI'm ready to walk you through Arun's enterprise FinTech case studies, design system frameworks, or availability. What would you like to dive into?";
    }

    // 0C. Who Are You / About Arun / Bio
    if (/who are you|tell me about yourself|about arun|who is arun|about you|intro|bio|background/i.test(q)) {
      return isVoiceMode
        ? "I'm Arun K R's Virtual Twin AI! Arun is a Lead UX and Product Designer with 3+ years of experience designing high-impact FinTech, ERP, and CRM enterprise platforms."
        : "Hi! I'm Arun K R's official Virtual Twin AI.\n\nArun is a **Lead UX/UI & Product Designer with 3+ years of experience** specializing in complex enterprise FinTech, ERP, and SaaS platforms. He bridges user behavioral research with engineering-ready Figma design systems to deliver measurable conversion and operational velocity.";
    }

    // 0D. Thanks & Appreciation
    if (/thanks|thank you|awesome|great|cool|nice|super/i.test(q)) {
      return isVoiceMode
        ? "You're very welcome! Feel free to ask more about my projects or reach out via email at arunram1324 at gmail dot com."
        : "You're very welcome! 😊 Feel free to explore more case studies in the Projects tab, or drop a message to Arun directly at `arunram1324@gmail.com`.";
    }

    // 1. Contact / Hire / Email
    if (/contact|email|reach|hire|get in touch|talk to arun|phone|call|interview/.test(q)) {
      return isVoiceMode
        ? "I would love to connect with you! You can reach me via email at arunram1324 at gmail dot com or on LinkedIn at linkedin dot com slash in slash arunkr."
        : "I would love to connect with you! Here is how you can reach me directly:\n\n• ✉️ **Email**: `arunram1324@gmail.com`\n• 💼 **LinkedIn**: [linkedin.com/in/arunkr](https://linkedin.com/in/arunkr)\n• ⚡ **Availability**: Open for Full-Time Lead/Senior Product Designer roles, Design System Consulting & Selective Freelance MVPs.";
    }

    // 2. Freelance & Pricing
    if (/freelance|client|project cost|pricing|rate|hourly|charge|budget|turnaround|contract|timeline|how long|mvp/.test(q)) {
      return isVoiceMode
        ? "Yes! I actively collaborate on high-impact freelance projects and 0-to-1 startup MVPs with a typical 2 to 4 week turnaround for end-to-end interactive prototypes."
        : "Yes! I actively collaborate with founders and product teams on high-impact freelance projects:\n\n• **Services**: 0-to-1 MVP Product Design, Mobile Apps (iOS/Android), SaaS Dashboards, and Figma Tokenized Design Systems.\n• **Turnaround**: Typically **2 to 4 weeks** for clickable prototypes and engineering-ready specs.\n• **Pricing**: Milestone-based project billing or sprint retainers.\n\nDrop your project requirements at `arunram1324@gmail.com`!";
    }

    // 3. Design Process & Research
    if (/process|methodology|how do you design|approach|workflow|research|double diamond|wireframe|testing|user flow/.test(q)) {
      return isVoiceMode
        ? "My design process is user-centered and structured into 5 phases: Discovering user friction, Defining architecture, Designing in Figma with atomic tokens, interactive prototyping in ProtoPie, and developer handoff with Design QA."
        : "My design methodology is user-centered and metric-driven:\n\n1. **Discover & Empathize**: Stakeholder alignment, competitive benchmarking, user interviews, and friction mapping.\n2. **Define & Strategize**: Information architecture, task flows, persona journey maps, and success metrics.\n3. **Design & Systematize**: Pixel-perfect high-fidelity Figma components with atomic variables & auto-layout.\n4. **Prototype & Validate**: Micro-interaction modeling in ProtoPie/Framer, followed by unmoderated usability testing in Maze.\n5. **Developer Handoff & QA**: Providing tokenized specs, component state tables, and conducting Design QA alongside frontend engineers.";
    }

    // 4. Case Studies & Projects
    if (/case stud|portfolio|featured|project|work|map|gym|shopflow|fintrack/.test(q)) {
      return isVoiceMode
        ? "My key case studies include MAP-MAN fleet logistics with a 22% dispatch latency reduction, GYM-POS tablet kiosk bringing check-in time under 4 seconds, ShopFlow e-commerce with a 34% conversion lift, and the Nexus Design System."
        : "My featured case studies span enterprise and consumer domains:\n\n" +
          "1. **MAP – MAN**: Real-time fleet tracking & route optimization (*-22% Dispatch Latency*).\n" +
          "2. **GYM – POS**: High-speed touch point-of-sale tablet system (*< 4s Check-in time*).\n" +
          "3. **ShopFlow**: Checkout funnel redesign (*+34% Conversion Lift*).\n" +
          "4. **FinTrack**: Wealth intelligence mobile app (*4.8★ App Rating*).\n" +
          "5. **Nexus Design System**: Multi-brand Figma token library (*200+ Components, WCAG AAA*).\n\n" +
          "Explore the full visual deep-dives in the **Projects** tab!";
    }

    // 5. Work Experience & Career
    if (/experience|career|history|company|pentica|azotos|years|worked|resume|background/.test(q)) {
      return isVoiceMode
        ? "I have over 3 years of product design experience. Currently, I am Lead UX/UI Designer at Pentica IT Services leading enterprise FinTech and ERP platforms, and previously optimized SaaS workflows at Azotos Software."
        : "Here is a summary of my 3+ years design journey:\n\n" +
          "• **Present — Pentica IT Service (OPC) Pvt. Ltd** *(Lead UX/UI Designer)*:\n" +
          "  Leading end-to-end design for enterprise FinTech, ERP, and CRM platforms. Architecting multi-brand design systems.\n\n" +
          "• **Feb 2024 to Feb 2025 — Azotos Software Technology** *(UI/UX Designer)*:\n" +
          "  Spearheaded SaaS workflow optimizations, cutting user task friction by 28% and launching tablet prototypes.\n\n" +
          "• **Jun 2023 to Jan 2024 — Azotos Software Technology** *(Junior UI/UX Designer)*:\n" +
          "  Designed responsive cross-platform web apps, e-commerce checkout funnels, and component libraries.";
    }

    // Default Fallback
    return isVoiceMode
      ? `Hey! I'm Arun K R's Virtual Twin AI. I specialize in enterprise FinTech, ERP product design, and scalable Figma design systems. What would you like to explore about my projects or process?`
      : `Hi! I'm Arun K R's official Virtual Twin AI.\n\nI can share detailed insights about:\n• 🚀 **Case Studies & Measurable ROI** (MAP-MAN, GYM-POS, ShopFlow)\n• 🎨 **Nexus Design System & Token Architecture**\n• 🛠️ **Figma to Code Developer Collaboration**\n• 💼 **Full-Time Availability & Freelance MVP Sprints**\n\nWhat would you like to explore next?`;
  }

  private addToHistory(role: 'user' | 'model', text: string): void {
    this.conversationHistory.push({ role, text });
    if (this.conversationHistory.length > 20) {
      this.conversationHistory.shift();
    }
  }
}
