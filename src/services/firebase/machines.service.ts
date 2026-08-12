import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Machine } from '@/types'

const COLLECTION = 'machines'

export const machinesService = {
  async getAll(): Promise<Machine[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION))
      const machines = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Machine))
      machines.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      return machines
    } catch (error: any) {
      console.error('[machinesService.getAll] Error:', error.message)
      return []
    }
  },

  async getById(id: string): Promise<Machine | null> {
    try {
      const docSnap = await getDoc(doc(db, COLLECTION, id))
      if (!docSnap.exists()) return null
      return { id: docSnap.id, ...docSnap.data() } as Machine
    } catch (error: any) {
      console.error('[machinesService.getById] Error:', error.message)
      return null
    }
  },

  async create(data: Omit<Machine, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: new Date().toISOString(),
    })
    return docRef.id
  },

  async update(id: string, data: Partial<Machine>): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      updatedAt: new Date().toISOString(),
    })
  },

  async updateStatus(id: string, status: 'active' | 'inactive' | 'maintenance'): Promise<void> {
    await this.update(id, { status })
  },
}
