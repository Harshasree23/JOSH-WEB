import { useState, useEffect, useRef } from 'react';
import DayPanel from './DayPanel';
import CalendarGoalModal from './CalendarGoalModal';
import { useCalendarGoalsStore } from '../stores/calendarGoalsStore';

const MONTH_NAMES = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];
const MONTH_NAMES_FULL = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

/* ── helpers ──────────────────────────────────────────────────── */

function monthStart(year, mIdx) { return new Date(year, mIdx, 1); }
function monthEnd(year, mIdx)   { return new Date(year, mIdx + 1, 0); }

function toDateStr(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString().split('T')[0];
}

function sameDay(a, b) {
  return a && b && a.getTime() === b.getTime();
}

function inRange(date, a, b) {
  if (!date || !a || !b) return false;
  const d  = date.getTime();
  const lo = Math.min(a.getTime(), b.getTime());
  const hi = Math.max(a.getTime(), b.getTime());
  return d >= lo && d <= hi;
}

/* ── MonthStrip – horizontal drag strip for monthly goals ─────── */

const MonthStrip = ({ year, goals, deleteGoal }) => {
  const [dragStart, setDragStart] = useState(null); // month index 0-11
  const [dragEnd,   setDragEnd]   = useState(null);
  const isDragging = useRef(false);
  const hasMoved   = useRef(false);
  const [goalModal, setGoalModal] = useState(null);

  const startDrag = (mIdx) => {
    isDragging.current = true;
    hasMoved.current   = false;
    setDragStart(mIdx);
    setDragEnd(mIdx);
  };
  const moveDrag = (mIdx) => {
    if (!isDragging.current) return;
    hasMoved.current = true;
    setDragEnd(mIdx);
  };
  const endDrag = (mIdx) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const s = Math.min(dragStart ?? mIdx, mIdx);
    const e = Math.max(dragStart ?? mIdx, mIdx);
    if (!hasMoved.current && s === e) { setDragStart(null); setDragEnd(null); return; }
    setGoalModal({ start: monthStart(year, s), end: monthEnd(year, e) });
  };
  const cancelDrag = () => { isDragging.current = false; setDragStart(null); setDragEnd(null); };

  // Goals that overlap this year (monthly type only for the strip)
  const yearGoals = goals.filter((g) => {
    if (g.goal_type !== 'monthly') return false;
    const gs = new Date(g.start_date + 'T00:00:00');
    const ge = new Date(g.end_date   + 'T00:00:00');
    return gs.getFullYear() <= year && ge.getFullYear() >= year;
  });

  const goalBars = yearGoals.map((g) => {
    const gs = new Date(g.start_date + 'T00:00:00');
    const ge = new Date(g.end_date   + 'T00:00:00');
    const sc = gs.getFullYear() < year ? 0 : gs.getMonth();
    const ec = ge.getFullYear() > year ? 11 : ge.getMonth();
    return { goal: g, sc, ec,
      isStart: gs.getFullYear() === year && gs.getMonth() === sc,
      isEnd:   ge.getFullYear() === year && ge.getMonth() === ec };
  });

  // Assign lanes
  const lanes = [];
  for (const bar of goalBars) {
    let lane = 0;
    while (true) {
      const occ = lanes[lane] || [];
      if (!occ.some(([s, e]) => !(bar.ec < s || bar.sc > e))) break;
      lane++;
    }
    if (!lanes[lane]) lanes[lane] = [];
    lanes[lane].push([bar.sc, bar.ec]);
    bar.lane = lane;
  }
  const maxLane = goalBars.reduce((m, b) => Math.max(m, b.lane ?? 0), -1);

  const inDrag = (mIdx) =>
    dragStart !== null && dragEnd !== null &&
    mIdx >= Math.min(dragStart, dragEnd) && mIdx <= Math.max(dragStart, dragEnd);

  return (
    <div className="mb-4">
      <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1 ml-28">
        Monthly Goals — drag across months to set
      </div>

      {/* Drag strip */}
      <div className="flex select-none" onPointerLeave={cancelDrag}
        onPointerUp={() => endDrag(dragEnd ?? 0)} style={{ touchAction: 'none' }}>
        <div className="w-28 shrink-0" />
        <div className="flex flex-1 gap-0.5">
          {MONTH_NAMES.map((name, mIdx) => (
            <div key={mIdx}
              onPointerDown={(e) => { e.preventDefault(); startDrag(mIdx); }}
              onPointerEnter={() => moveDrag(mIdx)}
              onPointerUp={() => endDrag(mIdx)}
              className={`flex-1 h-8 rounded flex items-center justify-center text-[11px] font-medium
                cursor-pointer transition-colors duration-100
                ${inDrag(mIdx) ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
            >
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* Goal bars */}
      {maxLane >= 0 && (
        <div className="flex">
          <div className="w-28 shrink-0" />
          <div className="flex-1 relative mt-1" style={{ height: `${(maxLane + 1) * 22}px` }}>
            {goalBars.map(({ goal, sc, ec, isStart, isEnd, lane }) => (
              <div key={goal.id} className="absolute flex items-center overflow-hidden"
                style={{
                  top: `${lane * 22}px`, height: '18px',
                  left: `calc(${(sc / 12) * 100}% + 2px)`,
                  width: `calc(${((ec - sc + 1) / 12) * 100}% - 4px)`,
                  backgroundColor: goal.color,
                  borderRadius: `${isStart ? '6px' : '0'} ${isEnd ? '6px' : '0'} ${isEnd ? '6px' : '0'} ${isStart ? '6px' : '0'}`,
                  opacity: 0.9,
                }}
                title={goal.description ? `${goal.name}: ${goal.description}` : goal.name}
              >
                {isStart && <span className="text-white text-[10px] font-medium px-1.5 truncate flex-1">{goal.name}</span>}
                {goal.has_reminder && isStart && (
                  <span className="text-white/80 text-[10px] shrink-0" title={`Reminder: ${goal.reminder_date}`}>🔔</span>
                )}
                {isEnd && (
                  <button className="shrink-0 text-white/60 hover:text-white text-[10px] px-1 transition-colors"
                    onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}>✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {goalModal && (
        <CalendarGoalModal startDate={goalModal.start} endDate={goalModal.end} type="monthly"
          onClose={() => { setGoalModal(null); setDragStart(null); setDragEnd(null); }} />
      )}
    </div>
  );
};

/* ── YearView ─────────────────────────────────────────────────── */

const YearView = ({ currentDate }) => {
  const [selectedDay,   setSelectedDay]   = useState(null);
  const [gridDragStart, setGridDragStart] = useState(null); // Date
  const [gridDragEnd,   setGridDragEnd]   = useState(null); // Date
  const isGridDragging = useRef(false);
  const gridHasMoved   = useRef(false);
  const [weekGoalModal, setWeekGoalModal] = useState(null); // { start, end }

  const { goals, fetchGoals, deleteGoal } = useCalendarGoalsStore();

  const year  = currentDate.getFullYear();
  const today = new Date();

  useEffect(() => {
    fetchGoals(new Date(year, 0, 1), new Date(year, 11, 31));
  }, [year, fetchGoals]);

  const isToday = (d) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  /* ── day-grid drag handlers ─────────────────────────────────── */
  const startGridDrag = (date) => {
    if (!date) return;
    isGridDragging.current = true;
    gridHasMoved.current   = false;
    setGridDragStart(date);
    setGridDragEnd(date);
  };
  const moveGridDrag = (date) => {
    if (!isGridDragging.current || !date) return;
    gridHasMoved.current = true;
    setGridDragEnd(date);
  };
  const endGridDrag = (date) => {
    if (!isGridDragging.current) return;
    isGridDragging.current = false;
    const start = gridDragStart;
    const end   = date || gridDragEnd || gridDragStart;
    if (!start) { setGridDragStart(null); setGridDragEnd(null); return; }

    if (!gridHasMoved.current || sameDay(start, end)) {
      setSelectedDay(start);
      setGridDragStart(null); setGridDragEnd(null);
    } else {
      const lo = new Date(Math.min(start.getTime(), end.getTime()));
      const hi = new Date(Math.max(start.getTime(), end.getTime()));
      setWeekGoalModal({ start: lo, end: hi });
      setGridDragStart(null); setGridDragEnd(null);
    }
  };
  const cancelGridDrag = () => {
    isGridDragging.current = false;
    setGridDragStart(null); setGridDragEnd(null);
    gridHasMoved.current = false;
  };

  /* ── helper: get multi_day goals covering a specific date ───── */
  const multiDayGoals = goals.filter(g => g.goal_type === 'multi_day');
  const goalsForDate = (date) => {
    if (!date) return [];
    return multiDayGoals.filter(g => {
      const gs = new Date(g.start_date + 'T00:00:00');
      const ge = new Date(g.end_date   + 'T00:00:00');
      return date >= gs && date <= ge;
    });
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">

        {/* Monthly goals drag strip */}
        <MonthStrip year={year} goals={goals} deleteGoal={deleteGoal} />

        {/* Separator */}
        <div className="border-t border-gray-100 mb-3" />

        {/* Weekly / multi-day goals hint */}
        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2 ml-28">
          Weekly / Multi-day Goals — drag across days to set
        </div>

        {/* Day-grid header (day numbers 1-31) */}
        <div className="flex mb-1">
          <div className="w-28 shrink-0" />
          {Array.from({ length: 31 }, (_, i) => (
            <div key={i} className="flex-1 text-center text-[10px] text-gray-400">{i + 1}</div>
          ))}
        </div>

        {/* Month rows – drag-enabled */}
        <div
          className="flex flex-col gap-1 select-none"
          onPointerLeave={cancelGridDrag}
          onPointerUp={() => endGridDrag(null)}
          style={{ touchAction: 'none' }}
        >
          {MONTH_NAMES_FULL.map((monthName, mIdx) => {
            const daysInMonth = new Date(year, mIdx + 1, 0).getDate();

            return (
              <div key={mIdx} className="flex items-center">
                {/* Month label */}
                <div className="w-28 shrink-0 text-right pr-3">
                  <span className="text-xs font-medium text-gray-600">{monthName}</span>
                </div>

                {/* Day cells */}
                <div className="flex flex-1 gap-0.5">
                  {Array.from({ length: 31 }, (_, dIdx) => {
                    const dayNum = dIdx + 1;
                    const valid  = dayNum <= daysInMonth;
                    const date   = valid ? new Date(year, mIdx, dayNum) : null;
                    const todayCell  = date ? isToday(date) : false;
                    const inDragSel  = valid && inRange(date, gridDragStart, gridDragEnd);
                    const dayGoals   = goalsForDate(date);
                    const goalColor  = dayGoals.length > 0 ? dayGoals[0].color : null;

                    return (
                      <div
                        key={dIdx}
                        onPointerDown={(e) => { e.preventDefault(); startGridDrag(date); }}
                        onPointerEnter={() => moveGridDrag(date)}
                        onPointerUp={() => endGridDrag(date)}
                        className={`relative flex-1 h-7 rounded text-[10px] flex items-center justify-center
                          transition-all duration-100
                          ${!valid ? 'bg-transparent cursor-default' :
                            todayCell  ? 'bg-gray-900 text-white font-bold cursor-pointer' :
                            inDragSel  ? 'bg-blue-200 text-blue-800 font-medium cursor-pointer' :
                            'bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer'}
                        `}
                        title={date ? date.toLocaleDateString() : ''}
                      >
                        {valid ? dayNum : ''}
                        {/* Colored bottom bar for multi_day goals */}
                        {goalColor && !todayCell && !inDragSel && (
                          <span
                            className="absolute bottom-0 left-0 right-0 h-1 rounded-b"
                            style={{ backgroundColor: goalColor }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Panel */}
      {selectedDay && (
        <DayPanel date={selectedDay} onClose={() => setSelectedDay(null)} />
      )}

      {/* Weekly / multi-day goal modal (from day-grid drag) */}
      {weekGoalModal && (
        <CalendarGoalModal
          startDate={weekGoalModal.start}
          endDate={weekGoalModal.end}
          type="multi_day"
          onClose={() => setWeekGoalModal(null)}
        />
      )}
    </div>
  );
};

export default YearView;
