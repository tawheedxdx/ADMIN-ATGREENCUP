import { collection, addDoc, getDocs, query, orderBy, limit as firestoreLimit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { AuditLog } from '@/types'

const COLLECTION = 'audit_logs'

export const auditService = {
  async log(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      await addDoc(collection(db, COLLECTION), {
        ...entry,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('[auditService.log] Failed to write audit log:', error)
    }
  },

  async getLogs(maxRecords: number = 100): Promise<AuditLog[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        orderBy('timestamp', 'desc'),
        firestoreLimit(maxRecords)
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog))
    } catch (error: any) {
      console.error('[auditService.getLogs] Error:', error.message)
      if (error.code === 'failed-precondition') {
        const q = query(collection(db, COLLECTION), firestoreLimit(maxRecords))
        const snapshot = await getDocs(q)
        const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog))
        logs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
        return logs
      }
      return []
    }
  },
}
