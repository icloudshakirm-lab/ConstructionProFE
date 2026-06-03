import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem, PrimeTemplate } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { DEMO_TODOS, TODO_PRIORITIES, TodoItem, TodoPriority } from './todo.data';

@Component({
  selector: 'app-todo',
  imports: [
    FormsModule,
    PrimeTemplate,
    Breadcrumb,
    Button,
    Checkbox,
    Dialog,
    InputText,
    Select,
    Tag
  ],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.scss'
})
export class TodoComponent {
  readonly breadcrumbs: MenuItem[] = [
    { label: 'Home', routerLink: '/dashboard' },
    { label: 'Collaboration', routerLink: '/collaboration' },
    { label: 'To-Do' }
  ];

  readonly todos = signal<TodoItem[]>(structuredClone(DEMO_TODOS));
  readonly filter = signal<'all' | 'open' | 'done'>('all');
  readonly dialogVisible = signal(false);
  readonly priorityOptions = TODO_PRIORITIES;
  readonly draft = signal({
    title: '',
    project: 'Tower Block A',
    assignee: 'Site Engineer',
    dueDate: '',
    priority: 'Medium' as TodoPriority
  });

  readonly filteredTodos = computed(() => {
    const f = this.filter();
    return this.todos().filter((t) => {
      if (f === 'open') return !t.completed;
      if (f === 'done') return t.completed;
      return true;
    });
  });

  readonly openCount = computed(() => this.todos().filter((t) => !t.completed).length);

  openAdd(): void {
    this.draft.set({
      title: '',
      project: 'Tower Block A',
      assignee: 'Site Engineer',
      dueDate: '',
      priority: 'Medium'
    });
    this.dialogVisible.set(true);
  }

  saveTodo(): void {
    const d = this.draft();
    if (!d.title.trim()) return;

    const item: TodoItem = {
      id: `todo-${Date.now()}`,
      title: d.title.trim(),
      project: d.project.trim(),
      assignee: d.assignee.trim(),
      dueDate: d.dueDate || new Date().toISOString().slice(0, 10),
      priority: d.priority,
      completed: false
    };

    this.todos.update((list) => [item, ...list]);
    this.dialogVisible.set(false);
  }

  setComplete(item: TodoItem, completed: boolean): void {
    this.todos.update((list) =>
      list.map((t) => (t.id === item.id ? { ...t, completed } : t))
    );
  }

  prioritySeverity(priority: TodoPriority): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (priority) {
      case 'High':
        return 'danger';
      case 'Medium':
        return 'warn';
      default:
        return 'info';
    }
  }
}
