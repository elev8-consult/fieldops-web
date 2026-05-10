export type UserRole =
  | 'super_admin'
  | 'brand_manager'
  | 'supervisor'
  | 'promoter'
  | 'merchandiser'
  | 'reviewer';
export type OutletType =
  | 'supermarket'
  | 'minimarket'
  | 'hypermarket'
  | 'depot'
  | 'other';
export type ProductFlow = 'merchandiser' | 'promoter' | 'both';
export type MessageStatus =
  | 'received'
  | 'processing'
  | 'parsed'
  | 'flagged'
  | 'reviewed'
  | 'rejected'
  | 'duplicate';
export type ReportType = 'merchandiser' | 'promoter' | 'unknown';
export type ParsedReportStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'archived';
export type FlagSeverity = 'info' | 'warning' | 'error';
export type FlagStatus = 'open' | 'resolved' | 'ignored';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  fullName: string;
  whatsappPhone: string | null;
  email: string | null;
  role: UserRole;
  brandId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Region {
  id: string;
  name: string;
  country: string;
  createdAt: string;
}

export interface Outlet {
  id: string;
  name: string;
  type: OutletType;
  isDepot: boolean;
  regionId: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  region?: Region;
}

export interface Product {
  id: string;
  brandId: string;
  canonicalName: string;
  sku: string | null;
  flow: ProductFlow;
  unit: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  brand?: Brand;
}

export interface ProductAlias {
  id: string;
  productId: string;
  alias: string;
  createdBy: string | null;
  createdAt: string;
}

export type MessageType = 'text' | 'image' | 'document' | 'audio' | string;

