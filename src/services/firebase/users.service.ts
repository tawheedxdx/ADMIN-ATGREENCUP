import {
  collection, doc, getDocs, getDoc, updateDoc, setDoc,
  query, where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { User } from '@/types'

const COLLECTION = 'users'

export const usersService = {
  async getAll(): Promise<User[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION))
      const users = snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as User))
      users.sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''))
      return users
    } catch (error: any) {
      console.error('[usersService.getAll] Error:', error.message)
      return []
    }
  },

  async getOperators(): Promise<User[]> {
    try {
      const q = query(collection(db, COLLECTION), where('role', '==', 'operator'))
      const snapshot = await getDocs(q)
      const operators = snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as User))
      operators.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''))
      return operators
    } catch (error: any) {
      console.error('[usersService.getOperators] Error:', error.message)
      return []
    }
  },

  async getById(uid: string): Promise<User | null> {
    try {
      const docSnap = await getDoc(doc(db, COLLECTION, uid))
      if (!docSnap.exists()) return null
      return { uid: docSnap.id, ...docSnap.data() } as User
    } catch (error: any) {
      console.error('[usersService.getById] Error:', error.message)
      return null
    }
  },

  async create(data: Omit<User, 'uid' | 'createdAt'>): Promise<string> {
    const docRef = doc(collection(db, COLLECTION))
    await setDoc(docRef, {
      ...data,
      createdAt: new Date().toISOString(),
    })
    return docRef.id
  },

  async update(uid: string, data: Partial<User>): Promise<void> {
    await updateDoc(doc(db, COLLECTION, uid), {
      ...data,
      updatedAt: new Date().toISOString(),
    })
  },

  async deactivate(uid: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, uid), {
      status: 'inactive',
      updatedAt: new Date().toISOString(),
    })
  },

  async activate(uid: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, uid), {
      status: 'active',
      updatedAt: new Date().toISOString(),
    })
  },

  async createUser(data: Partial<User>): Promise<string> {
    return this.create({
      email: data.email || '',
      displayName: data.displayName || data.name || '',
      role: data.role || 'operator',
      status: data.status || 'active',
      phone: data.phone,
    })
  },

  async toggleUserStatus(
    uidOrObj: string | { id?: string; uid?: string; isActive: boolean },
    isActiveParam?: boolean
  ): Promise<void> {
    let uid = ''
    let active = true

    if (typeof uidOrObj === 'string') {
      uid = uidOrObj
      active = isActiveParam ?? true
    } else {
      uid = uidOrObj.uid || uidOrObj.id || ''
      active = uidOrObj.isActive
    }

    if (active) {
      return this.activate(uid)
    } else {
      return this.deactivate(uid)
    }
  },
}
