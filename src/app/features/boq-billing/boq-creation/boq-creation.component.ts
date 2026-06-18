import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuItem, PrimeTemplate } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { getModuleById } from '../../../core/constants/feature-registry';
import { ProjectsApiService } from '../../../core/api/project-planning';
import {
  BOQ_PROJECTS,
  BOQ_UNITS,
  DEMO_BOQ_SECTIONS,
  ITEM_CODE_CATALOG,
  BoqLineItem,
  BoqSection,
  formatMoney,
  lineAmount,
  roundMoney
} from './boq-creation.data';

interface SectionRow {
  section: BoqSection;
  depth: number;
  subtotal: number;
}

@Component({
  selector: 'app-boq-creation',
  imports: [
    FormsModule,
    PrimeTemplate,
    Breadcrumb,
    Button,
    Card,
    Dialog,
    InputNumber,
    InputText,
    Select,
    Tag
  ],
  templateUrl: './boq-creation.component.html',
  styleUrl: './boq-creation.component.scss'
})
export class BoqCreationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectsApi = inject(ProjectsApiService);

  readonly projectOptions = BOQ_PROJECTS;
  readonly unitOptions = BOQ_UNITS.map((u) => ({ label: u, value: u }));
  readonly itemCodeOptions = ITEM_CODE_CATALOG.map((c) => ({
    label: `${c.code} — ${c.description}`,
    value: c.code,
    ...c
  }));

  readonly selectedProjectId = signal('tower-a');
  readonly boqTitle = signal('Bill of Quantities — Tower Block A');
  readonly sections = signal<BoqSection[]>([]);
  readonly selectedSectionId = signal<string>('');

  readonly sectionDialogVisible = signal(false);
  readonly sectionDraftCode = signal('');
  readonly sectionDraftTitle = signal('');
  readonly sectionDraftParentId = signal<string | null>(null);

  ngOnInit(): void {
    this.projectsApi.list().subscribe({
      next: (projects) => {
        console.log('[BoqCreation] GET /projects', projects);
        const projectId = projects[0]?.id ?? 'P-001';
        this.projectsApi.getBoq(projectId).subscribe({
          next: (boq) => console.log('[BoqCreation] GET /projects/' + projectId + '/boq', boq),
          error: (err) =>
            console.error('[BoqCreation] GET /projects/' + projectId + '/boq failed', err)
        });
      },
      error: (err) => console.error('[BoqCreation] GET /projects failed', err)
    });
  }

  readonly breadcrumbs = computed<MenuItem[]>(() => {
    const moduleId = this.route.snapshot.data['moduleId'] as string | undefined;
    const mod = moduleId ? getModuleById(moduleId) : undefined;
    const items: MenuItem[] = [{ label: 'Home', routerLink: '/dashboard' }];
    if (mod) {
      items.push({ label: mod.title, routerLink: `/${mod.routePath}` });
    }
    items.push({ label: 'BOQ Creation' });
    return items;
  });

  readonly parentSectionOptions = computed(() => {
    const roots = [{ label: '— Top level (no parent) —', value: null as string | null }];
    const flat = this.flattenSections();
    return [
      ...roots,
      ...flat.map((r) => ({
        label: `${'  '.repeat(r.depth)}${r.section.code} — ${r.section.title}`,
        value: r.section.id
      }))
    ];
  });

  readonly sectionRows = computed(() => this.flattenSections());

  readonly selectedSection = computed(() => {
    const id = this.selectedSectionId();
    return this.sections().find((s) => s.id === id) ?? null;
  });

  readonly selectedItems = computed(() => {
    const section = this.selectedSection();
    return section ? [...section.items] : [];
  });

  readonly selectedSectionSubtotal = computed(() => {
    const section = this.selectedSection();
    return section ? this.sectionSubtotal(section.id) : 0;
  });

  readonly grandTotal = computed(() => {
    return this.sections()
      .filter((s) => !s.parentId)
      .reduce((sum, s) => sum + this.sectionSubtotal(s.id), 0);
  });

  readonly totalLineCount = computed(() =>
    this.sections().reduce((n, s) => n + s.items.length, 0)
  );

  onProjectChange(projectId: string): void {
    this.selectedProjectId.set(projectId);
    const label = this.projectOptions.find((p) => p.value === projectId)?.label ?? projectId;
    this.boqTitle.set(`Bill of Quantities — ${label}`);
  }

  selectSection(id: string): void {
    this.selectedSectionId.set(id);
  }

  openAddSection(): void {
    this.sectionDraftCode.set('');
    this.sectionDraftTitle.set('');
    this.sectionDraftParentId.set(this.selectedSectionId());
    this.sectionDialogVisible.set(true);
  }

  saveSection(): void {
    const code = this.sectionDraftCode().trim();
    const title = this.sectionDraftTitle().trim();
    if (!code || !title) return;

    const section: BoqSection = {
      id: `sec-${Date.now()}`,
      code: code.toUpperCase(),
      title,
      parentId: this.sectionDraftParentId(),
      items: []
    };

    this.sections.update((list) => [...list, section]);
    this.selectedSectionId.set(section.id);
    this.sectionDialogVisible.set(false);
  }

  addLineItem(): void {
    const sectionId = this.selectedSectionId();
    if (!sectionId) return;

    const item: BoqLineItem = {
      id: `li-${Date.now()}`,
      itemNo: '',
      itemCode: '',
      description: '',
      unit: 'm³',
      qty: 0,
      rate: 0
    };

    this.sections.update((list) =>
      list.map((s) => {
        if (s.id !== sectionId) return s;
        const items = [...s.items, item];
        this.renumberItems(items);
        return { ...s, items };
      })
    );
  }

  removeLineItem(itemId: string): void {
    const sectionId = this.selectedSectionId();
    this.sections.update((list) =>
      list.map((s) => {
        if (s.id !== sectionId) return s;
        const items = s.items.filter((i) => i.id !== itemId);
        this.renumberItems(items);
        return { ...s, items };
      })
    );
  }

  updateLineItem(itemId: string, patch: Partial<BoqLineItem>): void {
    const sectionId = this.selectedSectionId();
    this.sections.update((list) =>
      list.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          items: s.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i))
        };
      })
    );
  }

  onItemCodeChange(item: BoqLineItem, code: string | null): void {
    if (!code) {
      this.updateLineItem(item.id, { itemCode: '' });
      return;
    }
    const catalog = ITEM_CODE_CATALOG.find((c) => c.code === code);
    const patch: Partial<BoqLineItem> = { itemCode: code };
    if (catalog) {
      patch.description = catalog.description;
      patch.unit = catalog.unit;
      if (!item.rate) {
        patch.rate = catalog.typicalRate;
      }
    }
    this.updateLineItem(item.id, patch);
  }

  calcLineAmount(item: BoqLineItem): number {
    return lineAmount(item);
  }

  formatMoney(value: number): string {
    return formatMoney(value);
  }

  sectionSubtotal(sectionId: string): number {
    const section = this.sections().find((s) => s.id === sectionId);
    if (!section) return 0;

    const itemsTotal = section.items.reduce((sum, i) => sum + lineAmount(i), 0);
    const children = this.sections().filter((s) => s.parentId === sectionId);
    const childrenTotal = children.reduce((sum, c) => sum + this.sectionSubtotal(c.id), 0);

    return roundMoney(itemsTotal + childrenTotal);
  }

  private flattenSections(): SectionRow[] {
    const sections = this.sections();
    const rows: SectionRow[] = [];

    const walk = (parentId: string | null, depth: number): void => {
      const children = sections
        .filter((s) => s.parentId === parentId)
        .sort((a, b) => a.code.localeCompare(b.code));

      for (const section of children) {
        rows.push({ section, depth, subtotal: this.sectionSubtotal(section.id) });
        walk(section.id, depth + 1);
      }
    };

    walk(null, 0);
    return rows;
  }

  private renumberItems(items: BoqLineItem[]): void {
    const section = this.selectedSection();
    const prefix = section?.code ?? 'ITM';
    items.forEach((item, index) => {
      if (!item.itemNo || /^\d+$/.test(item.itemNo)) {
        item.itemNo = `${prefix}-${index + 1}`;
      }
    });
  }
}
