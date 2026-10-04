import { useState, useEffect, useRef } from 'react';
import DayPanel from './DayPanel';
import CalendarGoalModal from './CalendarGoalModal';
import { useCalendarGoalsStore } from '../stores/calendarGoalsStore';
import { supabase } from '../../../core/lib/supabase';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ── helpers ──────────────────────────────────────────────────── */

function toDateStr(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
}

function sameDay(a, b) {
  return a && b && a.getTime() === b.getTime();
}

function inRange(date, a, b) {
  if (!date || !a || !b) return false;
  const d = date.getTime();
  const lo = Math.min(a.getTime(), b.getTime());
  const hi = Math.max(a.getTime(), b.getTime());
  return d >= lo && d <= hi;
}

/**
 * For a given week (array of {date|null} cells), find all goals that overlap
 * and return span metadata: { goal, startCol, endCol, isGoalStart, isGoalEnd, lane }.
 * Goals are stacked into lanes to avoid vertical overlap.
 */
function buildGoalSpans(weekCells, goals) {
  const validCells = weekCells.map((c, i) => ({ date: c.date, col: i })).filter((c) => c.date);
  if (!validCells.length) return [];

  const weekStart = validCells[0].date;
  const weekEnd = validCells[validCells.length - 1].date;

  const spans = [];
  const lanes = []; // each lane = array of [startCol, endCol] occupied intervals

  for (const goal of goals) {
    const gs = new Date(goal.start_date + 'T00:00:00');
    const ge = new Date(goal.end_date   + 'T00:00:00');
    if (gs > weekEnd || ge < weekStart) continue;

    // Clamp to week
    const effStart = gs < weekStart ? weekStart : gs;
    const effEnd = ge > weekEnd ? weekEnd : ge;

    // Find column indices
    let startCol = -1, endCol = -1;
    for (const c of validCells) {
      if (startCol === -1 && c.date >= effStart) startCol = c.col;
      if (c.date <= effEnd) endCol = c.col;
    }
    if (startCol === -1 || endCol === -1) continue;

    // Assign to a free lane
    let lane = 0;
    while (true) {
      const occupied = lanes[lane] || [];
      const conflict = occupied.some(([s, e]) => !(endCol < s || startCol > e));
      if (!conflict) break;
      lane++;
    }
    if (!lanes[lane]) lanes[lane] = [];
    lanes[lane].push([startCol, endCol]);

    spans.push({
      goal,
      startCol,
      endCol,
      isGoalStart: sameDay(gs, effStart),
      isGoalEnd: sameDay(ge, effEnd),
      lane,
    });
  }

  return spans;
}

/* ── Component ────────────────────────────────────────────────── */

