// In the Name of God, the Creative, the Originator
import { redirect } from 'next/navigation';

// Redirect root to default locale
export default function RootPage() {
  redirect('/fa');
}
