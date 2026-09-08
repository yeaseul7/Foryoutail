import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'matchichi - 전국 유기동물 입양 공고',
    short_name: 'matchichi',
    description: '전국 유기동물 입양 공고와 동물보호소를 편리하게 검색하는 서비스',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#F45F4A',
    lang: 'ko-KR',
    categories: ['lifestyle', 'pets'],
    icons: [
      {
        src: '/static/images/findme-app-icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
