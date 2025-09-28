import { stackServerApp } from '@/stack/server';
import { redirect } from 'next/navigation';
import { CreditsPageClient } from '@/components/CreditsPageClient';
import { getUserCredits } from '@/lib/stackauth-credits';
import { ArrowLeft, Coins } from 'lucide-react';
import Link from 'next/link';

export default async function CreditsPage() {
  const user = await stackServerApp.getUser();
  
  if (!user) {
    redirect('/handler/sign-in');
  }

  const credits = await getUserCredits(user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-900">Game Credits</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <Coins className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-medium" data-wallet-amount>{credits} GC</span>
              </div>

              <div className="flex items-center space-x-2">
                <img
                  src={user.profileImageUrl || '/default-avatar.png'}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-gray-700">{user.displayName}</span>
              </div>

              <a
                href="/handler/account-settings"
                className="text-gray-500 hover:text-gray-700"
              >
                Settings
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreditsPageClient initialCredits={credits} userId={user.id} />
      </main>
    </div>
  );
}