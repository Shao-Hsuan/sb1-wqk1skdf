import { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useGoalStore } from '../../store/goalStore';
import { AuthStatus } from '../../services/auth';

// 定義公開路由
const PUBLIC_ROUTES = ['/auth'];

interface AuthRequiredProps {
  onFirstLogin: () => void;
}

export default function AuthRequired({ onFirstLogin }: AuthRequiredProps) {
  const location = useLocation();
  const { status, user, setUser, setStatus, setError } = useAuthStore();
  const { loadGoals, reset: resetGoals, goals } = useGoalStore();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (status === AuthStatus.INITIALIZING) {
        console.log('🔄 Initializing auth...', {
          pathname: location.pathname,
          status,
          hasUser: !!user
        });

        try {
          // Check current auth status
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) throw sessionError;
          
          if (mounted) {
            console.log('📡 Auth session:', {
              hasSession: !!session,
              userId: session?.user?.id
            });

            if (session?.user) {
              console.log('👤 User authenticated, loading goals...');
              setUser(session.user);
              try {
                await loadGoals();
                
                // 檢查是否為首次登入
                const { data: settings, error: settingsError } = await supabase
                  .from('user_settings')
                  .select('last_login')
                  .eq('user_id', session.user.id)
                  .maybeSingle();

                if (settingsError) throw settingsError;

                // 如果沒有設定記錄或沒有上次登入時間，則建立新記錄
                if (!settings || !settings.last_login) {
                  const { error: insertError } = await supabase
                    .from('user_settings')
                    .upsert({ 
                      user_id: session.user.id,
                      last_login: new Date().toISOString()
                    });
                  
                  if (insertError) throw insertError;
                  
                  // 顯示使用說明對話框
                  onFirstLogin();
                }

                // 檢查用戶是否有目標
                if (goals.length === 0 && !location.pathname.includes('/goal-setup')) {
                  navigate('/goal-setup', { replace: true });
                }
              } catch (error) {
                console.error('Failed to load goals:', error);
              }
              setStatus(AuthStatus.AUTHENTICATED);
            } else {
              setUser(null);
              resetGoals();
              setStatus(AuthStatus.UNAUTHENTICATED);
            }
          }

          // Set up auth state change listener
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            console.log('🔄 Auth state changed:', { event, userId: session?.user?.id });

            try {
              switch (event) {
                case 'SIGNED_IN':
                case 'TOKEN_REFRESHED':
                case 'USER_UPDATED':
                case 'INITIAL_SESSION':
                  if (session?.user) {
                    setUser(session.user);
                    try {
                      await loadGoals();
                      // 檢查用戶是否有目標
                      if (goals.length === 0 && !location.pathname.includes('/goal-setup')) {
                        navigate('/goal-setup', { replace: true });
                      }
                    } catch (error) {
                      console.error('Failed to load goals after auth change:', error);
                    }
                    setStatus(AuthStatus.AUTHENTICATED);
                  }
                  break;
                case 'SIGNED_OUT':
                case 'USER_DELETED':
                  console.log('User signed out, clearing state...');
                  setUser(null);
                  resetGoals();
                  setStatus(AuthStatus.UNAUTHENTICATED);
                  break;
              }
            } catch (err) {
              console.error('Auth state change error:', err);
              setError(err instanceof Error ? err : new Error('認證狀態更新失敗'));
              setStatus(AuthStatus.ERROR);
            }
          });

          return () => {
            subscription.unsubscribe();
          };
        } catch (err) {
          console.error('❌ Auth initialization error:', err);
          if (mounted) {
            setError(err instanceof Error ? err : new Error('認證初始化失敗'));
            setStatus(AuthStatus.ERROR);
          }
        }
      }
    };

    const cleanup = initializeAuth();

    // Cleanup
    return () => {
      mounted = false;
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [status === AuthStatus.INITIALIZING]); // 只在 INITIALIZING 狀態時執行

  console.log('🔍 AuthRequired render:', {
    pathname: location.pathname,
    status,
    hasUser: !!user,
    isPublicRoute: PUBLIC_ROUTES.includes(location.pathname)
  });

  // 如果是登出事件，直接導向到登入頁面
  if (status === AuthStatus.UNAUTHENTICATED && !PUBLIC_ROUTES.includes(location.pathname)) {
    console.log('🚫 User not authenticated, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // 處理已登入狀態訪問登入頁面
  if (status === AuthStatus.AUTHENTICATED && PUBLIC_ROUTES.includes(location.pathname)) {
    console.log('👤 User authenticated, redirecting to journal');
    return <Navigate to="/journal" replace />;
  }

  // 處理初始化狀態
  if (status === AuthStatus.INITIALIZING && !PUBLIC_ROUTES.includes(location.pathname)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // 處理錯誤狀態
  if (status === AuthStatus.ERROR) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center text-red-500 p-4">
          <p>系統發生錯誤</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            重新整理
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}