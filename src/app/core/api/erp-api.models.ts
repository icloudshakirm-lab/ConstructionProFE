/**
 * Types aligned with ERP.Web OpenAPI `swagger/v1/swagger.json` (camelCase JSON).
 * Regenerate or diff against the backend when contracts change.
 * Reports: `GET .../items-closing-balance` and `GET .../ledgers/closing-balance` require `toDate` (RFC3339).
 */

export interface PagedResponse<T> {
  items: T[];
  page: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
  openingBalance?: number;
  closingBalance?: number;
  openingBalanceNature?: string;
  closingBalanceNature?: string;
  isBalanceDr?: boolean;
}

export interface AuthTokenResponse {
  userId: string;
  email: string;
  userName: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  userName: string;
  password: string;
}

export interface RefreshRequest {
  accessToken: string;
  refreshToken: string;
}

export interface CurrentUserResponse {
  userId: string;
  email: string;
  userName: string;
  roles: string[];
}

export interface CreateTransactionRequest {
  voucherNumber: string;
  type: string;
  date?: string;
  description?: string | null;
  childTransactions: CreateChildTransactionRequest[];
}

export interface CreateChildTransactionRequest {
  description?: string;
  reference?: string | null;
  ledgerId?: number | null;
  ledgerEntryType?: string | null;
  ledgerAmount?: number | null;
  inventoryBatchId?: number | null;
  inventoryType?: string | null;
  itemId?: string | null;
  quantity?: number | null;
  rate?: number | null;
}

export interface CreateTransactionResponse {
  id: number;
  voucherNumber: string;
}

export type UpdateTransactionRequest = CreateTransactionRequest;
export type UpdateTransactionResponse = CreateTransactionResponse;

export interface ManufacturingStockLineRequest {
  itemBatchId?: number | null;
  itemId: number;
  description?: string | null;
  quantity: number;
  rate: number;
}

export interface ManufacturingExpenseRequest {
  ledgerId: number;
  amount: number;
  description?: string | null;
}

export interface ManufacturingLedgerLineRequest {
  ledgerId: number;
  entryType: string;
  amount: number;
  description?: string | null;
}

export interface CreateManufacturingTransactionRequest {
  voucherNumber: string;
  date?: string;
  description?: string | null;
  rawMaterials: ManufacturingStockLineRequest[];
  expenses: ManufacturingExpenseRequest[];
  ledgerLines: ManufacturingLedgerLineRequest[];
  outputStock: ManufacturingStockLineRequest[];
}

export interface CreateManufacturingTransactionResponse {
  id: number;
  voucherNumber: string;
}

export interface DashboardChartPointDto {
  date: string; // yyyy-mm-dd
  count: number;
  amount: number;
}

export interface DashboardVoucherBreakdownDto {
  code: string;
  name: string;
  count: number;
  amount: number;
}

export interface DashboardTopItemDto {
  itemId: number;
  title: string;
  barcode: string;
  quantity: number;
  amount: number;
}

export interface DashboardChartsDto {
  fromDate: string;
  toDate: string;
  salesByDay: DashboardChartPointDto[];
  purchasesByDay: DashboardChartPointDto[];
  salesByVoucherType: DashboardVoucherBreakdownDto[];
  topSellingItems: DashboardTopItemDto[];
}

export interface DashboardOrganizationStatsDto {
  users: number;
  tills: number;
  activeTills: number;
  branches: number;
  activeBranches: number;
  warehouses: number;
  godowns: number;
}

export interface DashboardSalesStatsDto {
  count: number;
  totalAmount: number;
  periodCount: number;
  periodTotalAmount: number;
  todayCount: number;
  todayTotalAmount: number;
}

export interface DashboardPurchasesStatsDto {
  count: number;
  totalAmount: number;
  periodCount: number;
  periodTotalAmount: number;
  todayCount: number;
  todayTotalAmount: number;
}

export interface DashboardStockStatsDto {
  items: number;
  activeItems: number;
  batches: number;
  totalQuantity: number;
  totalValue: number;
  lowStockItems: number;
}

export interface DashboardMasterDataStatsDto {
  ledgers: number;
  activeLedgers: number;
  customers: number;
  vendors: number;
  currencies: number;
  projects: number;
}

export interface DashboardOperationalStatsDto {
  purchaseOrders: number;
  quotations: number;
  deliveryNotes: number;
}

export interface DashboardVoucherStatsDto {
  journal: number;
  payment: number;
  receipt: number;
  manufacturing: number;
  pointOfSale: number;
}

