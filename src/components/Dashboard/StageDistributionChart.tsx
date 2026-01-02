import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getStageColor } from '../../utils/launchDetection';

interface StageDistributionChartProps {
  distribution: Record<string, number>;
  onStageClick?: (stage: string) => void;
}

const STAGE_LABELS: Record<string, string> = {
  planning: 'Planning',
  design: 'Design',
  development: 'Development',
  testing: 'Testing',
  deployment: 'Deployment',
  maintenance: 'Maintenance',
  deployed: 'Deployed',
};

export function StageDistributionChart({ distribution, onStageClick }: StageDistributionChartProps) {
  const data = Object.entries(distribution).map(([stage, count]) => ({
    name: STAGE_LABELS[stage] || stage,
    stage,
    value: count,
    color: getStageColor(stage),
  }));

  const handlePieClick = (entry: { stage: string }) => {
    if (onStageClick) {
      onStageClick(entry.stage);
    }
  };

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500">
        No projects to display
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={60}
            paddingAngle={2}
            dataKey="value"
            onClick={handlePieClick}
            style={{ cursor: onStageClick ? 'pointer' : 'default' }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className={onStageClick ? 'hover:opacity-80 transition-opacity' : ''}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => <span className="text-gray-300">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
