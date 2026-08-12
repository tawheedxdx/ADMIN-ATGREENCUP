import {
  collection, doc, getDocs, getDoc, updateDoc, writeBatch,
  query, where, orderBy,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { salaryService } from './salary.service'
import type { Entry, EntryFilters } from '@/types'

const COLLECTION = 'entries'

export const entriesService = {
  async getAll(filters?: EntryFilters): Promise<Entry[]> {
    try {
      const constraints: QueryConstraint[] = [orderBy('submittedAt', 'desc')]

      if (filters?.status) {
        constraints.unshift(where('status', '==', filters.status))
      } else if (filters?.operatorUid) {
        constraints.unshift(where('operatorUid', '==', filters.operatorUid))
      }

      const q = query(collection(db, COLLECTION), ...constraints)
      const snapshot = await getDocs(q)
      let entries = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Entry))

      if (filters?.machineNo) {
        entries = entries.filter(e => e.machineNo === filters.machineNo)
      }
      if (filters?.productName) {
        entries = entries.filter(e => e.productName === filters.productName)
      }
      if (filters?.operatorUid && filters?.status) {
        entries = entries.filter(e => e.operatorUid === filters.operatorUid)
      }

      return entries
    } catch (error: any) {
      console.error('[entriesService.getAll] Error:', error.message)
      if (error.code === 'failed-precondition') {
        const q = query(collection(db, COLLECTION))
        const snapshot = await getDocs(q)
        let entries = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Entry))
        entries.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))
        return entries
      }
      throw error
    }
  },

  async getPending(): Promise<Entry[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('status', '==', 'pending'),
        orderBy('submittedAt', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Entry))
    } catch (error: any) {
      console.error('[entriesService.getPending] Error:', error.message)
      if (error.code === 'failed-precondition') {
        const q = query(collection(db, COLLECTION), where('status', '==', 'pending'))
        const snapshot = await getDocs(q)
        const entries = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Entry))
        entries.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))
        return entries
      }
      throw error
    }
  },

  async getById(id: string): Promise<Entry | null> {
    const docSnap = await getDoc(doc(db, COLLECTION, id))
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() } as Entry
  },

  async approve(id: string, adminUid: string, adminName?: string): Promise<void> {
    const entryRef = doc(db, COLLECTION, id)
    const entrySnap = await getDoc(entryRef)
    if (!entrySnap.exists()) {
      throw new Error('Entry not found')
    }
    const entryData = entrySnap.data() as Entry
    
    const approvalData = {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: adminUid,
      approvedByName: adminName || '',
    }

    try {
      const activeRule = await salaryService.getActiveRuleByMachine(entryData.machineNo)
      const batch = writeBatch(db)
      
      batch.update(entryRef, approvalData)
      
      if (activeRule && activeRule.rateAmount > 0) {
        let calcQty = entryData.quantity
        let matchedUnit = entryData.unit || activeRule.unit

        const isNewFormat = entryData.pcs !== undefined || entryData.boxQuantity !== undefined
        if (isNewFormat) {
          const ruleUnitLow = activeRule.unit.toLowerCase()
          if (ruleUnitLow.includes('box')) {
            calcQty = entryData.boxQuantity ?? 0
            matchedUnit = 'BOX'
          } else if (ruleUnitLow.includes('pc') || ruleUnitLow.includes('piece')) {
            calcQty = entryData.pcs ?? 0
            matchedUnit = 'PCS'
          } else {
            calcQty = entryData.pcs ?? 0
            matchedUnit = activeRule.unit
          }
        } else {
          if (entryData.quantity2 !== undefined && entryData.unit2) {
            const ruleUnitLow = activeRule.unit.toLowerCase()
            const u2Low = entryData.unit2.toLowerCase()
            if ((ruleUnitLow.includes('pc') || ruleUnitLow.includes('piece')) && (u2Low.includes('pc') || u2Low.includes('piece'))) {
              calcQty = entryData.quantity2
              matchedUnit = entryData.unit2
            }
          }
        }
        
        calcQty = Math.floor(Math.max(0, calcQty || 0))
        const amount = salaryService.calculateAmount(calcQty, activeRule)
        
        const getISOWeek = (date: Date) => {
          const tdt = new Date(date.valueOf())
          const dayn = (date.getDay() + 6) % 7
          tdt.setDate(tdt.getDate() - dayn + 3)
          const firstThursday = tdt.valueOf()
          tdt.setMonth(0, 1)
          if (tdt.getDay() !== 4) {
              tdt.setMonth(0, 1 + ((4 - tdt.getDay()) + 7) % 7)
          }
          return 1 + Math.ceil((firstThursday - tdt.valueOf()) / 604800000)
        }

        let defaultPeriod = 'weekly'
        try {
          const settings = await salaryService.getSettings()
          defaultPeriod = settings.defaultPeriod
        } catch (e) {
          console.error('Failed to load salary settings fallback to weekly', e)
        }
        
        let periodKey = ''
        const dateObj = entryData.productionDate ? new Date(entryData.productionDate) : new Date()
        if (defaultPeriod === 'monthly') {
          periodKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`
        } else {
          periodKey = `${dateObj.getFullYear()}-W${String(getISOWeek(dateObj)).padStart(2, '0')}`
        }
        
        const earningRef = doc(collection(db, 'earnings'))
        batch.set(earningRef, {
          entryId: id,
          operatorUid: entryData.operatorUid,
          operatorName: entryData.operatorName,
          machineNo: entryData.machineNo,
          productName: entryData.productName || '',
          quantity: calcQty,
          unit: matchedUnit,
          productionDate: entryData.productionDate || new Date().toISOString().split('T')[0],
          calculatedAmount: amount,
          rateAmount: activeRule.rateAmount,
          ratePerQuantity: activeRule.ratePerQuantity,
          periodType: defaultPeriod,
          periodKey: periodKey,
          paymentStatus: 'pending_payment',
          createdAt: new Date().toISOString()
        })
      }
      
      await batch.commit()
    } catch (error) {
      console.error('[entriesService.approve] Batch operation failed. Falling back to discrete approval:', error)
      await updateDoc(entryRef, approvalData)
    }
  },

  async reject(id: string, adminUid: string, reason: string, adminName?: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: adminUid,
      rejectedByName: adminName || '',
      rejectionReason: reason,
    })
  },

  async correct(id: string, adminUid: string, corrections: Partial<Entry>, note: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
      ...corrections,
      status: 'corrected',
      correctedAt: new Date().toISOString(),
      correctedBy: adminUid,
      correctionNote: note,
    })
  },

  async approveEntry(id: string, adminUid: string = 'admin', adminName: string = 'System Admin'): Promise<void> {
    return this.approve(id, adminUid, adminName)
  },

  async rejectEntry(id: string, adminUid: string = 'admin', reason: string = 'Rejected by Admin', adminName: string = 'System Admin'): Promise<void> {
    return this.reject(id, adminUid, reason, adminName)
  },

  async correctEntry(
    id: string,
    correctionsOrAdminUid: string | Partial<Entry>,
    correctionsOrNote?: Partial<Entry> | string,
    noteStr?: string
  ): Promise<void> {
    if (typeof correctionsOrAdminUid === 'string') {
      const adminUid = correctionsOrAdminUid
      const corrections = (correctionsOrNote as Partial<Entry>) || {}
      const note = noteStr || 'Corrected by Admin'
      return this.correct(id, adminUid, corrections, note)
    } else {
      const corrections = correctionsOrAdminUid
      const note = (correctionsOrNote as string) || 'Corrected by Admin'
      return this.correct(id, 'admin', corrections, note)
    }
  },

  async getTodayEntries(): Promise<Entry[]> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const q = query(
        collection(db, COLLECTION),
        where('productionDate', '>=', today),
        orderBy('productionDate', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Entry))
    } catch (error: any) {
      console.error('[entriesService.getTodayEntries] Error:', error.message)
      return []
    }
  },
}
