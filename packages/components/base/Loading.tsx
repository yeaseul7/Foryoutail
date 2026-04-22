'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

export default function Loading() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('/static/lottie/Loading 40 _ Paperplane.json')
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('Failed to load animation:', err));
  }, []);

  if (!animationData) {
    return (
      <div className="flex justify-center items-center py-12">
        <div>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-40 h-40">
        <Lottie animationData={animationData} loop={true} />
      </div>
    </div>
  );
}
