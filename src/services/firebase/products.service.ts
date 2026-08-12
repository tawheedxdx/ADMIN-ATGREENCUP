import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Product } from '@/types'

const COLLECTION = 'products'

export const productsService = {
  async getAll(): Promise<Product[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION))
      const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product))
      products.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      return products
    } catch (error: any) {
      console.error('[productsService.getAll] Error:', error.message)
      return []
    }
  },

  async getById(id: string): Promise<Product | null> {
    try {
      const docSnap = await getDoc(doc(db, COLLECTION, id))
      if (!docSnap.exists()) return null
      return { id: docSnap.id, ...docSnap.data() } as Product
    } catch (error: any) {
      console.error('[productsService.getById] Error:', error.message)
      return null
    }
  },

  async create(data: Omit<Product, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: new Date().toISOString(),
    })
    return docRef.id
  },

  async update(id: string, data: Partial<Product>): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      updatedAt: new Date().toISOString(),
    })
  },
}
