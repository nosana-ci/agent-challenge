"use client";

interface CorrelationMatrixProps {
  assets: string[];
  matrix: number[][];
}

export default function CorrelationMatrix({
  assets,
  matrix,
}: CorrelationMatrixProps) {
  const getCorrelationColor = (value: number) => {
    // Green for positive, red for negative
    if (value >= 0.7) return "bg-green-600 text-white";
    if (value >= 0.3) return "bg-green-400 text-slate-900";
    if (value >= -0.3) return "bg-slate-600 text-white";
    if (value >= -0.7) return "bg-red-400 text-slate-900";
    return "bg-red-600 text-white";
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🔗</span>
        <h3 className="text-xl font-bold text-white">
          Asset Correlation Matrix
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-2"></th>
              {assets.map((asset, idx) => (
                <th key={idx} className="p-2 text-slate-300 font-semibold">
                  {asset}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, rowIdx) => (
              <tr key={rowIdx}>
                <td className="p-2 text-slate-300 font-semibold">{asset}</td>
                {matrix[rowIdx]?.map((value, colIdx) => (
                  <td key={colIdx} className="p-1">
                    <div
                      className={`${getCorrelationColor(value)} p-2 rounded text-center font-bold transition-all hover:scale-110`}
                    >
                      {value.toFixed(2)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded" />
          <span className="text-slate-300">Strong Positive (0.7+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-600 rounded" />
          <span className="text-slate-300">Neutral (-0.3 to 0.3)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded" />
          <span className="text-slate-300">Strong Negative (-0.7+)</span>
        </div>
      </div>

      <div className="mt-4 p-4 bg-slate-700/30 rounded-lg">
        <p className="text-slate-300 text-sm">
          💡 <span className="font-semibold">Correlation Guide:</span> Values
          close to +1 indicate assets move together. Values close to -1 mean
          they move in opposite directions. Use this to diversify your
          portfolio.
        </p>
      </div>
    </div>
  );
}
