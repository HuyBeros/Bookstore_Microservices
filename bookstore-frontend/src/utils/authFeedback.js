import { z } from 'zod';
import { isValidPhoneVN } from './formatters.js';
import { isInternalUrl } from './helpers.js';

// Keep the password rule aligned with RegisterRequest.java.
export const passwordRules = [
  { label: 'Ít nhất 8 ký tự', test: value => value.length >= 8 },
  { label: 'Có chữ hoa và chữ thường', test: value => /[A-Z]/.test(value) && /[a-z]/.test(value) },
  { label: 'Có ít nhất một chữ số', test: value => /\d/.test(value) },
  { label: 'Có ký tự đặc biệt @$!%*?&', test: value => /[@$!%*?&]/.test(value) },
];

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập hoặc email'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const registerSchema = z.object({
  full_name: z.string().trim().min(1, 'Vui lòng nhập họ và tên'),
  username: z.string().trim().min(3, 'Tên đăng nhập cần từ 3 đến 50 ký tự')
    .max(50, 'Tên đăng nhập tối đa 50 ký tự').regex(/^\S+$/, 'Tên đăng nhập không được chứa khoảng trắng'),
  email: z.string().trim().email('Vui lòng nhập địa chỉ email hợp lệ'),
  phone: z.string().trim().refine(value => !value || isValidPhoneVN(value), 'Số điện thoại cần có 10 chữ số và bắt đầu bằng 0'),
  password: z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Mật khẩu cần chữ hoa, chữ thường, số và ký tự đặc biệt @$!%*?&; không dùng dấu cách hoặc ký tự khác'),
  password_confirm: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
}).refine(data => data.password === data.password_confirm, {
  message: 'Mật khẩu xác nhận chưa khớp', path: ['password_confirm'],
});

export function authLink(path, redirect) {
  return isInternalUrl(redirect) ? `${path}?${new URLSearchParams({ redirect })}` : path;
}

export function authDestination(redirect, role) {
  if (isInternalUrl(redirect) && !redirect.includes('\\') && ![...redirect].some(char => char.charCodeAt(0) <= 32) && !/^\/(login|register)(?:[/?#]|$)/.test(redirect)) return redirect;
  return ['ADMIN', 'STAFF'].includes(role?.name || role) ? '/admin' : '/';
}

export function authFailure(error, mode) {
  const status = error?.status ?? error?.response?.status;
  const body = error?.data ?? error?.response?.data;
  let message = typeof body?.message === 'string' ? body.message : error?.message;
  if (status === 0) message = 'Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
  else if (status === 408) message = 'Máy chủ phản hồi quá lâu. Vui lòng thử lại sau ít phút.';
  else if (status >= 500) message = 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau ít phút.';
  else if (status === 429) message ||= 'Bạn đã thử quá nhiều lần. Vui lòng chờ một lúc rồi thử lại.';
  else if (mode === 'login' && (status === 400 || status === 401)) message = 'Tên đăng nhập, email hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra lại.';
  else if (mode === 'login' && status === 403) message ||= 'Tài khoản đang bị khóa. Vui lòng liên hệ nhà sách để được hỗ trợ.';
  if (!message || message === 'Có lỗi xảy ra') message = mode === 'login' ? 'Chưa thể đăng nhập. Vui lòng thử lại.' : 'Chưa thể tạo tài khoản. Vui lòng thử lại.';

  const aliases = { username: 'username', usernameOrEmail: 'username', email: 'email', password: 'password', fullName: 'full_name', phone: 'phone' };
  const fieldErrors = {};
  if (status === 400 && body?.data && typeof body.data === 'object') {
    for (const [key, value] of Object.entries(body.data)) {
      if (aliases[key] && typeof value === 'string') fieldErrors[aliases[key]] = value;
    }
  }
  if (mode === 'register' && [400, 409].includes(status)) {
    if (/tên đăng nhập|username/i.test(message)) fieldErrors.username ||= message;
    else if (/email/i.test(message)) fieldErrors.email ||= message;
  }
  return { type: 'error', message, fieldErrors };
}
