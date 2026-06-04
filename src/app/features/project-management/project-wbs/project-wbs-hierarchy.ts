import { TreeNode } from 'primeng/api';
import type { ProjectWbs, WbsMilestone, WbsPriority, WbsSite, WbsTask } from './project-wbs.data';
import { responsibleLabel } from './project-wbs.data';

export interface WbsHierarchyTaskItem {
  id: string;
  title: string;
  responsible: string;
  unassigned: boolean;
  priority: WbsPriority;
  dueDate: string;
}

export interface WbsHierarchyMilestoneNode {
  id: string;
  siteId: string;
  title: string;
  targetDate?: string;
  priority: WbsPriority;
  taskCount: number;
}

function buildTaskColumn(
  tasks: WbsTask[],
  siteId: string,
  milestoneId: string
): TreeNode[] {
  if (!tasks.length) {
    return [
      {
        type: 'tasks',
        styleClass: 'wbs-hierarchy-tasks-column',
        data: {
          siteId,
          milestoneId,
          items: [] as WbsHierarchyTaskItem[],
          empty: true
        }
      }
    ];
  }

  return [
    {
      expanded: true,
      type: 'tasks',
      styleClass: 'wbs-hierarchy-tasks-column',
      data: {
        siteId,
        milestoneId,
        items: tasks.map((t) => ({
          id: t.id,
          title: t.name,
          responsible: responsibleLabel(t.responsiblePersonId),
          unassigned: !t.responsiblePersonId,
          priority: t.priority,
          dueDate: t.dueDate
        })),
        empty: false
      }
    }
  ];
}

function buildMilestoneNode(site: WbsSite, milestone: WbsMilestone): TreeNode {
  return {
    expanded: true,
    type: 'milestone',
    data: {
      id: milestone.id,
      siteId: site.id,
      title: milestone.name,
      targetDate: milestone.targetDate,
      priority: milestone.priority,
      taskCount: milestone.tasks.length
    } satisfies WbsHierarchyMilestoneNode,
    children: buildTaskColumn(milestone.tasks, site.id, milestone.id)
  };
}

function buildSiteNode(site: WbsSite): TreeNode {
  return {
    expanded: true,
    type: 'site',
    data: {
      id: site.id,
      title: site.name,
      subtitle: site.location,
      milestoneCount: site.milestones.length
    },
    children: site.milestones.map((ms) => buildMilestoneNode(site, ms))
  };
}

/** PrimeNG organization chart tree: Project → Sites → Milestones → Tasks. */
export function buildWbsHierarchyChart(wbs: ProjectWbs): TreeNode[] {
  const totalTasks = wbs.sites.reduce(
    (sum, s) => sum + s.milestones.reduce((ms, m) => ms + m.tasks.length, 0),
    0
  );

  return [
    {
      expanded: true,
      type: 'project',
      data: {
        title: wbs.projectName,
        subtitle: `${wbs.sites.length} sites · ${totalTasks} tasks`,
        projectId: wbs.projectId
      },
      children: wbs.sites.map((site) => buildSiteNode(site))
    }
  ];
}
