import { useState } from 'react'
import type { User } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '@/services/firebase/users.service'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { UserPlus, UserCheck, UserX, Search, Shield, Phone, Mail } from 'lucide-react'

export default function Employees() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'operator' as 'operator' | 'admin',
  })

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => usersService.getAll(),
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersService.toggleUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] })
    },
  })

  const createUserMutation = useMutation({
    mutationFn: (userData: typeof newUser) => usersService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] })
      setIsAddOpen(false)
      setNewUser({ name: '', email: '', phone: '', role: 'operator' })
    },
  })

  const filteredUsers = users.filter(
    (u: User) =>
      (u.displayName || u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone || '').includes(searchTerm)
  )

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-20" label="Fetching Team Directory..." />
  }

  if (error) {
    return <ErrorState onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-graphite-100">Team Directory</h2>
          <p className="text-xs text-graphite-400">Manage operators and admin accounts</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="py-2 px-3 bg-brand-600 hover:bg-brand-500 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-graphite-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, phone..."
          className="w-full bg-graphite-900 border border-graphite-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-graphite-100 placeholder-graphite-500 focus:border-brand-500 focus:outline-none"
        />
      </div>

      {/* User Cards */}
      {filteredUsers.length === 0 ? (
        <EmptyState title="No Employees Found" description="Try searching for another name or email." />
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user: User) => (
            <div
              key={user.uid || user.id}
              className="p-4 bg-graphite-900/90 border border-graphite-800 rounded-2xl space-y-3 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-graphite-800 border border-graphite-700 flex items-center justify-center font-extrabold text-brand-400 text-sm">
                    {(user.displayName || user.name || 'OP').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-graphite-100">{user.displayName || user.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-graphite-950 text-graphite-400 border border-graphite-800 uppercase font-semibold">
                        {user.role}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          user.status === 'active' || user.isActive !== false
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                            : 'bg-red-950/80 text-red-400 border border-red-800/40'
                        }`}
                      >
                        {user.status === 'active' || user.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Toggle Button */}
                <button
                  onClick={() =>
                    toggleStatusMutation.mutate({
                      id: user.uid || user.id || '',
                      isActive: !(user.status === 'active' || user.isActive !== false),
                    })
                  }
                  className={`p-2 rounded-xl border transition-all ${
                    user.status === 'active' || user.isActive !== false
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/60'
                      : 'bg-graphite-800 text-graphite-400 border-graphite-700'
                  }`}
                >
                  {user.status === 'active' || user.isActive !== false ? (
                    <UserCheck className="w-4 h-4" />
                  ) : (
                    <UserX className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-graphite-850/60 text-graphite-300">
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-graphite-500 shrink-0" />
                  <span className="truncate">{user.email || 'No Email'}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-graphite-500 shrink-0" />
                  <span className="truncate">{user.phone || 'No Phone'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Bottom Sheet */}
      <BottomSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Employee">
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-graphite-300">Full Name</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full mt-1 bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-xs text-graphite-100 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-graphite-300">Email Address</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="e.g. rahul@atgreencup.com"
                className="w-full mt-1 bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-xs text-graphite-100 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-graphite-300">Phone Number</label>
              <input
                type="tel"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full mt-1 bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-xs text-graphite-100 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-graphite-300">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                className="w-full mt-1 bg-graphite-950 border border-graphite-800 rounded-xl p-3 text-xs text-graphite-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="operator">Machine Operator</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>
          </div>

          <button
            disabled={createUserMutation.isPending || !newUser.name.trim()}
            onClick={() => createUserMutation.mutate(newUser)}
            className="w-full py-3 bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            Create Employee Profile
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
