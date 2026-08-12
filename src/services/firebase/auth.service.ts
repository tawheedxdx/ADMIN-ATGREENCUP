import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User as FirebaseUser,
  type Unsubscribe,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { User } from '@/types'

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const user = await this.getUserProfile(credential.user.uid)

    if (!user) {
      const newUser: Omit<User, 'uid'> = {
        email: credential.user.email || email,
        displayName: credential.user.displayName || email.split('@')[0],
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      await setDoc(doc(db, 'users', credential.user.uid), newUser)
      return { uid: credential.user.uid, ...newUser }
    }

    if (user.role !== 'admin') {
      await signOut(auth)
      throw new Error('Access denied. Admin privileges required.')
    }

    return user
  },

  async logout(): Promise<void> {
    await signOut(auth)
  },

  async getUserProfile(uid: string): Promise<User | null> {
    try {
      const docRef = doc(db, 'users', uid)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) return null
      return { uid: docSnap.id, ...docSnap.data() } as User
    } catch (error) {
      console.error('[authService.getUserProfile] Error:', error)
      return null
    }
  },

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): Unsubscribe {
    return firebaseOnAuthStateChanged(auth, callback)
  },
}
