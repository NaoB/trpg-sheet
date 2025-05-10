'use client';

import { createUser } from './actions';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { LogIn, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SavedUser {
  id: string;
  name: string;
  email: string;
  lastLogin: string;
}

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [savedUsers, setSavedUsers] = useState<SavedUser[]>([]);

  useEffect(() => {
    // Load saved users from localStorage
    const savedUsersStr = localStorage.getItem('savedUsers');
    if (savedUsersStr) {
      setSavedUsers(JSON.parse(savedUsersStr));
    }
  }, []);

  const saveUser = (user: { id: string; name: string; email: string }) => {
    const newUser = {
      ...user,
      lastLogin: new Date().toISOString(),
    };

    const updatedUsers = [
      newUser,
      ...savedUsers.filter(u => u.id !== user.id)
    ].slice(0, 5); // Keep only the 5 most recent users

    localStorage.setItem('savedUsers', JSON.stringify(updatedUsers));
    setSavedUsers(updatedUsers);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    try {
      const result = await createUser({ name, email });
      if (result.success && result.userId) {
        saveUser({ id: result.userId, name, email });
        toast.success('Account created successfully!');
        router.push(`/player/${result.userId}`);
      } else {
        toast.error(result.error || 'Failed to create account');
      }
    } catch (error: unknown) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  const handleUserSelect = (userId: string) => {
    router.push(`/player/${userId}`);
  };

  const handleDeleteUser = (userId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the parent button click
    const updatedUsers = savedUsers.filter(u => u.id !== userId);
    localStorage.setItem('savedUsers', JSON.stringify(updatedUsers));
    setSavedUsers(updatedUsers);
    toast.success('Account removed from recent list');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br"
      style={{
        background: 'linear-gradient(135deg, #22332a 0%, #3a4a5a 40%, #6b6e73 80%, #bfa76a 100%)'
      }}
    >
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            Welcome to TRPG Sheet
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Create your account to get started
          </p>
        </div>

        {savedUsers.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-stone-700">Recent Accounts</h2>
            <div className="space-y-2">
              {savedUsers.map((user) => (
                <Button
                  key={user.id}
                  variant="outline"
                  className="w-full justify-start group"
                  onClick={() => handleUserSelect(user.id)}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{user.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">{user.email}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteUser(user.id, e)}
                      >
                        <Trash2 className="h-4 w-4 text-stone-500 hover:text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-stone-500">Or create new account</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-stone-700"
              >
                Username
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none focus:ring-stone-500 sm:text-sm"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-stone-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none focus:ring-stone-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-stone-600 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