export interface DashboardPeriodDto {
  fromDate?: string | null;
  toDate?: string | null;
}

export interface DashboardStatsDto {
  organization: DashboardOrganizationStatsDto;
  sales: DashboardSalesStatsDto;
  purchases: DashboardPurchasesStatsDto;
  stock: DashboardStockStatsDto;
  masterData: DashboardMasterDataStatsDto;
  operational: DashboardOperationalStatsDto;
  vouchers: DashboardVoucherStatsDto;
  period?: DashboardPeriodDto | null;
}

export interface TransactionDTO {
  id: number;
  voucherNumber: string;
  type: string;
  date: string;
  description?: string | null;
  status: string;
  totalAmount: number;
  totalQuantity: number;
  childTransactions: ChildTransactionDTO[];
  tillNo?: string | null;
}

export interface ChildTransactionDTO {
  id: number;
  parentTransactionId: number;
  description: string;
  reference?: string | null;
  ledgerId?: number | null;
  ledgerName?: string | null;
  ledgerEntryType?: string | null;
  ledgerAmount?: number | null;
  inventoryBatchId?: number | null;
  itemId?: string | null;
  quantity?: number | null;
  rate?: number | null;
  inventoryAmount?: number | null;
  againstLedger?: string | null;
}

export interface BatchDTO {
  id: number;
  itemId: number;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate?: string | null;
  availableQuantity: number;
  allocatedQuantity: number;
  notes?: string | null;
  defaultPrice: number;
}

export interface ItemDTO {
  id: number;
  name: string;
  title: string;
  /** Stock / scan code (max 64 in API). */
  barcode: string;
  description?: string | null;
  /** Parent stock / item group (required in API responses). */
  itemGroupId: number;
}

/** `GET /items/by-barcode/{barcode}` — item plus batch summaries for POS / lookups. */
export interface ItemWithBatchesDto {
  item: ItemDTO;
  batches: ItemBatchSummaryDto[];
}

export interface ItemBatchSummaryDto {
  batchId: number;
  name: string;
  expiryDate?: string | null;
  manufacturingDate: string;
  defaultPrice: number;
}

export interface LookupDTO {
  id: number;
  name: string;
}


// ----------------------------
// Reports
// ----------------------------

export interface ItemClosingBalanceDto {
  itemId: number;
  barcode: string;
  title: string;
  closingAvailableQuantity: number;
  currentAvailableQuantity: number;
}

export interface LedgerClosingBalanceDto {
  ledgerId: number;
  code: string;
  name: string;
  closingBalance: number;
}

/** `GET /reports/financial/trial-balance?fromDate=&toDate=` */
export interface TrialBalanceReportDto {
  fromDate?: string;
  toDate?: string;
  lines?: TrialBalanceLineDto[];
  totalOpeningDebit?: number;
  totalOpeningCredit?: number;
  totalPeriodDebit?: number;
  totalPeriodCredit?: number;
  totalClosingDebit?: number;
  totalClosingCredit?: number;
}

