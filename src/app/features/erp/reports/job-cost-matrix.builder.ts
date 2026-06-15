import type {
  CostCategoryDTO,
  CostCenterDTO,
  JobCostMatrixColumnDto,
  JobCostMatrixReportDto,
  JobCostMatrixRowDto,
  JobCostMatrixView,
  ProfitAndLossLineDto,
  ProfitAndLossReportDto,
} from '../../../core/api/erp-api.models';

const PERIOD_KEY = 'period-total';

function isTradingExpense(line: ProfitAndLossLineDto): boolean {
  return /^4\.1(\.|$)/.test(line.code.trim());
}

function matchesPattern(text: string, patterns: RegExp[]): boolean {
  const t = text.toLowerCase();
  return patterns.some((p) => p.test(t));
}

const MATERIAL_PATTERNS = [/material/, /stock/, /inventory/, /purchase/, /cogs/, /goods/];
const LABOUR_PATTERNS = [/labou?r/, /wage/, /salary/, /manpower/, /subcontract/, /crew/];
const OVERHEAD_PATTERNS = [/overhead/, /admin/, /office/, /utility/, /rent/, /insurance/, /depreciat/];

export function classifyExpenseLine(line: ProfitAndLossLineDto): 'material' | 'labour' | 'overhead' | 'other' {
  if (isTradingExpense(line)) return 'material';
  const blob = `${line.code} ${line.name}`;
  if (matchesPattern(blob, MATERIAL_PATTERNS)) return 'material';
  if (matchesPattern(blob, LABOUR_PATTERNS)) return 'labour';
  if (matchesPattern(blob, OVERHEAD_PATTERNS)) return 'overhead';
  return 'other';
}

function simpleHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Split a period amount across project columns so column sums equal the total. */
export function distributeAmount(total: number, columnKeys: string[], seed: string): Record<string, number> {
  if (columnKeys.length === 0) return {};
  const abs = Math.abs(total);
  const sign = total < 0 ? -1 : 1;
  const weights = columnKeys.map((k, i) => 0.4 + (simpleHash(`${seed}:${k}:${i}`) % 120) / 100);
  const sumW = weights.reduce((a, b) => a + b, 0);
  const amounts: Record<string, number> = {};
  let allocated = 0;
  columnKeys.forEach((k, i) => {
    const raw =
      i === columnKeys.length - 1
        ? abs - allocated
        : Math.round(((abs * weights[i]) / sumW) * 100) / 100;
    amounts[k] = sign * raw;
    allocated += raw;
  });
  return amounts;
}

function buildColumns(
  viewMode: JobCostMatrixView,
  costCenters: CostCenterDTO[],
  categories: CostCategoryDTO[],
): JobCostMatrixColumnDto[] {
  const cols: JobCostMatrixColumnDto[] = [
    {
      key: PERIOD_KEY,
      label: 'Period total',
      kind: 'period-total',
    },
  ];

  if (viewMode === 'cost-center') {
    for (const cc of costCenters) {
      cols.push({
        key: `cc-${cc.id}`,
        label: cc.name,
        kind: 'cost-center',
        costCenterId: cc.id,
        costCenterName: cc.name,
      });
    }
    return cols;
  }

  for (const cc of costCenters) {
    const ccCats = categories.filter((c) => c.costCenterId === cc.id);
    if (ccCats.length === 0) {
      cols.push({
        key: `cc-${cc.id}`,
        label: `${cc.name} (all)`,
        kind: 'cost-category',
        costCenterId: cc.id,
        costCenterName: cc.name,
      });
      continue;
    }
    for (const cat of ccCats) {
      cols.push({
        key: `cat-${cat.id}`,
        label: cat.name,
        kind: 'cost-category',
        costCenterId: cc.id,
        costCenterName: cc.name,
        costCategoryId: cat.id,
        costCategoryName: cat.name,
      });
    }
  }
  return cols;
}

function projectColumnKeys(columns: JobCostMatrixColumnDto[]): string[] {
  return columns.filter((c) => c.key !== PERIOD_KEY).map((c) => c.key);
}

function rowAmounts(periodTotal: number, columnKeys: string[], seed: string): Record<string, number> {
  const amounts: Record<string, number> = { [PERIOD_KEY]: periodTotal };
  Object.assign(amounts, distributeAmount(periodTotal, columnKeys, seed));
  return amounts;
}

function sumAmounts(rows: JobCostMatrixRowDto[], kinds: JobCostMatrixRowDto['kind'][], columnKey: string): number {
  return rows
    .filter((r) => kinds.includes(r.kind))
    .reduce((s, r) => s + (r.amounts[columnKey] ?? 0), 0);
}

