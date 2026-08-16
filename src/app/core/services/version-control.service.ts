import { Injectable, signal } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  Firestore 
} from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../config/firebase.config';
import { PortfolioVersionSnapshot } from '../models/portfolio.model';
import { PortfolioDataService } from './portfolio-data.service';
import { ToastService } from '../../shared/services/toast.service';

const STORAGE_KEY = 'ak_portfolio_version_snapshots';
const CURRENT_VERSION_TAG = 'v4.2.0';

const DEFAULT_MILESTONE_VERSIONS: PortfolioVersionSnapshot[] = [
  {
    id: 'v4-2-0-live',
    version: 'v4.2.0',
    title: 'Real-Time Geolocation Analytics & Smart Notification System',
    description: 'Added live visitor exact city/country tracking, Landing page enter email notifications, clean dropdown without emojis, conditional field hiding, and dynamic auto-reply thank-you templates.',
    createdAt: '2026-08-16T09:40:00.000Z',
    isLive: true,
    author: 'Arun K R',
    template: 'bento',
    highlights: [
      'Exact Visitor Geolocation (City, State, Country & Flag 🇮🇳 🇺🇸 🇬🇧)',
      'Instant Email Alert to arunram1324@gmail.com on Landing Page Start',
      'Contact Dropdown without emojis & auto-hide timeline on Networking',
      'Dual-channel FormSubmit delivery + dynamic Thank-You Auto-Reply to visitors'
    ]
  },
  {
    id: 'v4-1-0',
    version: 'v4.1.0',
    title: 'Typography Engine & Mobile 7-Column Navigation',
    description: 'Implemented multi-font typography sandbox with live preview, fixed mobile bottom navigation scrolling, restored Skills & Contact tabs, and removed all button shadows globally.',
    createdAt: '2026-08-15T18:30:00.000Z',
    isLive: false,
    author: 'Arun K R',
    template: 'bento',
    highlights: [
      'Dynamic Typography Sandbox (Inter, Plus Jakarta Sans, DM Sans, Outfit, Space Grotesk, Syne)',
      'Restored mobile bottom navigation 7-item grid',
      'Global flat button styling with zero shadow'
    ]
  },
  {
    id: 'v4-0-0',
    version: 'v4.0.0',
    title: 'Marttin Minimalist Template & Voice AI Virtual Twin',
    description: 'Introduced switchable portfolio templates, interactive Virtual Twin Voice AI, light/dark theme presets, and high-performance in-page video modals.',
    createdAt: '2026-08-15T08:00:00.000Z',
    isLive: false,
    author: 'Arun K R',
    template: 'marttin',
    highlights: [
      'Interactive Voice AI Virtual Twin with custom Q&A knowledge base',
      'Multi-template switch engine (Bento OS / Marttin Editorial)',
      'Light & Dark dynamic themes with curated color palettes'
    ]
  },
  {
    id: 'v3-5-0',
    version: 'v3.5.0',
    title: 'Firebase Cloud Firestore Integration & Admin CMS Portal',
    description: 'Initial cloud database architecture, real-time Firestore sync for projects, experiences, tools, and PIN-secured administrative dashboard.',
    createdAt: '2026-08-14T14:00:00.000Z',
    isLive: false,
    author: 'Arun K R',
    template: 'bento',
    highlights: [
      'Cloud Firestore real-time synchronization',
      'Pin-protected Admin CMS dashboard',
      'Comprehensive CRUD for Projects, Tools, and Experience'
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class VersionControlService {
  private firestore: Firestore | null = null;
  public currentVersion = signal<string>(CURRENT_VERSION_TAG);
  public snapshots = signal<PortfolioVersionSnapshot[]>([]);
  public isSyncing = signal<boolean>(false);

  constructor(
    private portfolioData: PortfolioDataService,
    private toastService: ToastService
  ) {
    try {
      const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();
      this.firestore = getFirestore(app);
      this.initSnapshotsListener();
    } catch (e) {
      console.warn('VersionControl Firestore init note:', e);
      this.loadLocalSnapshots();
    }
  }

  private loadLocalSnapshots(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.snapshots.set(JSON.parse(stored));
      } else {
        this.snapshots.set(DEFAULT_MILESTONE_VERSIONS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MILESTONE_VERSIONS));
      }
    } catch {
      this.snapshots.set(DEFAULT_MILESTONE_VERSIONS);
    }
  }

  private initSnapshotsListener(): void {
    if (!this.firestore) {
      this.loadLocalSnapshots();
      return;
    }

    try {
      const colRef = collection(this.firestore, 'portfolio_version_snapshots');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      
      onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          // Initialize defaults into Firestore
          this.seedInitialVersions();
          return;
        }

        const list: PortfolioVersionSnapshot[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as PortfolioVersionSnapshot;
          list.push({
            ...data,
            id: docSnap.id
          });
        });

        // Ensure current live version is marked
        const enriched = list.map(v => ({
          ...v,
          isLive: v.version === this.currentVersion()
        }));

        this.snapshots.set(enriched);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched));
      }, (err) => {
        console.warn('Snapshots Firestore listener note:', err);
        this.loadLocalSnapshots();
      });
    } catch (e) {
      this.loadLocalSnapshots();
    }
  }

  private async seedInitialVersions(): Promise<void> {
    if (!this.firestore) return;
    try {
      for (const item of DEFAULT_MILESTONE_VERSIONS) {
        const docRef = doc(this.firestore, 'portfolio_version_snapshots', item.id);
        const dataSnapshot = this.portfolioData.getFullDataSnapshot();
        await setDoc(docRef, { ...item, dataSnapshot }, { merge: true });
      }
    } catch (e) {
      console.warn('Failed to seed version snapshots:', e);
    }
  }

  // --- Create New Version Snapshot ---
  public async createSnapshot(
    versionTag: string,
    title: string,
    description: string,
    highlights: string[]
  ): Promise<boolean> {
    const cleanVersion = versionTag.trim().startsWith('v') ? versionTag.trim() : `v${versionTag.trim()}`;
    const newId = `ver-${Date.now()}-${cleanVersion.replace(/\./g, '-')}`;
    const dataSnapshot = this.portfolioData.getFullDataSnapshot();

    const newSnapshot: PortfolioVersionSnapshot = {
      id: newId,
      version: cleanVersion,
      title: title.trim() || `Portfolio Snapshot ${cleanVersion}`,
      description: description.trim() || 'Manual backup snapshot created via Admin Portal.',
      createdAt: new Date().toISOString(),
      isLive: true,
      author: 'Arun K R',
      template: this.portfolioData.activeTemplate(),
      highlights: highlights && highlights.length ? highlights : ['Full portfolio state & CMS data backup'],
      dataSnapshot: dataSnapshot
    };

    this.currentVersion.set(cleanVersion);

    // Save to Firestore
    if (this.firestore) {
      try {
        const docRef = doc(this.firestore, 'portfolio_version_snapshots', newId);
        await setDoc(docRef, newSnapshot);
      } catch (err) {
        console.warn('Firestore snapshot save error:', err);
      }
    }

    // Save locally
    const currentList = [newSnapshot, ...this.snapshots().filter(s => s.id !== newId)];
    this.snapshots.set(currentList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));

    this.toastService.show(`Snapshot ${cleanVersion} created successfully!`);
    return true;
  }

  // --- Restore / Rollback to a Version Snapshot ---
  public async restoreSnapshot(snapshot: PortfolioVersionSnapshot): Promise<boolean> {
    if (!snapshot) return false;

    this.isSyncing.set(true);
    try {
      if (snapshot.dataSnapshot) {
        this.portfolioData.restoreFullDataSnapshot(snapshot.dataSnapshot);
      }

      this.currentVersion.set(snapshot.version);

      // Update isLive flag in list
      const updated = this.snapshots().map(s => ({
        ...s,
        isLive: s.id === snapshot.id
      }));
      this.snapshots.set(updated);

      this.toastService.show(`Restored & rolled back to ${snapshot.version}: "${snapshot.title}"!`);
      return true;
    } catch (err) {
      this.toastService.show('Failed to restore snapshot. Please try again.');
      return false;
    } finally {
      this.isSyncing.set(false);
    }
  }

  // --- Delete Snapshot ---
  public async deleteSnapshot(id: string): Promise<void> {
    if (this.firestore) {
      try {
        const docRef = doc(this.firestore, 'portfolio_version_snapshots', id);
        await deleteDoc(docRef);
      } catch (e) {}
    }

    const updated = this.snapshots().filter(s => s.id !== id);
    this.snapshots.set(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    this.toastService.show('Version snapshot deleted.');
  }

  // --- Export Portfolio as JSON ---
  public exportBackupJson(): void {
    try {
      const data = {
        version: this.currentVersion(),
        exportDate: new Date().toISOString(),
        author: 'Arun K R',
        content: this.portfolioData.getFullDataSnapshot(),
        allSnapshots: this.snapshots()
      };

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arun-portfolio-backup-${this.currentVersion()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.toastService.show('Portfolio backup JSON downloaded successfully!');
    } catch (e) {
      this.toastService.show('Failed to export backup JSON.');
    }
  }

  // --- Import Portfolio from JSON ---
  public importBackupJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && (parsed.content || parsed.dataSnapshot)) {
        const data = parsed.content || parsed.dataSnapshot;
        this.portfolioData.restoreFullDataSnapshot(data);
        if (parsed.version) {
          this.currentVersion.set(parsed.version);
        }
        this.toastService.show('Backup JSON imported and restored successfully!');
        return true;
      }
      this.toastService.show('Invalid portfolio backup JSON format.');
      return false;
    } catch (e) {
      this.toastService.show('Failed to parse backup JSON.');
      return false;
    }
  }
}