export interface WhatsappMessage {
  id: string;
  waMessageId: string;
  senderPhone: string | null;
  senderName: string | null;
  bodyRaw: string | null;
  bodyNormalized: string | null;
  messageType: MessageType;
  hasMedia: boolean;
  reportType: ReportType | null;
  status: MessageStatus | string;
  aiConfidence: number | null;
  aiClassification: Record<string, unknown> | null;
  aiExtraction: Record<string, unknown> | null;
  receivedAt: string;
  processedAt: string | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportFlag {
  id: string;
  reportId: string;
  flagCode: string;
  fieldName: string | null;
  severity: FlagSeverity;
  message: string | null;
  status: FlagStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ParsedReport {
  id: string;
  messageId: string;
  brandId: string | null;
  outletId: string | null;
  reportedBy: string | null;
  reportDate: string | null;
  reportType: ReportType;
  status: ParsedReportStatus | string;
  confidence: number | null;
  locationRaw: string | null;
  dateRaw: string | null;
  nameRaw: string | null;
  isDepotReport: boolean;
  createdAt: string;
  updatedAt?: string;
  flags?: ReportFlag[];
  brand?: Brand | null;
  outlet?: Outlet | null;
  message?: {
    id: string;
    bodyRaw: string | null;
    bodyNormalized: string | null;
    aiExtraction: Record<string, unknown> | null;
    aiClassification: Record<string, unknown> | null;
    aiConfidence: number | null;
    messageType: string;
    senderPhone: string | null;
    senderName: string | null;
    receivedAt: string;
  } | null;
  reportData?: {
    id: string;
    promoType?: string | null;
    notes?: string | null;
    items?: MerchandiserItem[];
    promoStandPlacement?: string | null;
    personsContacted?: number | null;
    personsTasted?: number | null;
    feedbackText?: string | null;
    mostAskedQuestion?: string | null;
    questionsAnswers?: { question: string; answer: string }[];
    sales?: PromoterSaleItem[];
    samples?: PromoterSampleItem[];
  } | null;
}

export interface MerchandiserReportItemBatch {
  id: string;
  reportItemId: string;
  quantity: number | null;
  expiryDate: string | null;
  expiryRaw: string | null;
  createdAt: string;
}

export interface MerchandiserReportItem {
  id: string;
  merchandiserReportId: string;
  productId: string | null;
  productNameRaw: string;
  quantity: number | null;
  expiryDate: string | null;
  expiryRaw: string | null;
  isProductMatched: boolean;
  matchConfidence: number | null;
  matchType: string | null;
  createdAt?: string;
  matchSuggestions: Array<{
    productId: string;
    canonicalName: string;
    confidence: number;
  }>;
  batches?: MerchandiserReportItemBatch[];
  product?: Product | null;
}

export type MerchandiserItem = MerchandiserReportItem;

export interface MerchandiserReport {
  id: string;
  reportId: string;
  promoType: string | null;
  notes: string | null;
  createdAt?: string;
  items: MerchandiserItem[];
  parsedReport: ParsedReport;
}

export interface PromoterSaleItem {
  id: string;
  promoterReportId?: string;
  productId: string | null;
  productNameRaw: string;
  quantity: number | null;
  promoLabel: string | null;
  isOffer: boolean;
  isProductMatched: boolean;
  matchConfidence: number | null;
  matchType: string | null;
  createdAt?: string;
  matchSuggestions: Array<{
    productId: string;
    canonicalName: string;
    confidence: number;
  }>;
  product?: Product | null;
}

export interface PromoterSampleItem {
  id: string;
  promoterReportId?: string;
  productId: string | null;
  productNameRaw: string;
  quantity: number | null;
  availabilityNote: string | null;
  isProductMatched: boolean;
  matchConfidence: number | null;
  matchType: string | null;
  createdAt?: string;
  matchSuggestions: Array<{
    productId: string;
    canonicalName: string;
    confidence: number;
  }>;
  product?: Product | null;
}

export interface PromoterReport {
  id: string;
  reportId: string;
  promoStandPlacement: string | null;
  personsContacted: number | null;
  personsTasted: number | null;
  feedbackText: string | null;
  mostAskedQuestion: string | null;
  questionsAnswers:
    | { question: string; answer: string }[]
    | Record<string, unknown>
    | null;
  sales: PromoterSaleItem[];
  samples: PromoterSampleItem[];
  parsedReport: ParsedReport;
}

export interface AuditLog {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface UnknownSender {
  id: string;
  senderPhone: string;
  senderName: string | null;
  seenCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedBrandId: string | null;
  resolvedAt: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AnalyticsSummaryRow {
  reportType: string;
  status: string;
  count: number;
}

export type AnalyticsSummary = AnalyticsSummaryRow;

export interface FlaggedRate {
  flagged: string;
  total: string;
  rate: string;
}

export interface ReportsByDayRow {
  day: string;
  count: number;
}

export interface TopFlaggedProductRow {
  productNameRaw: string;
  count: number;
}

export interface ReportsByDay {
  day: string;
  reportType: string;
  report_type?: string;
  count: number;
}

export interface TopFlaggedProduct {
  product_name_raw: string;
  count: number;
}

export interface MerchandiserDashboardParams {
  brandId: string;
  dateFrom?: string;
  dateTo?: string;
  status?: 'approved' | 'flagged' | 'all';
}

export interface MerchandiserDashboardBatch {
  quantity: number | null;
  expiryDate: string | null;
  expiryRaw: string | null;
}

export interface MerchandiserDashboardCell {
  quantity: number | null;
  reportDate: string;
  reportId: string;
  expiryDate: string | null;
  expiryRaw: string | null;
  hasMultipleBatches: boolean;
  batches: MerchandiserDashboardBatch[];
  status: 'approved' | 'flagged';
}

export interface MerchandiserDashboardRow {
  outletId: string;
  outletName: string;
  isDepot: boolean;
  cells: Record<string, MerchandiserDashboardCell>;
}

export interface MerchandiserDashboardResponse {
  brand: { id: string; name: string; slug: string };
  dateRange: { from: string; to: string };
  products: Array<{ id: string; name: string }>;
  outlets: Array<{ id: string; name: string; isDepot: boolean }>;
  rows: MerchandiserDashboardRow[];
  summary: {
    totalReports: number;
    totalOutlets: number;
    totalProducts: number;
    approvedCount: number;
    flaggedCount: number;
    lastReportDate: string | null;
  };
}

export interface PromoterDashboardParams {
  brand_id?: string;
  date_from?: string;
  date_to?: string;
  status?: Array<'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived'>;
  outlet_id?: string;
  reported_by?: string;
}

export interface PromoterDashboardProduct {
  id: string;
  canonical_name: string;
  is_offer: boolean;
}

export interface PromoterDashboardRow {
  outlet_id: string;
  outlet_name: string;
  outlet_type: string;
  region_name: string | null;
  has_flags: boolean;
  flag_messages: string[];
  pending_review: boolean;
  cells: Record<string, Record<string, number>>;
  palette: Record<string, number>;
  gifts: Record<string, number>;
  row_total: number;
}

export interface PromoterDashboardGridResponse {
  dates: string[];
  products: PromoterDashboardProduct[];
  rows: PromoterDashboardRow[];
  column_totals: Record<string, number> & {
    palette: number;
    gifts: number;
    grand_total: number;
  };
}

export interface PromoterDashboardSummaryResponse {
  outlets_visited: number;
  reports_count: number;
  qty_sold: number;
  qty_gifts: number;
}

export interface PromoterOutletReportDetail {
  report_id: string;
  report_date: string;
  status: string;
  promoter_id: string | null;
  promoter_name: string | null;
  sales: Array<{
    id: string;
    product_id: string | null;
    product_name_raw: string;
    quantity: number | null;
    promo_label: string | null;
    is_offer: boolean;
    is_product_matched: boolean;
    match_confidence: number | null;
    match_type: string | null;
  }>;
  samples: Array<{
    id: string;
    product_id: string | null;
    product_name_raw: string;
    quantity: number | null;
    availability_note: string | null;
    is_product_matched: boolean;
    sample_match_confidence: number | null;
    sample_match_type: string | null;
  }>;
}

export interface PromoterOutletReportsResponse {
  outlet: {
    id: string;
    name: string;
    type: string;
    region_name: string | null;
  };
  reports: PromoterOutletReportDetail[];
}
