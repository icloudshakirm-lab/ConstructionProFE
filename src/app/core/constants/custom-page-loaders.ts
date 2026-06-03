import { Type } from '@angular/core';
import { FeaturePageComponent } from '../models/feature-page.model';

type PageLoader = () => Promise<Type<unknown>>;

export const CUSTOM_PAGE_LOADERS: Record<FeaturePageComponent, PageLoader> = {
  'gantt-chart': () =>
    import('../../features/project-management/gantt-chart/gantt-chart.component').then(
      (m) => m.GanttChartComponent
    ),
  'projects-sites-org-chart': () =>
    import('../../features/project-management/projects-sites-org-chart/projects-sites-org-chart.component').then(
      (m) => m.ProjectsSitesOrgChartComponent
    ),
  'project-overview': () =>
    import('../../features/project-management/project-overview/project-overview.component').then(
      (m) => m.ProjectOverviewComponent
    ),
  'drawing-viewer': () =>
    import('../../features/document-management/drawing-viewer/drawing-viewer.component').then(
      (m) => m.DrawingViewerComponent
    ),
  notes: () =>
    import('../../features/collaboration/notes/notes.component').then((m) => m.NotesComponent),
  todo: () =>
    import('../../features/collaboration/todo/todo.component').then((m) => m.TodoComponent),
  'milestones-page': () =>
    import('../../features/collaboration/milestones/milestones.component').then(
      (m) => m.MilestonesPageComponent
    ),
  messages: () =>
    import('../../features/collaboration/messages/messages.component').then(
      (m) => m.MessagesComponent
    )
};
