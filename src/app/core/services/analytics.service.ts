import { Injectable, signal } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  increment, 
  Firestore 
} from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../config/firebase.config';
import { VisitorAnalytics, VisitorLogItem } from '../models/portfolio.model';

const DEFAULT_ANALYTICS: VisitorAnalytics = {
  totalViews: 0,
  uniqueVisitors: 0,
  devices: {
    mobile: 0,
    desktop: 0,
    tablet: 0
  },
  pageViews: {
    intro: 0,
    vt: 0,
    exp: 0,
    proj: 0,
    tools: 0,
    skills: 0,
    contact: 0
  }
};

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private firestore: Firestore | null = null;
  
  // Reactive signals for Admin Dashboard
  public stats = signal<VisitorAnalytics>(DEFAULT_ANALYTICS);
  public recentVisitors = signal<VisitorLogItem[]>([]);

  constructor() {
    try {
      const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();
      this.firestore = getFirestore(app);
      this.initAnalyticsListeners();
    } catch (err) {
      console.warn('Analytics Firestore init note:', err);
    }
  }

  // --- Real-time Listeners for Admin Dashboard ---
  private initAnalyticsListeners(): void {
    if (!this.firestore) return;

    try {
      // 1. Listen to aggregate stats
      const statsDocRef = doc(this.firestore, 'portfolio_analytics', 'stats');
      onSnapshot(statsDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          this.stats.set({
            totalViews: data['totalViews'] || 0,
            uniqueVisitors: data['uniqueVisitors'] || 0,
            devices: {
              mobile: data['devices']?.mobile || 0,
              desktop: data['devices']?.desktop || 0,
              tablet: data['devices']?.tablet || 0
            },
            pageViews: {
              intro: data['pageViews']?.intro || 0,
              vt: data['pageViews']?.vt || 0,
              exp: data['pageViews']?.exp || 0,
              proj: data['pageViews']?.proj || 0,
              tools: data['pageViews']?.tools || 0,
              skills: data['pageViews']?.skills || 0,
              contact: data['pageViews']?.contact || 0
            }
          });
        }
      }, (err) => {
        console.warn('Analytics stats listener note:', err);
      });

      // 2. Listen to recent visitor activity log (Last 25)
      const visitorsColRef = collection(this.firestore, 'portfolio_analytics_visitors');
      const q = query(visitorsColRef, orderBy('timestamp', 'desc'), limit(25));
      onSnapshot(q, (snapshot) => {
        const list: VisitorLogItem[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            timestamp: d['timestamp'] || new Date().toISOString(),
            page: d['page'] || 'intro',
            device: d['device'] || 'Desktop',
            referrer: d['referrer'] || 'Direct',
            city: d['city'] || '',
            region: d['region'] || '',
            country: d['country'] || '',
            countryCode: d['countryCode'] || '',
            flag: d['flag'] || '🌐',
            location: d['location'] || (d['city'] && d['country'] ? `${d['city']}, ${d['country']}` : 'Global')
          });
        });
        this.recentVisitors.set(list);
      }, (err) => {
        console.warn('Analytics visitors listener note:', err);
      });

    } catch (e) {
      console.warn('Analytics setup error:', e);
    }
  }

  // --- Cached Location Resolution ---
  private cachedLocation: {
    city: string;
    region: string;
    country: string;
    countryCode: string;
    flag: string;
    locationText: string;
  } | null = null;

  private async resolveVisitorLocation(): Promise<{
    city: string;
    region: string;
    country: string;
    countryCode: string;
    flag: string;
    locationText: string;
  }> {
    if (this.cachedLocation) return this.cachedLocation;

    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('ak_visitor_geo');
      if (stored) {
        try {
          this.cachedLocation = JSON.parse(stored);
          return this.cachedLocation!;
        } catch {}
      }
    }

    try {
      const res = await fetch('https://ipwho.is/', {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const loc = {
            city: data.city || '',
            region: data.region || '',
            country: data.country || 'Global',
            countryCode: data.country_code || '',
            flag: data.flag?.emoji || '🌐',
            locationText: [data.city, data.country].filter(Boolean).join(', ') || 'Global'
          };
          this.cachedLocation = loc;
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('ak_visitor_geo', JSON.stringify(loc));
          }
          return loc;
        }
      }
    } catch (e) {
      // Fallback below
    }

    // Fallback using timezone if geolocation fails or is blocked
    let fallbackCountry = 'India';
    let fallbackFlag = '🇮🇳';
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz.includes('Kolkata') && !tz.includes('Calcutta') && !tz.includes('India') && !tz.includes('Asia/Colombo')) {
        fallbackCountry = 'Global';
        fallbackFlag = '🌐';
      }
    } catch {}

    const defaultLoc = {
      city: '',
      region: '',
      country: fallbackCountry,
      countryCode: fallbackCountry === 'India' ? 'IN' : '',
      flag: fallbackFlag,
      locationText: fallbackCountry
    };
    return defaultLoc;
  }

  // --- Track Page Views and Visitor Sessions ---
  public async trackPageView(page: string): Promise<void> {
    if (!this.firestore) return;

    try {
      const device = this.detectDevice();
      const isNewSession = typeof window !== 'undefined' && !sessionStorage.getItem('ak_analytics_session_active');

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('ak_analytics_session_active', 'true');
      }

      const statsDocRef = doc(this.firestore, 'portfolio_analytics', 'stats');

      // Update aggregations with atomic increments
      const updatePayload: any = {
        totalViews: increment(1),
        [`devices.${device.toLowerCase()}`]: increment(1),
        [`pageViews.${page}`]: increment(1),
        lastActive: new Date().toISOString()
      };

      if (isNewSession) {
        updatePayload.uniqueVisitors = increment(1);
      }

      setDoc(statsDocRef, updatePayload, { merge: true }).catch((e) => {
        console.warn('Failed to record page view:', e);
      });

      // Resolve visitor exact location
      const geo = await this.resolveVisitorLocation();

      // Record detailed log entry in visitors collection with location
      const visitorsColRef = collection(this.firestore, 'portfolio_analytics_visitors');
      addDoc(visitorsColRef, {
        timestamp: new Date().toISOString(),
        page: page,
        device: device,
        referrer: typeof document !== 'undefined' && document.referrer ? document.referrer : 'Direct Visit',
        isNewSession: isNewSession,
        city: geo.city,
        region: geo.region,
        country: geo.country,
        countryCode: geo.countryCode,
        flag: geo.flag,
        location: geo.locationText
      }).catch(() => {});

    } catch (err) {
      console.warn('Track page view error:', err);
    }
  }

  // --- Notify Arun via Email when Visitor Enters Portfolio ---
  public async notifyVisitorEntered(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Send 1 email alert per visitor session to keep Arun's inbox clean
    if (sessionStorage.getItem('ak_visitor_enter_notified')) return;
    sessionStorage.setItem('ak_visitor_enter_notified', 'true');

    try {
      const device = this.detectDevice();
      const geo = await this.resolveVisitorLocation();
      const referrer = typeof document !== 'undefined' && document.referrer ? document.referrer : 'Direct Visit';
      const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }) + ' IST';

      await fetch('https://formsubmit.co/ajax/arunram1324@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `🚀 [Live Alert] A visitor from ${geo.city ? geo.city + ', ' + geo.country : geo.country} just entered your Portfolio!`,
          'Event Notification': 'A visitor clicked "Start / Explore Portfolio" on your Landing Page',
          '📍 Visitor Location': `${geo.flag} ${geo.locationText}`,
          '📱 Device Used': device,
          '🌐 Traffic Source': referrer,
          '⏰ Timestamp': timeStr,
          '💡 Status': 'User is actively browsing your portfolio right now',
          _template: 'box'
        })
      }).catch(e => console.warn('Visitor entry notification note:', e));
    } catch (err) {
      console.warn('Visitor entry alert error:', err);
    }
  }

  private detectDevice(): 'Mobile' | 'Desktop' | 'Tablet' {
    if (typeof window === 'undefined') return 'Desktop';
    const width = window.innerWidth;
    if (width <= 767) return 'Mobile';
    if (width <= 1024) return 'Tablet';
    return 'Desktop';
  }
}
