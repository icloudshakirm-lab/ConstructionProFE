import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem, PrimeTemplate } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { DEMO_NOTES, ProjectNote } from './notes.data';

@Component({
  selector: 'app-notes',
  imports: [
    FormsModule,
    PrimeTemplate,
    Breadcrumb,
    Button,
    Dialog,
    InputText,
    Tag,
    Textarea
  ],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.scss'
})
export class NotesComponent {
  readonly breadcrumbs: MenuItem[] = [
    { label: 'Home', routerLink: '/dashboard' },
    { label: 'Collaboration', routerLink: '/collaboration' },
    { label: 'Notes' }
  ];

  readonly notes = signal<ProjectNote[]>(structuredClone(DEMO_NOTES));
  readonly search = signal('');
  readonly dialogVisible = signal(false);
  readonly draft = signal({ title: '', body: '', project: 'Tower Block A' });

  readonly filteredNotes = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = [...this.notes()].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    if (!q) return list;
    return list.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.project.toLowerCase().includes(q)
    );
  });

  openAdd(): void {
    this.draft.set({ title: '', body: '', project: 'Tower Block A' });
    this.dialogVisible.set(true);
  }

  saveNote(): void {
    const d = this.draft();
    if (!d.title.trim()) return;

    const note: ProjectNote = {
      id: `note-${Date.now()}`,
      title: d.title.trim(),
      body: d.body.trim(),
      project: d.project.trim() || 'General',
      author: 'You',
      updatedAt: new Date().toISOString(),
      pinned: false
    };

    this.notes.update((list) => [note, ...list]);
    this.dialogVisible.set(false);
  }

  togglePin(note: ProjectNote): void {
    this.notes.update((list) =>
      list.map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n))
    );
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }
}
