import type {
  Brand,
  MerchandiserItem,
  MerchandiserReport,
  Outlet,
  ParsedReport,
  Product,
  ProductAlias,
  PromoterReport,
  PromoterSaleItem,
  PromoterSampleItem,
  ReportFlag,
  User,
  WhatsappMessage,
} from '@/types';
import { toIdString } from '@/lib/utils';

export function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id: toIdString(raw.id),
    fullName: String(raw.fullName ?? ''),
    email: String(raw.email ?? ''),
    role: raw.role as User['role'],
    brandId: raw.brandId != null ? toIdString(raw.brandId) : null,
    whatsappPhone:
      raw.whatsappPhone != null ? String(raw.whatsappPhone) : null,
    isActive: Boolean(raw.isActive ?? true),
    createdAt: String(raw.createdAt ?? ''),
  };
}

export function normalizeBrand(raw: Record<string, unknown>): Brand {
  return {
    id: toIdString(raw.id),
    name: String(raw.name ?? ''),
    slug: String(raw.slug ?? ''),
    isActive: Boolean(raw.isActive ?? true),
    createdAt: String(raw.createdAt ?? ''),
  };
}

export function normalizeOutlet(raw: Record<string, unknown>): Outlet {
  const region = raw.region as Record<string, unknown> | undefined;
  return {
    id: toIdString(raw.id),
    name: String(raw.name ?? ''),
    type: raw.type as Outlet['type'],
    isDepot: Boolean(raw.isDepot),
    regionId: raw.regionId != null ? toIdString(raw.regionId) : null,
    address: raw.address != null ? String(raw.address) : null,
    isActive: Boolean(raw.isActive ?? true),
    region: region
      ? {
          id: toIdString(region.id),
          name: String(region.name ?? ''),
          country: String(region.country ?? ''),
        }
      : undefined,
  };
}

export function normalizeProduct(raw: Record<string, unknown>): Product {
  const brand = raw.brand as Record<string, unknown> | undefined;
  return {
    id: toIdString(raw.id),
    brandId: toIdString(raw.brandId),
    canonicalName: String(raw.canonicalName ?? ''),
    sku: raw.sku != null ? String(raw.sku) : null,
    flow: raw.flow as Product['flow'],
    unit: raw.unit != null ? String(raw.unit) : null,
    isActive: Boolean(raw.isActive ?? true),
    brand: brand ? normalizeBrand(brand) : undefined,
  };
}

export function normalizeProductAlias(raw: Record<string, unknown>): ProductAlias {
  return {
    id: toIdString(raw.id),
    productId: toIdString(raw.productId),
    alias: String(raw.alias ?? ''),
    createdAt: String(raw.createdAt ?? ''),
  };
}

export function normalizeFlag(raw: Record<string, unknown>): ReportFlag {
  return {
    id: toIdString(raw.id),
    reportId: toIdString(raw.reportId),
    flagCode: String(raw.flagCode ?? ''),
    fieldName: raw.fieldName != null ? String(raw.fieldName) : null,
    severity: raw.severity as ReportFlag['severity'],
    message: String(raw.message ?? ''),
    status: raw.status as ReportFlag['status'],
    resolvedAt: raw.resolvedAt != null ? String(raw.resolvedAt) : null,
  };
}

export function normalizeParsedReport(raw: Record<string, unknown>): ParsedReport {
  const flags = raw.flags as Record<string, unknown>[] | undefined;
  const brand = raw.brand as Record<string, unknown> | undefined;
  const outlet = raw.outlet as Record<string, unknown> | null | undefined;
  return {
    id: toIdString(raw.id),
    messageId: toIdString(raw.messageId),
    brandId: raw.brandId != null ? toIdString(raw.brandId) : null,
    outletId: raw.outletId != null ? toIdString(raw.outletId) : null,
    reportedBy:
      raw.reportedById != null
        ? toIdString(raw.reportedById)
        : raw.reportedBy != null
          ? toIdString(raw.reportedBy)
          : null,
    reportDate: raw.reportDate != null ? String(raw.reportDate) : null,
    reportType: raw.reportType as ParsedReport['reportType'],
    status: String(raw.status) as ParsedReport['status'],
    confidence:
      raw.confidence != null ? Number(raw.confidence) : null,
    locationRaw: raw.locationRaw != null ? String(raw.locationRaw) : null,
    dateRaw: raw.dateRaw != null ? String(raw.dateRaw) : null,
    nameRaw: raw.nameRaw != null ? String(raw.nameRaw) : null,
    isDepotReport: Boolean(raw.isDepotReport),
    createdAt: String(raw.createdAt ?? ''),
    flags: flags?.map((f) => normalizeFlag(f)),
    brand: brand ? normalizeBrand(brand) : undefined,
    outlet: outlet ? normalizeOutlet(outlet) : null,
  };
}

export function normalizeMerchItem(raw: Record<string, unknown>): MerchandiserItem {
  const product = raw.product as Record<string, unknown> | null | undefined;
  return {
    id: toIdString(raw.id),
    productNameRaw:
      raw.productNameRaw != null ? String(raw.productNameRaw) : null,
    productId: raw.productId != null ? toIdString(raw.productId) : null,
    quantity: raw.quantity != null ? Number(raw.quantity) : null,
    expiryDate: raw.expiryDate != null ? String(raw.expiryDate) : null,
    expiryRaw: raw.expiryRaw != null ? String(raw.expiryRaw) : null,
    isProductMatched: Boolean(raw.isProductMatched),
    product: product ? normalizeProduct(product) : null,
  };
}

