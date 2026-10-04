import { useEffect } from 'react';
import TimelineIndicator from './TimelineIndicator';
import TrackRow from './TrackRow';
import { useBoardStore } from '../stores/boardStore';

/**
 * DayPanel – slide-in overlay showing the full day board for a selected date.
 * Used by Month and Year views when the user clicks on a specific day.
 */
const DayPanel = ({ date, onClose }) => {
  const { events, fetchEvents } = useBoardStore();

  useEffect(() => {
    if (date) fetchEvents(date);
  }, [date, fetchEvents]);

  if (!date) return null;

  const label = date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-5xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Day Board</p>
            <h2 className="font-semibold text-gray-900 font-caveat text-2xl">{label}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Board content – scrollable horizontally */}
        <div className="flex-1 overflow-auto p-6">
          <TimelineIndicator />
          <TrackRow events={events} date={date} />
        </div>
      </div>
    </>
  );
};

export default DayPanel;
