export default function MetricCard({ title, value, format = "number" }) {
  const formatted = formatValue(value, format);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{formatted}</p>
    </div>
  );
}

function formatValue(value, format) {
  if (value == null) return "—";
  switch (format) {
    case "currency":
      return `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case "percent":
      return `${value}%`;
    case "number":
    default:
      return Number(value).toLocaleString("en-US");
  }
}
