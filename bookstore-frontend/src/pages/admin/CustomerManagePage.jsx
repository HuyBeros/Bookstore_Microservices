import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { getUsers } from '../../api/services/userApi';
import { USER_STATUS_LABELS, USER_STATUS_COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import { PageHeader } from '../../components/ui';
import { ChevronRight } from 'lucide-react';

const CustomerManagePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('q') || '';

  const { data: customersData, loading } = useFetch(
    async () => {
      const res = await getUsers({
        q: search,
        role: 'CUSTOMER',
        page,
        limit: 20,
      });
      return res;
    },
    [page, search]
  );

  const columns = [
    {
      key: 'full_name',
      header: 'Họ và tên',
      width: '200px',
      render: (v, row) => (
        <div>
          <p className="font-semibold text-body-sm text-ink">{v || 'Khách hàng'}</p>
          <p className="text-caption text-ink-muted">@{row.username}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      width: '220px',
      render: (v) => <span className="text-body-sm text-ink">{v || '-'}</span>,
    },
    {
      key: 'phone',
      header: 'Số điện thoại',
      width: '150px',
      render: (v) => <span className="text-body-sm text-ink">{v || '-'}</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '130px',
      render: (v) => (
        <span className={`px-2 py-0.5 text-xs rounded-badge font-medium whitespace-nowrap inline-flex ${USER_STATUS_COLORS[v] || 'bg-green-100 text-green-800'}`}>
          {USER_STATUS_LABELS[v] || 'Hoạt động'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Ngày tham gia',
      width: '150px',
      render: (v) => formatDate(v, 'short'),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Quản lý khách hàng"
        subtitle="Danh sách độc giả và tài khoản mua hàng trên hệ thống"
      />

      <div className="flex-1 relative mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, email, số điện thoại..."
          value={search}
          onChange={(e) => setSearchParams({ q: e.target.value, page: '1' })}
          className="w-full px-4 py-2 border border-border bg-surface text-ink rounded-input focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <DataTable
        columns={columns}
        data={customersData?.data || []}
        loading={loading}
        page={page}
        totalPages={customersData?.totalPages || 1}
        onPageChange={(p) => setSearchParams({ page: p.toString(), q: search })}
      />
    </div>
  );
};

export default CustomerManagePage;
