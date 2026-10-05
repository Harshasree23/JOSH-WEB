import { useState } from "react";
import { useBoardStore } from "../stores/boardStore";

// 1 px = 1 minute on the 1440-px timeline
const pxToTime = (px) => {
  const totalMin = Math.round(Math.max(0, Math.min(1439, px)));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const timeToPx = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const TrackSetting = ({
  setDragStart,
  setCurrentDrag,
  dragStart,
  currentDrag,
  date,
  closeModal,
}) => {
  const { addEvent } = useBoardStore();
  const [submitting, setSubmitting] = useState(false);

  // Derive initial times from drag positions
  const initStart = pxToTime(Math.min(dragStart, currentDrag));
  const initEnd   = pxToTime(Math.max(dragStart, currentDrag));

  const [startTime, setStartTime] = useState(initStart);
  const [endTime,   setEndTime]   = useState(initEnd);

  const handleCancel = () => {
    setDragStart(null);
    setCurrentDrag(null);
    closeModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formData  = new FormData(e.currentTarget);
    const eventName = formData.get("eventName");
    const eventDesc = formData.get("eventDesc");

    const startPx = timeToPx(startTime);
    const endPx   = timeToPx(endTime);

    await addEvent({ name: eventName, description: eventDesc, startPx, endPx, date });

    setDragStart(null);
    setCurrentDrag(null);
    setSubmitting(false);
    closeModal();
  };

  const dateLabel = date?.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              ←
            </button>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider leading-none mb-0.5">
                New Event
              </p>
              <p className="text-sm font-medium text-gray-600">{dateLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Time range row */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Time
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[11px] text-gray-400 mb-1">Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                />
              </div>
              <span className="text-gray-300 mt-5 text-lg">→</span>
              <div className="flex-1">
                <label className="block text-[11px] text-gray-400 mb-1">End</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          {/* Event name */}
          <div>
            <label
              htmlFor="eventName"
              className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
            >
              Event Name
            </label>
            <input
              id="eventName"
              type="text"
              name="eventName"
              placeholder="e.g. Morning workout"
              required
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="eventDesc"
              className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
            >
              Description{" "}
              <span className="text-gray-300 normal-case font-normal">(optional)</span>
            </label>
            <input
              id="eventDesc"
              type="text"
              name="eventDesc"
              placeholder="Add a note…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Adding…" : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrackSetting;