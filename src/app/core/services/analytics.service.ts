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

      // 2. Listen to recent visitor activity log (Last 20)
      const visitorsColRef = collection(this.firestore, 'portfolio_analytics_visitors');
      const q = query(visitorsColRef, orderBy('timestamp', 'desc'), limit(20));
      onSnapshot(q, (snapshot) => {
        const list: VisitorLogItem[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            timestamp: d['timestamp'] || new Date().toISOString(),
            page: d['page'] || 'intro',
            device: d['device'] || 'Desktop',
            referrer: d['referrer'] || 'Direct'
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

  // --- Track Page Views and Visitor Sessions ---
  public trackPageView(page: string): void {
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

      // Record detailed log entry in visitors collection
      const visitorsColRef = collection(this.firestore, 'portfolio_analytics_visitors');
      addDoc(visitorsColRef, {
        timestamp: new Date().toISOString(),
        page: page,
        device: device,
        referrer: typeof document !== 'undefined' && document.referrer ? document.referrer : 'Direct Visit',
        isNewSession: isNewSession
      }).catch(() => {});

    } catch (err) {
      console.warn('Track page view error:', err);
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
