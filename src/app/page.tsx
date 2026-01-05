import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to dashboard for now
  // In a real app, this would check authentication first
  redirect('/dashboard');
}