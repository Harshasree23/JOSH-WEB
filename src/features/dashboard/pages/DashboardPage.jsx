import { useEffect } from "react";
import Heading from "../../../shared/components/Heading";
import StreakGraph from "../../../shared/components/StreakGraph";
import { useHabitsStore } from "../../habits/stores/habitsStore";
import { useBoardStore } from "../../board/stores/boardStore";
import { useAuthStore } from "../../auth/stores/authStore";
import { useGoalsStore } from "../../goals/stores/goalsStore";

export default function DashboardPage() 
{
  const { habits, fetchHabits, fetchCategories, toggleHabitLog } = useHabitsStore();
  const { events, fetchEvents } = useBoardStore();
  const { profile } = useAuthStore();
  const boardSummary = useBoardStore((s) => s.getSummary);

  const { goals, fetchGoals } = useGoalsStore();
  
  useEffect(() => {
    fetchCategories();
    fetchHabits();
    fetchEvents(new Date());
    fetchGoals();
  }, [fetchCategories, fetchHabits, fetchEvents, fetchGoals]);

  const completedCount = habits.filter(h => h.todayLog?.completed).length;
  const totalCount = habits.length;
  const allDone = totalCount > 0 && completedCount === totalCount;
  const summary = boardSummary();

  return(
    <div>

      <div className="flex items-center justify-between">
        
        <Profile username={profile?.username} />
       
        <div className="font-kalam text-xl italic text-gray-500 text-right">
          <div> " Best is the enemy of the good " </div>
          <div> " Hardwork beats talent when talent doesn't work hard " </div>
        </div>
      </div>

    <div className="flex justify-around gap-10 my-10">

      <div>
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
      </div>


      <div>
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
          )}9
          {summary.totalEvents > 0 && (
            <div className="mt-3 flex flex-col gap-1">
              {[...events].filter(
                (event) => {
                  const date = new Date();
                  const minutes = date.getHours() * 60 + date.getMinutes();
                  return event.end_px > minutes;
                }
              ).map((event) => {
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
      </div>

      <div className="flex-1">
          <Heading title="Recent Journal" />
          <div className="border rounded w-full h-30" >
          </div>
      </div>

      </div>

      {/* Active Goals */}
      <Heading title="Active Goals" />
      <div className="flex gap-6 mb-10 overflow-x-auto pb-4">
        {goals.length === 0 ? (
          <div className="font-bubbler text-gray-400 text-sm italic">No active goals.</div>
        ) : (
          goals.map(goal => {
            let progressDays = 0;
            let totalDays = 0;
            let progressPercent = 0;
            
            if (goal.time_period_start && goal.time_period_end) {
              const start = new Date(goal.time_period_start);
              const end = new Date(goal.time_period_end);
              const now = new Date();
              
              totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
              progressDays = Math.max(0, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
              if (progressDays > totalDays) progressDays = totalDays;
              
              progressPercent = (progressDays / totalDays) * 100;
            }

            return (
              <div key={goal.id} className="min-w-[250px] border rounded-lg p-4 flex flex-col gap-2">
                <div className="font-bubbler text-xl font-bold">{goal.name}</div>
                
                {goal.time_period_start && goal.time_period_end && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{progressDays} / {totalDays} days</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </div>
                )}
                
                {goal.target_value && (
                  <div className="text-sm text-blue-600 font-kalam mt-1">
                    🎯 Target: {goal.target_value} {goal.target_unit}
                  </div>
                )}
              </div>
            )
          })
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
    <div className="flex items-center gap-10">
      <div className="w-30 h-30 rounded bg-gray-300">

      </div>
      <Heading title={username || 'User'} />
    </div>
  );
};