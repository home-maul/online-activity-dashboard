"use client";

export default function MockBanner({ message }) {
  return (
    <div className="w-full bg-blue text-white text-center py-1.5 text-[11px] font-medium tracking-wide">
      {message || "Not connected — connect the API to see live data"}
    </div>
  );
}
