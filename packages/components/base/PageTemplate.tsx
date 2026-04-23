import Header from './Header';

interface PageTemplateProps {
  children?: React.ReactNode;
  visibleHeaderButtons?: boolean;
}

export default function PageTemplate({
  children,
  visibleHeaderButtons = true,
}: PageTemplateProps) {
  return (
    <div className="flex flex-col items-center w-full h-full min-h-0">
      <div className="shrink-0 w-full">
        <Header visibleHeaderButtons={visibleHeaderButtons} />
      </div>
      <div className="flex-1 min-h-0 w-full bg-lightBlue overflow-hidden">
        <div className="mx-auto flex h-full w-full min-w-0 max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
