'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import heroBackground from '@/static/images/background_default.png';

const HEADING_LINE_1 = '\uC9C4\uC815\uD55C \uAC00\uC871\uC744 \uCC3E\uC544\uC8FC\uB294';
const HEADING_LINE_2 = '\uC548\uC2DD\uCC98';
const SEARCH_PLACEHOLDER =
  '\uC9C0\uC5ED, \uD488\uC885, \uD2B9\uC9D5\uC73C\uB85C \uCC3E\uC544\uBCF4\uC138\uC694';
const SEARCH_SUBMIT_ARIA = '\uAC80\uC0C9';
const PHOTO_FIND_LABEL = '\uC0AC\uC9C4\uC73C\uB85C \uBE44\uC2B7\uD55C \uC544\uC774 \uCC3E\uAE30';

export default function HomeAdoptionHero() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const onSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/shelter?q=${encodeURIComponent(q)}`);
      return;
    }
    router.push('/shelter');
  };

  return (
    <section
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden min-h-[340px] sm:min-h-[420px] mb-8 sm:mb-10"
      aria-labelledby="home-adoption-hero-heading"
    >
      <div className="absolute inset-0">
        <Image
          src={heroBackground}
          alt=""
          fill
          priority
          className="object-cover object-[center_35%] scale-105 blur-[3px] sm:blur-[2px]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/35" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-[#f9fcfe]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-10 sm:py-14 md:py-16 text-center">
        <h1
          id="home-adoption-hero-heading"
          className="text-2xl sm:text-3xl md:text-[2rem] font-bold text-gray-900 tracking-tight leading-snug max-w-[20rem] sm:max-w-none"
        >
          <span className="block">{HEADING_LINE_1}</span>
          <span className="block">{HEADING_LINE_2}</span>
        </h1>

        <form
          onSubmit={onSearchSubmit}
          className="mt-6 sm:mt-8 w-full max-w-lg flex items-center gap-1 rounded-full bg-white pl-4 sm:pl-5 pr-1.5 py-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] ring-1 ring-gray-100"
          role="search"
        >
          <label htmlFor="home-hero-search" className="sr-only">
            유기동물 검색
          </label>
          <input
            id="home-hero-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={SEARCH_PLACEHOLDER}
            className="min-w-0 flex-1 bg-transparent text-[15px] sm:text-base text-gray-900 placeholder:text-gray-400 outline-none py-2"
            autoComplete="off"
          />
          <button
            type="submit"
            className="shrink-0 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-primary1 text-white shadow-sm hover:opacity-95 transition-opacity"
            aria-label={SEARCH_SUBMIT_ARIA}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.push('/search-animal')}
          className="mt-3 sm:mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 py-2.5 text-sm sm:text-[15px] font-medium text-gray-800 shadow-sm backdrop-blur-md hover:bg-white/60 transition-colors"
        >
          <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-gray-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {PHOTO_FIND_LABEL}
        </button>
      </div>
    </section>
  );
}