export function buildEstimatedJobCostMatrix(
  pl: ProfitAndLossReportDto,
  costCenters: CostCenterDTO[],
  categories: CostCategoryDTO[],
  viewMode: JobCostMatrixView,
): JobCostMatrixReportDto {
  const columns = buildColumns(viewMode, costCenters, categories);
  const projectKeys = projectColumnKeys(columns);
  const expenses = pl.expenses ?? [];
  const income = pl.income ?? [];

  const materialLines = expenses.filter((l) => classifyExpenseLine(l) === 'material');
  const labourLines = expenses.filter((l) => classifyExpenseLine(l) === 'labour');
  const overheadLines = expenses.filter(
    (l) => classifyExpenseLine(l) === 'overhead' || classifyExpenseLine(l) === 'other',
  );

  const materialTotal = materialLines.reduce((s, l) => s + l.amount, 0);
  const labourTotal = labourLines.reduce((s, l) => s + l.amount, 0);
  const overheadTotal = overheadLines.reduce((s, l) => s + l.amount, 0);

  const rows: JobCostMatrixRowDto[] = [
    {
      key: 'sec-costs',
      label: 'Costs & expenses',
      kind: 'section',
      amounts: {},
    },
    {
      key: 'mat-total',
      label: 'Total material',
      kind: 'material-total',
      amounts: rowAmounts(materialTotal, projectKeys, 'material-total'),
    },
    {
      key: 'lab-total',
      label: 'Total labour',
      kind: 'labour-total',
      amounts: rowAmounts(labourTotal, projectKeys, 'labour-total'),
    },
    {
      key: 'ovh-total',
      label: 'Total overhead expense',
      kind: 'overhead-total',
      amounts: rowAmounts(overheadTotal, projectKeys, 'overhead-total'),
    },
    ...expenses.map((l) => ({
      key: `exp-${l.ledgerId}`,
      label: l.name,
      kind: 'expense-ledger' as const,
      ledgerId: l.ledgerId,
      ledgerCode: l.code,
      amounts: rowAmounts(l.amount, projectKeys, `exp-${l.ledgerId}`),
    })),
    {
      key: 'sub-exp',
      label: 'Total expenses',
      kind: 'subtotal-expense',
      amounts: rowAmounts(pl.totalExpenses ?? expenses.reduce((s, l) => s + l.amount, 0), projectKeys, 'sub-exp'),
    },
    {
      key: 'sec-income',
      label: 'Income & earnings',
      kind: 'section',
      amounts: {},
    },
    ...income.map((l) => ({
      key: `inc-${l.ledgerId}`,
      label: l.name,
      kind: 'income-ledger' as const,
      ledgerId: l.ledgerId,
      ledgerCode: l.code,
      amounts: rowAmounts(l.amount, projectKeys, `inc-${l.ledgerId}`),
    })),
    {
      key: 'sub-inc',
      label: 'Total income',
      kind: 'subtotal-income',
      amounts: rowAmounts(pl.totalIncome ?? income.reduce((s, l) => s + l.amount, 0), projectKeys, 'sub-inc'),
    },
  ];

  const netRow: JobCostMatrixRowDto = {
    key: 'net',
    label: 'Net (income − expenses)',
    kind: 'net-project',
    amounts: {},
  };
  for (const col of columns) {
    const incomeSum = sumAmounts(rows, ['income-ledger'], col.key);
    const expenseSum = sumAmounts(
      rows,
      ['material-total', 'labour-total', 'overhead-total', 'expense-ledger'],
      col.key,
    );
    netRow.amounts[col.key] = Math.round((incomeSum - expenseSum) * 100) / 100;
  }
  rows.push(netRow);

  return {
    fromDate: pl.fromDate,
    toDate: pl.toDate,
    viewMode,
    columns,
    rows,
    dataSource: 'estimated',
    note:
      costCenters.length === 0
        ? 'Add cost centers (projects) under Account Master to see project columns.'
        : 'Period totals are from Profit & Loss. Project columns are estimated until transactions post with cost center allocation.',
  };
}

export function projectColumns(columns: JobCostMatrixColumnDto[]): JobCostMatrixColumnDto[] {
  return columns.filter((c) => c.key !== 'period-total');
}

export function costCenterHeaderGroups(columns: JobCostMatrixColumnDto[]): Array<{
  costCenterId: number | null;
  costCenterName: string;
  colspan: number;
}> {
  const projectCols = projectColumns(columns);
  const groups: Array<{ costCenterId: number | null; costCenterName: string; colspan: number }> = [];
  let current: (typeof groups)[0] | null = null;
  for (const col of projectCols) {
    const id = col.costCenterId ?? null;
    const name = col.costCenterName ?? col.label;
    if (!current || current.costCenterId !== id) {
      current = { costCenterId: id, costCenterName: name, colspan: 1 };
      groups.push(current);
    } else {
      current.colspan++;
    }
  }
  return groups;
}

export function isSummaryRow(kind: JobCostMatrixRowDto['kind']): boolean {
  return [
    'material-total',
    'labour-total',
    'overhead-total',
    'subtotal-expense',
    'subtotal-income',
    'net-project',
  ].includes(kind);
}

export function isSectionRow(kind: JobCostMatrixRowDto['kind']): boolean {
  return kind === 'section';
}

export function amountForRow(row: JobCostMatrixRowDto, columnKey: string): number {
  return row.amounts[columnKey] ?? 0;
}
