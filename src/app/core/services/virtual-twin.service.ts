import { Injectable, signal } from '@angular/core';
import { ChatMessage } from '../models/portfolio.model';
import { ToastService } from '../../shared/services/toast.service';
import { PortfolioDataService } from './portfolio-data.service';
import { AiTwinService } from './ai-twin.service';

@Injectable({
  providedIn: 'root'
})
export class VirtualTwinService {
  public messages = signal<ChatMessage[]>([]);
  public isTyping = signal<boolean>(false);
  public isStreaming = signal<boolean>(false);
  public streamingChunk = signal<string>('');

  constructor(
    private toastService: ToastService,
    private portfolioData: PortfolioDataService,
    public aiTwin: AiTwinService
  ) {}

  /**
   * Real-time Generative Voice AI response generator
   */
  public async getVoiceAnswerAsync(query: string): Promise<string> {
    return await this.aiTwin.generateAiResponse(query, true);
  }

  /**
   * Synchronous voice fallback (for instant prompts)
   */
  public getVoiceAnswer(query: string): string {
    const q = query.toLowerCase().trim();

    // Check custom CMS Voice Q&As
    const customItems = this.portfolioData.voiceKnowledge();
    for (const item of customItems) {
      const kws = item.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      if (kws.some(kw => q.includes(kw)) && item.voiceAnswer) {
        return item.voiceAnswer;
      }
    }

    if (/vanakkam|mapla|tamil|epdi|nalla/.test(q)) {
      return "Vanakkam mapla! Naan Arun oda Virtual Twin AI. Ennoda UI UX design projects, process, illana hiring pathi neenga enkitta direct-ah kekalam!";
    }

    if (/contact|email|reach|hire|call|interview/.test(q)) {
      return "I would love to connect! You can reach me via email at arunram1324 at gmail dot com or on LinkedIn at linkedin dot com slash in slash arunkr.";
    }

    return "I am Arun's Virtual Twin AI. I can walk you through my design process, case study metrics, developer handoffs, or my availability for your team. What would you like to explore?";
  }

  /**
   * Real-time Generative AI text chat with live streaming tokens
   */
  public async sendMessage(userText: string): Promise<void> {
    if (!userText.trim() || this.isStreaming() || this.isTyping()) return;

    const time = this.formatTime();
    const userMsg: ChatMessage = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: userText.trim(),
      timestamp: time
    };

    this.messages.update(prev => [...prev, userMsg]);
    this.isTyping.set(true);

    try {
      // 1. Generate real generative AI response
      const answer = await this.aiTwin.generateAiResponse(userText.trim(), false);

      this.isTyping.set(false);
      this.isStreaming.set(true);

      // 2. Stream answer word-by-word with natural human pacing
      const words = answer.split(' ');
      let currentText = '';

      for (let i = 0; i < words.length; i += 2) {
        currentText += (i === 0 ? '' : ' ') + words.slice(i, i + 2).join(' ');
        this.streamingChunk.set(currentText);
        await new Promise(r => setTimeout(r, 18 + Math.random() * 14));
      }

      const aiMsg: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: answer,
        timestamp: this.formatTime()
      };

      this.messages.update(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat AI generation error:', err);
      this.messages.update(prev => [
        ...prev,
        {
          id: 'ai_' + Date.now(),
          sender: 'ai',
          text: "I specialize in enterprise FinTech, ERP, and CRM product design, scalable Figma design systems, and rapid prototyping. Let me know what you'd like to explore!",
          timestamp: this.formatTime()
        }
      ]);
    } finally {
      this.isTyping.set(false);
      this.isStreaming.set(false);
      this.streamingChunk.set('');
    }
  }

  public clearMessages(): void {
    this.messages.set([]);
    this.aiTwin.clearHistory();
  }

  private formatTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

