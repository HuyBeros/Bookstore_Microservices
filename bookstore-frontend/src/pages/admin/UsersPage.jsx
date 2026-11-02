import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

/**
 * Admin Users Management page – placeholder.
 */
const UsersPage = () => {
  const users = [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Quản lý người dùng</h1>
      {users.length === 0 ? (
        <p className="text-gray-600">Chưa có dữ liệu người dùng.</p>
      ) : (
        <table className="min-w-full bg-white shadow rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left">ID</th>
              <th className="py-2 px-4 text-left">Tên</th>
              <th className="py-2 px-4 text-left">Email</th>
              <th className="py-2 px-4 text-left">Vai trò</th>
            </tr>
          </thead>
          <tbody>{/* map rows */}</tbody>
        </table>
      )}
    </div>
  );
};

export default UsersPage;
