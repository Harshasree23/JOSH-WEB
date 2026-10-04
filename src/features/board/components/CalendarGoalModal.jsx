import { useState } from 'react';
import { useCalendarGoalsStore } from '../stores/calendarGoalsStore';

const COLORS = [
  { label: 'Slate',   value: '#475569' },
  { label: 'Blue',    value: '#2563EB' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Amber',   value: '#D97706' },
  { label: 'Rose',    value: '#E11D48' },
  { label: 'Violet',  value: '#7C3AED' },
  { label: 'Cyan',    value: '#0891B2' },
];

function toDateStr(date) {
  if (typeof date === 'string') return date;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
}

function fmtRange(start, end, view) {
  const opts = view === 'year'
    ? { month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short', year: 'numeric' };
  const s = start.toLocaleDateString('en-IN', opts);
  const e = end.toLocaleDateString('en-IN', opts);
  return s === e ? s : `${s} → ${e}`;
}

/**
 * CalendarGoalModal – shown after a drag-select in Month or Year view.
 * @prop {Date}   startDate
 * @prop {Date}   endDate
 * @prop {'multi_day'|'monthly'} type
 * @prop {Function} onClose
 */
const CalendarGoalModal = ({ startDate, endDate, type, onClose }) => {
  const { addGoal } = useCalendarGoalsStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0].value);
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const view = type === 'monthly' ? 'year' : 'month';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    addGoal({
      type,
      startDate: toDateStr(startDate),
      endDate: toDateStr(endDate),
      name: name.trim(),
      description: description.trim(),
      color,
      hasReminder,
      reminderDate: hasReminder ? reminderDate : null,
    });

    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors text-lg"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-5">
          <h2 className="font-semibold text-gray-900 text-lg">
            {type === 'monthly' ? 'Monthly Goal' : 'Multi-Day Goal'}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {fmtRange(startDate, endDate, view)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Goal name *
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'monthly' ? 'e.g. Launch MVP, Read 2 books…' : 'e.g. Sprint, Study week…'}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does success look like?"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Colour</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c.value
                      ? 'ring-2 ring-offset-2 ring-gray-500 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasReminder}
                onChange={(e) => setHasReminder(e.target.checked)}
                className="rounded accent-gray-700"
              />
              <span className="text-sm text-gray-700 font-medium">Set a reminder date</span>
            </label>
            {hasReminder && (
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                min={toDateStr(startDate)}
                max={toDateStr(endDate)}
                className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex-1 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save Goal'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-800 transition-colors rounded-xl hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarGoalModal;
