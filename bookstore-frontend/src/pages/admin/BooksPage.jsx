import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

/**
 * Admin Books Management page – list of books with placeholder actions.
 * Real implementation would call bookApi for CRUD operations.
 */
const BooksPage = () => {
  // Placeholder data – replace with API call later.
  const books = [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Quản lý sách</h1>
      {books.length === 0 ? (
        <p className="text-gray-600">Chưa có dữ liệu sách. (Bạn có thể tích hợp API để lấy danh sách)</p>
      ) : (
        <table className="min-w-full bg-white shadow rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left">ID</th>
              <th className="py-2 px-4 text-left">Tiêu đề</th>
              <th className="py-2 px-4 text-left">Tác giả</th>
              <th className="py-2 px-4 text-left">Giá</th>
              <th className="py-2 px-4 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>{/* map rows */}</tbody>
        </table>
      )}
    </div>
  );
};

export default BooksPage;
