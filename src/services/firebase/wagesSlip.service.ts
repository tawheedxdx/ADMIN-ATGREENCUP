import {
  collection, doc, getDocs, getDoc, updateDoc, writeBatch,
  query, where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { SalarySlip, SalarySlipItem, Earning, Entry, Product, SlipPaymentStatus } from '@/types'

const SLIPS_COLLECTION = 'salarySlips'
const EARNINGS_COLLECTION = 'earnings'
const ENTRIES_COLLECTION = 'entries'
const USERS_COLLECTION = 'users'
const PRODUCTS_COLLECTION = 'products'

function getBoxQuantity(e: Entry): number {
  if (e.boxQuantity !== undefined) return e.boxQuantity
  let b = 0
  if (e.unit?.toUpperCase() === 'BOX') {
    b += Number(e.quantity) || 0
  }
  if (e.unit2?.toUpperCase() === 'BOX') {
    b += Number(e.quantity2) || 0
  }
  return b
}

function getPcsQuantity(e: Entry): number {
  if (e.pcs !== undefined) return e.pcs
  let p = 0
  if (e.unit?.toUpperCase() === 'PCS') {
    p += Number(e.quantity) || 0
  }
  if (e.unit2?.toUpperCase() === 'PCS') {
    p += Number(e.quantity2) || 0
  }
  return p
}

export const wagesSlipService = {
  async getAll(): Promise<SalarySlip[]> {
    return this.getAllSlips()
  },

  async getAllSlips(): Promise<SalarySlip[]> {
    const q = query(
      collection(db, SLIPS_COLLECTION),
      where('status', '!=', 'deleted')
    )
    const snapshot = await getDocs(q)
    const slips = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SalarySlip))
    slips.sort((a, b) => (b.generatedAt || '').localeCompare(a.generatedAt || ''))
    return slips
  },

  async create(data: { operatorUid?: string; operatorId?: string; fromDate?: string; startDate?: string; toDate?: string; endDate?: string }): Promise<string> {
    const uid = data.operatorUid || data.operatorId || ''
    const start = data.fromDate || data.startDate || ''
    const end = data.toDate || data.endDate || ''
    return this.createWagesSlip(uid, start, end, 'admin', 'System Admin')
  },

  async markAsPaid(slipId: string): Promise<void> {
    return this.markSlipAsPaid(slipId, 'admin', 'System Admin')
  },

  async getSlipById(id: string): Promise<SalarySlip | null> {
    const docSnap = await getDoc(doc(db, SLIPS_COLLECTION, id))
    if (!docSnap.exists() || docSnap.data().status === 'deleted') return null
    return { id: docSnap.id, ...docSnap.data() } as SalarySlip
  },

  async generateSlipNumber(date: Date): Promise<string> {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const q = query(
      collection(db, SLIPS_COLLECTION),
      where('generatedAt', '>=', startOfDay.toISOString()),
      where('generatedAt', '<=', endOfDay.toISOString())
    )
    const snap = await getDocs(q)
    const count = snap.size + 1
    const countStr = String(count).padStart(6, '0')
    return `WS-${dateStr}-${countStr}`
  },

  async previewWagesSlip(
    operatorUid: string,
    fromDate: string,
    toDate: string,
    includeOnlyApproved = true,
    includeOnlyUnpaid = true
  ): Promise<{
    items: SalarySlipItem[]
    totalBoxes: number
    totalPackets: number
    totalPCS: number
    grossAmount: number
    roundOff: number
    finalAmount: number
    earningIds: string[]
    productionEntryIds: string[]
  }> {
    const earningsQuery = query(
      collection(db, EARNINGS_COLLECTION),
      where('operatorUid', '==', operatorUid)
    )
    const earningsSnap = await getDocs(earningsQuery)
    let operatorEarnings = earningsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Earning))

    operatorEarnings = operatorEarnings.filter(e => {
      const date = e.productionDate || e.createdAt?.split('T')[0]
      if (!date) return false
      if (date < fromDate || date > toDate) return false
      if (includeOnlyUnpaid && e.paymentStatus === 'paid') return false
      return true
    })

    const entriesQuery = query(
      collection(db, ENTRIES_COLLECTION),
      where('operatorUid', '==', operatorUid)
    )
    const entriesSnap = await getDocs(entriesQuery)
    let operatorEntries = entriesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Entry))

    operatorEntries = operatorEntries.filter(e => {
      if (e.productionDate < fromDate || e.productionDate > toDate) return false
      if (includeOnlyApproved && e.status !== 'approved') return false
      return true
    })

    const productsSnap = await getDocs(collection(db, PRODUCTS_COLLECTION))
    const productsList = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product))

    const groups: { [key: string]: SalarySlipItem & { earningIds: string[], entryIds: string[] } } = {}
    let totalBoxes = 0
    let totalPackets = 0
    let totalPCS = 0
    let grossAmount = 0

    const earningIds: string[] = []
    const productionEntryIds: string[] = []

    for (const earning of operatorEarnings) {
      const entry = operatorEntries.find(e => e.id === earning.entryId)
      if (includeOnlyApproved && !entry) continue

      const boxes = entry ? getBoxQuantity(entry) : (earning.unit === 'BOX' ? earning.quantity : 0)
      const packets = entry ? (entry.totalPackets || 0) : 0
      const pcs = entry ? getPcsQuantity(entry) : (earning.unit === 'PCS' ? earning.quantity : 0)

      const rateStr = `₹${earning.rateAmount} / ${earning.ratePerQuantity} ${earning.unit || 'PCS'}`
      const groupKey = `${earning.machineNo}_${earning.productName || 'Unknown'}_${rateStr}`

      if (!groups[groupKey]) {
        const matchedProd = productsList.find(p => p.name.toLowerCase() === (earning.productName || '').toLowerCase())
        groups[groupKey] = {
          machineNo: earning.machineNo,
          productId: matchedProd?.id || 'unknown',
          productName: earning.productName || 'Unknown',
          box: 0,
          totalPackets: 0,
          pcs: 0,
          rate: rateStr,
          amount: 0,
          productionEntryIds: [],
          earningIds: [],
          entryIds: []
        }
      }

      groups[groupKey].box += boxes
      groups[groupKey].totalPackets += packets
      groups[groupKey].pcs += pcs
      groups[groupKey].amount += earning.calculatedAmount
      
      if (!groups[groupKey].entryIds.includes(earning.entryId)) {
        groups[groupKey].entryIds.push(earning.entryId)
        groups[groupKey].productionEntryIds!.push(earning.entryId)
      }
      if (!groups[groupKey].earningIds.includes(earning.id)) {
        groups[groupKey].earningIds.push(earning.id)
      }

      totalBoxes += boxes
      totalPackets += packets
      totalPCS += pcs
      grossAmount += earning.calculatedAmount

      if (!earningIds.includes(earning.id)) earningIds.push(earning.id)
      if (!productionEntryIds.includes(earning.entryId)) productionEntryIds.push(earning.entryId)
    }

    const items = Object.values(groups).map(g => {
      const { earningIds, entryIds, ...rest } = g
      return rest as SalarySlipItem
    })

    const finalAmount = Math.round(grossAmount)
    const roundOff = Number((finalAmount - grossAmount).toFixed(2))

    return {
      items,
      totalBoxes,
      totalPackets,
      totalPCS,
      grossAmount,
      roundOff,
      finalAmount,
      earningIds,
      productionEntryIds
    }
  },

  async createWagesSlip(
    operatorUid: string,
    fromDate: string,
    toDate: string,
    adminUid: string,
    adminName: string,
    includeOnlyApproved = true,
    includeOnlyUnpaid = true,
    autoMarkPaid = false
  ): Promise<string> {
    const operatorSnap = await getDoc(doc(db, USERS_COLLECTION, operatorUid))
    if (!operatorSnap.exists()) {
      throw new Error('Operator user not found')
    }
    const operatorData = operatorSnap.data()

    const preview = await this.previewWagesSlip(
      operatorUid,
      fromDate,
      toDate,
      includeOnlyApproved,
      includeOnlyUnpaid
    )

    if (preview.items.length === 0) {
      throw new Error('No approved production records found for the selected period.')
    }

    const slipNumber = await this.generateSlipNumber(new Date())
    const slipDocRef = doc(collection(db, SLIPS_COLLECTION))
    const slipId = slipDocRef.id

    const paymentStatus: SlipPaymentStatus = autoMarkPaid ? 'paid' : 'pending'
    const nowISO = new Date().toISOString()

    const slipData: SalarySlip = {
      id: slipId,
      slipNumber,
      operatorUid,
      operatorName: operatorData.displayName || operatorData.email?.split('@')[0] || 'Unknown',
      employeeId: operatorData.employeeId || 'N/A',
      fromDate,
      toDate,
      generatedBy: adminUid,
      generatedByName: adminName,
      generatedAt: nowISO,
      status: 'active',
      paymentStatus,
      totalBoxes: preview.totalBoxes,
      totalPackets: preview.totalPackets,
      totalPCS: preview.totalPCS,
      grossAmount: preview.grossAmount,
      roundOff: preview.roundOff,
      finalAmount: preview.finalAmount,
      items: preview.items,
      productionEntryIds: preview.productionEntryIds,
      earningIds: preview.earningIds
    }

    if (autoMarkPaid) {
      slipData.paidAt = nowISO
      slipData.paidBy = adminUid
      slipData.paidByName = adminName
    }

    const batch = writeBatch(db)
    batch.set(slipDocRef, slipData)

    if (autoMarkPaid) {
      for (const earningId of preview.earningIds) {
        batch.update(doc(db, EARNINGS_COLLECTION, earningId), {
          paymentStatus: 'paid',
          paymentSlipId: slipId,
          paidAt: nowISO,
          paidBy: adminUid,
          updatedAt: nowISO
        })
      }
      for (const entryId of preview.productionEntryIds) {
        batch.update(doc(db, ENTRIES_COLLECTION, entryId), {
          paymentStatus: 'paid',
          paymentSlipId: slipId,
          paidAt: nowISO,
          paidBy: adminUid
        })
      }
    } else {
      for (const earningId of preview.earningIds) {
        batch.update(doc(db, EARNINGS_COLLECTION, earningId), {
          paymentSlipId: slipId,
          updatedAt: nowISO
        })
      }
      for (const entryId of preview.productionEntryIds) {
        batch.update(doc(db, ENTRIES_COLLECTION, entryId), {
          paymentSlipId: slipId
        })
      }
    }

    await batch.commit()
    return slipId
  },

  async markSlipAsPaid(slipId: string, adminUid: string, adminName: string): Promise<void> {
    const slipDocRef = doc(db, SLIPS_COLLECTION, slipId)
    const slipSnap = await getDoc(slipDocRef)
    if (!slipSnap.exists()) throw new Error('Wages slip not found')
    const slipData = slipSnap.data() as SalarySlip

    const nowISO = new Date().toISOString()
    const batch = writeBatch(db)

    batch.update(slipDocRef, {
      paymentStatus: 'paid',
      paidAt: nowISO,
      paidBy: adminUid,
      paidByName: adminName
    })

    if (slipData.earningIds && slipData.earningIds.length > 0) {
      for (const earningId of slipData.earningIds) {
        batch.update(doc(db, EARNINGS_COLLECTION, earningId), {
          paymentStatus: 'paid',
          paymentSlipId: slipId,
          paidAt: nowISO,
          paidBy: adminUid,
          updatedAt: nowISO
        })
      }
    }

    if (slipData.productionEntryIds && slipData.productionEntryIds.length > 0) {
      for (const entryId of slipData.productionEntryIds) {
        batch.update(doc(db, ENTRIES_COLLECTION, entryId), {
          paymentStatus: 'paid',
          paymentSlipId: slipId,
          paidAt: nowISO,
          paidBy: adminUid
        })
      }
    }

    await batch.commit()
  },

  async deleteSlip(slipId: string): Promise<void> {
    const slipDocRef = doc(db, SLIPS_COLLECTION, slipId)
    const slipSnap = await getDoc(slipDocRef)
    if (!slipSnap.exists()) throw new Error('Wages slip not found')
    const slipData = slipSnap.data() as SalarySlip

    const batch = writeBatch(db)

    if (slipData.earningIds && slipData.earningIds.length > 0) {
      for (const earningId of slipData.earningIds) {
        batch.update(doc(db, EARNINGS_COLLECTION, earningId), {
          paymentStatus: 'pending_payment',
          paymentSlipId: null,
          paidAt: null,
          paidBy: null,
          updatedAt: new Date().toISOString()
        })
      }
    }

    if (slipData.productionEntryIds && slipData.productionEntryIds.length > 0) {
      for (const entryId of slipData.productionEntryIds) {
        batch.update(doc(db, ENTRIES_COLLECTION, entryId), {
          paymentStatus: 'pending_payment',
          paymentSlipId: null,
          paidAt: null,
          paidBy: null
        })
      }
    }

    batch.update(slipDocRef, {
      status: 'deleted',
      updatedAt: new Date().toISOString()
    })

    await batch.commit()
  },

  async updateWagesSlip(slipId: string, updatedData: Partial<SalarySlip>): Promise<void> {
    const slipDocRef = doc(db, SLIPS_COLLECTION, slipId)
    await updateDoc(slipDocRef, {
      ...updatedData,
      isEdited: true,
      updatedAt: new Date().toISOString()
    })
  }
}
