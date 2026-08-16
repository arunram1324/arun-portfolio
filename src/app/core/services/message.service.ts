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
  public async sendMessage(
    payload: { name: string; email: string; subject: string; message: string },
    autoReplyText?: string
  ): Promise<{ success: boolean; message?: string }> {
    const trimmedPayload = {
      name: payload.name.trim(),
      email: payload.email.trim(),
      subject: payload.subject.trim() || 'New Portfolio Contact Message',
      message: payload.message.trim(),
      createdAt: new Date().toISOString(),
      read: false
    };

    // 1. Write to Cloud Firestore (Admin Inbox)
    if (this.firestore) {
      try {
        const messagesColRef = collection(this.firestore, 'contact_messages');
        await addDoc(messagesColRef, trimmedPayload);
      } catch (err) {
        console.warn('Failed to save message to Firestore:', err);
      }
    }

    // 2. Dispatch Email directly to arunram1324@gmail.com + Trigger Instant Auto-Reply to sender
    const defaultAutoReply = `Hi ${trimmedPayload.name},\n\nThank you for reaching out through my portfolio regarding "${trimmedPayload.subject}".\n\nI have received your message and will review the details. You can expect to hear back from me within 24 hours.\n\nBest regards,\nArun K R\nLead Product Designer\nBangalore, India`;

    const autoResponseContent = autoReplyText || defaultAutoReply;

    try {
      await fetch('https://formsubmit.co/ajax/arunram1324@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: trimmedPayload.name,
          email: trimmedPayload.email,
          _replyto: trimmedPayload.email,
          _subject: `[Portfolio Inquiry] ${trimmedPayload.subject} from ${trimmedPayload.name}`,
          _autoresponse: autoResponseContent,
          _template: 'table',
          'Inquiry Type': trimmedPayload.subject,
          'Sender Details': `${trimmedPayload.name} <${trimmedPayload.email}>`,
          'Message Content': trimmedPayload.message
        })
      }).catch(e => console.warn('FormSubmit dispatch note:', e));
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
