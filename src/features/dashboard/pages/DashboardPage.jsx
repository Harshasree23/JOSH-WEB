import { useEffect } from "react";
import Heading from "../../../shared/components/Heading";
import StreakGraph from "../../../shared/components/StreakGraph";
import { useHabitsStore } from "../../habits/stores/habitsStore";
import { useBoardStore } from "../../board/stores/boardStore";
import { useAuthStore } from "../../auth/stores/authStore";
import { useGoalsStore } from "../../goals/stores/goalsStore";
import { useProjectsStore } from "../../projects/stores/projectsStore";

export default function DashboardPage() 
{
  const { habits, fetchHabits, fetchCategories, toggleHabitLog } = useHabitsStore();
  const { events, fetchEvents } = useBoardStore();
  const { profile } = useAuthStore();
  const boardSummary = useBoardStore((s) => s.getSummary);

  const { goals, fetchGoals, goalProgress } = useGoalsStore();
  const { projects, tasks, fetchProjects } = useProjectsStore();
  
  useEffect(() => {
    fetchCategories();
    fetchHabits();
    fetchEvents(new Date());
    fetchGoals();
    fetchProjects();
  }, [fetchCategories, fetchHabits, fetchEvents, fetchGoals, fetchProjects]);

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

      {/* Active Goals */}
      <Heading title="Active Goals" />
      <div className="flex gap-6 mb-10 overflow-x-auto pb-4">
        {goals.length === 0 ? (
          <div className="font-bubbler text-gray-400 text-sm italic">No active goals.</div>
        ) : (
          goals.map(goal => {
            let progressDays = goalProgress[goal.id] || 0;
            let totalDays = parseInt(goal.target_value) || 0;
            let progressPercent = 0;
            
            if (!totalDays && goal.time_period_start && goal.time_period_end) {
              const start = new Date(goal.time_period_start);
              const end = new Date(goal.time_period_end);
              totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
            }

            if (totalDays > 0) {
              progressPercent = Math.min(100, (progressDays / totalDays) * 100);
            }

            return (
              <div key={goal.id} className="min-w-[250px] border rounded-lg p-4 flex flex-col gap-2">
                <div className="font-bubbler text-xl font-bold">{goal.name}</div>
                
                {totalDays > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{progressDays} / {totalDays} {goal.target_unit || 'days'}</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </div>
                )}
                
                {!goal.target_value && goal.time_period_end && (
                  <div className="text-sm text-blue-600 font-kalam mt-1">
                    Ends: {new Date(goal.time_period_end).toLocaleDateString()}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Active Projects & Learnings */}
      <Heading title="Active Projects & Learning" />
      <div className="flex gap-6 mb-10 overflow-x-auto pb-4">
        {projects.length === 0 ? (
          <div className="font-bubbler text-gray-400 text-sm italic">No active projects.</div>
        ) : (
          projects.filter(p => p.status === 'active').map(project => {
            const pTasks = tasks.filter(t => t.project_id === project.id)
            const totalTasks = pTasks.length
            const completedTasks = pTasks.filter(t => t.is_completed).length
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

            return (
              <div key={project.id} className="min-w-[250px] border rounded-lg p-4 flex flex-col gap-2 relative">
                <div className="font-bubbler text-xl font-bold flex items-center gap-2">
                  {project.name}
                  {project.project_type === 'learning' && (
                    <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-sans font-normal">Learning</span>
                  )}
                </div>
                
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{completedTasks} / {totalTasks} tasks</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
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