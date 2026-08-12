// ── Core Types matching ADMIN-APP ──

export interface User {
  uid: string
  id?: string
  email: string
  displayName: string
  name?: string
  role: 'admin' | 'operator'
  status: 'active' | 'inactive'
  isActive?: boolean
  assignedMachines?: string[]
  assignedProducts?: string[]
  createdAt: string
  updatedAt?: string
  photoURL?: string
  phone?: string
  earningsPeriodType?: 'weekly' | 'monthly'
  employeeId?: string
}

export type EntryStatus = 'pending' | 'approved' | 'rejected' | 'corrected'

export interface Entry {
  id: string
  operatorUid: string
  operatorName: string
  machineNo: string
  machineNumber?: string
  productName: string
  quantity: number
  unit: string
  unitName?: string
  quantity2?: number
  unit2?: string
  boxQuantity?: number
  totalPackets?: number
  counting?: number
  pcs?: number
  wasteQuantity?: number
  wasteUnit?: string
  productionDate: string
  shiftName?: string
  imageUrl?: string
  notes?: string
  status: EntryStatus
  submittedAt: string
  approvedAt?: string
  approvedBy?: string
  approvedByName?: string
  rejectedAt?: string
  rejectedBy?: string
  rejectedByName?: string
  rejectionReason?: string
  correctedAt?: string
  correctedBy?: string
  correctionNote?: string
  paymentStatus?: PaymentStatus
  paymentSlipId?: string
  paidAt?: string
  paidBy?: string
}

export interface Product {
  id: string
  name: string
  sku: string
  code?: string
  category?: string
  defaultBoxSize?: number
  unit: string
  packetsPerBox?: number
  pcsPerBox?: number
  ratePerBox?: number
  assignedMachines?: string[]
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt?: string
}

export interface Machine {
  id: string
  name: string
  machineNo: string
  machineNumber?: string
  type?: string
  status: 'active' | 'inactive' | 'maintenance'
  assignedOperators?: string[]
  assignedProductId?: string
  assignedProductName?: string
  createdAt: string
  updatedAt?: string
}

export interface Unit {
  id: string
  name: string
  abbreviation: string
  createdAt: string
}

export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  status: 'active' | 'inactive'
  createdAt: string
}

export interface AuditLog {
  id: string
  action: string
  module: string
  performedBy: string
  performedByName: string
  targetId?: string
  targetType?: string
  details?: string
  previousValue?: any
  newValue?: any
  timestamp: string
}

// ── Filter Types ──

export interface EntryFilters {
  status?: EntryStatus
  operatorUid?: string
  machineNo?: string
  productName?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

export interface SalarySettings {
  defaultPeriod: 'weekly' | 'monthly'
  allowOperatorOverride: boolean
  currency: string
  updatedAt?: string
}

// ── Issues Types ──

export type IssueStatus = 'open' | 'in_review' | 'resolved' | 'closed' | 'needs_more_info' | 'rejected'
export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent'
export type ResolutionType = 'repaired' | 'replaced_part' | 'operator_guidance' | 'false_alarm' | 'fixed' | 'maintenance_scheduled' | 'material_requested' | 'monitoring' | 'no_issue_found' | 'other' | 'none'

export interface Issue {
  id: string
  issueId?: string
  operatorUid: string
  operatorName: string
  employeeId?: string
  issueType: string
  title?: string
  machineNo?: string
  machineNumber?: string
  description: string
  photoUrl?: string
  photoPath?: string
  priority: IssuePriority
  severity?: IssuePriority
  status: IssueStatus
  createdAt: string
  updatedAt?: string
  adminNote?: string
  resolvedAt?: string
  resolvedBy?: string
  resolutionType?: ResolutionType
}

// ── Salaries & Wages Types ──

export interface SalaryRule {
  id: string
  machineNo: string
  rateAmount: number
  ratePerQuantity: number
  unit: string
  active: boolean
  effectiveFrom: string
  createdAt: string
  updatedAt?: string
}

export type PaymentStatus = 'pending_payment' | 'paid' | 'not_payable'
export type SalaryPeriod = 'weekly' | 'monthly'

export interface Earning {
  id: string
  entryId: string
  operatorUid: string
  operatorName: string
  employeeId?: string
  machineNo: string
  productName?: string
  quantity: number
  unit?: string
  productionDate?: string
  calculatedAmount: number
  appliedRuleId?: string
  paymentStatus: PaymentStatus
  paidAt?: string
  paidBy?: string
  createdAt: string
  updatedAt?: string
}

export interface SalarySlip {
  id: string
  operatorId: string
  operatorName: string
  employeeId?: string
  startDate: string
  endDate: string
  fromDate?: string
  toDate?: string
  totalEntries: number
  totalBoxes: number
  totalWaste: number
  grossAmount: number
  deductions?: number
  netPayable: number
  roundOff?: number
  finalAmount?: number
  status: 'UNPAID' | 'PAID' | 'paid' | 'unpaid'
  createdAt: string
  paidAt?: string
}
