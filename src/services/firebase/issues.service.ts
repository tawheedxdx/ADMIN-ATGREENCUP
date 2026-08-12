import {
  collection, doc, getDocs, getDoc, updateDoc,
  query, where, orderBy, type QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Issue, IssueStatus, IssuePriority, ResolutionType } from '@/types'
import { auditService } from './audit.service'

const COLLECTION = 'issues'

export interface IssueFilters {
  status?: IssueStatus
  priority?: IssuePriority
  machineNo?: string
  search?: string
}

export const issuesService = {
  async getAll(filters?: IssueFilters): Promise<Issue[]> {
    try {
      const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]

      if (filters?.status) {
        constraints.unshift(where('status', '==', filters.status))
      }

      const q = query(collection(db, COLLECTION), ...constraints)
      const snapshot = await getDocs(q)
      let issues = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Issue))

      if (filters?.priority) {
        issues = issues.filter(i => i.priority === filters.priority)
      }
      if (filters?.machineNo) {
        issues = issues.filter(i => i.machineNo === filters.machineNo)
      }
      if (filters?.search) {
        const lowerSearch = filters.search.toLowerCase()
        issues = issues.filter(i => 
          i.operatorName?.toLowerCase().includes(lowerSearch) ||
          i.machineNo?.toLowerCase().includes(lowerSearch) ||
          i.description?.toLowerCase().includes(lowerSearch) ||
          i.issueType?.toLowerCase().includes(lowerSearch)
        )
      }

      return issues
    } catch (error: any) {
      console.error('[issuesService.getAll] Error:', error.message)
      if (error.code === 'failed-precondition') {
        const q = query(collection(db, COLLECTION))
        const snapshot = await getDocs(q)
        let issues = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Issue))
        issues.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        return issues
      }
      throw error
    }
  },

  async getById(id: string): Promise<Issue | null> {
    const docSnap = await getDoc(doc(db, COLLECTION, id))
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() } as Issue
  },

  async updateStatus(
    id: string, 
    newStatus: IssueStatus, 
    adminUid: string = 'admin', 
    adminName: string = 'System Admin'
  ): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    })

    await auditService.log({
      action: 'update_issue_status',
      module: 'issues',
      performedBy: adminUid,
      performedByName: adminName,
      targetId: id,
      targetType: 'issue',
      details: `Updated issue status to ${newStatus}`,
    })
  },

  async resolveIssue(
    id: string, 
    notesOrPayload: string | {
      status: IssueStatus
      resolutionType: ResolutionType
      adminNote: string
    }, 
    adminUid: string = 'admin', 
    adminName: string = 'System Admin'
  ): Promise<void> {
    const payload = typeof notesOrPayload === 'string' ? {
      status: 'resolved' as IssueStatus,
      resolutionType: 'fixed' as ResolutionType,
      adminNote: notesOrPayload,
    } : notesOrPayload

    await updateDoc(doc(db, COLLECTION, id), {
      status: payload.status,
      resolutionType: payload.resolutionType,
      adminNote: payload.adminNote,
      resolvedAt: payload.status === 'resolved' || payload.status === 'closed' ? new Date().toISOString() : undefined,
      resolvedBy: payload.status === 'resolved' || payload.status === 'closed' ? adminUid : undefined,
      updatedAt: new Date().toISOString(),
    })

    await auditService.log({
      action: 'resolve_issue',
      module: 'issues',
      performedBy: adminUid,
      performedByName: adminName,
      targetId: id,
      targetType: 'issue',
      details: `Resolved issue. Status: ${payload.status}, Type: ${payload.resolutionType}`,
    })
  },
  
  async updateAdminNote(
    id: string,
    adminNote: string,
    adminUid: string,
    adminName: string
  ): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
      adminNote,
      updatedAt: new Date().toISOString(),
    })

    await auditService.log({
      action: 'update_issue_note',
      module: 'issues',
      performedBy: adminUid,
      performedByName: adminName,
      targetId: id,
      targetType: 'issue',
      details: `Updated admin note on issue`,
    })
  }
}
