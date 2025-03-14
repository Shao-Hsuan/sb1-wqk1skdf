import { supabase } from './supabase';

// 集中管理身份驗證狀態
export const AuthStatus = {
  INITIALIZING: 'INITIALIZING',
  AUTHENTICATED: 'AUTHENTICATED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  ERROR: 'ERROR'
} as const;

export type AuthStatus = typeof AuthStatus[keyof typeof AuthStatus];

export async function signUp(email: string, password: string) {
  console.log('📝 Attempting to sign up:', { email });
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) {
      console.error('❌ Sign up error:', error);
      if (error.message === 'User already registered') {
        throw new Error('此信箱已經註冊過了，請直接登入');
      }
      throw error;
    }
    
    // Wait for session to be established
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // If no session, try to sign in immediately
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError || !signInData.session) {
        throw new Error('註冊成功但無法自動登入，請重新登入');
      }

      // Dispatch auth event to trigger status update
      window.dispatchEvent(new Event('supabase.auth.signin'));

      // Return the sign in data
      return signInData;
    }
    
    // Dispatch auth event to trigger status update
    window.dispatchEvent(new Event('supabase.auth.signin'));
    
    console.log('✅ Sign up successful:', { userId: data.user?.id });
    return data;
  } catch (error) {
    console.error('❌ Sign up error:', error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  console.log('🔑 Attempting to sign in:', { email });
  try {
    // Add retry mechanism for network errors
    let retries = 3;
    let lastError;

    while (retries > 0) {
      try {
        // First attempt to sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          console.error('❌ Sign in error:', error);
          if (error.message === 'Invalid login credentials') {
            throw new Error('信箱或密碼錯誤');
          }
          throw error;
        }

        if (!data?.session) {
          throw new Error('登入失敗，請稍後再試');
        }
        
        // Verify session is established
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (!session) {
          throw new Error('登入失敗，請稍後再試');
        }
        
        // Dispatch auth event to trigger status update
        window.dispatchEvent(new Event('supabase.auth.signin'));
        
        console.log('✅ Sign in successful:', { 
          userId: session.user.id,
          hasSession: true
        });
        
        return { data: { session, user: session.user } };
      } catch (error) {
        lastError = error;
        if (error.name === 'AuthRetryableFetchError') {
          retries--;
          if (retries > 0) {
            // Wait for 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        throw error;
      }
    }

    throw lastError || new Error('登入失敗，請稍後再試');
  } catch (error) {
    console.error('❌ Sign in error:', error);
    if (error.name === 'AuthRetryableFetchError') {
      throw new Error('網路連線不穩定，請檢查網路連線後再試');
    }
    throw error;
  }
}

export async function signOut() {
  console.log('🚪 Attempting to sign out');
  try {
    // 先清除本地存儲
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }

    // 清除 cookies
    try {
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
    } catch (e) {
      console.warn('Failed to clear cookies:', e);
    }

    // 清除 IndexedDB
    try {
      const databases = await window.indexedDB.databases();
      await Promise.all(
        databases.map(db => {
          if (db.name) {
            return new Promise((resolve, reject) => {
              const request = window.indexedDB.deleteDatabase(db.name!);
              request.onsuccess = () => resolve(true);
              request.onerror = () => reject(request.error);
            });
          }
          return Promise.resolve();
        })
      );
    } catch (e) {
      console.warn('Failed to clear IndexedDB:', e);
    }

    // 清除 Supabase 會話
    await supabase.auth.signOut();
    await supabase.auth.clearSession();

    // 觸發登出事件
    window.dispatchEvent(new Event('supabase.signout'));

    // 直接導向到登入頁面
    window.location.replace('/auth');
    
    return true;
  } catch (error) {
    console.error('❌ Sign out error:', error);
    // 即使發生錯誤也要重定向到登入頁面
    window.location.replace('/auth');
    throw error;
  }
}

export async function getCurrentSession() {
  console.log('🔍 Getting current session');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Get session error:', error);
      throw error;
    }
    console.log('✅ Session retrieved:', { 
      hasSession: !!session,
      userId: session?.user?.id 
    });
    return session;
  } catch (error) {
    console.error('❌ Get session error:', error);
    throw error;
  }
}