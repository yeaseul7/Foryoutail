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
  badge,
  title,
  description,
  effectiveDate,
  sections,
}: LegalDocumentPageProps) {
  return (
    <main className="page-container-full">
      <PageTemplate>
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-0 py-10 sm:px-0">
          <div className="mb-6 rounded-3xl border border-border4 bg-white px-6 py-8 shadow-sm sm:px-8">
            <span className="inline-flex rounded-full bg-primary1/10 px-3 py-1 text-xs font-semibold text-primary1">
              {badge}
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-text1 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-text2 sm:text-base">
              {description}
            </p>
            <p className="mt-4 text-xs text-text3">시행일: {effectiveDate}</p>
          </div>

          <div className="space-y-4">
            {sections.map((section) => (
              <section
                key={section.title}
                className="rounded-3xl border border-border4 bg-white px-6 py-6 shadow-sm sm:px-8"
              >
                <h2 className="text-lg font-bold text-text1 sm:text-xl">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-text2 sm:text-base">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-border4 bg-white px-6 py-6 text-sm leading-7 text-text2 shadow-sm sm:px-8">
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
