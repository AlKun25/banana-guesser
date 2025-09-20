import { Dashboard } from '@/components/Dashboard';
import { stackServerApp } from '@/stack/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const user = await stackServerApp.getUser();
  
  if (!user) {
    redirect('/handler/sign-in');
  }

  return <Dashboard />;
}