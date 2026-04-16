import PageTemplate from '@/packages/ui/components/base/PageTemplate';
import SearchBase from '@/packages/ui/components/home/search/SearchBase';

export default function Search() {
  return (
    <main className="page-container-full">
      <PageTemplate>
        <SearchBase />
      </PageTemplate>
    </main>
  );
}