export interface TrialBalanceLineDto {
  ledgerId: number;
  code: string;
  name: string;
  ledgerType?: string;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

/** `GET /reports/financial/profit-and-loss?fromDate=&toDate=` */
export interface ProfitAndLossReportDto {
  fromDate?: string;
  toDate?: string;
  income?: ProfitAndLossLineDto[];
  expenses?: ProfitAndLossLineDto[];
  totalIncome?: number;
  totalExpenses?: number;
  totalOpeningStockAmount?: number;
  totalClosingStockAmount?: number;
  netProfit?: number;
}

export interface ProfitAndLossLineDto {
  ledgerId: number;
  code: string;
  name: string;
  section?: string;
  amount: number;
}

/** `GET /reports/financial/job-cost-matrix?fromDate=&toDate=&view=` */
export type JobCostMatrixView = 'cost-center' | 'cost-category';

export type JobCostColumnKind = 'period-total' | 'cost-center' | 'cost-category';

export interface JobCostMatrixColumnDto {
  key: string;
  label: string;
  kind: JobCostColumnKind;
  costCenterId?: number | null;
  costCenterName?: string | null;
  costCategoryId?: number | null;
  costCategoryName?: string | null;
}

export type JobCostRowKind =
  | 'section'
  | 'material-total'
  | 'labour-total'
  | 'overhead-total'
  | 'expense-ledger'
  | 'income-ledger'
  | 'subtotal-expense'
  | 'subtotal-income'
  | 'net-project';

export interface JobCostMatrixRowDto {
  key: string;
  label: string;
  kind: JobCostRowKind;
  ledgerId?: number | null;
  ledgerCode?: string | null;
  amounts: Record<string, number>;
}

export interface JobCostMatrixReportDto {
  fromDate?: string;
  toDate?: string;
  viewMode: JobCostMatrixView;
  columns: JobCostMatrixColumnDto[];
  rows: JobCostMatrixRowDto[];
  /** `api` when served by backend; `estimated` when built from P&L + master data. */
  dataSource?: 'api' | 'estimated';
  note?: string | null;
}

/** `GET /reports/financial/balance-sheet?fromDate=&toDate=` */
export interface BalanceSheetReportDto {
  fromDate?: string;
  toDate?: string;
  assets?: BalanceSheetLineDto[];
  liabilities?: BalanceSheetLineDto[];
  totalAssets?: number;
  totalLiabilities?: number;
  netProfitForPeriod?: number;
  totalEquity?: number;
  totalLiabilitiesAndEquity?: number;
}

export interface BalanceSheetLineDto {
  ledgerId: number;
  code: string;
  name: string;
  section?: string;
  amount: number;
}

// ----------------------------
// Purchase Orders
// ----------------------------

export interface PurchaseOrderListItemDto {
  id: number;
  poNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string | null;
  status: string;
  vendorLedgerId: number;
  vendorName: string;
  totalAmount: number;
  lineCount: number;
}

export interface PurchaseOrderDto {
  id: number;
  poNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string | null;
  reference?: string | null;
  notes?: string | null;
  deliveryAddress?: string | null;
  status: string;
  vendorLedgerId: number;
  vendorName: string;
  vendorCode: string;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  lines: PurchaseOrderLineDto[];
}

export interface PurchaseOrderLineDto {
  id: number;
  lineNumber: number;
  itemId: number;
  itemTitle: string;
  itemBarcode?: string | null;
  itemBatchId?: number | null;
  batchNumber?: string | null;
  unitOfMeasureId?: number | null;
  unitOfMeasureName?: string | null;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  lineAmount: number;
}

export interface PurchaseOrderLineRequest {
  lineNumber: number;
  itemId: number;
  itemBatchId?: number | null;
  unitOfMeasureId?: number | null;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
}

export interface CreatePurchaseOrderRequest {
  poNumber: string;
  orderDate?: string;
  vendorLedgerId: number;
  expectedDeliveryDate?: string | null;
  reference?: string | null;
  notes?: string | null;
  deliveryAddress?: string | null;
  status?: string | null;
  lines: PurchaseOrderLineRequest[];
}

export interface CreatePurchaseOrderResponse {
  id: number;
}

export interface UpdatePurchaseOrderRequest {
  orderDate?: string;
  vendorLedgerId: number;
  expectedDeliveryDate?: string | null;
  reference?: string | null;
  notes?: string | null;
  deliveryAddress?: string | null;
  status?: string | null;
  lines: PurchaseOrderLineRequest[];
}

export interface ListPurchaseOrdersParams {
  vendorLedgerId?: number | null;
  status?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

// ----------------------------
// Quotations
// ----------------------------

export interface QuotationListItemDto {
  id: number;
  quotationNumber: string;
  quotationDate: string;
  validUntil?: string | null;
  status: string;
  customerLedgerId: number;
  customerName: string;
  totalAmount: number;
  lineCount: number;
}

export interface QuotationDto {
  id: number;
  quotationNumber: string;
  quotationDate: string;
  validUntil?: string | null;
  reference?: string | null;
  notes?: string | null;
  deliveryAddress?: string | null;
  status: string;
  customerLedgerId: number;
  customerName: string;
  customerCode: string;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  lines: QuotationLineDto[];
}

export interface QuotationLineDto {
  id: number;
  lineNumber: number;
  itemId: number;
  itemTitle: string;
  itemBarcode?: string | null;
  itemBatchId?: number | null;
  batchNumber?: string | null;
  unitOfMeasureId?: number | null;
  unitOfMeasureName?: string | null;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  lineAmount: number;
}

export interface QuotationLineRequest {
  lineNumber: number;
  itemId: number;
  itemBatchId?: number | null;
  unitOfMeasureId?: number | null;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
}

export interface CreateQuotationRequest {
  quotationNumber: string;
  quotationDate?: string;
  customerLedgerId: number;
  validUntil?: string | null;
  reference?: string | null;
  notes?: string | null;
  deliveryAddress?: string | null;
  status?: string | null;
  lines: QuotationLineRequest[];
}

export interface CreateQuotationResponse {
  id: number;
}

export interface UpdateQuotationRequest {
  quotationDate?: string;
  customerLedgerId: number;
  validUntil?: string | null;
  reference?: string | null;
  notes?: string | null;
  deliveryAddress?: string | null;
  status?: string | null;
  lines: QuotationLineRequest[];
}

export interface ListQuotationsParams {
  customerLedgerId?: number | null;
  status?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

// ----------------------------
// Delivery Notes
// ----------------------------

export interface DeliveryNoteListItemDto {
  id: number;
  dnNumber: string;
  deliveryDate: string;
  status: string;
  customerLedgerId: number;
  customerName: string;
  quotationId?: number | null;
  quotationNumber?: string | null;
  totalAmount: number;
  lineCount: number;
}

export interface DeliveryNoteDto {
  id: number;
  dnNumber: string;
  deliveryDate: string;
  reference?: string | null;
  notes?: string | null;
  deliveryAddress?: string | null;
  status: string;
  customerLedgerId: number;
  customerName: string;
  customerCode: string;
  quotationId?: number | null;
  quotationNumber?: string | null;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  lines: DeliveryNoteLineDto[];
}

export interface DeliveryNoteLineDto {
  id: number;
  lineNumber: number;
  itemId: number;
  itemTitle: string;
  itemBarcode?: string | null;
  itemBatchId?: number | null;
  batchNumber?: string | null;
  unitOfMeasureId?: number | null;
  unitOfMeasureName?: string | null;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  lineAmount: number;
}

export interface DeliveryNoteLineRequest {
  lineNumber: number;
  itemId: number;
  itemBatchId?: number | null;
  unitOfMeasureId?: number | null;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
}

export interface CreateDeliveryNoteRequest {
  dnNumber: string;
  deliveryDate?: string;
  customerLedgerId: number;
  quotationId?: number | null;
  reference?: string | null;
  notes?: string | null;
  deliveryAddress?: string | null;
  status?: string | null;
  lines: DeliveryNoteLineRequest[];
}

export interface CreateDeliveryNoteFromQuotationRequest {
  dnNumber?: string | null;
  deliveryDate?: string | null;
  reference?: string | null;
  notes?: string | null;
  deliveryAddress?: string | null;
  status?: string | null;
}

export interface CreateDeliveryNoteResponse {
  id: number;
}

export interface UpdateDeliveryNoteRequest {
  deliveryDate?: string;
  customerLedgerId: number;
  quotationId?: number | null;
  reference?: string | null;
  notes?: string | null;
  deliveryAddress?: string | null;
  status?: string | null;
  lines: DeliveryNoteLineRequest[];
}

export interface ListDeliveryNotesParams {
  customerLedgerId?: number | null;
  quotationId?: number | null;
  status?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

export interface CreateLedgerRequest {
  code: string;
  name: string;
  description?: string | null;
  groupLedgerId?: number | null;
  type?: number;
}

export interface CreateLedgerResponse {
  id: number;
}

export interface UpdateLedgerRequest {
  code: string;
  name: string;
  description?: string | null;
  groupLedgerId?: number | null;
  type?: number;
}

export interface LedgerDTO {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  groupLedgerId?: number | null;
  groupName?: string | null;
  isBalanceDr?: boolean;
}

export interface CreateLedgerGroupRequest {
  code: string;
  name: string;
  description?: string | null;
  parentGroupId?: number | null;
}

export interface CreateLedgerGroupResponse {
  id: number;
}

export interface UpdateLedgerGroupRequest {
  code: string;
  name: string;
  description?: string | null;
  parentGroupId?: number | null;
}

export interface UpdateGroupLedgerResponse {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  parentGroupId?: number | null;
}

export interface GroupLedgerDTO {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  parentGroupId?: number | null;
}

/** `GET|POST|PUT|DELETE /cost-centers` — align with backend contract when OpenAPI is published. */
export interface CostCenterDTO {
  id: number;
  code: string;
  name: string;
  description?: string | null;
}

export interface CreateCostCenterRequest {
  code: string;
  name: string;
  description?: string | null;
}

export interface CreateCostCenterResponse {
  id: number;
}

export interface UpdateCostCenterRequest {
  code: string;
  name: string;
  description?: string | null;
}

/** `GET|POST|PUT|DELETE /costcategories` */
export interface CostCategoryDTO {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  /** Required by API; must be greater than 0. */
  costCenterId: number;
}

export interface CreateCostCategoryRequest {
  code: string;
  name: string;
  description?: string | null;
  costCenterId: number;
}

export interface CreateCostCategoryResponse {
  id: number;
}

export interface UpdateCostCategoryRequest {
  code: string;
  name: string;
  description?: string | null;
  costCenterId: number;
}

/** `GET|POST|PUT|DELETE /currencies` */
export interface CurrencyDTO {
  id: number;
  code: string;
  name: string;
  symbol?: string | null;
  decimalPlaces?: number | null;
  description?: string | null;
}

export interface CreateCurrencyRequest {
  code: string;
  name: string;
  symbol?: string | null;
  decimalPlaces?: number | null;
  description?: string | null;
}

export interface CreateCurrencyResponse {
  id: number;
}

export interface UpdateCurrencyRequest {
  code: string;
  name: string;
  symbol?: string | null;
  decimalPlaces?: number | null;
  description?: string | null;
}

/** `GET|POST|DELETE /currencyexchangerates` */
export interface CurrencyExchangeRateDTO {
  id: number;
  fromCurrencyId: number;
  toCurrencyId: number;
  /** Rate applied: one unit of fromCurrency = rate × toCurrency. */
  rate: number;
  effectiveDate?: string | null;
}

export interface CreateCurrencyExchangeRateRequest {
  fromCurrencyId: number;
  toCurrencyId: number;
  rate: number;
  effectiveDate?: string | null;
}

export interface CreateCurrencyExchangeRateResponse {
  id: number;
}

/** Body for `POST /items` (OpenAPI required: name, title, barcode). */
export interface CreateItemRequest {
  name: string;
  title: string;
  barcode: string;
  description?: string | null;
  /** When set, must be greater than 0 (OpenAPI exclusiveMinimum). */
  itemGroupId?: number;
}

/** Body for `PUT /items/{id}`. */
export interface UpdateItemRequest {
  name: string;
  title: string;
  barcode: string;
  description?: string | null;
  /** When set, must be greater than 0 (OpenAPI exclusiveMinimum). */
  itemGroupId?: number;
}

export interface CreateItemResponse {
  id: number;
}

export interface CreateItemGroupRequest {
  code: string;
  name: string;
  description?: string | null;
  parentGroupId?: number | null;
}

export interface CreateItemGroupResponse {
  id: number;
}

export interface ItemGroupDTO {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  parentGroupId?: number | null;
}

export interface CreateBatchRequest {
  itemId?: number;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate?: string | null;
  notes?: string | null;
  defaultPrice: number;
}

export interface CreateBatchResponse {
  id: number;
}

export interface CreateContributorRequest {
  name: string;
  phoneNumber?: string | null;
}

export interface CreateContributorResponse {
  id: number;
  name: string;
}

export interface ContributorRecord {
  id: number;
  name: string;
  phoneNumber?: string | null;
}

export interface PagedResultOfContributorRecord {
  items: ContributorRecord[];
  page: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
}

export type ContributorListResponse = PagedResultOfContributorRecord;

export interface UpdateContributorRequest {
  id: number;
  name: string;
}

export interface UpdateContributorResponse {
  contributor: ContributorRecord;
}

export interface HttpValidationProblemDetails extends ProblemDetails {
  errors?: Record<string, string[]>;
}

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
}

export interface ErrorResponse {
  statusCode?: number;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface CompanyDTO {
  id: number;
  code: string;
  name: string;
  legalName?: string | null;
  taxRegistrationNumber?: string | null;
  website?: string | null;
  primaryPhone?: string | null;
  primaryEmail?: string | null;
  notes?: string | null;
  isActive: boolean;
}

export interface CreateCompanyRequest {
  code: string;
  name: string;
  legalName?: string | null;
  taxRegistrationNumber?: string | null;
  website?: string | null;
  primaryPhone?: string | null;
  primaryEmail?: string | null;
  notes?: string | null;
}

export interface CreateCompanyResponse {
  id: number;
}

export interface UpdateCompanyRequest {
  code: string;
  name: string;
  legalName?: string | null;
  taxRegistrationNumber?: string | null;
  website?: string | null;
  primaryPhone?: string | null;
  primaryEmail?: string | null;
  notes?: string | null;
  isActive: boolean;
}

// ----------------------------
// Branches
// ----------------------------

export interface BranchDTO {
  id: number;
  code: string;
  name: string;
  address?: string | null;
  city?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  isActive: boolean;
}

export interface CreateBranchRequest {
  code: string;
  name: string;
  address?: string | null;
  city?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
}

export interface UpdateBranchRequest {
  id: number;
  code: string;
  name: string;
  address?: string | null;
  city?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  isActive: boolean;
}

// ----------------------------
// Item Categories
// ----------------------------

export interface ItemCategoryDTO {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  parentCategoryId?: number | null;
}

export interface CreateItemCategoryRequest {
  code: string;
  name: string;
  description?: string | null;
  parentCategoryId?: number | null;
}

export interface UpdateItemCategoryRequest {
  code: string;
  name: string;
  description?: string | null;
  parentCategoryId?: number | null;
}

// ----------------------------
// Godowns
// ----------------------------

export interface GodownDTO {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
}

export interface CreateGodownRequest {
  name: string;
  address?: string | null;
  city?: string | null;
}

export interface UpdateGodownRequest {
  name: string;
  address?: string | null;
  city?: string | null;
}

// ----------------------------
// Price Lists
// ----------------------------

export interface PriceListDTO {
  id: number;
  itemId: number;
  ledgerId: number;
  pricePerItem: number;
}

export interface PriceListItemDto {
  itemId: number;
  pricePerItem: number;
}

export interface CreatePriceListRequest {
  itemId: number;
  ledgerId: number;
  pricePerItem: number;
}

export interface CreateBulkPriceListRequest {
  ledgerId: number;
  items: PriceListItemDto[];
}

// ----------------------------
// Configurations
// ----------------------------

export interface ConfigurationDTO {
  id: number;
  name: string;
  value?: string | null;
  description?: string | null;
  configurationGroupId: number;
  configurationGroupName?: string | null;
}

export interface CreateConfigurationCommand {
  name: string;
  value?: string | null;
  description?: string | null;
  configurationGroupId: number;
}

export interface UpdateConfigurationCommand {
  id: number;
  name: string;
  value?: string | null;
  description?: string | null;
  configurationGroupId: number;
}

// ----------------------------
// Configuration Groups
// ----------------------------

export interface ConfigurationGroupDTO {
  id: number;
  name: string;
  description?: string | null;
  parentGroupId?: number | null;
  parentGroupName?: string | null;
}

export interface CreateConfigurationGroupCommand {
  name: string;
  description?: string | null;
  parentGroupId?: number | null;
}

export interface UpdateConfigurationGroupCommand {
  id: number;
  name: string;
  description?: string | null;
  parentGroupId?: number | null;
}

// ----------------------------
// Configuration Tree
// ----------------------------

export interface ConfigurationTreeDTO {
  id: number;
  name: string;
  value?: string | null;
  description?: string | null;
  isGroup: boolean;
  children: ConfigurationTreeDTO[];
}



// ----------------------------
// Tills
// ----------------------------

export interface TillDTO {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  warehouseId: number;
  statusValue: number;
  isActive: boolean;
}

export interface CreateTillRequest {
  code: string;
  name: string;
  description?: string | null;
  warehouseId: number;
}

export interface UpdateTillRequest {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  warehouseId: number;
  statusValue: number;
  isActive: boolean;
}

// ----------------------------
// Till Assignments
// ----------------------------

export interface TillAssignmentDTO {
  id: number;
  tillId: number;
  userId: string;
  startAt: string;
  endAt?: string | null;
  notes?: string | null;
}

export interface CreateTillAssignmentRequest {
  tillId: number;
  userId: string;
  startAt: string;
  notes?: string | null;
}

export interface UpdateTillAssignmentRequest {
  id: number;
  tillId: number;
  userId: string;
  startAt: string;
  endAt?: string | null;
  notes?: string | null;
}

// ----------------------------
// Units of Measure
// ----------------------------

export interface UnitOfMeasureDTO {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  symbol?: string | null;
  conversionFactor?: number;
  baseUnitId?: number | null;
  isBase: boolean;
  isActive: boolean;
}

export interface CreateUnitOfMeasureRequest {
  code: string;
  name: string;
  description?: string | null;
  symbol?: string | null;
  conversionFactor?: number;
  baseUnitId?: number | null;
  isBase: boolean;
  isActive: boolean;
}

export interface UpdateUnitOfMeasureRequest {
  code: string;
  name: string;
  description?: string | null;
  symbol?: string | null;
  conversionFactor?: number;
  baseUnitId?: number | null;
  isBase: boolean;
  isActive: boolean;
}
