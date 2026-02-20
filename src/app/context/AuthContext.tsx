import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  emailNotifications: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  signup: (username: string, email: string, password: string, fullName: string) => boolean;
  updateEmailNotifications: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('neurowatch_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const signup = (username: string, email: string, password: string, fullName: string): boolean => {
    // Check if user already exists
    const existingUsers = JSON.parse(localStorage.getItem('neurowatch_users') || '[]');
    const userExists = existingUsers.some((u: any) => u.username === username || u.email === email);
    
    if (userExists) {
      return false;
    }

    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password, // In production, this would be hashed
      fullName,
      emailNotifications: true,
    };

    existingUsers.push(newUser);
    localStorage.setItem('neurowatch_users', JSON.stringify(existingUsers));
    
    // Auto-login after signup
    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('neurowatch_user', JSON.stringify(userWithoutPassword));
    
    return true;
  };

  const login = (username: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem('neurowatch_users') || '[]');
    const foundUser = users.find(
      (u: any) => (u.username === username || u.email === username) && u.password === password
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('neurowatch_user', JSON.stringify(userWithoutPassword));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('neurowatch_user');
  };

  const updateEmailNotifications = (enabled: boolean) => {
    if (user) {
      const updatedUser = { ...user, emailNotifications: enabled };
      setUser(updatedUser);
      localStorage.setItem('neurowatch_user', JSON.stringify(updatedUser));
      
      // Update in users list
      const users = JSON.parse(localStorage.getItem('neurowatch_users') || '[]');
      const updatedUsers = users.map((u: any) => 
        u.id === user.id ? { ...u, emailNotifications: enabled } : u
      );
      localStorage.setItem('neurowatch_users', JSON.stringify(updatedUsers));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        signup,
        updateEmailNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
