interface SparkProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}

export function Spark({
  values,
  width = 80,
  height = 22,
  color = "#fbbf24",
  fill = false,
}: SparkProps) {
  if (!values.length) {
    return <div style={{ width, height }} aria-hidden />;
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);

  const points = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * (width - 2) + 1;
    const y = height - 2 - ((v - min) / range) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const line = `M${points.join(" L")}`;
  const area = fill ? `${line} L${(width - 1).toFixed(1)},${height - 1} L1,${height - 1} Z` : null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden
    >
      {area && <path d={area} fill={color} fillOpacity={0.15} />}
      <path
        d={line}
        stroke={color}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
