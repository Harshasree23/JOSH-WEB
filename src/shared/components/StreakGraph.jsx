import { useMemo, useEffect, useState } from "react";
import { supabase } from "../../core/lib/supabase";


const StreakGraph = ({ habitId, overall }) => {

    const [logDates, setLogDates] = useState(new Set());
    const [allCompleteDates, setAllCompleteDates] = useState(new Set());
    const [streakInfo, setStreakInfo] = useState({ totalActive: 0, maxStreak: 0 });

    // Fetch log data from Supabase
    useEffect(() => {
        if (!habitId && !overall) return;

        const fetchLogs = async () => {
            const today = new Date();
            const startDay = new Date();
            startDay.setDate(today.getDate() - 365);

            if (overall) {
                // Overall mode: a day is "active" if ALL active habits were completed that day
                // First get active habits count
                const { data: habitsData } = await supabase
                    .from('habits')
                    .select('id')
                    .eq('is_active', true);

                const totalActive = habitsData?.length || 0;
                if (totalActive === 0) return;

                // Get all completed logs in the range
                const { data: logsData } = await supabase
                    .from('habit_logs')
                    .select('log_date, completed')
                    .eq('completed', true)
                    .gte('log_date', startDay.toISOString().split('T')[0])
                    .lte('log_date', today.toISOString().split('T')[0]);

                if (logsData) {
                    // Count completions per date
                    const dateCountMap = {};
                    logsData.forEach((log) => {
                        dateCountMap[log.log_date] = (dateCountMap[log.log_date] || 0) + 1;
                    });

                    // A date is "all complete" if count >= totalActive
                    const allDone = new Set();
                    const anyDone = new Set();
                    Object.entries(dateCountMap).forEach(([date, count]) => {
                        anyDone.add(date);
                        if (count >= totalActive) {
                            allDone.add(date);
                        }
                    });

                    setAllCompleteDates(allDone);
                    setLogDates(anyDone);
                    setStreakInfo({
                        totalActive: allDone.size,
                        maxStreak: calculateMaxStreak([...allDone]),
                    });
                }
            } else {
                // Per-habit mode
                const { data } = await supabase
                    .from('habit_logs')
                    .select('log_date, completed')
                    .eq('habit_id', habitId)
                    .eq('completed', true)
                    .gte('log_date', startDay.toISOString().split('T')[0])
                    .lte('log_date', today.toISOString().split('T')[0]);

                if (data) {
                    const dates = new Set(data.map((d) => d.log_date));
                    setLogDates(dates);
                    setStreakInfo({
                        totalActive: dates.size,
                        maxStreak: calculateMaxStreak(data.map((d) => d.log_date)),
                    });
                }
            }
        };

        fetchLogs();
    }, [habitId, overall]);

    const streakGraphData = useMemo(
        () => {
            const today = new Date();
            const startDay = new Date();
            startDay.setDate(today.getDate() - 365);
            let days = [];

            let paddingDays = today.getDay() % 6;
            for (let i = 1; i < paddingDays; i++) {
                days.push(null);
            }

            for (let i = 0; i < 366; i++) {
                const currentDay = new Date(startDay);
                currentDay.setDate(currentDay.getDate() + i);
                days.push(currentDay);

                const tomorrow = new Date(currentDay);
                tomorrow.setDate(tomorrow.getDate() + 1);

                if (tomorrow.getDate() == 1 && i < 366) {
                    for (let j = 0; j < 14; j++) {
                        days.push(null);
                    }
                }
            }

            return days;
        }, []
    );

    const getColor = (date) => {
        if (!date) return '';
        if (!habitId && !overall) return 'bg-gray-200';
        const dateStr = date.toISOString().split('T')[0];

        if (overall) {
            if (allCompleteDates.has(dateStr)) return 'bg-green-500';
            if (logDates.has(dateStr)) return 'bg-green-200';
            return 'bg-gray-200';
        }

        return logDates.has(dateStr) ? 'bg-green-400' : 'bg-gray-200';
    };

    const isDataMode = habitId || overall;

    return (
        <div className="p-5 border rounded w-fit">

            {/* Streak information */}
            <div className="flex gap-10 mb-7 font-kalam">
                <div className="flex items-center gap-3">
                    <div className="text-sm font-light">
                        {overall ? 'All habits complete' : 'Total active days'}
                    </div>
                    <div className="text-sm"> {isDataMode ? streakInfo.totalActive : '—'} </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-sm font-light"> Max streak </div>
                    <div className="text-sm"> {isDataMode ? streakInfo.maxStreak : '—'} </div>
                </div>
                {overall && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="inline-block w-3 h-3 bg-green-500 rounded-sm" /> All done
                        <span className="inline-block w-3 h-3 bg-green-200 rounded-sm ml-2" /> Partial
                    </div>
                )}
            </div>

            {/* Streak Graph */}
            <div className="grid grid-rows-7 grid-flow-col gap-[1.5px] w-fit ">
                {
                    streakGraphData.map(
                        (date, index) =>
                        (
                            date == null ?
                                (<div key={index} className="w-3 h-3" />)
                                :
                                (<div key={index} className={`w-3 h-3 ${getColor(date)}`}
                                    title={date.toDateString()}
                                />)
                        )
                    )
                }
            </div>

        </div>
    );
};

function calculateMaxStreak(dateStrings) {
    if (!dateStrings.length) return 0;
    const sorted = [...dateStrings].sort();
    let max = 1;
    let current = 1;

    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
            current++;
            max = Math.max(max, current);
        } else if (diffDays > 1) {
            current = 1;
        }
    }
    return max;
}

export default StreakGraph;