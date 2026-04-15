'use client';

import NavLink from '../../common/NavLink';
import { MdMap, MdViewModule } from 'react-icons/md';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export default function HomeTab() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewMode = searchParams.get('view') || 'card';

  const isMapActive = viewMode === 'map';
  const isCardActive = viewMode === 'card';

  const createViewUrl = useCallback(
    (view: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', view);
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams],
  );

  return (
    <div className="flex flex-col gap-3 mt-4 w-full sm:flex-row sm:justify-center sm:items-center">
      <div className="flex gap-2 items-center sm:gap-2">
        <NavLink
          to={createViewUrl('map')}
          activeClassName="active !border-primary1"
          isActive={() => isMapActive}
          className={`flex gap-2 items-center ${
            isMapActive ? '!text-primary1 !border-primary1' : '!text-black'
          }`}
        >
          <MdMap className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          <span className="text-sm font-bold whitespace-nowrap sm:text-sm md:text-base">
            지도보기
          </span>
        </NavLink>
        <NavLink
          to={createViewUrl('card')}
          activeClassName="active !border-primary1"
          isActive={() => isCardActive}
          className={`flex gap-2 items-center ${
            isCardActive ? '!text-primary1 !border-primary1' : '!text-black'
          }`}
        >
          <MdViewModule className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          <span className="text-sm whitespace-nowrap sm:text-sm md:text-base">
            카드보기
          </span>
        </NavLink>
      </div>
    </div>
  );
}
