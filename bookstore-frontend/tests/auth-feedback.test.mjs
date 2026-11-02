import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { authFailure, authDestination, authLink, loginSchema, registerSchema } from '../src/utils/authFeedback.js';

const validRegistration = { full_name: 'Độc Giả Kiểm Thử', username: 'reader_test', email: 'reader@example.invalid',
  phone: '', password: 'Reader@123', password_confirm: 'Reader@123' };

test('registration password validation agrees with the actual Java request contract', async () => {
  const java = await readFile(new URL('../../user-services/src/main/java/com/bookstore/userservices/dto/request/RegisterRequest.java', import.meta.url), 'utf8');
  const expression = java.match(/regexp\s*=\s*"((?:\\.|[^"\\])*)"/)[1];
  const backendRule = new RegExp(JSON.parse(`"${expression}"`));
  for (const password of ['Reader@123', 'reader123', 'READER@123', 'reader@123', 'Reader@abc', 'Ab1@', 'Reader#123', 'Reader@123 ', 'ĐọcSách@123']) {
    const result = registerSchema.safeParse({ ...validRegistration, password, password_confirm: password });
    assert.equal(result.success, backendRule.test(password), `Password policy mismatch (${password.length} characters)`);
  }
});

test('forms trim identifiers but preserve passwords; registration confirms password and validates optional phone', () => {
  assert.deepEqual(loginSchema.parse({ username: ' reader ', password: ' password ' }), { username: 'reader', password: ' password ' });
  assert.equal(loginSchema.safeParse({ username: '   ', password: 'p' }).success, false);
  assert.equal(registerSchema.safeParse(validRegistration).success, true);
  assert.equal(registerSchema.safeParse({ ...validRegistration, username: 'abc' }).success, true);
  assert.equal(registerSchema.safeParse({ ...validRegistration, password_confirm: 'Other@123' }).success, false);
  assert.equal(registerSchema.safeParse({ ...validRegistration, phone: '123' }).success, false);
});

test('backend validation fields map to the visible registration fields', () => {
  const failure = authFailure({ status: 400, data: { message: 'Dữ liệu gửi lên không hợp lệ',
    data: { fullName: 'Vui lòng nhập họ tên', password: 'Mật khẩu chưa hợp lệ', internal: 'ignore' } } }, 'register');
  assert.deepEqual(failure.fieldErrors, { full_name: 'Vui lòng nhập họ tên', password: 'Mật khẩu chưa hợp lệ' });
  assert.equal(failure.type, 'error');
});

test('duplicate username/email errors identify the field without treating rate limiting as a connection failure', () => {
  assert.equal(authFailure({ status: 409, message: 'Tên đăng nhập đã tồn tại' }, 'register').fieldErrors.username, 'Tên đăng nhập đã tồn tại');
  assert.equal(authFailure({ status: 400, message: 'Email đã được đăng ký' }, 'register').fieldErrors.email, 'Email đã được đăng ký');
  const rateLimit = authFailure({ status: 429, message: 'Vui lòng thử lại sau 15 phút.' }, 'login');
  assert.match(rateLimit.message, /15 phút/);
  assert.doesNotMatch(rateLimit.message, /kết nối/);
});

test('network, timeout, locked account and server failure provide actionable messages', () => {
  assert.match(authFailure({ status: 0 }, 'login').message, /kết nối mạng/);
  assert.match(authFailure({ status: 408 }, 'register').message, /phản hồi quá lâu/);
  assert.match(authFailure({ status: 403, message: 'Tài khoản bị khóa' }, 'login').message, /bị khóa/);
  assert.match(authFailure({ status: 401 }, 'login').message, /chưa chính xác/);
  assert.doesNotMatch(authFailure({ status: 500, message: 'SQL stacktrace' }, 'register').message, /SQL/);
});

test('login destination supports staff/admin and preserves a safe return path across registration', () => {
  assert.equal(authDestination(null, 'STAFF'), '/admin');
  assert.equal(authDestination(null, { name: 'ADMIN' }), '/admin');
  assert.equal(authDestination(null, 'CUSTOMER'), '/');
  assert.equal(authDestination('/books?q=java', 'CUSTOMER'), '/books?q=java');
  for (const path of ['https://example.invalid', '//example.invalid', '/\\example.invalid', '/login', '/register?redirect=/cart', '/\n/evil']) {
    assert.equal(authDestination(path, 'CUSTOMER'), '/');
  }
  assert.equal(new URL(authLink('/register', '/checkout?buyNow=1'), 'https://local.invalid').searchParams.get('redirect'), '/checkout?buyNow=1');
});
