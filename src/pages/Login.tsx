import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth.store';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

type FormValues = z.infer<typeof schema>;

export function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      const response = await authApi.login(data);
      setAuth(response.user, response.access_token);
      navigate('/');
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string | string[] } };
      };
      const raw = err.response?.data?.message ?? 'Login failed';
      const message = Array.isArray(raw) ? raw.join(', ') : String(raw);
      setError('root', { message });
    }
  };

  const hour = new Date().getHours();
  const greet =
    hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-center bg-gradient-to-br from-indigo-600 to-indigo-800 p-12 lg:flex">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-8 inline-flex rounded-2xl bg-white/20 p-3">
            <BarChart3 className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">FieldOps</h1>
          <p className="mt-2 text-indigo-200">
            Field Operations Management Platform
          </p>
          <ul className="mt-10 space-y-4 text-left text-indigo-100">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
              Real-time WhatsApp report processing
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
              AI-powered data extraction
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
              Smart validation and review workflow
            </li>
          </ul>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md px-2">
          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to your account — good {greet}
          </p>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 space-y-5"
            autoComplete="on"
          >
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              loading={isSubmitting}
              disabled={!isValid}
            >
              Sign in
            </Button>
            {errors.root && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errors.root.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
