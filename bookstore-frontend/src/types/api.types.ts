/**
 * TypeScript Type Definitions for all API Services
 * Catalog, User, Order, and Inventory Services
 */

// ========== PAGINATION & COMMON TYPES ==========

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface Reference {
  id: number;
  name: string;
}

// ========== CATALOG SERVICE TYPES ==========

export interface BookResponse {
  id: number;
  title: string;
  isbn?: string;
  price: number;
  description: string;
  category: Reference;
  publisher: Reference;
  authors: Reference[];
  cover_image_url?: string;
  rating?: number;
  discount_percentage?: number;
  quantity_in_stock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookRequest {
  title: string;
  isbn?: string;
  price: number;
  description: string;
  categoryId: number;
  publisherId: number;
  authorIds: number[];
}

export interface AuthorResponse {
  id: number;
  name: string;
  biography?: string;
  birth_date?: string;
  nationality?: string;
  avatar_url?: string;
}

export interface AuthorRequest {
  name: string;
  biography?: string;
  birth_date?: string;
  nationality?: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
  icon_url?: string;
}

export interface CategoryRequest {
  name: string;
  description?: string;
}

export interface PublisherResponse {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  address?: string;
  website?: string;
}

export interface PublisherRequest {
  name: string;
  email?: string;
  phone_number?: string;
  address?: string;
  website?: string;
}

// ========== USER SERVICE TYPES ==========

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
}

export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UserDetailResponse {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  status: 'ACTIVE' | 'LOCKED';
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ========== ORDER SERVICE TYPES ==========

export interface CartItemResponse {
  bookId: number;
  title: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CartResponse {
  cartId: number;
  items: CartItemResponse[];
  totalAmount: number;
}

export interface CartItemRequest {
  bookId: number;
  quantity: number;
}

export interface OrderItemResponse {
  bookId: number;
  title: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderResponse {
  orderId: number;
  userId: number;
  shippingAddress: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt?: string;
  items: OrderItemResponse[];
}

export interface PlaceOrderRequest {
  shippingAddress: string;
  paymentMethod: PaymentMethod;
}

export interface PaymentResponse {
  paymentId: number;
  orderId: number;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transactionRef: string;
  createdAt: string;
  paidAt?: string;
  instruction: string;
}

export interface PaymentRequest {
  method: PaymentMethod;
}

// ========== INVENTORY SERVICE TYPES ==========

export interface InventoryResponse {
  bookId: number;
  quantity: number;
  updatedAt: string;
}

export interface InventoryTransactionResponse {
  id: number;
  bookId: number;
  type: TransactionType;
  quantityChange: number;
  quantityAfter: number;
  orderId?: number;
  note: string;
  createdAt: string;
}

export interface ImportInventoryRequest {
  bookId: number;
  quantity: number;
  note?: string;
}

export interface AdjustInventoryRequest {
  bookId: number;
  newQuantity: number;
  note?: string;
}

export interface DeductInventoryRequest {
  items: Array<{
    bookId: number;
    quantity: number;
  }>;
}

export interface RestoreInventoryRequest {
  items: Array<{
    bookId: number;
    quantity: number;
  }>;
}

// ========== ENUMS ==========

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  COD = 'COD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum TransactionType {
  IMPORT = 'IMPORT',
  ORDER_DEDUCT = 'ORDER_DEDUCT',
  ORDER_RESTORE = 'ORDER_RESTORE',
  ADJUST = 'ADJUST',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
}