const MonthView = ({ currentDate }) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [eventCounts, setEventCounts] = useState({});

  // Drag-to-select goal range
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);

  const [goalModal, setGoalModal] = useState(null); // { start, end }

  const { goals, fetchGoals, deleteGoal } = useCalendarGoalsStore();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /* ── fetch event counts + calendar goals ───────────────────── */
  useEffect(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);

    // Board event dots
    supabase
      .from('board_events')
      .select('event_date')
      .gte('event_date', toDateStr(firstDay))
      .lte('event_date', toDateStr(lastDay))
      .then(({ data }) => {
        if (!data) return;
        const counts = {};
        data.forEach(({ event_date }) => {
          counts[event_date] = (counts[event_date] || 0) + 1;
        });
        setEventCounts(counts);
      });

    // Calendar goals for this month
    fetchGoals(firstDay, lastDay);
  }, [year, month, fetchGoals]);

  /* ── build calendar cells ───────────────────────────────────── */
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstDow - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, isCurrent: false, date: null });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, isCurrent: true, date: new Date(year, month, d) });
  const trail = cells.length % 7;
  if (trail) for (let d = 1; d <= 7 - trail; d++)
    cells.push({ day: d, isCurrent: false, date: null });

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  /* ── goals for this month, split by type ───────────────────── */
  const monthStart = new Date(year, month, 1);
  const monthEnd   = new Date(year, month + 1, 0);
  const allMonthGoals = goals.filter((g) => {
    const gs = new Date(g.start_date + 'T00:00:00');
    const ge = new Date(g.end_date   + 'T00:00:00');
    return gs <= monthEnd && ge >= monthStart;
  });
  // monthly-type → shown as header chips above the calendar
  const monthlyGoals = allMonthGoals.filter(g => g.goal_type === 'monthly');
  // multi_day-type → shown as colored bands within the calendar grid
  const multiDayGoals = allMonthGoals.filter(g => g.goal_type === 'multi_day');

  /* ── drag handlers ──────────────────────────────────────────── */
  const startDrag = (date) => {
    if (!date) return;
    isDragging.current = true;
    hasMoved.current = false;
    setDragStart(date);
    setDragEnd(date);
  };

  const moveDrag = (date) => {
    if (!isDragging.current || !date) return;
    hasMoved.current = true;
    setDragEnd(date);
  };

  const endDrag = (date) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const start = dragStart;
    const end = date || dragEnd || dragStart;

    if (!start) { setDragStart(null); setDragEnd(null); return; }

    if (!hasMoved.current || sameDay(start, end)) {
      // Single click → open day panel
      setSelectedDay(start);
      setDragStart(null);
      setDragEnd(null);
    } else {
      // Range drag → open goal modal
      const lo = new Date(Math.min(start.getTime(), end.getTime()));
      const hi = new Date(Math.max(start.getTime(), end.getTime()));
      setGoalModal({ start: lo, end: hi });
    }
  };

  const cancelDrag = () => {
    isDragging.current = false;
    setDragStart(null);
    setDragEnd(null);
    hasMoved.current = false;
  };

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div
      className="flex-1 min-w-0 select-none"
      onPointerLeave={cancelDrag}
      onPointerUp={() => endDrag(null)}
    >
      {/* ── Monthly goals header – compact chips above calendar ── */}
      {monthlyGoals.length > 0 && (
        <div className="mb-3 pb-3 border-b border-gray-100">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">
            Monthly Goals
          </p>
          <div className="flex flex-wrap gap-2">
            {monthlyGoals.map((g) => (
              <div
                key={g.id}
                className="group flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: g.color }}
                title={g.description || g.name}
              >
                <span className="truncate max-w-[160px]">{g.name}</span>
                {g.has_reminder && (
                  <span className="text-[10px]" title={`Reminder: ${g.reminder_date}`}>🔔</span>
                )}
                <button
                  onClick={() => deleteGoal(g.id)}
                  className="text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Day-of-week header ───────────────────────────────── */}
      <div className="grid grid-cols-7 mb-2">
        {DOW.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-2 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar weeks ───────────────────────────────────── */}
      {weeks.map((week, wIdx) => {
        // Only multi_day goals appear as bands in the grid
        const spans = buildGoalSpans(week, multiDayGoals);
        const maxLane = spans.reduce((m, s) => Math.max(m, s.lane), -1);

        return (
          <div key={wIdx} className="mb-1">

            {/* Day cells row */}
            <div className="grid grid-cols-7 gap-0.5">
              {week.map((cell, cIdx) => {
                const isToday = cell.date && sameDay(cell.date, today);
                const isSel = cell.date && dragStart && dragEnd && inRange(cell.date, dragStart, dragEnd);
                const dateStr = cell.date ? toDateStr(cell.date) : null;
                const count = dateStr ? eventCounts[dateStr] || 0 : 0;

                return (
                  <div
                    key={cIdx}
                    onPointerDown={(e) => { e.preventDefault(); startDrag(cell.date); }}
                    onPointerEnter={() => moveDrag(cell.date)}
                    onPointerUp={() => endDrag(cell.date)}
                    className={`
                      relative flex flex-col items-center justify-start pt-1.5 pb-1
                      rounded-lg h-12 text-sm cursor-pointer transition-colors duration-100
                      ${!cell.isCurrent ? 'opacity-25 cursor-default' : ''}
                      ${isSel ? 'bg-blue-100' : isToday ? '' : cell.isCurrent ? 'hover:bg-gray-50' : ''}
                    `}
                    style={{ touchAction: 'none' }}
                  >
                    <span className={`
                      w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium z-10
                      ${isToday ? 'bg-gray-900 text-white' : isSel ? 'text-blue-700 font-semibold' : 'text-gray-700'}
                    `}>
                      {cell.day}
                    </span>
                    {count > 0 && cell.isCurrent && (
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                          <span key={i} className="w-1 h-1 rounded-full bg-gray-400" />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Goal spans – one row per lane */}
            {maxLane >= 0 && (
              <div className="relative mt-0.5" style={{ height: `${(maxLane + 1) * 22}px` }}>
                {spans.map(({ goal, startCol, endCol, isGoalStart, isGoalEnd, lane }) => (
                  <div
                    key={goal.id + '-' + wIdx}
                    className="absolute flex items-center overflow-hidden"
                    style={{
                      top: `${lane * 22}px`,
                      height: '18px',
                      left: `calc(${(startCol / 7) * 100}% + 2px)`,
                      width: `calc(${((endCol - startCol + 1) / 7) * 100}% - 4px)`,
                      backgroundColor: goal.color,
                      borderRadius: `${isGoalStart ? '6px' : '0'} ${isGoalEnd ? '6px' : '0'} ${isGoalEnd ? '6px' : '0'} ${isGoalStart ? '6px' : '0'}`,
                      opacity: 0.9,
                    }}
                    title={goal.description ? `${goal.name}: ${goal.description}` : goal.name}
                  >
                    {isGoalStart && (
                      <span className="text-white text-[10px] font-medium px-1.5 truncate flex-1">
                        {goal.name}
                      </span>
                    )}
                    {isGoalEnd && (
                      <button
                        className="shrink-0 text-white/60 hover:text-white text-[10px] px-1 transition-colors"
                        onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                        title="Delete goal"
                      >
                        ✕
                      </button>
                    )}
                    {goal.has_reminder && isGoalStart && (
                      <span className="shrink-0 text-white/80 text-[10px] px-0.5" title={`Reminder: ${goal.reminder_date}`}>
                        🔔
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Day Panel */}
      {selectedDay && (
        <DayPanel date={selectedDay} onClose={() => setSelectedDay(null)} />
      )}

      {/* Goal Modal */}
      {goalModal && (
        <CalendarGoalModal
          startDate={goalModal.start}
          endDate={goalModal.end}
          type="multi_day"
          onClose={() => {
            setGoalModal(null);
            setDragStart(null);
            setDragEnd(null);
          }}
        />
      )}
    </div>
  );
};

export default MonthView;
