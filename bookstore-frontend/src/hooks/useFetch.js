import { useEffect, useState, useRef } from 'react';

/**
 * Hook: useFetch
 * Gọi async function với xử lý loading, error, refetch
 * Hủy request cũ bằng AbortController để tránh race condition
 *
 * @param {Function} fetcher - hàm gọi API, nhận signal từ AbortController
 * @param {Array} deps - dependencies (để trigger refetch)
 * @returns {{data, loading, error, refetch}}
 */
export const useFetch = (fetcher, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetch = async () => {
    try {
      // Hủy request trước đó nếu còn
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);

      const result = await fetcher(abortControllerRef.current.signal);
      setData(result);
    } catch (err) {
      // Bỏ qua lỗi từ abort
      if (err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, deps);

  return { data, loading, error, refetch: fetch };
};
