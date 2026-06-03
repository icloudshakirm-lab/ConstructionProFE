import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem, PrimeTemplate } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { CommMessage, DEMO_MESSAGES, MessageChannel } from './messages.data';

@Component({
  selector: 'app-messages',
  imports: [
    FormsModule,
    PrimeTemplate,
    Breadcrumb,
    Button,
    Card,
    Dialog,
    InputText,
    Select,
    Tag,
    Textarea
  ],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent {
  readonly breadcrumbs: MenuItem[] = [
    { label: 'Home', routerLink: '/dashboard' },
    { label: 'Collaboration', routerLink: '/collaboration' },
    { label: 'Messages' }
  ];

  readonly messages = signal<CommMessage[]>(structuredClone(DEMO_MESSAGES));
  readonly selectedId = signal<string | null>(DEMO_MESSAGES[0]?.id ?? null);
  readonly composeVisible = signal(false);
  readonly channelOptions: { label: string; value: MessageChannel }[] = [
    { label: 'In-App', value: 'In-App' },
    { label: 'Email', value: 'Email' },
    { label: 'SMS', value: 'SMS' },
    { label: 'WhatsApp', value: 'WhatsApp' }
  ];
  readonly draft = signal({
    subject: '',
    body: '',
    to: '',
    project: 'Tower Block A',
    channel: 'In-App' as MessageChannel
  });

  readonly selected = computed(() => {
    const id = this.selectedId();
    return this.messages().find((m) => m.id === id) ?? null;
  });

  readonly unreadCount = computed(() => this.messages().filter((m) => !m.read).length);

  selectMessage(msg: CommMessage): void {
    this.selectedId.set(msg.id);
    if (!msg.read) {
      this.messages.update((list) =>
        list.map((m) => (m.id === msg.id ? { ...m, read: true } : m))
      );
    }
  }

  openCompose(): void {
    this.draft.set({
      subject: '',
      body: '',
      to: '',
      project: 'Tower Block A',
      channel: 'In-App'
    });
    this.composeVisible.set(true);
  }

  sendMessage(): void {
    const d = this.draft();
    if (!d.subject.trim() || !d.body.trim()) return;

    const msg: CommMessage = {
      id: `msg-${Date.now()}`,
      subject: d.subject.trim(),
      preview: d.body.trim().slice(0, 80) + (d.body.length > 80 ? '…' : ''),
      body: d.body.trim(),
      from: 'You',
      to: d.to.trim() || 'Team',
      project: d.project.trim(),
      channel: d.channel,
      sentAt: new Date().toISOString(),
      read: true
    };

    this.messages.update((list) => [msg, ...list]);
    this.selectedId.set(msg.id);
    this.composeVisible.set(false);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }
}
