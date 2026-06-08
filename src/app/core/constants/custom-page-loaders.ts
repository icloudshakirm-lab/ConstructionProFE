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
    ),
  'boq-creation': () =>
    import('../../features/boq-billing/boq-creation/boq-creation.component').then(
      (m) => m.BoqCreationComponent
    ),
  'boq-revisions': () =>
    import('../../features/boq-billing/boq-revisions/boq-revisions.component').then(
      (m) => m.BoqRevisionsComponent
    ),
  'qa-qc-inspections': () =>
    import('../../features/project-management/qa-qc-inspections/qa-qc-inspections.component').then(
      (m) => m.QaQcInspectionsComponent
    ),
  'sites-map': () =>
    import('../../features/project-management/sites-map/sites-map.component').then(
      (m) => m.SitesMapComponent
    ),
  'project-gis-planner': () =>
    import('../../features/project-management/project-gis-planner/project-gis-planner.component').then(
      (m) => m.ProjectGisPlannerComponent
    ),
  'site-status-gis': () =>
    import('../../features/project-management/site-status-gis/site-status-gis.component').then(
      (m) => m.SiteStatusGisComponent
    ),
  'project-wbs': () =>
    import('../../features/project-management/project-wbs/project-wbs.component').then(
      (m) => m.ProjectWbsComponent
    ),
  'gps-tracking': () =>
    import('../../features/site-mobile/gps-tracking/gps-tracking.component').then(
      (m) => m.GpsTrackingComponent
    ),
  'vehicle-tracking': () =>
    import('../../features/site-mobile/vehicle-tracking/vehicle-tracking.component').then(
      (m) => m.VehicleTrackingComponent
    ),
  'projects-register': () =>
    import('../../features/project-management/projects-register/projects-register.component').then(
      (m) => m.ProjectsRegisterComponent
    ),
  'sites-management': () =>
    import('../../features/project-management/sites-management/sites-management.component').then(
      (m) => m.SitesManagementComponent
    ),
  'approval-workflows': () =>
    import('../../features/document-management/approval-workflows/approval-workflows.component').then(
      (m) => m.ApprovalWorkflowsComponent
    ),
  'employee-records': () =>
    import('../../features/hr-payroll/employee-records/employee-records.component').then(
      (m) => m.EmployeeRecordsComponent
    ),
  'hr-attendance': () =>
    import('../../features/hr-payroll/hr-attendance/hr-attendance.component').then(
      (m) => m.HrAttendanceComponent
    ),
  payroll: () =>
    import('../../features/hr-payroll/payroll/payroll.component').then((m) => m.PayrollComponent)
};
