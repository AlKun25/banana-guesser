import { redirect } from 'next/navigation';

export default function PaymentsPage() {
  // Redirect to the new credits page
  redirect('/credits');
}
