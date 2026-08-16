export type NavPage = 'vt' | 'intro' | 'exp' | 'proj' | 'tools' | 'skills' | 'contact';

export type PortfolioTemplateMode = 'bento' | 'marttin';

export interface SectionVisibilitySettings {
  showHero: boolean;
  showVirtualTwin: boolean;
  showProjects: boolean;
  showExperience: boolean;
  showSkillsTools: boolean;
  showContact: boolean;
}

export interface NavItem {
  id: NavPage;
  label: string;
  shortLabel: string;
  tooltip: string;
  icon: string;
}

export interface WorkExperience {
  period: string;
  company: string;
  role: string;
  description: string;
  highlights?: string[];
  current?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  image?: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  metrics?: string;
  link?: string;
}

export interface ToolItem {
  id: string;
  name: string;
  type: string;
  category?: 'design' | 'dev' | 'research' | '3d';
  logoUrl?: string;
}

export interface SkillItem {
  name: string;
  icon: string;
}

export interface SkillCategory {
  id: string;
  categoryName: string;
  icon: string;
  description: string;
  skills: string[];
}

export interface ContactLink {
  icon: string;
  label: string;
  value?: string;
  href: string;
  action?: 'copy' | 'link';
}

export interface ContactInfo {
  subtitle: string;
  availabilityTitle: string;
  availabilitySubtitle: string;
  isAvailable: boolean;
}

export interface TypographySettings {
  headingFont: string;
  bodyFont: string;
  headingWeight: string;
  headingLetterSpacing: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface VoiceQAItem {
  id: string;
  keywords: string; // comma-separated trigger words
  questionLabel: string;
  voiceAnswer: string;
  textAnswer: string;
  category?: 'general' | 'experience' | 'case-study' | 'hiring' | 'process';
}

export interface ProfileInfo {
  name: string;
  role: string;
  headline: string;
  bio: string;
  photoUrl: string;
  industries: string[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface VisitorLogItem {
  id: string;
  timestamp: string;
  page: string;
  device: 'Mobile' | 'Desktop' | 'Tablet';
  referrer: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  flag?: string;
  location?: string;
}

export interface VisitorAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  devices: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  pageViews: {
    intro: number;
    vt: number;
    exp: number;
    proj: number;
    tools: number;
    skills: number;
    contact: number;
  };
}

export interface AutoReplySettings {
  enabled: boolean;
  subjectTemplate: string;
  bodyTemplate: string;
}
