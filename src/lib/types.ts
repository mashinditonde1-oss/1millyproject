export type Currency = "USD" | "ZiG" | "ZAR";

export type DocType = "quote" | "proforma" | "invoice" | "credit_note";

export type DocStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "expired"
  | "approved"
  | "cancelled"
  | "partially_paid"
  | "paid"
  | "overdue";

export interface BusinessProfile {
  id: string;
  businessName: string;
  businessType: string;
  logoDataUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  vatNumber?: string;
  poBox?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranchCode?: string;
  ecocash?: string;
  innbucks?: string;
  primaryCurrency: Currency;
  vatDefault: boolean;
  defaultPaymentTerms: string;
  tagline?: string;
  footerMessage?: string;
  brandColor: string;
  plan: "free" | "pro";
  referralCode: string;
  createdAt: string;
}

export interface Client {
  id: string;
  fullName: string;
  companyName?: string;
  whatsapp: string;
  email?: string;
  address?: string;
  poBox?: string;
  creditLimit?: number;
  notes?: string;
  paymentPreference?: string;
  deletedAt?: string | null;
  createdAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  method: "Cash" | "EcoCash" | "Bank Transfer" | "Swipe Card" | "InnBucks" | "Other";
  date: string;
  isDeposit?: boolean;
}

export interface BusinessDocument {
  id: string;
  type: DocType;
  number: string;
  clientId: string;
  date: string;
  dueDate?: string;
  expiryDate?: string;
  poNumber?: string;
  currency: Currency;
  exchangeRate?: number;
  rateOverridden?: boolean;
  items: LineItem[];
  vatEnabled: boolean;
  discountType?: "percent" | "fixed";
  discountValue?: number;
  depositRequired?: number;
  notes?: string;
  status: DocStatus;
  payments: PaymentRecord[];
  signature?: { dataUrl: string; fullName: string; date: string };
  declineReason?: string;
  linkedInvoiceId?: string;
  shareToken: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const BUSINESS_TYPES = [
  "Construction and Contracting",
  "Welding and Fabrication",
  "Electrical Services",
  "Plumbing",
  "Cleaning Services",
  "Catering and Events",
  "Salon and Beauty",
  "Consultancy and Professional Services",
  "Retail and Wholesale",
  "Transport and Logistics",
  "Printing and Branding",
  "IT Services",
  "Agriculture and Farming",
  "Medical and Health Services",
  "Legal Services",
  "Tutoring and Training",
  "General and Other",
] as const;

export const SUGGESTED_LINE_ITEMS: Record<string, string[]> = {
  "Construction and Contracting": ["Site preparation", "Foundation work", "Brickwork (per square metre)", "Roofing", "Plastering", "Labour"],
  "Welding and Fabrication": ["Steel gate fabrication", "Burglar bars", "Welding labour (per hour)", "Materials"],
  "Electrical Services": ["Wiring (per point)", "DB board installation", "Solar inverter installation", "Call out fee", "Labour"],
  "Plumbing": ["Pipe installation", "Geyser installation", "Leak repair", "Call out fee", "Labour"],
  "Cleaning Services": ["Office cleaning (monthly)", "Deep cleaning", "Window cleaning", "Cleaning materials"],
  "Catering and Events": ["Catering per head", "Decor", "Tents and chairs hire", "Service staff"],
  "Salon and Beauty": ["Hair treatment", "Manicure", "Pedicure", "Hair products"],
  "Consultancy and Professional Services": ["Consulting hours", "Strategy session", "Report and deliverables"],
  "Retail and Wholesale": ["Product (qty)", "Delivery", "Bulk discount"],
  "Transport and Logistics": ["Delivery (per km)", "Loading and offloading", "Fuel surcharge"],
  "Printing and Branding": ["Business cards (500)", "Banner printing", "Logo design", "T-shirt branding"],
  "IT Services": ["Website development", "Hosting (monthly)", "Tech support hours", "Domain registration"],
  "Agriculture and Farming": ["Maize (per tonne)", "Fertilizer", "Labour days", "Transport to market"],
  "Medical and Health Services": ["Consultation", "Medication", "Procedure"],
  "Legal Services": ["Legal consultation", "Document drafting", "Court appearance"],
  "Tutoring and Training": ["Tutoring session (per hour)", "Training course", "Materials"],
  "General and Other": ["Service item", "Materials", "Labour"],
};