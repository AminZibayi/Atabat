// In the Name of God, the Creative, the Originator
import { notFound } from 'next/navigation';

// This catch-all route handles all unmatched paths and triggers the not-found page
export default function CatchAllNotFound() {
  notFound();
}
