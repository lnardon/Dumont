export default function CircleGraph({
  percentage,
  label,
}: {
  percentage: number;
  label: string;
}) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokePct = ((100 - percentage) * circumference) / 100;

  return (
    <svg width={64} height={64}>
      <circle
        r={radius}
        cx={32}
        cy={32}
        fill="transparent"
        stroke="rgba(127, 127, 156, 0.32)"
        strokeWidth="4"
      />
      <circle
        r={radius}
        cx={32}
        cy={32}
        fill="transparent"
        stroke="antiquewhite"
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={-strokePct}
        transform={`rotate(270 32 32)`}
        style={{ transition: "all 0.7s ease" }}
      />
      <text
        x="50%"
        y="50%"
        dy=".3em"
        textAnchor="middle"
        style={{ color: "antiquewhite" }}
        fill="white"
        fontSize="12"
        fontWeight={700}
      >
        {label}
      </text>
    </svg>
  );
}
