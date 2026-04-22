import { ImageResponse } from 'next/og';
import { getShelterAnimalByDesertionNo } from '@/lib/utils/shelterAnimalsFirestore';

export const alt = '꼬순내 - 유기동물 입양 정보';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

async function fetchAnimalData(desertionNo: string) {
  try {
    return await getShelterAnimalByDesertionNo(desertionNo);
  } catch (error) {
    console.error('OG Image - 동물 정보 조회 중 오류 발생:', error);
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id: desertionNo } = await params;
  const animalData = await fetchAnimalData(desertionNo);

  if (!animalData) {
    // 기본 이미지 반환
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 60,
            background: 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <div style={{ fontSize: 80, marginBottom: 20 }}>🐾</div>
          <div>꼬순내</div>
          <div style={{ fontSize: 30, marginTop: 10 }}>유기동물 입양 정보</div>
        </div>
      ),
      {
        ...size,
      }
    );
  }

  const kindName = animalData.kindFullNm || animalData.kindNm || '유기동물';
  const imageUrl = animalData.popfile || animalData.popfile1 || animalData.popfile2 || animalData.popfile3;

  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {imageUrl && (
          <img
            src={imageUrl.replace('http://', 'https://')}
            alt={kindName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            color: 'white',
          }}
        >
          <div style={{ fontSize: 50, fontWeight: 'bold', marginBottom: 10 }}>
            {kindName}
          </div>
          <div style={{ fontSize: 30 }}>
            {animalData.sexCd === 'F' ? '암컷' : animalData.sexCd === 'M' ? '수컷' : ''}
            {animalData.age ? ` / ${animalData.age}` : ''}
            {animalData.weight ? ` / ${animalData.weight}kg` : ''}
          </div>
          <div style={{ fontSize: 25, marginTop: 10, opacity: 0.9 }}>
            꼬순내 - 입양을 기다리고 있어요 🐾
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
