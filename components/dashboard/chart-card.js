export default function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">{title}</h3>
      {children}
    </div>
  );
}
