'use client';

import ShelterDetailPageContent from './ShelterDetailPageContent';
import { useParams } from 'next/navigation';

export default function ShelterDetailPage() {
  const params = useParams<{ id: string }>();
  const desertionNo = params.id;
  return <ShelterDetailPageContent desertionNo={desertionNo} />;
}
