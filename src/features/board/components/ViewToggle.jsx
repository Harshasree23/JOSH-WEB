const ViewToggle = ({ view, setView }) => {
  const views = ['day', 'month', 'year'];

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {views.map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all duration-200 ${
            view === v
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
};

export default ViewToggle;
