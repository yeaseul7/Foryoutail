'use client';

import Link from 'next/link';
import PageFooter from './PageFooter';
import PageTemplate from './PageTemplate';
import { useLanguage } from '@/lib/i18n/language';

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
  english?: Omit<LegalDocumentPageProps, 'badge' | 'english'>;
}

export default function LegalDocumentPage({
  title,
  description,
  effectiveDate,
  sections,
  english,
}: LegalDocumentPageProps) {
  const { isEnglish, t } = useLanguage();
  const content = isEnglish && english
    ? english
    : { title, description, effectiveDate, sections };
  return (
    <main className="page-container-full">
      <PageTemplate>
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col bg-transparent px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
          <header className="border-b border-[#e5dfdb] pb-10 sm:pb-12">
            <h1 className="text-3xl font-bold tracking-tight text-text1 sm:text-4xl">
              {content.title}
            </h1>
            <p className="mt-5 text-base leading-8 text-text2 sm:text-lg">
              {content.description}
            </p>
            <p className="mt-5 text-sm text-text3">{t('시행일:', 'Effective date:')} {content.effectiveDate}</p>
          </header>

          <div>
            {content.sections.map((section) => (
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
            <p>{t('문의:', 'Contact:')} kkosunnaekr1@gmail.com</p>
            <p className="mt-2">
              {t('관련 문서:', 'Related documents:')}
              {' '}
              <Link href="/privacy" className="text-primary1 hover:underline">
                {t('개인정보처리방침', 'Privacy Policy')}
              </Link>
              {' · '}
              <Link href="/terms" className="text-primary1 hover:underline">
                {t('서비스 이용약관', 'Terms of Service')}
              </Link>
            </p>
          </div>
        </div>
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
