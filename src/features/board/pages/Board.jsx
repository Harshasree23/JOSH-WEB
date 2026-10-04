import { useState, useEffect } from 'react';
import TimelineIndicator from '../components/TimelineIndicator';
import TrackRow from '../components/TrackRow';
import ViewToggle from '../components/ViewToggle';
import MonthView from '../components/MonthView';
import YearView from '../components/YearView';
import { useBoardStore } from '../stores/boardStore';

/* ── helpers ─────────────────────────────────────────────────── */

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function formatDayLabel(date) {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* ── Board Page ───────────────────────────────────────────────── */

const BoardPage = () => {
  const today = new Date();

  const [view, setView] = useState('day');       // 'day' | 'month' | 'year'
  const [currentDate, setCurrentDate] = useState(today); // anchor date

  const { events, loading, fetchEvents } = useBoardStore();

  // For day view, re-fetch when currentDate changes
  useEffect(() => {
    if (view === 'day') fetchEvents(currentDate);
  }, [view, currentDate, fetchEvents]);

  /* ── Navigation ────────────────────────────────────────────── */

  const goBack = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === 'day')   d.setDate(d.getDate() - 1);
      if (view === 'month') d.setMonth(d.getMonth() - 1);
      if (view === 'year')  d.setFullYear(d.getFullYear() - 1);
      return d;
    });
  };

  const goForward = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === 'day')   d.setDate(d.getDate() + 1);
      if (view === 'month') d.setMonth(d.getMonth() + 1);
      if (view === 'year')  d.setFullYear(d.getFullYear() + 1);
      return d;
    });
  };

  const goToday = () => setCurrentDate(new Date());

  /* ── Period Label ──────────────────────────────────────────── */

  let periodLabel = '';
  if (view === 'day')   periodLabel = formatDayLabel(currentDate);
  if (view === 'month') periodLabel = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  if (view === 'year')  periodLabel = `${currentDate.getFullYear()}`;

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <div className="flex flex-col gap-4">

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-all text-sm"
            aria-label="Previous"
          >
            ‹
          </button>

          <span className="font-semibold font-caveat text-xl text-gray-800 min-w-[14ch] text-center">
            {periodLabel}
          </span>

          <button
            onClick={goForward}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-all text-sm"
            aria-label="Next"
          >
            ›
          </button>

          <button
            onClick={goToday}
            className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-all ml-1"
          >
            Today
          </button>
        </div>

        {/* View toggle */}
        <ViewToggle view={view} setView={setView} />
      </div>

      {/* ── Content ─────────────────────────────────────────── */}

      {view === 'day' && (
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-gray-400 text-sm py-4">Loading…</p>
          ) : (
            <>
              <TimelineIndicator />
              <TrackRow events={events} date={currentDate} />
            </>
          )}
        </div>
      )}

      {view === 'month' && (
        <MonthView currentDate={currentDate} />
      )}

      {view === 'year' && (
        <YearView currentDate={currentDate} />
      )}
    </div>
  );
};

export default BoardPage;