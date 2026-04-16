import PageTemplate from '@/packages/ui/components/base/PageTemplate';
import PageFooter from '@/packages/ui/components/base/PageFooter';
import ShelterPostsServer from '@/packages/ui/components/shelter/ShelterPostsServer';
import PreloadSearchModel from './PreloadSearchModel';

export default function Shelter() {
  return (
    <main className="page-container-full">
      <PageTemplate>
        <PreloadSearchModel />
        <ShelterPostsServer />
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
