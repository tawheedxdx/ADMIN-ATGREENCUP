import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, addDoc,
  query, where, orderBy, deleteDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { SalaryRule, SalarySettings, Earning, PaymentStatus } from '@/types'

const RULES_COLLECTION = 'salaryRules'
const EARNINGS_COLLECTION = 'earnings'

export const salaryService = {
  async getRules(): Promise<SalaryRule[]> {
    const q = query(collection(db, RULES_COLLECTION), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SalaryRule))
  },

  async getActiveRuleByMachine(machineNo: string): Promise<SalaryRule | null> {
    const q = query(
      collection(db, RULES_COLLECTION),
      where('machineNo', '==', machineNo),
      where('active', '==', true)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as SalaryRule
  },

  async createRule(ruleData: Omit<SalaryRule, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, RULES_COLLECTION), {
      ...ruleData,
      createdAt: new Date().toISOString()
    })
    return docRef.id
  },

  async updateRule(id: string, ruleData: Partial<Omit<SalaryRule, 'id' | 'createdAt'>>): Promise<void> {
    await updateDoc(doc(db, RULES_COLLECTION, id), {
      ...ruleData,
      updatedAt: new Date().toISOString()
    })
  },

  async deleteRule(id: string): Promise<void> {
    await deleteDoc(doc(db, RULES_COLLECTION, id))
  },

  async getSettings(): Promise<SalarySettings> {
    const docSnap = await getDoc(doc(db, 'salarySettings', 'default'))
    if (!docSnap.exists()) {
      return {
        defaultPeriod: 'weekly',
        allowOperatorOverride: false,
        currency: 'INR'
      }
    }
    return docSnap.data() as SalarySettings
  },

  async updateSettings(settings: Partial<SalarySettings>): Promise<void> {
    await setDoc(doc(db, 'salarySettings', 'default'), {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true })
  },

  async getAllEarnings(): Promise<Earning[]> {
    const q = query(collection(db, EARNINGS_COLLECTION), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Earning))
  },

  async getEarningsByOperator(operatorUid: string): Promise<Earning[]> {
    const q = query(
      collection(db, EARNINGS_COLLECTION),
      where('operatorUid', '==', operatorUid),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Earning))
  },

  async updatePaymentStatus(
    id: string, 
    status: PaymentStatus, 
    adminUid?: string, 
    note?: string
  ): Promise<void> {
    const updateData: any = {
      paymentStatus: status,
      updatedAt: new Date().toISOString()
    }

    if (status === 'paid') {
      updateData.paidAt = new Date().toISOString()
      updateData.paidBy = adminUid
    } else {
      updateData.paidAt = null
      updateData.paidBy = null
    }

    if (note !== undefined) {
      updateData.paymentNote = note
    }

    await updateDoc(doc(db, EARNINGS_COLLECTION, id), updateData)
  },

  calculateAmount(quantity: number, rule: SalaryRule): number {
    if (!rule.ratePerQuantity || rule.ratePerQuantity <= 0) return 0
    return (quantity / rule.ratePerQuantity) * rule.rateAmount
  }
}
