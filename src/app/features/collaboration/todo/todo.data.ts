export type TodoPriority = 'Low' | 'Medium' | 'High';

export interface TodoItem {
  id: string;
  title: string;
  project: string;
  assignee: string;
  dueDate: string;
  priority: TodoPriority;
  completed: boolean;
}

export const DEMO_TODOS: TodoItem[] = [
  {
    id: 'todo-1',
    title: 'Submit weekly progress photos — Zone 3',
    project: 'Tower Block A',
    assignee: 'Site Engineer',
    dueDate: '2026-06-05',
    priority: 'High',
    completed: false
  },
  {
    id: 'todo-2',
    title: 'Confirm steel delivery GRN against PO-4421',
    project: 'Warehouse Expansion',
    assignee: 'Store Keeper',
    dueDate: '2026-06-04',
    priority: 'Medium',
    completed: false
  },
  {
    id: 'todo-3',
    title: 'Issue revised drainage shop drawing to subcontractor',
    project: 'Roadworks Package C',
    assignee: 'Document Controller',
    dueDate: '2026-06-02',
    priority: 'High',
    completed: true
  },
  {
    id: 'todo-4',
    title: 'Book ICU medical gas inspection slot',
    project: 'Central Hospital Wing B',
    assignee: 'MEP Coordinator',
    dueDate: '2026-06-10',
    priority: 'Low',
    completed: false
  }
];

export const TODO_PRIORITIES: { label: string; value: TodoPriority }[] = [
  { label: 'Low', value: 'Low' },
  { label: 'Medium', value: 'Medium' },
  { label: 'High', value: 'High' }
];
