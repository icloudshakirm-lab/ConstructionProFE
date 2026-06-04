import {
  Component,
  HostListener,
  ViewChild,
  ElementRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { SelectButton } from 'primeng/selectbutton';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { getModuleById } from '../../../core/constants/feature-registry';
import { ActivatedRoute } from '@angular/router';
import {
  DEFAULT_EDGE_STYLE,
  DIAGRAM_TOOLBOX,
  EDGE_STROKE_WIDTH_OPTIONS,
  nodeAlertStyle,
  resolveEdgeStyle
} from './workflow-diagram.data';
import type {
  AlertStyle,
  DiagramNode,
  DiagramTool,
  EdgeCornerStyle,
  EdgeLineStyle,
  EdgeStyle,
  NodeShape,
  Point,
  WorkflowDiagram
} from './workflow-diagram.model';
import {
  CANVAS_HEIGHT,
  DEFAULT_LANE_WIDTH,
  GRID_STEP,
  allNodeBounds,
  buildEdgePaths,
  canvasWidth,
  defaultShapeSize,
  addWaypointOnEdge,
  dragSegmentWaypoints,
  dragWaypointTo,
  edgeAnchors,
  initialDiagram,
  laneOffsets,
  newId,
  nodePositionFromDrag,
  polylinePoints,
  removeWaypointAt,
  resolveEdgeWaypoints,
  snapToLaneContent,
  variantForNewShape,
  waypointsForNewEdge
} from './workflow-diagram.utils';

interface EdgeDragContext {
  start: Point;
  end: Point;
  poly: Point[];
}

@Component({
  selector: 'app-approval-workflows',
  imports: [FormsModule, Breadcrumb, Button, Dialog, InputText, SelectButton, Tag, Toast, Tooltip],
  providers: [MessageService],
  templateUrl: './approval-workflows.component.html',
  styleUrl: './approval-workflows.component.scss'
})
export class ApprovalWorkflowsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);

  @ViewChild('canvasSvg', { static: true }) canvasSvg!: ElementRef<SVGSVGElement>;

  readonly toolbox = DIAGRAM_TOOLBOX;
  readonly gridStep = GRID_STEP;
  readonly edgeStrokeWidthOptions = EDGE_STROKE_WIDTH_OPTIONS;
  readonly lineStyleOptions = [
    { label: 'Solid', value: 'solid' as EdgeLineStyle },
    { label: 'Dashed', value: 'dashed' as EdgeLineStyle }
  ];
  readonly cornerStyleOptions = [
    { label: 'Sharp', value: 'sharp' as EdgeCornerStyle },
    { label: 'Rounded', value: 'rounded' as EdgeCornerStyle }
  ];
  readonly diagram = signal<WorkflowDiagram>(initialDiagram());
  readonly activeTool = signal<DiagramTool>('select');
  readonly selectedNodeId = signal<string | null>(null);
  readonly selectedEdgeId = signal<string | null>(null);
  readonly connectorFromId = signal<string | null>(null);
  readonly statusHint = signal('Select a tool, then click the canvas or shapes.');

  readonly labelDialogVisible = signal(false);
  readonly labelDraft = signal('');
  readonly lineStylePanelExpanded = signal(true);

  /** Line style panel: visible when a canvas shape or connector is selected */
  readonly showLineStylePanel = computed(
    () => this.selectedNodeId() !== null || this.selectedEdgeId() !== null
  );

  private dragNodeId: string | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private dragPointerStartX = 0;
  private dragPointerStartY = 0;
  private suppressCanvasClick = false;

  private dragWaypoint: { edgeId: string; index: number; startWaypoints: Point[] } | null = null;
  private dragSegment: {
    edgeId: string;
    segmentIndex: number;
    startPointer: Point;
    startWaypoints: Point[];
    startAnchor: Point;
    endAnchor: Point;
  } | null = null;

  readonly canvasHeight = CANVAS_HEIGHT;
  readonly canvasWidth = computed(() => canvasWidth(this.diagram().lanes));
  readonly laneOffsetMap = computed(() => laneOffsets(this.diagram().lanes));
  readonly edgePaths = computed(() => buildEdgePaths(this.diagram()));

  readonly selectedEdge = computed(() => {
    const id = this.selectedEdgeId();
    if (!id) return null;
    return this.diagram().edges.find((e) => e.id === id) ?? null;
  });

  readonly selectedEdgeStyle = computed(() => {
    const edge = this.selectedEdge();
    return edge ? resolveEdgeStyle(edge) : DEFAULT_EDGE_STYLE;
  });

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) {
      items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    }
    items.push({ label: 'Approval Workflows' });
    return items;
  });

  laneX(laneId: string): number {
    return this.laneOffsetMap().get(laneId) ?? 0;
  }

  laneContentHeight(): number {
    return this.canvasHeight - this.diagram().laneHeaderHeight;
  }

  alertStyle(node: DiagramNode): AlertStyle {
    return nodeAlertStyle(node);
  }

  toggleLineStylePanel(): void {
    this.lineStylePanelExpanded.update((open) => !open);
  }

  setTool(tool: DiagramTool): void {
    this.activeTool.set(tool);
    this.connectorFromId.set(null);
    if (tool === 'connector') {
      this.statusHint.set('Click a source shape, then one or more target shapes (repeat from same source).');
    } else if (tool === 'swimlane') {
      this.statusHint.set('Use Add swim lane for a new vertical column.');
    } else if (tool === 'select') {
      this.statusHint.set(
        'Connectors: select a line, drag sections or blue handles, Shift+click / double-click to add bends.'
      );
    } else {
      this.statusHint.set(`Click inside a lane column to place a ${tool}.`);
    }
  }

  addSwimLane(): void {
    const d = this.diagram();
    const lane = { id: newId('lane'), title: 'New lane', width: DEFAULT_LANE_WIDTH };
    this.diagram.set({ ...d, lanes: [...d.lanes, lane] });
    this.messages.add({ severity: 'success', summary: 'Swim lane added', life: 2000 });
  }

  clearSelectedEdgePath(): void {
    const edgeId = this.selectedEdgeId();
    if (!edgeId) return;
    this.persistEdgeWaypoints(edgeId, []);
    this.statusHint.set('Connector path reset to shortest route.');
    this.messages.add({ severity: 'info', summary: 'Path cleared', life: 1500 });
  }

  deleteSelected(): void {
    const nodeId = this.selectedNodeId();
    const edgeId = this.selectedEdgeId();
    if (!nodeId && !edgeId) return;

    const d = this.diagram();
    if (nodeId) {
      this.diagram.set({
        ...d,
        nodes: d.nodes.filter((n) => n.id !== nodeId),
        edges: d.edges.filter((e) => e.fromId !== nodeId && e.toId !== nodeId)
      });
      this.selectedNodeId.set(null);
    } else if (edgeId) {
      this.diagram.set({ ...d, edges: d.edges.filter((e) => e.id !== edgeId) });
      this.selectedEdgeId.set(null);
    }
  }

  exportJson(): void {
    const json = JSON.stringify(this.diagram(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `workflow-${Date.now()}.json`;
    a.click();
  }

  onCanvasClick(event: MouseEvent): void {
    if (this.suppressCanvasClick) {
      this.suppressCanvasClick = false;
      return;
    }

    const tool = this.activeTool();
    if (tool === 'select' || tool === 'connector') return;

    const pt = this.svgPoint(event);
    if (!pt) return;

    if (tool === 'swimlane') {
      this.addSwimLane();
      return;
    }

    const snap = snapToLaneContent(this.diagram(), pt.x, pt.y);
    if (!snap) {
      this.messages.add({
        severity: 'warn',
        summary: 'Place inside lane',
        detail: 'Click below the lane title bar, inside a column.'
      });
      return;
    }

    const shape = tool as NodeShape;
    const size = defaultShapeSize(shape);
    const node: DiagramNode = {
      id: newId('n'),
      laneId: snap.laneId,
      shape,
      variant: variantForNewShape(shape),
      x: Math.max(8, snap.x - size.w / 2),
      y: Math.max(8, snap.y - size.h / 2),
      w: size.w,
      h: size.h,
      label: shape === 'text' ? 'Label' : 'Step'
    };
    const d = this.diagram();
    this.diagram.set({ ...d, nodes: [...d.nodes, node] });
    this.selectedNodeId.set(node.id);
  }

  onNodeMouseDown(event: MouseEvent, nodeId: string): void {
    event.stopPropagation();
    event.preventDefault();

    const tool = this.activeTool();

    if (tool === 'connector') {
      this.handleConnectorClick(nodeId);
      return;
    }

    if (tool !== 'select') return;

    const pt = this.svgPoint(event);
    const node = this.diagram().nodes.find((n) => n.id === nodeId);
    if (!pt || !node) return;

    const laneX = this.laneX(node.laneId);
    const headerH = this.diagram().laneHeaderHeight;
    this.dragNodeId = nodeId;
    this.dragOffsetX = pt.x - (laneX + node.x);
    this.dragOffsetY = pt.y - (headerH + node.y);
    this.dragPointerStartX = event.clientX;
    this.dragPointerStartY = event.clientY;
    this.suppressCanvasClick = false;
    this.selectedNodeId.set(nodeId);
    this.selectedEdgeId.set(null);
    this.lineStylePanelExpanded.set(true);
  }

  onNodeDoubleClick(event: MouseEvent, nodeId: string): void {
    event.stopPropagation();
    const node = this.diagram().nodes.find((n) => n.id === nodeId);
    if (!node) return;
    this.selectedNodeId.set(nodeId);
    this.labelDraft.set(node.label);
    this.labelDialogVisible.set(true);
  }

  saveLabel(): void {
    const id = this.selectedNodeId();
    if (!id) return;
    const label = this.labelDraft().trim() || 'Step';
    const d = this.diagram();
    this.diagram.set({
      ...d,
      nodes: d.nodes.map((n) => (n.id === id ? { ...n, label } : n))
    });
    this.labelDialogVisible.set(false);
  }

  onEdgeSelect(event: MouseEvent, edgeId: string): void {
    event.stopPropagation();
    if (this.activeTool() !== 'select' && this.activeTool() !== 'connector') return;

    if (this.activeTool() === 'select' && event.shiftKey) {
      this.addBendOnEdge(edgeId, event);
      return;
    }

    this.selectedEdgeId.set(edgeId);
    this.selectedNodeId.set(null);
    this.lineStylePanelExpanded.set(true);
    const count = this.edgePaths().find((p) => p.id === edgeId)?.waypoints.length ?? 0;
    this.statusHint.set(
      `${count} bend(s) — drag line sections or blue handles. Shift+click / double-click to add. Alt+click blue handle to remove.`
    );
  }

  onEdgeDoubleClick(event: MouseEvent, edgeId: string): void {
    event.stopPropagation();
    event.preventDefault();
    this.suppressCanvasClick = true;
    if (this.activeTool() !== 'select') return;
    this.selectedEdgeId.set(edgeId);
    this.addBendOnEdge(edgeId, event);
  }

  updateSelectedEdgeStyle(patch: Partial<EdgeStyle>): void {
    const edgeId = this.selectedEdgeId();
    if (!edgeId) return;
    const d = this.diagram();
    this.diagram.set({
      ...d,
      edges: d.edges.map((e) =>
        e.id === edgeId ? { ...e, style: { ...resolveEdgeStyle(e), ...patch } } : e
      )
    });
  }

  onEdgeColorChange(color: string): void {
    this.updateSelectedEdgeStyle({ color });
  }

  onEdgeStrokeWidthChange(width: number): void {
    this.updateSelectedEdgeStyle({ strokeWidth: width });
  }

  onEdgeLineStyleChange(lineStyle: EdgeLineStyle): void {
    this.updateSelectedEdgeStyle({ lineStyle });
  }

  onEdgeCornerStyleChange(cornerStyle: EdgeCornerStyle): void {
    this.updateSelectedEdgeStyle({ cornerStyle });
  }

  addBendOnSelectedEdge(): void {
    const edgeId = this.selectedEdgeId();
    if (!edgeId) return;
    const path = this.edgePaths().find((p) => p.id === edgeId);
    const ctx = this.edgeContext(edgeId);
    const edge = this.diagram().edges.find((e) => e.id === edgeId);
    if (!path?.virtualBends.length || !ctx || !edge) return;
    const mid = path.virtualBends[Math.floor(path.virtualBends.length / 2)];
    const wps = addWaypointOnEdge(
      ctx.start,
      ctx.end,
      resolveEdgeWaypoints(edge, ctx.start, ctx.end),
      { x: mid.x, y: mid.y }
    );
    this.persistEdgeWaypoints(edgeId, wps);
    this.selectedEdgeId.set(edgeId);
    this.messages.add({ severity: 'info', summary: 'Bend added', life: 1200 });
  }

  private addBendOnEdge(edgeId: string, event: MouseEvent): void {
    const pt = this.svgPoint(event);
    const ctx = this.edgeContext(edgeId);
    if (!pt || !ctx) return;
    const edge = this.diagram().edges.find((e) => e.id === edgeId);
    if (!edge) return;
    const wps = addWaypointOnEdge(
      ctx.start,
      ctx.end,
      resolveEdgeWaypoints(edge, ctx.start, ctx.end),
      pt
    );
    this.persistEdgeWaypoints(edgeId, wps);
    this.selectedEdgeId.set(edgeId);
    this.statusHint.set(`${wps.length} bend(s) on this connector.`);
  }

  onEdgeSegmentMouseDown(event: MouseEvent, edgeId: string, segmentIndex: number): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.activeTool() !== 'select') return;

    const pt = this.svgPoint(event);
    const ctx = this.edgeContext(edgeId);
    if (!pt || !ctx) return;

    this.selectedEdgeId.set(edgeId);
    this.selectedNodeId.set(null);
    const edge = this.diagram().edges.find((e) => e.id === edgeId);
    const startWaypoints = edge
      ? resolveEdgeWaypoints(edge, ctx.start, ctx.end).map((p) => ({ ...p }))
      : [];
    this.dragSegment = {
      edgeId,
      segmentIndex,
      startPointer: { ...pt },
      startWaypoints,
      startAnchor: { ...ctx.start },
      endAnchor: { ...ctx.end }
    };
    this.suppressCanvasClick = true;
    this.statusHint.set('Drag to move this section of the connector.');
  }

  onWaypointMouseDown(event: MouseEvent, edgeId: string, index: number): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.activeTool() !== 'select') return;

    if (event.altKey) {
      const ctx = this.edgeContext(edgeId);
      if (!ctx) return;
      const edge = this.diagram().edges.find((e) => e.id === edgeId);
      if (!edge) return;
      const wps = removeWaypointAt(resolveEdgeWaypoints(edge, ctx.start, ctx.end), index);
      this.persistEdgeWaypoints(edgeId, wps);
      this.selectedEdgeId.set(edgeId);
      return;
    }

    const ctx = this.edgeContext(edgeId);
    if (!ctx) return;

    const edge = this.diagram().edges.find((e) => e.id === edgeId);
    const startWaypoints = edge
      ? resolveEdgeWaypoints(edge, ctx.start, ctx.end).map((p) => ({ ...p }))
      : [];
    this.dragWaypoint = { edgeId, index, startWaypoints };
    this.selectedEdgeId.set(edgeId);
    this.selectedNodeId.set(null);
    this.suppressCanvasClick = true;
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    if (this.dragSegment) {
      this.moveSegment(event);
      return;
    }
    if (this.dragWaypoint) {
      this.moveWaypoint(event);
      return;
    }
    if (!this.dragNodeId) return;

    const moved =
      Math.abs(event.clientX - this.dragPointerStartX) > 3 ||
      Math.abs(event.clientY - this.dragPointerStartY) > 3;
    if (moved) {
      this.suppressCanvasClick = true;
    }

    const pt = this.svgPoint(event);
    const node = this.diagram().nodes.find((n) => n.id === this.dragNodeId);
    if (!pt || !node) return;

    const pos = nodePositionFromDrag(
      this.diagram(),
      pt.x,
      pt.y,
      this.dragOffsetX,
      this.dragOffsetY,
      node.w,
      node.h
    );
    if (!pos) return;

    const d = this.diagram();
    this.diagram.set({
      ...d,
      nodes: d.nodes.map((n) =>
        n.id === this.dragNodeId ? { ...n, laneId: pos.laneId, x: pos.x, y: pos.y } : n
      )
    });
  }

  @HostListener('document:mouseup')
  onDocumentMouseUp(): void {
    const edgeId = this.dragSegment?.edgeId ?? this.dragWaypoint?.edgeId;
    if (edgeId) {
      const count = this.diagram().edges.find((e) => e.id === edgeId)?.waypoints?.length ?? 0;
      this.statusHint.set(`${count} bend(s) — drag sections or handles to adjust.`);
    }
    this.dragNodeId = null;
    this.dragSegment = null;
    this.dragWaypoint = null;
  }

  private moveSegment(event: MouseEvent): void {
    const drag = this.dragSegment;
    if (!drag) return;
    const pt = this.svgPoint(event);
    if (!pt) return;

    const ctx = this.edgeContext(drag.edgeId);
    if (!ctx) return;

    const delta = {
      x: pt.x - drag.startPointer.x,
      y: pt.y - drag.startPointer.y
    };
    const wps = dragSegmentWaypoints(
      ctx.start,
      ctx.end,
      drag.startWaypoints,
      drag.segmentIndex,
      delta
    );
    this.persistEdgeWaypoints(drag.edgeId, wps);
  }

  private moveWaypoint(event: MouseEvent): void {
    const drag = this.dragWaypoint;
    if (!drag) return;
    const pt = this.svgPoint(event);
    if (!pt) return;

    const wps = dragWaypointTo(drag.startWaypoints, drag.index, pt);
    this.persistEdgeWaypoints(drag.edgeId, wps);
  }

  private edgeContext(edgeId: string): EdgeDragContext | null {
    const d = this.diagram();
    const edge = d.edges.find((e) => e.id === edgeId);
    if (!edge) return null;
    const bounds = new Map(allNodeBounds(d).map((b) => [b.id, b]));
    const from = bounds.get(edge.fromId);
    const to = bounds.get(edge.toId);
    if (!from || !to) return null;
    const { start, end } = edgeAnchors(from, to);
    const waypoints = resolveEdgeWaypoints(edge, start, end);
    return {
      start,
      end,
      poly: polylinePoints(start, end, waypoints)
    };
  }

  private persistEdgeWaypoints(edgeId: string, waypoints: Point[]): void {
    const d = this.diagram();
    const stored = waypoints.length ? waypoints.map((p) => ({ ...p })) : undefined;
    this.diagram.set({
      ...d,
      edges: d.edges.map((e) => (e.id === edgeId ? { ...e, waypoints: stored } : e))
    });
  }

  private handleConnectorClick(nodeId: string): void {
    const from = this.connectorFromId();
    if (!from) {
      this.connectorFromId.set(nodeId);
      this.selectedNodeId.set(nodeId);
      this.statusHint.set('Source set — click target shape(s). Click source again to change.');
      return;
    }
    if (from === nodeId) {
      this.connectorFromId.set(null);
      this.statusHint.set('Connector cleared — pick a new source.');
      return;
    }
    const d = this.diagram();
    const exists = d.edges.some((e) => e.fromId === from && e.toId === nodeId);
    if (!exists) {
      const bounds = new Map(allNodeBounds(d).map((b) => [b.id, b]));
      const fromBox = bounds.get(from);
      const toBox = bounds.get(nodeId);
      let waypoints: Point[] | undefined;
      if (fromBox && toBox) {
        const anchors = edgeAnchors(fromBox, toBox);
        waypoints = waypointsForNewEdge(anchors.start, anchors.end);
      }
      this.diagram.set({
        ...d,
        edges: [
          ...d.edges,
          {
            id: newId('e'),
            fromId: from,
            toId: nodeId,
            waypoints,
            style: { ...DEFAULT_EDGE_STYLE }
          }
        ]
      });
      this.messages.add({ severity: 'info', summary: 'Connected', life: 1500 });
    }
    this.selectedNodeId.set(nodeId);
    this.statusHint.set('Select the connector — drag sections or handles to shape the path.');
  }

  private svgPoint(event: MouseEvent): { x: number; y: number } | null {
    const svg = this.canvasSvg?.nativeElement;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }
}
