import { Injectable, signal, computed } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc, 
  Firestore 
} from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../config/firebase.config';
import { ContactMessage } from '../models/portfolio.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private firestore: Firestore | null = null;

  // Reactive state for Admin Inbox
  public messages = signal<ContactMessage[]>([]);
  public unreadCount = computed(() => this.messages().filter(m => !m.read).length);

  constructor() {
    try {
      const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();
      this.firestore = getFirestore(app);
      this.initMessagesListener();
    } catch (err) {
      console.warn('MessageService Firestore init note:', err);
    }
  }

  // --- Real-time Messages Listener for Admin ---
  private initMessagesListener(): void {
    if (!this.firestore) return;

    try {
      const messagesColRef = collection(this.firestore, 'contact_messages');
      const q = query(messagesColRef, orderBy('createdAt', 'desc'));
      
      onSnapshot(q, (snapshot) => {
        const list: ContactMessage[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            name: d['name'] || 'Anonymous',
            email: d['email'] || '',
            subject: d['subject'] || 'General Inquiry',
            message: d['message'] || '',
            createdAt: d['createdAt'] || new Date().toISOString(),
            read: !!d['read']
          });
        });
        this.messages.set(list);
      }, (err) => {
        console.warn('Messages listener note:', err);
      });
    } catch (e) {
      console.warn('Message listener error:', e);
    }
  }

  // --- Send Message from Public Site ---
  public async sendMessage(payload: { name: string; email: string; subject: string; message: string }): Promise<{ success: boolean; message?: string }> {
    const trimmedPayload = {
      name: payload.name.trim(),
      email: payload.email.trim(),
      subject: payload.subject.trim() || 'New Portfolio Contact Message',
      message: payload.message.trim(),
      createdAt: new Date().toISOString(),
      read: false
    };

    let firestoreSaved = false;

    // 1. Write to Cloud Firestore (Admin Inbox)
    if (this.firestore) {
      try {
        const messagesColRef = collection(this.firestore, 'contact_messages');
        await addDoc(messagesColRef, trimmedPayload);
        firestoreSaved = true;
      } catch (err) {
        console.warn('Failed to save message to Firestore:', err);
      }
    }

    // 2. Dispatch Email Notification directly to arunram1324@gmail.com
    try {
      // Using Web3Forms public contact API endpoint with recipient set to arunram1324@gmail.com
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: '5eb497fa-4b82-4113-94c6-8c5efb70ce66', // Web3Forms Access Key for Arun's email
          from_name: `${trimmedPayload.name} (Portfolio Inquiry)`,
          subject: `[Portfolio Inquiry] ${trimmedPayload.subject} from ${trimmedPayload.name}`,
          email: trimmedPayload.email,
          message: `Sender Name: ${trimmedPayload.name}\nSender Email: ${trimmedPayload.email}\nSubject: ${trimmedPayload.subject}\n\nMessage:\n${trimmedPayload.message}\n\n---\nSent from Arun K R Portfolio Web App`,
          to_email: 'arunram1324@gmail.com'
        })
      }).catch(e => console.warn('Email dispatch note:', e));
    } catch (e) {
      console.warn('Email notification note:', e);
    }

    return { success: true };
  }

  // --- Admin Message Management ---
  public async markAsRead(id: string, read: boolean = true): Promise<void> {
    if (!this.firestore) return;
    try {
      const docRef = doc(this.firestore, 'contact_messages', id);
      await updateDoc(docRef, { read });
    } catch (err) {
      console.warn('Failed to update message status:', err);
    }
  }

  public async deleteMessage(id: string): Promise<void> {
    if (!this.firestore) return;
    try {
      const docRef = doc(this.firestore, 'contact_messages', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Failed to delete message:', err);
    }
  }
}
