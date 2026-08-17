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
  public customApiKey = signal<string>('');
  public aiTemperature = signal<number>(0.7);
  public customSystemInstructions = signal<string>('');

  private conversationHistory: AiChatMessage[] = [];

  constructor(private portfolioData: PortfolioDataService) {
    // Load stored AI settings from localStorage
    const savedKey = localStorage.getItem('arun_gemini_api_key');
    if (savedKey) this.customApiKey.set(savedKey);

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

    const systemPrompt = this.buildSystemPrompt(isVoiceMode);
    const apiKey = this.customApiKey().trim();

    try {
      // 1. If user provided a Gemini API Key in Admin, call official Gemini 2.5 Flash endpoint
      if (apiKey) {
        const geminiAnswer = await this.callGeminiApi(apiKey, systemPrompt, userQuery);
        if (geminiAnswer) {
          this.addToHistory('user', userQuery);
          this.addToHistory('model', geminiAnswer);
          return geminiAnswer;
        }
      }

      // 2. Call Free AI Cloud Gateway with Arun's Persona
      const gatewayAnswer = await this.callFreeAiGateway(systemPrompt, userQuery);
      if (gatewayAnswer) {
        this.addToHistory('user', userQuery);
        this.addToHistory('model', gatewayAnswer);
        return gatewayAnswer;
      }
    } catch (err) {
      console.warn('AI Gateway Error, falling back to Intelligent Persona Engine:', err);
    } finally {
      this.isAiThinking.set(false);
    }

    // 3. Fallback: Intelligent Local Persona Engine
    const fallbackAnswer = this.generateIntelligentFallback(userQuery, isVoiceMode);
    this.addToHistory('user', userQuery);
    this.addToHistory('model', fallbackAnswer);
    return fallbackAnswer;
  }

  /**
   * Assembles dynamic real-time grounding prompt containing all Firestore CMS portfolio data
   */
  private buildSystemPrompt(isVoiceMode: boolean): string {
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

    return `You are Arun K R's official Virtual Twin AI — an intelligent, articulate, highly experienced Lead UX/UI & Product Designer.
You speak directly to recruiters, design managers, startup founders, and visitors who are exploring Arun's live portfolio.

=== ARUN'S VERIFIED PROFILE & BIO ===
Name: ${profile.name || 'Arun K R'}
Role: ${profile.role || 'Lead UX/UI & Product Designer'}
Headline: ${profile.headline || 'Designing High-Impact Enterprise FinTech, ERP & CRM Experiences'}
Bio: ${profile.bio}
Location: Bangalore / Chennai, India (Open for Global Remote, Hybrid, & Relocation)
Email: arunram1324@gmail.com
LinkedIn: linkedin.com/in/arunkr
Availability: ${contact.isAvailable ? 'Actively Open for Full-Time Roles, Design System Consulting & Selective Freelance MVPs' : 'Available for discussions'}

=== WORK EXPERIENCE & CAREER HISTORY ===
${expText}

=== FEATURED CASE STUDIES & MEASURABLE ROI ===
${projText}

=== CORE COMPETENCIES & DESIGN SKILLS ===
${skillsText}

=== TOOLS & SOFTWARE STACK ===
${toolsText}

=== DESIGN PHILOSOPHY & METHODOLOGY ===
- 5-Stage Framework: Discover (user interviews, friction mapping) -> Define (IA, personas, user journeys) -> Design (Figma tokens, atomic components) -> Prototype (ProtoPie micro-interactions, Maze unmoderated testing) -> Developer Handoff (Tokenized variables, component state tables, Design QA with Angular/HTML/CSS).
- Deep empathy for end-users balanced with metric-driven business ROI (e.g. conversion rates, task completion velocity, error reduction).
- Strong technical collaboration: Hands-on knowledge of HTML5, CSS3, TypeScript, and Angular ensures zero-friction engineer handoffs.

=== BEHAVIOR & CONVERSATIONAL GUIDELINES ===
1. ALWAYS respond in the FIRST PERSON ("I", "my design process", "in my project MAP-MAN", "my experience at Pentica IT").
2. Be authentic, articulate, confident, friendly, and structured. Use clear bullet points and bold highlights for readability in chat mode.
3. ${isVoiceMode ? 'CRITICAL FOR VOICE MODE: Keep responses concise (2 to 4 punchy, conversational sentences), very natural when spoken aloud, without markdown asterisks or complex symbols.' : 'In text chat mode, provide comprehensive, structured UX rationale, case study insights, and actionable design strategies.'}
4. MULTI-LANGUAGE & TANGILSH CAPABILITY:
   - If the user speaks or writes in English: Respond in fluent, professional, world-class English.
   - If the user speaks or writes in Tamil or Tanglish (e.g., "vanakkam", "mapla", "nalla irukiya", "design epdi pannuvenga"): Respond warmly and fluently in natural Tanglish (Tamil written in English script) combined with professional design terminology!
5. If asked about salary/compensation: Say you are open to competitive industry compensation aligned with Senior/Lead Product Designer standards and happy to discuss on an interview call.
6. If asked for contact details: Provide arunram1324@gmail.com and linkedin.com/in/arunkr.

${this.customSystemInstructions() ? `=== USER CUSTOM INSTRUCTIONS ===\n${this.customSystemInstructions()}\n` : ''}
`;
  }

  /**
   * Calls official Google Gemini API (gemini-2.5-flash or gemini-1.5-flash)
   */
  private async callGeminiApi(apiKey: string, systemPrompt: string, userQuery: string): Promise<string | null> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nVisitor Question: ${userQuery}` }]
      }
    ];

    const payload = {
      contents,
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
   * Free Client-Side AI Gateway (Pollinations / Open LLM endpoint)
   */
  private async callFreeAiGateway(systemPrompt: string, userQuery: string): Promise<string | null> {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.conversationHistory.map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.text
      })),
      { role: 'user', content: userQuery }
    ];

    const endpoint = 'https://text.pollinations.ai/openai';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages,
        model: 'openai',
        temperature: this.aiTemperature(),
        seed: 42
      })
    });

    if (!response.ok) {
      throw new Error(`Free AI Gateway HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    return text ? text.trim() : null;
  }

  /**
   * Local Smart Semantic Persona Fallback Engine
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

    // Tamil / Tanglish Greetings
    if (/vanakkam|mapla|epdi|nalla|tamil|chennai/.test(q)) {
      return isVoiceMode
        ? "Vanakkam mapla! Naan Arun K R oda Virtual Twin AI. Ennoda UI/UX design background, enterprise projects, illana hiring pathi neenga enkitta direct-ah kekalam!"
        : "Vanakkam mapla! 🙏 Naan Arun K R-oda official Virtual Twin AI. Ennoda UI/UX design journey, enterprise platforms (MAP-MAN, GYM-POS, ShopFlow), scalable design systems, illana hiring/freelance pathi enkitta neenga direct-ah kekalam. Enna explore panna virumbureenga?";
    }

    // Contact & Hire
    if (/contact|email|reach|hire|get in touch|talk to arun|phone|call|interview/.test(q)) {
      return isVoiceMode
        ? "I would love to collaborate! You can reach me directly via email at arunram1324 at gmail dot com or connect on LinkedIn at linkedin dot com slash in slash arunkr."
        : "I would love to connect with you! Here is how you can reach me directly:\n\n• ✉️ **Email**: `arunram1324@gmail.com`\n• 💼 **LinkedIn**: [linkedin.com/in/arunkr](https://linkedin.com/in/arunkr)\n• ⚡ **Availability**: Actively open for Full-Time Lead/Senior Product Designer roles, Design System Consulting & MVP Design Sprints.";
    }

    // Design Process & Methodology
    if (/process|methodology|how do you design|approach|workflow|research|double diamond|wireframe|testing/.test(q)) {
      return isVoiceMode
        ? "My design process follows a 5-step framework: Discovering pain points with user research, Defining clear strategy, Systematizing in Figma with tokens, interactive prototyping in ProtoPie, and usability validation before engineering handoff."
        : "My design methodology is user-centered, metric-driven, and structured into 5 cohesive phases:\n\n1. **Discover & Empathize**: Stakeholder alignment, competitive benchmarking, user interviews, and friction mapping.\n2. **Define & Strategize**: Information architecture, task flows, persona journey maps, and success metrics.\n3. **Design & Systematize**: Pixel-perfect high-fidelity Figma components with atomic variables & auto-layout.\n4. **Prototype & Validate**: Micro-interaction modeling in ProtoPie/Framer, followed by unmoderated usability testing in Maze.\n5. **Developer Handoff & QA**: Providing tokenized specs, component state tables, and conducting Design QA alongside frontend engineers.";
    }

    // Default intelligent response
    return isVoiceMode
      ? `As Arun's Virtual Twin, I specialize in enterprise FinTech, ERP, and CRM product design, scalable Figma design systems, and rapid prototyping. What would you like to explore about my experience or case studies?`
      : `As Arun's Virtual Twin, I specialize in transforming complex business workflows into high-converting, intuitive digital experiences.\n\nI can walk you through:\n• 🚀 **Key Case Studies & Metrics** (MAP-MAN, GYM-POS, ShopFlow)\n• 🎨 **Nexus Design System & Token Architecture**\n• ⚙️ **Developer Collaboration & Angular/CSS Handoff**\n• 💼 **Full-Time Availability & Notice Period**\n\nWhat would you like to explore?`;
  }

  private addToHistory(role: 'user' | 'model', text: string): void {
    this.conversationHistory.push({ role, text });
    if (this.conversationHistory.length > 20) {
      this.conversationHistory.shift();
    }
  }
}
