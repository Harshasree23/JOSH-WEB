import { useState } from 'react';

/**
 * GoalsSidebar – shown in Month and Year views.
 * Allows setting weekly and monthly goals persisted to localStorage for now.
 */
const STORAGE_KEY = 'board_goals';

function loadGoals() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveGoals(goals) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

// weekKey: "2026-W40", monthKey: "2026-10"
function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const GoalsSidebar = ({ currentDate }) => {
  const [goals, setGoals] = useState(loadGoals);
  const [editingKey, setEditingKey] = useState(null);
  const [draft, setDraft] = useState('');

  const weekKey = getWeekKey(currentDate);
  const monthKey = getMonthKey(currentDate);

  const weekGoals = goals[weekKey] || [];
  const monthGoals = goals[monthKey] || [];

  const startEdit = (key, existing) => {
    setEditingKey(key);
    setDraft(existing.join('\n'));
  };

  const saveEdit = () => {
    const lines = draft
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const updated = { ...goals, [editingKey]: lines };
    setGoals(updated);
    saveGoals(updated);
    setEditingKey(null);
    setDraft('');
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setDraft('');
  };

  const GoalSection = ({ title, goalKey, items }) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
        <button
          onClick={() => startEdit(goalKey, items)}
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          {items.length ? 'Edit' : '+ Add'}
        </button>
      </div>

      {editingKey === goalKey ? (
        <div>
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="One goal per line…"
            className="w-full text-sm border border-gray-300 rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
            rows={4}
          />
          <div className="flex gap-2 mt-1">
            <button
              onClick={saveEdit}
              className="text-xs bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700"
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : items.length ? (
        <ul className="space-y-1">
          {items.map((g, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
              {g}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-400 italic">No goals set</p>
      )}
    </div>
  );

  return (
    <div className="w-64 shrink-0 border-l border-gray-200 pl-6">
      <h2 className="font-semibold text-gray-800 mb-4 text-sm">Goals</h2>
      <GoalSection
        title={`Week (${weekKey.replace('-', ' ')})`}
        goalKey={weekKey}
        items={weekGoals}
      />
      <GoalSection
        title={`Month (${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()})`}
        goalKey={monthKey}
        items={monthGoals}
      />
    </div>
  );
};

export default GoalsSidebar;
