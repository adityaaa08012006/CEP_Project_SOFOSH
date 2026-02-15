import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../api';
import { ROLES } from '@cep/shared';
import { LoadingSpinner, EmptyState, Modal } from '../../components/ui/Common';
import { Users, Search, Shield, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ManageUsersPage() {
  const [search, setSearch] = useState('');
  const [roleModal, setRoleModal] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => userApi.getAll(search ? { search } : {}).then((r) => r.data),
  });

  const roleMut = useMutation({
    mutationFn: ({ id, role }) => userApi.updateRole(id, { role }),
    onSuccess: () => {
      toast.success('User role updated');
      setRoleModal(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update role'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => userApi.delete(id),
    onSuccess: () => {
      toast.success('User deactivated');
      setDeleteModal(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to deactivate'),
  });

  if (isLoading) return <LoadingSpinner className="py-20" />;

  const users = data?.users || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <p className="text-gray-500">View, search and manage user accounts</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No Users" description="No users found matching your search." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Phone</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Joined</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">{u.full_name}</td>
                  <td className="py-3 text-gray-500">{u.email}</td>
                  <td className="py-3 text-gray-500">{u.phone || '-'}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.role === ROLES.ADMIN
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                  <td className="py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => { setRoleModal(u); setNewRole(u.role); }}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                        title="Change role"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal(u)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Deactivate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Modal */}
      <Modal isOpen={!!roleModal} onClose={() => setRoleModal(null)} title="Change User Role">
        {roleModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Change role for <strong>{roleModal.full_name}</strong>
            </p>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="input-field">
              <option value={ROLES.USER}>User</option>
              <option value={ROLES.ADMIN}>Admin</option>
            </select>
            <div className="flex space-x-3">
              <button
                onClick={() => roleMut.mutate({ id: roleModal.id, role: newRole })}
                disabled={roleMut.isPending}
                className="btn-primary flex-1"
              >
                {roleMut.isPending ? 'Saving...' : 'Update Role'}
              </button>
              <button onClick={() => setRoleModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Deactivate User">
        {deleteModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Deactivate <strong>{deleteModal.full_name}</strong>? They will no longer be able to log in.
            </p>
            <div className="flex space-x-3">
              <button onClick={() => deleteMut.mutate(deleteModal.id)} disabled={deleteMut.isPending} className="btn-danger flex-1">
                {deleteMut.isPending ? 'Deactivating...' : 'Deactivate'}
              </button>
              <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
