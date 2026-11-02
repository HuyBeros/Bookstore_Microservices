/**
 * Auth Service - Manages User Authentication
 * Base URL: http://localhost:8081/api
 */

import { API_CONFIG, createHeaders, saveAuthData, clearAuthData } from '../apiConfig';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserDetailResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  VerifyOtpRequest,
  ResetPasswordRequest,
  RefreshTokenRequest,
  ApiResponse,
} from '../../types/api.types';

class AuthService {
  private baseUrl = API_CONFIG.USER_SERVICE.BASE_URL;

  // ========== AUTH ENDPOINTS ==========

  /**
   * Register new account
   * POST /auth/register
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const result: ApiResponse<LoginResponse> = await response.json();
    saveAuthData(result.data);
    return result.data;
  }

  /**
   * Login to account
   * POST /auth/login
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const result: ApiResponse<LoginResponse> = await response.json();
    saveAuthData(result.data);
    return result.data;
  }

  /**
   * Logout from account
   * POST /auth/logout
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: createHeaders(true),
      });
    } catch (error) {
      console.error('Logout API error:', error);
    }

    clearAuthData();
  }

  /**
   * Refresh JWT token
   * POST /auth/refresh-token
   */
  async refreshToken(): Promise<LoginResponse> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const response = await fetch(`${this.baseUrl}/auth/refresh-token`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ refreshToken } as RefreshTokenRequest),
    });

    if (!response.ok) {
      clearAuthData();
      throw new Error('Token refresh failed');
    }

    const result: ApiResponse<LoginResponse> = await response.json();
    saveAuthData(result.data);
    return result.data;
  }

  /**
   * Forgot password - Send OTP to email
   * POST /auth/forgot-password
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send OTP');
    }
  }

  /**
   * Verify OTP for password reset
   * POST /auth/verify-otp
   */
  async verifyOtp(data: VerifyOtpRequest): Promise<{ token: string }> {
    const response = await fetch(`${this.baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'OTP verification failed');
    }

    const result: ApiResponse<{ token: string }> = await response.json();
    return result.data;
  }

  /**
   * Reset password with OTP
   * POST /auth/reset-password
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset failed');
    }
  }

  // ========== USER PROFILE ENDPOINTS ==========

  /**
   * Get current user profile
   * GET /users/me
   */
  async getMyProfile(): Promise<UserDetailResponse> {
    const response = await fetch(`${this.baseUrl}/users/me`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthData();
      }
      throw new Error('Failed to fetch profile');
    }

    const result: ApiResponse<UserDetailResponse> = await response.json();
    return result.data;
  }

  /**
   * Get user by ID
   * GET /users/{id}
   */
  async getUserById(id: number): Promise<UserDetailResponse> {
    const response = await fetch(`${this.baseUrl}/users/${id}`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error(`User not found: ${id}`);
    }

    const result: ApiResponse<UserDetailResponse> = await response.json();
    return result.data;
  }

  /**
   * Update user profile
   * PUT /users/profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserDetailResponse> {
    const response = await fetch(`${this.baseUrl}/users/profile`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }

    const result: ApiResponse<UserDetailResponse> = await response.json();
    return result.data;
  }

  /**
   * Change password
   * PUT /users/change-password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/users/change-password`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to change password');
    }
  }

  // ========== HELPER METHODS ==========

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Get user role
   */
  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return this.getUserRole() === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Check if user is staff
   */
  isStaff(): boolean {
    return this.hasRole('STAFF');
  }

  /**
   * Check if user is customer
   */
  isCustomer(): boolean {
    return this.hasRole('CUSTOMER');
  }
}

export const authService = new AuthService();
export default authService;
