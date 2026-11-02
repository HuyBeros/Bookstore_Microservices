import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Lock, Mail, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { changePassword } from '../../api/services/userApi';
import Spinner from '../../components/common/Spinner';

/**
 * ProfilePage — BookZone Figma Design
 * Hồ sơ cá nhân & Bảo mật tài khoản
 */
const profileSchema = z.object({
  fullName: z.string().min(2, 'Tên phải ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(8, 'Mật khẩu phải ít nhất 8 ký tự'),
  confirmPassword: z.string().min(6, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
});

const ProfilePage = () => {
  const { user, loading, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
    reset: resetPassword,
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data) => {
    try {
      await updateProfile({ ...data, address: user?.address });
      showToast({
        type: 'success',
        message: 'Cập nhật hồ sơ thành công',
      });
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message || 'Cập nhật hồ sơ thất bại',
      });
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      await changePassword({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });
      showToast({
        type: 'success',
        message: 'Đổi mật khẩu thành công',
      });
      resetPassword();
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message || 'Đổi mật khẩu thất bại',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#0e1520] flex justify-center items-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#0e1520] text-[#121c2a] dark:text-[#f0ece8] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#ffece7] dark:bg-[#9b2f00]/30 text-[#9b2f00] dark:text-[#ff9266] flex items-center justify-center font-bold text-2xl shadow-sm">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User size={28} />}
          </div>
          <div>
            <h1 className="font-playfair font-bold text-2xl sm:text-3xl text-[#121c2a] dark:text-white">
              {user?.full_name || 'Hồ sơ tài khoản'}
            </h1>
            <p className="text-xs sm:text-sm text-[#8d7168] dark:text-gray-400 mt-0.5">
              {user?.email || 'Quản lý thông tin và cài đặt bảo mật'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-3 border-b border-[#e8e3db] dark:border-gray-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
              activeTab === 'profile'
                ? 'bg-[#9b2f00] text-white shadow-sm'
                : 'text-[#59413a] dark:text-gray-300 hover:bg-[#eff4ff] dark:hover:bg-gray-800'
            }`}
          >
            <User size={16} />
            <span>Thông tin cá nhân</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
              activeTab === 'password'
                ? 'bg-[#9b2f00] text-white shadow-sm'
                : 'text-[#59413a] dark:text-gray-300 hover:bg-[#eff4ff] dark:hover:bg-gray-800'
            }`}
          >
            <Lock size={16} />
            <span>Đổi mật khẩu</span>
          </button>
        </div>

        {/* Tab 1: Profile Form */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-[#18222f] rounded-2xl border border-[#e8e3db] dark:border-gray-800 p-6 sm:p-8 shadow-sm">
            <h2 className="font-bold text-lg text-[#121c2a] dark:text-white mb-6">
              Thông tin người dùng
            </h2>

            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#59413a] dark:text-gray-300 mb-1.5">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d7168]" />
                  <input
                    {...registerProfile('fullName')}
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e8e3db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#121c2a] dark:text-white text-sm focus:border-[#9b2f00] focus:ring-1 focus:ring-[#9b2f00] outline-none transition-all"
                  />
                </div>
                {profileErrors.fullName && (
                  <p className="text-xs text-red-500 mt-1">{profileErrors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#59413a] dark:text-gray-300 mb-1.5">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d7168]" />
                  <input
                    {...registerProfile('email')}
                    type="email"
                    placeholder="example@phuonganh.vn"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e8e3db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#121c2a] dark:text-white text-sm focus:border-[#9b2f00] focus:ring-1 focus:ring-[#9b2f00] outline-none transition-all"
                  />
                </div>
                {profileErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{profileErrors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#59413a] dark:text-gray-300 mb-1.5">
                  Số điện thoại liên lạc
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d7168]" />
                  <input
                    {...registerProfile('phone')}
                    type="tel"
                    placeholder="0912 345 678"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e8e3db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#121c2a] dark:text-white text-sm focus:border-[#9b2f00] focus:ring-1 focus:ring-[#9b2f00] outline-none transition-all"
                  />
                </div>
                {profileErrors.phone && (
                  <p className="text-xs text-red-500 mt-1">{profileErrors.phone.message}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-[#c2410c] hover:bg-[#9b2f00] text-white transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>{profileSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Password Form */}
        {activeTab === 'password' && (
          <div className="bg-white dark:bg-[#18222f] rounded-2xl border border-[#e8e3db] dark:border-gray-800 p-6 sm:p-8 shadow-sm">
            <h2 className="font-bold text-lg text-[#121c2a] dark:text-white mb-6">
              Đổi mật khẩu bảo vệ
            </h2>

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#59413a] dark:text-gray-300 mb-1.5">
                  Mật khẩu hiện tại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d7168]" />
                  <input
                    {...registerPassword('currentPassword')}
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e8e3db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#121c2a] dark:text-white text-sm focus:border-[#9b2f00] focus:ring-1 focus:ring-[#9b2f00] outline-none transition-all"
                  />
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#59413a] dark:text-gray-300 mb-1.5">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d7168]" />
                  <input
                    {...registerPassword('newPassword')}
                    type="password"
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e8e3db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#121c2a] dark:text-white text-sm focus:border-[#9b2f00] focus:ring-1 focus:ring-[#9b2f00] outline-none transition-all"
                  />
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#59413a] dark:text-gray-300 mb-1.5">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <ShieldCheck size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d7168]" />
                  <input
                    {...registerPassword('confirmPassword')}
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e8e3db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#121c2a] dark:text-white text-sm focus:border-[#9b2f00] focus:ring-1 focus:ring-[#9b2f00] outline-none transition-all"
                  />
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-[#c2410c] hover:bg-[#9b2f00] text-white transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center gap-2"
                >
                  <Lock size={16} />
                  <span>{passwordSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfilePage;
