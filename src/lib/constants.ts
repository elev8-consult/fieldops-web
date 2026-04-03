export const STATUS_LABELS: Record<string, string> = {
  parsed: 'Parsed',
  flagged: 'Flagged',
  failed: 'Failed',
  approved: 'Approved',
  rejected: 'Rejected',
  pending_review: 'In Review',
  draft: 'Draft',
  unknown: 'Unknown',
  received: 'Received',
  processing: 'Processing',
  reviewed: 'Reviewed',
  duplicate: 'Duplicate',
  open: 'Open',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

export const REPORT_TYPE_LABELS: Record<string, string> = {
  merchandiser: 'Merchandiser',
  promoter: 'Promoter',
  unknown: 'Unknown',
};

export const FLAG_CODE_LABELS: Record<string, string> = {
  MISSING_DATE: 'Missing Date',
  MISSING_LOCATION: 'Missing Location',
  MISSING_NAME: 'Missing Name',
  MISSING_BRAND: 'Missing Brand',
  MISSING_QUANTITY: 'Missing Quantity',
  MISSING_PERSONS_COUNT: 'Missing Persons Count',
  NO_ITEMS_EXTRACTED: 'No Items Found',
  UNRECOGNIZED_PRODUCT: 'Unrecognized Product',
  INVALID_DATE_FORMAT: 'Invalid Date Format',
  FUTURE_DATE: 'Future Date',
  PAST_EXPIRY_DATE: 'Expired Product',
  SUSPICIOUS_EXPIRY_YEAR: 'Suspicious Expiry Year',
  NEGATIVE_QUANTITY: 'Negative Quantity',
  LOW_AI_CONFIDENCE: 'Low AI Confidence',
  DUPLICATE_SUSPECTED: 'Possible Duplicate',
  EXTRACTION_FAILED: 'Extraction Failed',
  LOW_CLASSIFICATION_CONFIDENCE: 'Classification Failed',
};

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  BRAND_MANAGER: 'brand_manager',
  SUPERVISOR: 'supervisor',
  REVIEWER: 'reviewer',
} as const;
