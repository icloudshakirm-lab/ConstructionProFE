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
  ALERT_COLOR_PRESETS,
  ARROW_MARKER_OPTIONS,
  DEFAULT_EDGE_STYLE,
  DIAGRAM_TOOLBOX,
  EDGE_STROKE_WIDTH_OPTIONS,
  NODE_BORDER_WIDTH_OPTIONS,
  arrowMarkerFilled,
  arrowMarkerPath,
  arrowMarkerPreviewTransform,
  arrowMarkerRefX,
  defaultNodeVariant,
  hasCustomNodeColors,
  nodeStyleKeepingBorderWidth,
  resolveEdgeStyle,
  resolveNodeStyle
} from './workflow-diagram.data';
import type {
  AlertVariant,
  ArrowMarkerType,
  ConnectionPortHit,
  DiagramNode,
  DiagramTool,
  NodeBounds,
  EdgeCornerStyle,
  EdgeLineStyle,
  EdgePort,
  EdgeStyle,
  NodeResizeHandle,
  NodeShape,
  NodeStyle,
  Point,
  PortSide,
  ResolvedNodeStyle,
  WorkflowDiagram
} from './workflow-diagram.model';
import {
  CANVAS_HEIGHT,
  DEFAULT_LANE_WIDTH,
  GRID_STEP,
  allNodeBounds,
  anchorPoint,
  buildEdgePaths,
  canvasWidth,
  connectionPortsForBounds,
  defaultPortToward,
  defaultShapeSize,
  addWaypointOnEdge,
  dragSegmentWaypoints,
  dragWaypointTo,
  initialDiagram,
  laneOffsets,
  newId,
  nodeBounds,
  nodePositionFromDrag,
  resizeNodeBounds,
  polylinePoints,
  portFromPoint,
  removeWaypointAt,
  resolveEdgeEndpoints,
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
  @ViewChild('designerShell') designerShell?: ElementRef<HTMLElement>;

  readonly fullscreen = signal(false);

  readonly toolbox = DIAGRAM_TOOLBOX;
  readonly gridStep = GRID_STEP;
  readonly edgeStrokeWidthOptions = EDGE_STROKE_WIDTH_OPTIONS;
  readonly arrowMarkerOptions = ARROW_MARKER_OPTIONS;
  readonly arrowMarkerPath = arrowMarkerPath;
  readonly arrowMarkerFilled = arrowMarkerFilled;
  readonly arrowMarkerRefX = arrowMarkerRefX;
  readonly arrowMarkerPreviewTransform = arrowMarkerPreviewTransform;
  readonly nodeBorderWidthOptions = NODE_BORDER_WIDTH_OPTIONS;
  readonly alertColorPresets = ALERT_COLOR_PRESETS;
  readonly resizeHandleSize = 8;
  readonly nodeResizeHandles: {
    handle: NodeResizeHandle;
    cx: number;
    cy: number;
    cursor: string;
  }[] = [
    { handle: 'nw', cx: 0, cy: 0, cursor: 'nwse-resize' },
    { handle: 'n', cx: 0.5, cy: 0, cursor: 'ns-resize' },
    { handle: 'ne', cx: 1, cy: 0, cursor: 'nesw-resize' },
    { handle: 'e', cx: 1, cy: 0.5, cursor: 'ew-resize' },
    { handle: 'se', cx: 1, cy: 1, cursor: 'nwse-resize' },
    { handle: 's', cx: 0.5, cy: 1, cursor: 'ns-resize' },
    { handle: 'sw', cx: 0, cy: 1, cursor: 'nesw-resize' },
    { handle: 'w', cx: 0, cy: 0.5, cursor: 'ew-resize' }
  ];
  readonly lineStyleOptions = [
    { label: 'Solid', value: 'solid' as EdgeLineStyle },
    { label: 'Dashed', value: 'dashed' as EdgeLineStyle }
  ];
  readonly cornerStyleOptions = [
    { label: 'Sharp', value: 'sharp' as EdgeCornerStyle },
    { label: 'Rounded', value: 'rounded' as EdgeCornerStyle },
    { label: 'Sketch', value: 'sketch' as EdgeCornerStyle }
  ];
  readonly diagram = signal<WorkflowDiagram>(initialDiagram());
  readonly activeTool = signal<DiagramTool>('select');
  readonly selectedNodeId = signal<string | null>(null);
  readonly selectedEdgeId = signal<string | null>(null);
  readonly connectorFromId = signal<string | null>(null);
  readonly connectorFromPort = signal<EdgePort | null>(null);
  readonly connectorPreviewPoint = signal<Point | null>(null);
  readonly statusHint = signal('Select a tool, then click the canvas or shapes.');

  readonly labelDialogVisible = signal(false);
  readonly labelDraft = signal('');
  readonly lineStylePanelExpanded = signal(true);
  readonly shapeStylePanelExpanded = signal(true);

  private dragNodeId: string | null = null;
  private dragResize: {
    nodeId: string;
    handle: NodeResizeHandle;
    startBounds: { x: number; y: number; w: number; h: number };
    laneId: string;
  } | null = null;
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
  private dragEndpoint: { edgeId: string; end: 'from' | 'to'; nodeId: string } | null = null;

  readonly canvasHeight = CANVAS_HEIGHT;
  readonly canvasWidth = computed(() => canvasWidth(this.diagram().lanes));
  readonly laneOffsetMap = computed(() => laneOffsets(this.diagram().lanes));
  readonly edgePaths = computed(() => buildEdgePaths(this.diagram()));

  readonly connectorPreviewLine = computed(() => {
    const fromId = this.connectorFromId();
    const fromPort = this.connectorFromPort();
    const cursor = this.connectorPreviewPoint();
    if (!fromId || !fromPort || !cursor) {
      return null;
    }
    const fromBox = allNodeBounds(this.diagram()).find((b) => b.id === fromId);
    if (!fromBox) {
      return null;
    }
    return {
      start: anchorPoint(fromBox, fromPort),
      end: this.resolveConnectorPreviewEnd(cursor, fromId, fromBox)
    };
  });

  readonly selectedEdge = computed(() => {
    const id = this.selectedEdgeId();
    if (!id) return null;
    return this.diagram().edges.find((e) => e.id === id) ?? null;
  });

  readonly selectedEdgeStyle = computed(() => {
    const edge = this.selectedEdge();
    return edge ? resolveEdgeStyle(edge) : DEFAULT_EDGE_STYLE;
  });

  readonly selectedEdgeBendCount = computed(() => {
    const id = this.selectedEdgeId();
    if (!id) {
      return 0;
    }
    const path = this.edgePaths().find((p) => p.id === id);
    if (path) {
      return path.waypoints.length;
    }
    return this.selectedEdge()?.waypoints?.length ?? 0;
  });

  readonly selectedNode = computed(() => {
    const id = this.selectedNodeId();
    if (!id) {
      return null;
    }
    return this.diagram().nodes.find((n) => n.id === id) ?? null;
  });

  readonly selectedNodeStyle = computed((): ResolvedNodeStyle | null => {
    const node = this.selectedNode();
    return node ? resolveNodeStyle(node) : null;
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

  shapeStyle(node: DiagramNode): ResolvedNodeStyle {
    return resolveNodeStyle(node);
  }

  showConnectionPorts(nodeId: string): boolean {
    const tool = this.activeTool();
    if (tool === 'connector') {
      return true;
    }
    if (tool !== 'select') {
      return false;
    }
    if (this.selectedNodeId() === nodeId) {
      return true;
    }
    const edgeId = this.selectedEdgeId();
    if (!edgeId) {
      return false;
    }
    const edge = this.diagram().edges.find((e) => e.id === edgeId);
    return edge ? edge.fromId === nodeId || edge.toId === nodeId : false;
  }

  connectionPorts(nodeId: string): ConnectionPortHit[] {
    const bounds = this.boundsForNode(nodeId);
    if (!bounds) {
      return [];
    }
    const edge = this.selectedEdge();
    if (
      this.activeTool() === 'select' &&
      edge &&
      (edge.fromId === nodeId || edge.toId === nodeId)
    ) {
      const path = this.edgePaths().find((p) => p.id === edge.id);
      if (path) {
        const port = edge.fromId === nodeId ? path.fromPort : path.toPort;
        const pt = edge.fromId === nodeId ? path.start : path.end;
        return connectionPortsForBounds(bounds).map((hit) =>
          hit.side === port.side ? { ...hit, x: pt.x, y: pt.y, ratio: port.ratio } : hit
        );
      }
    }
    return connectionPortsForBounds(bounds);
  }

  private boundsForNode(nodeId: string) {
    const node = this.diagram().nodes.find((n) => n.id === nodeId);
    if (!node) {
      return null;
    }
    const laneX = this.laneX(node.laneId);
    return nodeBounds(node, laneX, this.diagram().laneHeaderHeight);
  }

  toggleLineStylePanel(): void {
    this.lineStylePanelExpanded.update((open) => !open);
  }

  toggleShapeStylePanel(): void {
    this.shapeStylePanelExpanded.update((open) => !open);
  }

  updateSelectedNodeStyle(patch: Partial<NodeStyle>): void {
    const nodeId = this.selectedNodeId();
    if (!nodeId) {
      return;
    }
    const d = this.diagram();
    this.diagram.set({
      ...d,
      nodes: d.nodes.map((n) =>
        n.id === nodeId ? { ...n, style: { ...n.style, ...patch } } : n
      )
    });
  }

  onAlertColorPresetSelect(variant: AlertVariant): void {
    const nodeId = this.selectedNodeId();
    if (!nodeId) {
      return;
    }
    const d = this.diagram();
    this.diagram.set({
      ...d,
      nodes: d.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, variant, style: nodeStyleKeepingBorderWidth(n) }
          : n
      )
    });
  }

  isAlertPresetActive(variant: AlertVariant): boolean {
    const node = this.selectedNode();
    if (!node) {
      return false;
    }
    const effective = node.variant ?? defaultNodeVariant(node.shape);
    return effective === variant && !hasCustomNodeColors(node);
  }

  onNodeBorderWidthChange(width: number): void {
    this.updateSelectedNodeStyle({ borderWidth: width });
  }

  resetSelectedNodeStyle(): void {
    const nodeId = this.selectedNodeId();
    if (!nodeId) {
      return;
    }
    const d = this.diagram();
    this.diagram.set({
      ...d,
      nodes: d.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, variant: defaultNodeVariant(n.shape), style: undefined }
          : n
      )
    });
    this.messages.add({ severity: 'info', summary: 'Shape style reset', life: 1500 });
  }

  openSelectedNodeLabel(): void {
    const node = this.selectedNode();
    if (!node) {
      return;
    }
    this.labelDraft.set(node.label);
    this.labelDialogVisible.set(true);
  }

  setTool(tool: DiagramTool): void {
    this.activeTool.set(tool);
    this.connectorFromId.set(null);
    this.connectorFromPort.set(null);
    this.connectorPreviewPoint.set(null);
    if (tool === 'connector') {
      this.statusHint.set(
        'Click a source connection point — a line follows your cursor. Click a target point or shape to connect.'
      );
    } else if (tool === 'swimlane') {
      this.statusHint.set('Use Add swim lane for a new vertical column.');
    } else if (tool === 'select') {
      this.statusHint.set(
        'Drag shapes to move · drag corner/edge handles to resize · connectors: select line to style or bend.'
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

  onResizeHandleMouseDown(event: MouseEvent, nodeId: string, handle: NodeResizeHandle): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.activeTool() !== 'select') {
      return;
    }
    const node = this.diagram().nodes.find((n) => n.id === nodeId);
    if (!node) {
      return;
    }
    this.dragResize = {
      nodeId,
      handle,
      startBounds: { x: node.x, y: node.y, w: node.w, h: node.h },
      laneId: node.laneId
    };
    this.dragNodeId = null;
    this.selectedNodeId.set(nodeId);
    this.selectedEdgeId.set(null);
    this.suppressCanvasClick = true;
    this.statusHint.set('Drag to resize the shape.');
  }

  onNodeMouseDown(event: MouseEvent, nodeId: string): void {
    event.stopPropagation();
    event.preventDefault();

    const tool = this.activeTool();

    if (tool === 'connector') {
      if (this.connectorFromId()) {
        this.handleConnectorClick(nodeId, null);
      } else {
        this.statusHint.set('Click a connection point on the source shape first.');
      }
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
    this.shapeStylePanelExpanded.set(true);
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

  onArrowHeadChange(type: ArrowMarkerType): void {
    this.updateSelectedEdgeStyle({ arrowHead: type });
  }

  onArrowTailChange(type: ArrowMarkerType): void {
    this.updateSelectedEdgeStyle({ arrowTail: type });
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

  removeBendOnSelectedEdge(): void {
    const edgeId = this.selectedEdgeId();
    if (!edgeId) {
      return;
    }
    const ctx = this.edgeContext(edgeId);
    const edge = this.diagram().edges.find((e) => e.id === edgeId);
    if (!ctx || !edge) {
      return;
    }
    const wps = resolveEdgeWaypoints(edge, ctx.start, ctx.end);
    if (!wps.length) {
      this.messages.add({
        severity: 'warn',
        summary: 'No bends',
        detail: 'This connector has no bends to remove.',
        life: 2000
      });
      return;
    }
    const next = removeWaypointAt(wps, wps.length - 1);
    this.persistEdgeWaypoints(edgeId, next);
    this.selectedEdgeId.set(edgeId);
    this.statusHint.set(`${next.length} bend(s) on this connector.`);
    this.messages.add({ severity: 'info', summary: 'Bend removed', life: 1200 });
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

  onConnectionPortMouseDown(
    event: MouseEvent,
    nodeId: string,
    side: PortSide,
    ratio: number
  ): void {
    event.stopPropagation();
    event.preventDefault();
    this.suppressCanvasClick = true;
    const port: EdgePort = { side, ratio };

    if (this.activeTool() === 'connector') {
      this.handleConnectorClick(nodeId, port);
      return;
    }

    if (this.activeTool() !== 'select') {
      return;
    }

    const edge = this.selectedEdge();
    if (!edge) {
      return;
    }
    if (edge.fromId === nodeId) {
      this.persistEdgePort(edge.id, 'from', port);
    } else if (edge.toId === nodeId) {
      this.persistEdgePort(edge.id, 'to', port);
    }
  }

  onEndpointMouseDown(event: MouseEvent, edgeId: string, end: 'from' | 'to'): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.activeTool() !== 'select') {
      return;
    }
    const edge = this.diagram().edges.find((e) => e.id === edgeId);
    if (!edge) {
      return;
    }
    const nodeId = end === 'from' ? edge.fromId : edge.toId;
    this.dragEndpoint = { edgeId, end, nodeId };
    this.selectedEdgeId.set(edgeId);
    this.selectedNodeId.set(null);
    this.suppressCanvasClick = true;
    this.statusHint.set('Drag along the shape edge to move the arrow attachment.');
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

  onCanvasMouseMove(event: MouseEvent): void {
    if (
      this.activeTool() !== 'connector' ||
      !this.connectorFromId() ||
      !this.connectorFromPort()
    ) {
      return;
    }
    const pt = this.svgPoint(event);
    if (pt) {
      this.connectorPreviewPoint.set(pt);
    }
  }

  onCanvasMouseLeave(): void {
    if (this.activeTool() === 'connector' && this.connectorFromId()) {
      this.connectorPreviewPoint.set(null);
    }
  }

  toggleFullscreen(): void {
    const el = this.designerShell?.nativeElement;
    if (!el) {
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen();
    }
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    const el = this.designerShell?.nativeElement;
    this.fullscreen.set(!!el && document.fullscreenElement === el);
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    if (this.dragEndpoint) {
      this.moveEndpoint(event);
      return;
    }
    if (this.dragSegment) {
      this.moveSegment(event);
      return;
    }
    if (this.dragWaypoint) {
      this.moveWaypoint(event);
      return;
    }
    if (this.dragResize) {
      this.moveResize(event);
      return;
    }
    if (
      this.activeTool() === 'connector' &&
      this.connectorFromId() &&
      this.connectorFromPort()
    ) {
      const pt = this.svgPoint(event);
      if (pt) {
        this.connectorPreviewPoint.set(pt);
      }
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
    this.dragResize = null;
    this.dragSegment = null;
    this.dragWaypoint = null;
    this.dragEndpoint = null;
  }

  private moveResize(event: MouseEvent): void {
    const drag = this.dragResize;
    if (!drag) {
      return;
    }
    const pt = this.svgPoint(event);
    const node = this.diagram().nodes.find((n) => n.id === drag.nodeId);
    const lane = this.diagram().lanes.find((l) => l.id === drag.laneId);
    if (!pt || !node || !lane) {
      return;
    }
    const laneX = this.laneX(drag.laneId);
    const headerH = this.diagram().laneHeaderHeight;
    const localX = pt.x - laneX;
    const localY = pt.y - headerH;
    const maxY = this.laneContentHeight();
    const bounds = resizeNodeBounds(
      drag.handle,
      drag.startBounds,
      localX,
      localY,
      lane.width,
      maxY,
      node.shape
    );
    const d = this.diagram();
    this.diagram.set({
      ...d,
      nodes: d.nodes.map((n) =>
        n.id === drag.nodeId ? { ...n, x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h } : n
      )
    });
  }

  private moveEndpoint(event: MouseEvent): void {
    const drag = this.dragEndpoint;
    if (!drag) {
      return;
    }
    const pt = this.svgPoint(event);
    const bounds = this.boundsForNode(drag.nodeId);
    if (!pt || !bounds) {
      return;
    }
    const port = portFromPoint(bounds, pt);
    this.persistEdgePort(drag.edgeId, drag.end, port);
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
    const { start, end } = resolveEdgeEndpoints(edge, from, to);
    const waypoints = resolveEdgeWaypoints(edge, start, end);
    return {
      start,
      end,
      poly: polylinePoints(start, end, waypoints)
    };
  }

  private persistEdgePort(edgeId: string, end: 'from' | 'to', port: EdgePort): void {
    const d = this.diagram();
    const stored: EdgePort = { side: port.side, ratio: port.ratio };
    this.diagram.set({
      ...d,
      edges: d.edges.map((e) => {
        if (e.id !== edgeId) {
          return e;
        }
        return end === 'from' ? { ...e, fromPort: stored } : { ...e, toPort: stored };
      })
    });
  }

  private persistEdgeWaypoints(edgeId: string, waypoints: Point[]): void {
    const d = this.diagram();
    const stored = waypoints.length ? waypoints.map((p) => ({ ...p })) : undefined;
    this.diagram.set({
      ...d,
      edges: d.edges.map((e) => (e.id === edgeId ? { ...e, waypoints: stored } : e))
    });
  }

  private handleConnectorClick(nodeId: string, toPort: EdgePort | null): void {
    const from = this.connectorFromId();
    if (!from) {
      if (!toPort) {
        this.statusHint.set(
          'Click a connection point on the source shape (top, right, bottom, or left).'
        );
        return;
      }
      this.connectorFromId.set(nodeId);
      this.connectorFromPort.set(toPort);
      this.selectedNodeId.set(nodeId);
      this.selectedEdgeId.set(null);
      this.statusHint.set(
        `Source (${toPort.side}) set — click a target point or shape. Line follows your cursor.`
      );
      return;
    }
    if (from === nodeId) {
      if (toPort) {
        this.connectorFromPort.set(toPort);
        this.statusHint.set(
          `Source (${toPort.side}) set — click a target point or shape. Line follows your cursor.`
        );
      } else {
        this.connectorFromId.set(null);
        this.connectorFromPort.set(null);
        this.connectorPreviewPoint.set(null);
        this.statusHint.set('Connector cleared — pick a new source point.');
      }
      return;
    }
    const d = this.diagram();
    const bounds = new Map(allNodeBounds(d).map((b) => [b.id, b]));
    const fromBox = bounds.get(from);
    const toBox = bounds.get(nodeId);
    if (!fromBox || !toBox) {
      return;
    }

    const resolvedFrom = this.connectorFromPort() ?? defaultPortToward(fromBox, toBox);
    const resolvedTo = toPort ?? defaultPortToward(toBox, fromBox);

    const exists = d.edges.some(
      (e) =>
        e.fromId === from &&
        e.toId === nodeId &&
        e.fromPort?.side === resolvedFrom.side &&
        e.toPort?.side === resolvedTo.side
    );
    if (!exists) {
      const { start, end } = resolveEdgeEndpoints(
        { id: '', fromId: from, toId: nodeId, fromPort: resolvedFrom, toPort: resolvedTo },
        fromBox,
        toBox
      );
      const waypoints = waypointsForNewEdge(start, end);
      this.diagram.set({
        ...d,
        edges: [
          ...d.edges,
          {
            id: newId('e'),
            fromId: from,
            toId: nodeId,
            fromPort: resolvedFrom,
            toPort: resolvedTo,
            waypoints,
            style: { ...DEFAULT_EDGE_STYLE }
          }
        ]
      });
      this.messages.add({ severity: 'info', summary: 'Connected', life: 1500 });
    }
    this.connectorFromPort.set(resolvedFrom);
    this.selectedNodeId.set(nodeId);
    this.selectedEdgeId.set(null);
    this.statusHint.set(
      'Source locked — click another target point or shape, or click the source shape to reset.'
    );
  }

  private resolveConnectorPreviewEnd(cursor: Point, fromId: string, fromBox: NodeBounds): Point {
    const boundsList = allNodeBounds(this.diagram());
    let nearestPort: { dist: number; point: Point } | null = null;

    for (const box of boundsList) {
      if (box.id === fromId) {
        continue;
      }
      for (const hit of connectionPortsForBounds(box)) {
        const dist = Math.hypot(cursor.x - hit.x, cursor.y - hit.y);
        if (dist <= 14 && (!nearestPort || dist < nearestPort.dist)) {
          nearestPort = { dist, point: { x: hit.x, y: hit.y } };
        }
      }
    }
    if (nearestPort) {
      return nearestPort.point;
    }

    for (const box of boundsList) {
      if (box.id === fromId) {
        continue;
      }
      if (
        cursor.x >= box.left &&
        cursor.x <= box.right &&
        cursor.y >= box.top &&
        cursor.y <= box.bottom
      ) {
        return anchorPoint(box, defaultPortToward(box, fromBox));
      }
    }
    return cursor;
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