export function normalizeMerchandiserReport(
  raw: Record<string, unknown>,
): MerchandiserReport {
  const items = (raw.items as Record<string, unknown>[]) ?? [];
  const pr = raw.parsedReport as Record<string, unknown>;
  return {
    id: toIdString(raw.id),
    reportId: toIdString(raw.reportId),
    promoType: raw.promoType != null ? String(raw.promoType) : null,
    notes: raw.notes != null ? String(raw.notes) : null,
    items: items.map(normalizeMerchItem),
    parsedReport: normalizeParsedReport(pr),
  };
}

export function normalizeSaleItem(raw: Record<string, unknown>): PromoterSaleItem {
  const product = raw.product as Record<string, unknown> | null | undefined;
  return {
    id: toIdString(raw.id),
    productNameRaw:
      raw.productNameRaw != null ? String(raw.productNameRaw) : null,
    productId: raw.productId != null ? toIdString(raw.productId) : null,
    quantity: raw.quantity != null ? Number(raw.quantity) : null,
    promoLabel: raw.promoLabel != null ? String(raw.promoLabel) : null,
    isOffer: Boolean(raw.isOffer),
    isProductMatched: Boolean(raw.isProductMatched),
    product: product ? normalizeProduct(product) : null,
  };
}

export function normalizeSampleItem(
  raw: Record<string, unknown>,
): PromoterSampleItem {
  const product = raw.product as Record<string, unknown> | null | undefined;
  return {
    id: toIdString(raw.id),
    productNameRaw:
      raw.productNameRaw != null ? String(raw.productNameRaw) : null,
    productId: raw.productId != null ? toIdString(raw.productId) : null,
    quantity: raw.quantity != null ? Number(raw.quantity) : null,
    availabilityNote:
      raw.availabilityNote != null ? String(raw.availabilityNote) : null,
    isProductMatched: Boolean(raw.isProductMatched),
    product: product ? normalizeProduct(product) : null,
  };
}

function normalizeQuestions(
  raw: unknown,
): { question: string; answer: string }[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map((x) => {
      const o = x as Record<string, unknown>;
      return {
        question: String(o.question ?? ''),
        answer: String(o.answer ?? ''),
      };
    });
  }
  if (typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>).map(
      ([question, answer]) => ({
        question,
        answer: String(answer ?? ''),
      }),
    );
  }
  return [];
}

export function normalizePromoterReport(raw: Record<string, unknown>): PromoterReport {
  const pr = raw.parsedReport as Record<string, unknown>;
  const saleItems =
    (raw.saleItems as Record<string, unknown>[]) ??
    (raw.sales as Record<string, unknown>[]) ??
    [];
  const sampleItems =
    (raw.sampleItems as Record<string, unknown>[]) ??
    (raw.samples as Record<string, unknown>[]) ??
    [];
  return {
    id: toIdString(raw.id),
    reportId: toIdString(raw.reportId),
    promoStandPlacement:
      raw.promoStandPlacement != null
        ? String(raw.promoStandPlacement)
        : null,
    personsContacted:
      raw.personsContacted != null ? Number(raw.personsContacted) : null,
    personsTasted:
      raw.personsTasted != null ? Number(raw.personsTasted) : null,
    feedbackText:
      raw.feedbackText != null ? String(raw.feedbackText) : null,
    mostAskedQuestion:
      raw.mostAskedQuestion != null ? String(raw.mostAskedQuestion) : null,
    questionsAnswers: normalizeQuestions(raw.questionsAnswers),
    sales: saleItems.map(normalizeSaleItem),
    samples: sampleItems.map(normalizeSampleItem),
    parsedReport: normalizeParsedReport(pr),
  };
}

export function normalizeMessage(raw: Record<string, unknown>): WhatsappMessage {
  return {
    id: toIdString(raw.id),
    waMessageId: String(raw.waMessageId ?? ''),
    senderPhone: String(raw.senderPhone ?? ''),
    senderName: raw.senderName != null ? String(raw.senderName) : null,
    bodyRaw: raw.bodyRaw != null ? String(raw.bodyRaw) : null,
    bodyNormalized:
      raw.bodyNormalized != null ? String(raw.bodyNormalized) : null,
    messageType: String(raw.messageType ?? 'text') as WhatsappMessage['messageType'],
    hasMedia: Boolean(raw.hasMedia),
    reportType: (raw.reportType as WhatsappMessage['reportType']) ?? null,
    status: String(raw.status ?? ''),
    aiConfidence:
      raw.aiConfidence != null ? Number(raw.aiConfidence) : null,
    aiClassification:
      (raw.aiClassification as Record<string, unknown> | null) ?? null,
    aiExtraction: (raw.aiExtraction as Record<string, unknown> | null) ?? null,
    receivedAt: String(raw.receivedAt ?? ''),
    processedAt: raw.processedAt != null ? String(raw.processedAt) : null,
  };
}
