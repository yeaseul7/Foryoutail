'use client';

import { useRef, useCallback, useEffect } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { ShelterAnimalItem } from '@/packages/type/postType';
import AbandonedCard from '../base/AbandonedCard';

const ROW_HEIGHT = 360;
const GAP = 8;
const LOAD_MORE_THRESHOLD = 400;

interface VirtualizedShelterGridProps {
  items: ShelterAnimalItem[];
  width: number;
  height: number;
  onScrollNearEnd?: () => void;
}

export default function VirtualizedShelterGrid({
  items,
  width,
  height,
  onScrollNearEnd,
}: VirtualizedShelterGridProps) {
  const gridRef = useRef<Grid>(null);
  const columnCount = width < 640 ? 1 : 3;
  const rowCount = Math.ceil(Math.max(items.length, 1) / columnCount);
  const columnWidth = (width - GAP * (columnCount - 1)) / columnCount;
  const onScrollNearEndRef = useRef(onScrollNearEnd);
  useEffect(() => {
    onScrollNearEndRef.current = onScrollNearEnd;
  }, [onScrollNearEnd]);

  const handleScroll = useCallback(
    ({ scrollTop }: { scrollTop: number }) => {
      const totalHeight = rowCount * ROW_HEIGHT;
      if (totalHeight <= height) return;
      if (scrollTop + height >= totalHeight - LOAD_MORE_THRESHOLD) {
        onScrollNearEndRef.current?.();
      }
    },
    [rowCount, height]
  );

  const Cell = useCallback(
    ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
      const index = rowIndex * columnCount + columnIndex;
      const item = items[index];
      const num = (v: string | number | undefined) => (typeof v === 'number' ? v : parseFloat(String(v)) || 0);
      if (!item) return <div style={style} />;
      return (
        <div
          style={{
            ...style,
            left: num(style.left as number) + (columnIndex > 0 ? GAP / 2 : 0),
            top: num(style.top as number) + (rowIndex > 0 ? GAP / 2 : 0),
            width: num(style.width as number) - (columnIndex < columnCount - 1 ? GAP / 2 : 0),
            height: num(style.height as number) - (rowIndex < rowCount - 1 ? GAP / 2 : 0),
          }}
          className="flex justify-center"
        >
          <AbandonedCard shelterAnimal={item} />
        </div>
      );
    },
    [items, columnCount, rowCount]
  );

  if (items.length === 0) return null;

  return (
    <Grid
      ref={gridRef}
      columnCount={columnCount}
      columnWidth={columnWidth}
      height={height}
      rowCount={rowCount}
      rowHeight={ROW_HEIGHT}
      width={width}
      onScroll={handleScroll}
      overscanRowCount={2}
    >
      {Cell}
    </Grid>
  );
}
