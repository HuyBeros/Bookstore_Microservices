import React, { useState, useEffect } from 'react';
import {
  Button,
  DataTable,
  SearchInput,
  Select,
  EmptyState,
  ErrorState,
  StatusBadge,
  Modal,
  PageHeader,
  Badge,
} from '../../components/ui';
import { userApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

/**
 * UserManagePage Component
 * Manage system users: view accounts, change roles, lock/unlock accounts
 */
const UserManagePage = () => {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params = {
          ...(searchTerm && { search: searchTerm }),
          ...(roleFilter !== 'all' && { role: roleFilter }),
          limit: 50,
        };
        const data = await userApi.getUsers(params);
        setUsers(Array.isArray(data) ? data : data?.data || []);
        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải danh sách người dùng:', err);
        setError('Không thể tải danh sách tài khoản');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter]);

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;

    // Prevent self-demotion
    const isSelf =
      String(selectedUser.id) === String(currentUser?.id || currentUser?.user_id) ||
      selectedUser.username === currentUser?.username;

    if (isSelf && newRole !== 'ADMIN') {
      showToast('error', 'Bạn không thể tự hạ quyền tài khoản của chính mình');
      return;
    }

    try {
      setUpdatingId(selectedUser.id);
      await userApi.updateUserRole(selectedUser.id, newRole);
      setUsers(
        users.map((u) => (u.id === selectedUser.id ? { ...u, role: newRole } : u))
      );
      showToast('success', `Đã cập nhật vai trò của ${selectedUser.username} thành ${newRole}`);
      setRoleModalOpen(false);
    } catch (err) {
      showToast('error', err.message || 'Không thể cập nhật vai trò');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleLock = async (targetUser) => {
    const isSelf =
      String(targetUser.id) === String(currentUser?.id || currentUser?.user_id) ||
      targetUser.username === currentUser?.username;

    if (isSelf) {
      showToast('error', 'Quy tắc an toàn: Quản trị viên không được tự khóa tài khoản của mình');
      return;
    }

    try {
      setUpdatingId(targetUser.id);
      const newStatus = targetUser.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';

      await userApi.updateUserStatus(targetUser.id, newStatus);
      setUsers(
        users.map((u) => (u.id === targetUser.id ? { ...u, status: newStatus } : u))
      );
      showToast(
        'success',
        newStatus === 'LOCKED'
          ? `Đã khóa tài khoản @${targetUser.username}`
          : `Đã mở khóa tài khoản @${targetUser.username}`
      );
    } catch (err) {
      showToast('error', err.message || 'Không thể thay đổi trạng thái tài khoản');
    } finally {
      setUpdatingId(null);
    }
  };

  const columns = [
    {
      header: 'Họ và tên / Username',
      accessor: 'full_name',
      render: (row) => (
        <div>
          <p className="font-semibold text-body-sm text-ink dark:text-ink">
            {row.full_name || 'Chưa cập nhật'}
          </p>
          <p className="text-caption text-ink-muted">@{row.username}</p>
        </div>
      ),
    },
    {
      header: 'Email liên hệ',
      accessor: 'email',
      render: (row) => (
        <p className="text-body-sm text-ink dark:text-ink">{row.email || '-'}</p>
      ),
    },
    {
      header: 'Vai trò',
      accessor: 'role',
      render: (row) => {
        const isAdm = row.role === 'ADMIN';
        const isStaff = row.role === 'STAFF';
        return (
          <Badge variant={isAdm ? 'primary' : isStaff ? 'info' : 'secondary'} size="sm">
            {isAdm ? 'Quản trị viên (ADMIN)' : isStaff ? 'Nhân viên (STAFF)' : 'Khách hàng (CUSTOMER)'}
          </Badge>
        );
      },
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (row) => <StatusBadge type="user" value={row.status} />,
    },
    {
      header: 'Thao tác',
      accessor: 'id',
      render: (row) => {
        const isSelf =
          String(row.id) === String(currentUser?.id || currentUser?.user_id) ||
          row.username === currentUser?.username;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedUser(row);
                setNewRole(row.role);
                setRoleModalOpen(true);
              }}
              disabled={updatingId === row.id}
            >
              Đổi vai trò
            </Button>

            {isSelf ? (
              <span
                className="text-caption text-ink-muted italic px-2 py-1 bg-surface-muted rounded-button border border-border"
                title="Quy tắc an toàn: Không thể tự khóa tài khoản đang đăng nhập"
              >
                Đang đăng nhập
              </span>
            ) : (
              <Button
                variant={row.status === 'ACTIVE' ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => handleToggleLock(row)}
                loading={updatingId === row.id}
                className={row.status === 'ACTIVE' ? 'text-danger hover:bg-danger-soft' : ''}
              >
                {row.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Tài khoản & Phân quyền"
        subtitle="Quản lý danh sách tài khoản người dùng, nhân viên và thiết lập quyền hạn"
      />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchInput
          placeholder="Tìm theo tên, username hoặc email..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <Select
          options={[
            { value: 'all', label: 'Tất cả vai trò' },
            { value: 'ADMIN', label: 'Quản trị viên (ADMIN)' },
            { value: 'STAFF', label: 'Nhân viên (STAFF)' },
            { value: 'CUSTOMER', label: 'Khách hàng (CUSTOMER)' },
          ]}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        />
      </div>

      {/* Users Table */}
      {error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : users.length === 0 && !loading ? (
        <EmptyState
          title="Không tìm thấy tài khoản phù hợp"
          description="Thử tìm kiếm bằng tên hoặc username khác"
        />
      ) : (
        <DataTable columns={columns} data={users} loading={loading} />
      )}

      {/* Role Change Modal */}
      {roleModalOpen && selectedUser && (
        <Modal
          title={`Phân quyền: ${selectedUser.full_name || selectedUser.username}`}
          onClose={() => {
            setRoleModalOpen(false);
            setSelectedUser(null);
          }}
        >
          <div className="space-y-4">
            <p className="text-body-sm text-ink-muted">
              Chọn vai trò phân quyền cho tài khoản <strong className="text-ink">@{selectedUser.username}</strong>
            </p>

            <Select
              options={[
                { value: 'ADMIN', label: 'Quản trị viên (ADMIN) - Toàn quyền quản trị hệ thống' },
                { value: 'STAFF', label: 'Nhân viên (STAFF) - Quản lý sách, kho hàng và đơn hàng' },
                { value: 'CUSTOMER', label: 'Khách hàng (CUSTOMER) - Mua sắm và đọc sách' },
              ]}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setRoleModalOpen(false);
                  setSelectedUser(null);
                }}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleChangeRole}
                loading={updatingId === selectedUser.id}
              >
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagePage;
