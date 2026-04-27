export interface User {
  id: string;
  fullName: string;
  email: string;
  role:
    | 'super_admin'
    | 'brand_manager'
    | 'supervisor'
    | 'reviewer'
    | 'promoter'
    | 'merchandiser';
  brandId: string | null;
  whatsappPhone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

export interface Region {
  id: string;
  name: string;
  country: string;
}

export interface Outlet {
  id: string;
  name: string;
  type: 'supermarket' | 'minimarket' | 'hypermarket' | 'depot' | 'other';
  isDepot: boolean;
  regionId: string | null;
  address: string | null;
  isActive: boolean;
  region?: Region;
}

export interface Product {
  id: string;
  brandId: string;
  canonicalName: string;
  sku: string | null;
  flow: 'merchandiser' | 'promoter' | 'both';
  unit: string | null;
  isActive: boolean;
  brand?: Brand;
}

export interface ProductAlias {
  id: string;
  productId: string;
  alias: string;
  createdAt: string;
}

export type MessageType = 'text' | 'image' | 'document' | 'audio' | string;

export interface WhatsappMessage {
  id: string;
  waMessageId: string;
  senderPhone: string;
  senderName: string | null;
  bodyRaw: string | null;
  bodyNormalized: string | null;
  messageType: MessageType;
  hasMedia: boolean;
  reportType: 'merchandiser' | 'promoter' | 'unknown' | null;
  status:
    | 'received'
    | 'processing'
    | 'parsed'
    | 'flagged'
    | 'reviewed'
    | 'rejected'
    | 'failed'
    | 'duplicate'
    | string;
  aiConfidence: number | null;
  aiClassification: Record<string, unknown> | null;
  aiExtraction: Record<string, unknown> | null;
  receivedAt: string;
  processedAt: string | null;
}

export interface ReportFlag {
  id: string;
  reportId: string;
  flagCode: string;
  fieldName: string | null;
  severity: 'error' | 'warning' | 'info';
  message: string;
  status: 'open' | 'resolved' | 'dismissed';
  resolvedAt: string | null;
}

export interface ParsedReport {
  id: string;
  messageId: string;
  brandId: string | null;
  outletId: string | null;
  reportedBy: string | null;
  reportDate: string | null;
  reportType: 'merchandiser' | 'promoter' | 'unknown';
  status:
    | 'draft'
    | 'flagged'
    | 'pending_review'
    | 'approved'
    | 'rejected'
    | string;
  confidence: number | null;
  locationRaw: string | null;
  dateRaw: string | null;
  nameRaw: string | null;
  isDepotReport: boolean;
  createdAt: string;
  flags?: ReportFlag[];
  brand?: Brand | { id: string; name: string; slug: string } | null;
  outlet?: Outlet | { id: string; name: string; type: string; isDepot: boolean } | null;
  message?: {
    id: string;
    bodyRaw: string | null;
    bodyNormalized: string | null;
    aiExtraction: Record<string, unknown> | null;
    aiClassification: Record<string, unknown> | null;
    aiConfidence: number | null;
    messageType: string;
    senderPhone: string;
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

export interface MerchandiserItem {
  id: string;
  productNameRaw: string | null;
  productId: string | null;
  quantity: number | null;
  expiryDate: string | null;
  expiryRaw: string | null;
  isProductMatched: boolean;
  product?: Product | null;
}

export interface MerchandiserReport {
  id: string;
  reportId: string;
  promoType: string | null;
  notes: string | null;
  items: MerchandiserItem[];
  parsedReport: ParsedReport;
}

export interface PromoterSaleItem {
  id: string;
  productNameRaw: string | null;
  productId: string | null;
  quantity: number | null;
  promoLabel: string | null;
  isOffer: boolean;
  isProductMatched: boolean;
  product?: Product | null;
}

export interface PromoterSampleItem {
  id: string;
  productNameRaw: string | null;
  productId: string | null;
  quantity: number | null;
  availabilityNote: string | null;
  isProductMatched: boolean;
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
  questionsAnswers: { question: string; answer: string }[] | Record<string, unknown> | null;
  sales: PromoterSaleItem[];
  samples: PromoterSampleItem[];
  parsedReport: ParsedReport;
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
  count:            number;
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
