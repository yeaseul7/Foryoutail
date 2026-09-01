import Link from 'next/link';
import PageFooter from './PageFooter';
import PageTemplate from './PageTemplate';

interface LegalSection {
  title: string;
  body: string[];
}

interface LegalDocumentPageProps {
  badge: string;
  title: string;
  description: string;
  effectiveDate: string;
  sections: LegalSection[];
}

export default function LegalDocumentPage({
  title,
  description,
  effectiveDate,
  sections,
}: LegalDocumentPageProps) {
  return (
    <main className="page-container-full">
      <PageTemplate>
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col bg-transparent px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
          <header className="border-b border-[#e5dfdb] pb-10 sm:pb-12">
            <h1 className="text-3xl font-bold tracking-tight text-text1 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-5 text-base leading-8 text-text2 sm:text-lg">
              {description}
            </p>
            <p className="mt-5 text-sm text-text3">시행일: {effectiveDate}</p>
          </header>

          <div>
            {sections.map((section) => (
              <section
                key={section.title}
                className="border-b border-[#e5dfdb] py-10 sm:py-12"
              >
                <h2 className="text-2xl font-bold tracking-tight text-text1 sm:text-3xl">
                  {section.title}
                </h2>
                <div className="mt-6 space-y-4 text-base leading-8 text-text2 sm:text-lg sm:leading-9">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="py-10 text-base leading-8 text-text2 sm:py-12 sm:text-lg">
            <p>문의: kkosunnaekr1@gmail.com</p>
            <p className="mt-2">
              관련 문서:
              {' '}
              <Link href="/privacy" className="text-primary1 hover:underline">
                개인정보처리방침
              </Link>
              {' · '}
              <Link href="/terms" className="text-primary1 hover:underline">
                서비스 이용약관
              </Link>
            </p>
          </div>
        </div>
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
