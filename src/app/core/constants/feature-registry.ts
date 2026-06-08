import { FeatureModule } from '../models/feature-page.model';

export const FEATURE_MODULES: FeatureModule[] = [
  {
    id: 'project-management',
    title: 'Project Management',
    description: 'Projects, sites, tasks, milestones, and daily site operations.',
    icon: 'pi pi-building',
    routePath: 'projects',
    pages: [
      {
        id: 'projects',
        title: 'Projects',
        description: 'Master project register with contract value, timeline, and client details.',
        icon: 'pi pi-briefcase',
        highlights: ['Project charter', 'Contract summary', 'Status dashboard'],
        component: 'projects-register'
      },
      {
        id: 'sites',
        title: 'Sites',
        description: 'Physical job sites linked to projects with location and superintendent assignment.',
        icon: 'pi pi-map-marker',
        highlights: ['Site hierarchy', 'Geofence zones', 'Site contacts'],
        component: 'sites-management'
      },
      {
        id: 'sites-map',
        title: 'Construction Sites Map',
        description: 'Interactive map of all construction sites using open-source Leaflet and OpenStreetMap.',
        icon: 'pi pi-map',
        highlights: ['Leaflet map', 'Site markers', 'Project filter'],
        component: 'sites-map'
      },
      {
        id: 'project-gis-planner',
        title: 'Project GIS Planner',
        description:
          'Leaflet map to draw, edit, and export project geometries (point, line, polygon) with GeoJSON export.',
        icon: 'pi pi-pencil',
        highlights: ['Leaflet draw', 'Draw & edit', 'GeoJSON export'],
        component: 'project-gis-planner'
      },
      {
        id: 'site-status-gis',
        title: 'Site Status by GIS',
        description:
          'Seoul OSM roads preloaded as progress layers — excavation, backfill, compaction, pipe welding/laying, concrete, asphalt, and more.',
        icon: 'pi pi-chart-bar',
        highlights: ['Seoul roads GeoJSON', '12 progress layers', 'Layer toggles'],
        component: 'site-status-gis'
      },
      {
        id: 'tasks',
        title: 'Work Breakdown Structure',
        description:
          'Site → milestone → task hierarchy with responsible person assignment per task.',
        icon: 'pi pi-list-check',
        highlights: ['Sites & milestones', 'Task list', 'Responsible person'],
        component: 'project-wbs'
      },
      {
        id: 'milestones',
        title: 'Milestones',
        description: 'Contractual and internal milestones with planned vs actual dates.',
        icon: 'pi pi-flag',
        highlights: ['Critical path', 'Slippage alerts', 'Sign-off'],
        component: 'milestones-page'
      },
      {
        id: 'gantt-chart',
        title: 'Gantt Chart',
        description: 'Interactive project schedule with dependencies, progress, and timeline views.',
        icon: 'pi pi-sliders-h',
        highlights: ['WBS timeline', 'Dependencies', 'Day / Week / Month views'],
        component: 'gantt-chart'
      },
      {
        id: 'projects-sites-org-chart',
        title: 'Projects → Sites Chart',
        description: 'Organization chart view showing Projects and their Construction Sites.',
        icon: 'pi pi-sitemap',
        highlights: ['Hierarchy', 'Quick navigation', 'Site overview'],
        component: 'projects-sites-org-chart'
      },
      {
        id: 'project-overview',
        title: 'Project Overview',
        description:
          'Radial stakeholder map with the project at the center — contractors, sub-trades, team, consultants, client, and site entities.',
        icon: 'pi pi-share-alt',
        highlights: ['Stakeholder hub', 'Sub-contractors', 'Entity types'],
        component: 'project-overview'
      },
      {
        id: 'progress-tracking',
        title: 'Progress Tracking',
        description: 'Physical progress by activity, quantity, and percent complete.',
        icon: 'pi pi-chart-line',
        highlights: ['Quantity progress', 'S-curves', 'Earned value']
      },
      {
        id: 'daily-site-reports',
        title: 'Daily Site Reports',
        description: 'DSR capture for manpower, weather, work done, and incidents.',
        icon: 'pi pi-calendar',
        highlights: ['Manpower log', 'Weather', 'Work summary']
      },
      {
        id: 'delays-issues',
        title: 'Delays & Issue Tracking',
        description: 'Delay events, RFIs, NCRs, and corrective actions with accountability.',
        icon: 'pi pi-exclamation-triangle',
        highlights: ['Delay register', 'Root cause', 'Recovery plan']
      },
      {
        id: 'qa-qc-inspections',
        title: 'QA/QC Inspections',
        description:
          'Site inspection workflow from task assignment through pass, rework, re-inspection, and approval.',
        icon: 'pi pi-verified',
        highlights: ['Hold points', 'QA assignment', 'Pass / rework loop'],
        component: 'qa-qc-inspections'
      }
    ]
  },
  {
    id: 'store-inventory',
    title: 'Store & Inventory',
    description: 'Materials receiving, issuance, transfers, and project consumption.',
    icon: 'pi pi-box',
    routePath: 'inventory',
    pages: [
      {
        id: 'material-receiving',
        title: 'Material Receiving',
        description: 'GRN-linked receipts against PO with inspection and batch tracking.',
        icon: 'pi pi-inbox',
        highlights: ['QC inspection', 'Batch/lot', 'Put-away']
      },
      {
        id: 'material-issuance',
        title: 'Material Issuance',
        description: 'Issue materials to sites or cost codes with approval workflow.',
        icon: 'pi pi-send',
        highlights: ['Site requisition', 'Approval', 'Cost code']
      },
      {
        id: 'stock-transfers',
        title: 'Stock Transfers',
        description: 'Inter-warehouse and site-to-site stock movements.',
        icon: 'pi pi-arrows-h',
        highlights: ['Transfer note', 'In-transit', 'Acknowledgement']
      },
      {
        id: 'warehouse-management',
        title: 'Warehouse Management',
        description: 'Bins, zones, and stock positions across central and site stores.',
        icon: 'pi pi-warehouse',
        highlights: ['Bin locations', 'Stock ledger', 'Cycle count']
      },
      {
        id: 'reorder-levels',
        title: 'Reorder Levels',
        description: 'Min/max levels and auto-reorder suggestions by item and site.',
        icon: 'pi pi-bell',
        highlights: ['Min/max', 'Alerts', 'Suggested PR']
      },
      {
        id: 'material-consumption',
        title: 'Material Consumption by Project',
        description: 'Consumption analytics tied to BOQ items and project cost codes.',
        icon: 'pi pi-chart-bar',
        highlights: ['BOQ linkage', 'Variance', 'Project P&L']
      }
    ]
  },
  {
    id: 'resource-management',
    title: 'Resource Management',
    description: 'Labor, equipment allocation, machinery usage, and subcontractors.',
    icon: 'pi pi-users',
    routePath: 'resources',
    pages: [
      {
        id: 'labor-management',
        title: 'Labor Management',
        description: 'Crew composition, skill matrix, and deployment by site.',
        icon: 'pi pi-user',
        highlights: ['Crew roster', 'Skills', 'Deployment']
      },
      {
        id: 'attendance',
        title: 'Attendance',
        description: 'Site and office attendance with shift and overtime rules.',
        icon: 'pi pi-clock',
        highlights: ['Biometric/mobile', 'Shifts', 'Overtime rules']
      },
      {
        id: 'equipment-allocation',
        title: 'Equipment Allocation',
        description: 'Assign plant and equipment to projects with hire/charge rates.',
        icon: 'pi pi-cog',
        highlights: ['Allocation calendar', 'Rates', 'Utilization']
      },
      {
        id: 'machinery-usage',
        title: 'Machinery Usage Tracking',
        description: 'Hour meter readings, output units, and idle time by machine.',
        icon: 'pi pi-gauge',
        highlights: ['Hour meter', 'Output units', 'Idle time']
      },
      {
        id: 'subcontractors',
        title: 'Subcontractor Management',
        description: 'Subcontract packages, work orders, and performance tracking.',
        icon: 'pi pi-sitemap',
        highlights: ['Work orders', 'Retention', 'Performance']
      }
    ]
  },
  {
    id: 'procurement',
    title: 'Procurement',
    description: 'Requisitions through PO and goods receipt for construction supply chain.',
    icon: 'pi pi-shopping-cart',
    routePath: 'procurement',
    pages: [
      {
        id: 'purchase-requisitions',
        title: 'Purchase Requisitions',
        description: 'Site and HO material/service requests with budget check.',
        icon: 'pi pi-file-edit',
        highlights: ['Budget check', 'Approval matrix', 'Urgency']
      },
      {
        id: 'rfqs',
        title: 'RFQs',
        description: 'Request for quotation to multiple vendors with comparison.',
        icon: 'pi pi-envelope',
        highlights: ['Multi-vendor', 'Due date', 'Comparison']
      },
      {
        id: 'vendor-quotations',
        title: 'Vendor Quotations',
        description: 'Quoted rates, terms, and landed cost evaluation.',
        icon: 'pi pi-dollar',
        highlights: ['Landed cost', 'Terms', 'Award']
      },
      {
        id: 'purchase-orders',
        title: 'Purchase Orders',
        description: 'Formal PO issuance with delivery schedule and retention.',
        icon: 'pi pi-file',
        highlights: ['PO print', 'Amendments', 'Delivery schedule']
      },
      {
        id: 'grns',
        title: 'GRNs (Goods Receipt Notes)',
        description: 'Goods receipt against PO with quantity and quality acceptance.',
        icon: 'pi pi-check-square',
        highlights: ['Partial receipt', 'QC hold', '3-way match']
      }
    ]
  },
  {
    id: 'contractors-vendors',
    title: 'Contractors & Vendors',
    description: 'Contractors, sub-contractors, and vendor master register with prequalification and compliance.',
    icon: 'pi pi-briefcase',
    routePath: 'partners',
    pages: [
      {
        id: 'contractors',
        title: 'Contractors',
        description: 'Main contractor register with trade license, project assignment, and approval workflow.',
        icon: 'pi pi-building',
        highlights: ['Trade license', 'Prequalification', 'Project assignment'],
        component: 'partners-directory'
      },
      {
        id: 'sub-contractors',
        title: 'Sub-contractors',
        description: 'Sub-contractor and trade packages linked to main contractors with certifications.',
        icon: 'pi pi-sitemap',
        highlights: ['Trade packages', 'Parent contractor', 'Certifications'],
        component: 'partners-directory'
      },
      {
        id: 'vendors',
        title: 'Vendors',
        description: 'Vendor and supplier master for procurement, quotations, and payment terms.',
        icon: 'pi pi-truck',
        highlights: ['Supplier master', 'Payment terms', 'Performance'],
        component: 'partners-directory'
      }
    ]
  },
  {
    id: 'cost-control',
    title: 'Cost Control',
    description: 'Budget vs actual and profitability analysis across cost heads.',
    icon: 'pi pi-wallet',
    routePath: 'cost-control',
    pages: [
      {
        id: 'budget-vs-actual',
        title: 'Budget vs Actual',
        description: 'Control budgets by cost code with committed and actual spend.',
        icon: 'pi pi-percentage',
        highlights: ['Cost codes', 'Commitments', 'Forecast']
      },
      {
        id: 'material-cost',
        title: 'Material Cost Analysis',
        description: 'Material spend variance against BOQ and purchase history.',
        icon: 'pi pi-box',
        highlights: ['Rate variance', 'Qty variance', 'Trend']
      },
      {
        id: 'labor-cost',
        title: 'Labor Cost Analysis',
        description: 'Labor cost by trade, site, and productivity metrics.',
        icon: 'pi pi-users',
        highlights: ['Productivity', 'Rate analysis', 'Idle cost']
      },
      {
        id: 'equipment-cost',
        title: 'Equipment Cost Analysis',
        description: 'Owned and hired plant costs including fuel and maintenance.',
        icon: 'pi pi-truck',
        highlights: ['Hire vs own', 'Fuel', 'Maintenance']
      },
      {
        id: 'profitability',
        title: 'Profitability by Project',
        description: 'Revenue, cost, margin, and cash position by project.',
        icon: 'pi pi-chart-pie',
        highlights: ['Gross margin', 'Cash flow', 'WIP']
      }
    ]
  },
  {
    id: 'equipment-management',
    title: 'Equipment Management',
    description: 'Fleet register for excavators, cranes, dumpers, generators, and more.',
    icon: 'pi pi-truck',
    routePath: 'equipment',
    pages: [
      {
        id: 'excavators',
        title: 'Excavators',
        description: 'Excavator fleet with utilization, fuel, and maintenance history.',
        icon: 'pi pi-circle',
        highlights: ['Asset register', 'Utilization', 'TCO']
      },
      {
        id: 'cranes',
        title: 'Cranes',
        description: 'Tower and mobile cranes with lift plans and certification tracking.',
        icon: 'pi pi-arrow-up',
        highlights: ['Certification', 'Lift plan', 'Inspection']
      },
      {
        id: 'dumpers',
        title: 'Dumpers',
        description: 'Haulage fleet with trip logs and payload tracking.',
        icon: 'pi pi-car',
        highlights: ['Trip log', 'Payload', 'Route']
      },
      {
        id: 'generators',
        title: 'Generators',
        description: 'Power equipment with runtime hours and fuel efficiency.',
        icon: 'pi pi-bolt',
        highlights: ['Runtime', 'Fuel efficiency', 'Load']
      },
      {
        id: 'fuel-consumption',
        title: 'Fuel Consumption',
        description: 'Fuel issues, consumption per hour, and variance by machine.',
        icon: 'pi pi-filter',
        highlights: ['Issue slips', 'Consumption/hr', 'Theft alerts']
      },
      {
        id: 'maintenance',
        title: 'Maintenance',
        description: 'Preventive maintenance schedules and work orders.',
        icon: 'pi pi-wrench',
        highlights: ['PM schedule', 'Work orders', 'Spares']
      },
      {
        id: 'service-history',
        title: 'Service History',
        description: 'Complete service and repair history per asset.',
        icon: 'pi pi-history',
        highlights: ['Service log', 'Warranty', 'Cost']
      },
      {
        id: 'breakdown-reports',
        title: 'Breakdown Reports',
        description: 'Breakdown incidents, downtime, and MTBF/MTTR analytics.',
        icon: 'pi pi-times-circle',
        highlights: ['Downtime', 'MTBF', 'Root cause']
      }
    ]
  },
  {
    id: 'hr-payroll',
    title: 'HR & Payroll',
    description: 'Employee lifecycle, attendance, leave, payroll, and overtime.',
    icon: 'pi pi-id-card',
    routePath: 'hr',
    pages: [
      {
        id: 'employee-records',
        title: 'Employee Records',
        description: 'Employee master with documents, grades, and site assignment.',
        icon: 'pi pi-user-edit',
        highlights: ['Documents', 'Grades', 'Site assignment'],
        component: 'employee-records'
      },
      {
        id: 'hr-attendance',
        title: 'Attendance',
        description: 'HR attendance integration with payroll and project costing.',
        icon: 'pi pi-clock',
        highlights: ['Payroll sync', 'Project allocation', 'Exceptions'],
        component: 'hr-attendance'
      },
      {
        id: 'leave-management',
        title: 'Leave Management',
        description: 'Leave balances, requests, and approval workflows.',
        icon: 'pi pi-calendar-minus',
        highlights: ['Balances', 'Approvals', 'Calendar']
      },
      {
        id: 'payroll',
        title: 'Payroll',
        description: 'Monthly payroll processing with statutory deductions.',
        icon: 'pi pi-money-bill',
        highlights: ['Payslips', 'Statutory', 'Bank file'],
        component: 'payroll'
      },
      {
        id: 'overtime',
        title: 'Overtime',
        description: 'Overtime rules, approvals, and cost allocation to projects.',
        icon: 'pi pi-stopwatch',
        highlights: ['Rules engine', 'Approval', 'Project charge']
      }
    ]
  },
  {
    id: 'document-management',
    title: 'Document Management',
    description: 'Drawings, BOQs, contracts, photos, and approval workflows.',
    icon: 'pi pi-folder',
    routePath: 'documents',
    pages: [
      {
        id: 'drawings',
        title: 'Drawings',
        description: 'View AutoCAD DWG and DXF drawings in the browser (read-only).',
        icon: 'pi pi-image',
        highlights: ['DWG / DXF viewer', 'Pan & zoom', 'Drawing register'],
        component: 'drawing-viewer'
      },
      {
        id: 'boqs',
        title: 'BOQs',
        description: 'Bill of quantities document repository linked to billing module.',
        icon: 'pi pi-table',
        highlights: ['Versioning', 'Link to billing', 'Export']
      },
      {
        id: 'contracts',
        title: 'Contracts',
        description: 'Client and subcontract agreements with key dates and values.',
        icon: 'pi pi-file-pdf',
        highlights: ['Key dates', 'Variations', 'Expiry alerts']
      },
      {
        id: 'site-photos',
        title: 'Site Photos',
        description: 'Geo-tagged progress photos organized by date and location.',
        icon: 'pi pi-camera',
        highlights: ['Geo-tag', 'Albums', 'Progress evidence']
      },
      {
        id: 'approval-workflows',
        title: 'Approval Workflows',
        description: 'Configurable multi-level approvals for documents and transactions.',
        icon: 'pi pi-check-circle',
        highlights: ['Swim lanes', 'Draw.io shapes', 'Multi-connect'],
        component: 'approval-workflows'
      }
    ]
  },
  {
    id: 'site-mobile',
    title: 'Site Mobile',
    description: 'Field app capabilities for engineers on site — attendance to geofencing.',
    icon: 'pi pi-mobile',
    routePath: 'site-mobile',
    badge: 'Differentiator',
    pages: [
      {
        id: 'mobile-attendance',
        title: 'Mark Attendance',
        description: 'GPS-verified check-in/out for site engineers and labor.',
        icon: 'pi pi-map',
        highlights: ['GPS verify', 'Selfie optional', 'Offline sync']
      },
      {
        id: 'upload-photos',
        title: 'Upload Photos',
        description: 'Capture and upload progress photos from the field.',
        icon: 'pi pi-camera',
        highlights: ['Compress', 'Offline queue', 'Auto album']
      },
      {
        id: 'daily-progress',
        title: 'Submit Daily Progress',
        description: 'Mobile DSR with quantities, photos, and weather.',
        icon: 'pi pi-pencil',
        highlights: ['Quantities', 'Photos', 'Supervisor sign-off'],
        component: 'daily-progress'
      },
      {
        id: 'material-requests',
        title: 'Request Materials',
        description: 'Raise material requests from site with urgency and BOQ link.',
        icon: 'pi pi-shopping-bag',
        highlights: ['BOQ pick', 'Urgency', 'Track status']
      },
      {
        id: 'gps-tracking',
        title: 'GPS Tracking',
        description: 'Live location tracking for staff and critical assets.',
        icon: 'pi pi-compass',
        highlights: ['Live map', 'History trail', 'Alerts'],
        component: 'gps-tracking'
      },
      {
        id: 'vehicle-tracking',
        title: 'Track Vehicles',
        description: 'Fleet GPS for dumpers, pickups, and delivery vehicles.',
        icon: 'pi pi-car',
        highlights: ['Speed alerts', 'Route replay', 'Idle time'],
        component: 'vehicle-tracking'
      },
      {
        id: 'equipment-locations',
        title: 'Equipment Locations',
        description: 'Last known location and movement history for plant.',
        icon: 'pi pi-cog',
        highlights: ['BLE/GPS', 'Site map', 'Theft alert']
      },
      {
        id: 'geofencing',
        title: 'Geofencing for Sites',
        description: 'Virtual boundaries with entry/exit alerts and attendance validation.',
        icon: 'pi pi-globe',
        highlights: ['Polygon zones', 'Entry/exit', 'Compliance']
      }
    ]
  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    description: 'Notes, to-do tasks, milestones, and project communication messages.',
    icon: 'pi pi-comments',
    routePath: 'collaboration',
    pages: [
      {
        id: 'notes',
        title: 'Notes',
        description: 'Pinned project notes and site instructions for the team.',
        icon: 'pi pi-book',
        highlights: ['Pin important', 'Search', 'By project'],
        component: 'notes'
      },
      {
        id: 'todo',
        title: 'To-Do',
        description: 'Task list with assignee, due date, and priority for site and office.',
        icon: 'pi pi-check-square',
        highlights: ['Open / done', 'Priority', 'Assignee'],
        component: 'todo'
      },
      {
        id: 'milestones',
        title: 'Milestones',
        description: 'Milestone register with planned vs forecast dates and status.',
        icon: 'pi pi-flag',
        highlights: ['Slippage', 'Status', 'Owner'],
        component: 'milestones-page'
      },
      {
        id: 'messages',
        title: 'Messages',
        description: 'Project communication inbox — email, SMS, and in-app messages.',
        icon: 'pi pi-envelope',
        highlights: ['Unread', 'Compose', 'Channels'],
        component: 'messages'
      }
    ]
  },
  {
    id: 'boq-billing',
    title: 'BOQ & Client Billing',
    description: 'Construction billing from BOQ through IPCs, invoices, and retention.',
    icon: 'pi pi-calculator',
    routePath: 'boq-billing',
    badge: 'Differentiator',
    pages: [
      {
        id: 'boq-creation',
        title: 'BOQ Creation',
        description: 'Create detailed BOQ with items, units, rates, and sections.',
        icon: 'pi pi-plus-circle',
        highlights: ['Sections', 'Units', 'Rate build-up'],
        component: 'boq-creation'
      },
      {
        id: 'boq-revisions',
        title: 'BOQ Revisions',
        description: 'Revision history with comparison and approval before billing.',
        icon: 'pi pi-clone',
        highlights: ['Diff view', 'Approval', 'Effective date'],
        component: 'boq-revisions'
      },
      {
        id: 'boq-vs-actual',
        title: 'BOQ vs Actual Quantity',
        description: 'Measured quantities vs BOQ with variance and claim support.',
        icon: 'pi pi-chart-bar',
        highlights: ['Measured qty', 'Variance %', 'Claims']
      },
      {
        id: 'client-billing',
        title: 'Client Billing',
        description: 'Bill preparation aligned to contract and BOQ structure.',
        icon: 'pi pi-file-export',
        highlights: ['Contract terms', 'Deductions', 'Preview']
      },
      {
        id: 'progress-billing',
        title: 'Progress Billing',
        description: 'Bill by physical progress percentage per BOQ line.',
        icon: 'pi pi-percentage',
        highlights: ['% complete', 'Cumulative', 'Certification']
      },
      {
        id: 'running-bills',
        title: 'Running Bills',
        description: 'Cumulative running account with previous certified amounts.',
        icon: 'pi pi-list',
        highlights: ['Previous certified', 'This period', 'Balance']
      },
      {
        id: 'ipcs',
        title: 'IPCs (Interim Payment Certificates)',
        description: 'Formal IPC generation with engineer and QS certification.',
        icon: 'pi pi-verified',
        highlights: ['QS cert', 'Engineer cert', 'Client submission']
      },
      {
        id: 'client-invoices',
        title: 'Client Invoices',
        description: 'Tax-compliant invoices from certified IPC amounts.',
        icon: 'pi pi-receipt',
        highlights: ['Tax', 'PDF', 'Payment tracking']
      },
      {
        id: 'retention-tracking',
        title: 'Retention Tracking',
        description: 'Retention held and release schedule per contract.',
        icon: 'pi pi-lock',
        highlights: ['Hold %', 'Release milestones', 'Aging']
      }
    ]
  }
];

export function getModuleByPath(path: string): FeatureModule | undefined {
  return FEATURE_MODULES.find((m) => m.routePath === path);
}

export function getModuleById(id: string): FeatureModule | undefined {
  return FEATURE_MODULES.find((m) => m.id === id);
}
