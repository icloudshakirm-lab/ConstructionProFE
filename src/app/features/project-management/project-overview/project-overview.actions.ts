import { MenuItem } from 'primeng/api';
import { StakeholderEntity } from './project-overview.data';

export type ContextScope = 'project' | 'entity';

export interface EntityContext {
  scope: 'entity';
  groupId: string;
  entity: StakeholderEntity;
  parentEntityId?: string;
}

export interface ProjectContext {
  scope: 'project';
}

export type OverviewContextTarget = EntityContext | ProjectContext;

export function buildContextMenuItems(
  target: OverviewContextTarget,
  handlers: {
    onEdit: () => void;
    onView: () => void;
    onDuplicate?: () => void;
    onRemove?: () => void;
    onAddSub?: () => void;
    onAssign?: () => void;
    onDocuments?: () => void;
    onRegenerate?: () => void;
    onOpenSites?: () => void;
  }
): MenuItem[] {
  if (target.scope === 'project') {
    return [
      { label: 'Edit project', icon: 'pi pi-pencil', command: handlers.onEdit },
      { label: 'Open Sites chart', icon: 'pi pi-sitemap', command: handlers.onOpenSites },
      { separator: true },
      {
        label: 'Regenerate stakeholders',
        icon: 'pi pi-refresh',
        command: handlers.onRegenerate
      },
      { label: 'View details', icon: 'pi pi-eye', command: handlers.onView }
    ];
  }

  const isContractor = target.entity.kind === 'contractor';
  const isSub = target.entity.kind === 'subcontractor';

  const items: MenuItem[] = [
    { label: 'Edit', icon: 'pi pi-pencil', command: handlers.onEdit },
    { label: 'View details', icon: 'pi pi-eye', command: handlers.onView }
  ];

  if (!isSub && handlers.onDuplicate) {
    items.push({ label: 'Duplicate', icon: 'pi pi-copy', command: handlers.onDuplicate });
  }

  if (isContractor && handlers.onAddSub) {
    items.push({ label: 'Add sub-contractor', icon: 'pi pi-plus', command: handlers.onAddSub });
  }

  if (handlers.onRemove) {
    items.push({ separator: true });
    items.push({
      label: 'Remove from chart',
      icon: 'pi pi-trash',
      command: handlers.onRemove,
      styleClass: 'overview-menu-item--danger'
    });
  }

  if (handlers.onAssign || handlers.onDocuments) {
    items.push({ separator: true });
    if (handlers.onAssign) {
      items.push({ label: 'Assign contact', icon: 'pi pi-user-plus', command: handlers.onAssign });
    }
    if (handlers.onDocuments) {
      items.push({ label: 'Documents', icon: 'pi pi-folder-open', command: handlers.onDocuments });
    }
  }

  return items;
}
