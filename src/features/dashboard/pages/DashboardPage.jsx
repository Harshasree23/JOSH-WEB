import { useEffect } from "react";
import Heading from "../../../shared/components/Heading";
import StreakGraph from "../../../shared/components/StreakGraph";
import { useHabitsStore } from "../../habits/stores/habitsStore";
import { useBoardStore } from "../../board/stores/boardStore";
import { useAuthStore } from "../../auth/stores/authStore";

export default function DashboardPage() 
{
  const { habits, fetchHabits, fetchCategories, toggleHabitLog } = useHabitsStore();
  const { events, fetchEvents } = useBoardStore();
  const { profile } = useAuthStore();
  const boardSummary = useBoardStore((s) => s.getSummary);

  useEffect(() => {
    fetchCategories();
    fetchHabits();
    fetchEvents(new Date());
  }, [fetchCategories, fetchHabits, fetchEvents]);

  const completedCount = habits.filter(h => h.todayLog?.completed).length;
  const totalCount = habits.length;
  const allDone = totalCount > 0 && completedCount === totalCount;
  const summary = boardSummary();

  return(
    <div>

      <div className="flex items-center justify-between">
        
        <Profile username={profile?.username} />
       
        <div>
          Quotation here
        </div>
      </div>


      {/* Today's Habits Todo */}
      <Heading title="Today's Habits" />
      <div className="border rounded p-4 mb-6">
        {totalCount === 0 ? (
          <div className="font-bubbler text-gray-400 text-sm">No active habits yet</div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${allDone ? 'bg-green-500' : 'bg-gray-500'}`}
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <div className="font-kalam text-sm text-gray-500">
                {completedCount}/{totalCount}
              </div>
            </div>

            {/* Habit checklist */}
            <div className="flex flex-col gap-1">
              {habits.map((habit) => {
                const done = habit.todayLog?.completed;
                return (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => toggleHabitLog(habit.id)}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                        done ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}
                    >
                      {done && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div
                      className="rounded w-3 h-3 shrink-0"
                      style={{ backgroundColor: habit.category?.color_hex || '#e5e7eb' }}
                    />
                    <span className={`font-bubbler text-base ${done ? 'line-through text-gray-400' : ''}`}>
                      {habit.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      🔥 {habit.streak?.current_streak || 0}
                    </span>
                  </div>
                );
              })}
            </div>

            {allDone && (
              <div className="font-kalam text-green-600 text-sm mt-3 text-center">
                🎉 All habits completed today!
              </div>
            )}
          </>
        )}
      </div>


      {/* Board Summary */}
      <Heading title="Today's Schedule" />
      <div className="border rounded p-4 mb-6">
        {summary.totalEvents === 0 ? (
          <div className="font-bubbler text-gray-400 text-sm">No activities planned today</div>
        ) : (
          <div className="flex gap-6 font-kalam">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Activities</span>
              <span className="text-sm font-semibold">{summary.totalEvents}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Time planned</span>
              <span className="text-sm font-semibold">{summary.totalHours}h</span>
            </div>
          </div>
        )}
        {summary.totalEvents > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            {events.map((event) => {
              const startH = Math.floor(event.start_px / 60);
              const startM = event.start_px % 60;
              const endH = Math.floor(event.end_px / 60);
              const endM = event.end_px % 60;
              const fmt = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
              return (
                <div key={event.id} className="flex items-center gap-3 py-1 px-2 rounded font-kalam text-sm">
                  <span className="text-gray-400 text-xs w-24 shrink-0">{fmt(startH, startM)} – {fmt(endH, endM)}</span>
                  <span>{event.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Overall Activity Heatmap */}
      <Heading title="Activity" />
      <StreakGraph overall />


    </div>
  );
}


const Profile = ({ username }) => {

  return(
    <div className="flex items-center">
      <div className="w-30 h-30 rounded bg-gray-300">

      </div>
      <Heading title={username || 'User'} />
    </div>
  );
};