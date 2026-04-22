import { Metadata } from 'next';
import ShelterDetailPageContent from './ShelterDetailPageContent';
import {
  getBaseUrl,
  generateMetadata as generateMetadataUtil,
  generateDefaultMetadata,
} from '@/packages/utils/metadata';
import { getShelterAnimalByDesertionNo } from '@/lib/utils/shelterAnimalsFirestore';

const baseUrl = getBaseUrl();

async function fetchAnimalData(desertionNo: string) {
  try {
    return await getShelterAnimalByDesertionNo(desertionNo);
  } catch (error) {
    console.error('[fetchAnimalData] 에러:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: desertionNo } = await params;

  try {
    const animalData = await fetchAnimalData(desertionNo);

    if (animalData) {
      const kindName = animalData.kindFullNm || animalData.kindNm || '유기동물';
      const title = `${kindName} | 포유테일`;

      let description = '';
      if (animalData.specialMark) {
        description = `${kindName} - ${animalData.specialMark.substring(0, 150)}`;
      } else {
        const infoList = [];
        if (animalData.sexCd === 'F') infoList.push('암컷');
        if (animalData.sexCd === 'M') infoList.push('수컷');
        if (animalData.age) infoList.push(`${animalData.age}`);
        if (animalData.weight) infoList.push(`${animalData.weight}kg`);
        if (animalData.colorCd) infoList.push(animalData.colorCd);

        description = infoList.length > 0
          ? `${kindName} - ${infoList.join(' / ')} - 입양 정보를 확인해보세요.`
          : `${kindName} 입양 정보를 확인해보세요.`;
      }

      const imageUrl = animalData.popfile || animalData.popfile1 || animalData.popfile2 || animalData.popfile3;
      const pageUrl = `${baseUrl}/shelter/${desertionNo}`;

      return generateMetadataUtil({
        title,
        description,
        imageUrl,
        url: pageUrl,
        type: 'website',
        includeCanonical: true,
        includeTwitterCreator: true,
        includeOtherOgTags: true,
        imageAlt: kindName,
      });
    }
  } catch (error) {
    console.error('메타데이터 생성 중 오류:', error);
  }

  const pageUrl = `${baseUrl}/shelter/${desertionNo}`;

  return generateDefaultMetadata(
    '유기동물 정보 | 포유테일',
    '유기동물 입양 정보를 확인해보세요.',
    pageUrl,
    {
      type: 'article',
    },
  );
}

export default async function ShelterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: desertionNo } = await params;
  return <ShelterDetailPageContent desertionNo={desertionNo} />;
}
