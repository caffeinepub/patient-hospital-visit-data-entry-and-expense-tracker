import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';

interface ChartDataPoint {
  label: string;
  hospitalRs: number;
  medicineRs: number;
  total: number;
}

interface SpendingChartProps {
  data: ChartDataPoint[];
  title: string;
  description: string;
}

const chartConfig = {
  hospitalRs: {
    label: 'Hospital Charges (Rs)',
    color: 'hsl(var(--chart-1))',
  },
  medicineRs: {
    label: 'Medicine Charges (Rs)',
    color: 'hsl(var(--chart-3))',
  },
};

// Custom label component for bar values
const renderCustomLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  
  // Only show label if value is greater than 0
  if (!value || value === 0) return null;
  
  const formattedValue = `Rs ${Number(value).toLocaleString()}`;
  const fontSize = 11;
  const labelY = y + height / 2;
  const labelX = x + width / 2;
  
  return (
    <text
      x={labelX}
      y={labelY}
      fill="hsl(var(--card))"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={fontSize}
      fontWeight="600"
      style={{ pointerEvents: 'none' }}
    >
      {formattedValue}
    </text>
  );
};

export default function SpendingChart({ data, title, description }: SpendingChartProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="label" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value) => `Rs ${Number(value).toLocaleString()}`}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar 
                dataKey="hospitalRs" 
                fill="var(--color-hospitalRs)" 
                radius={[4, 4, 0, 0]}
                name="Hospital Charges (Rs)"
              >
                <LabelList content={renderCustomLabel} />
              </Bar>
              <Bar 
                dataKey="medicineRs" 
                fill="var(--color-medicineRs)" 
                radius={[4, 4, 0, 0]}
                name="Medicine Charges (Rs)"
              >
                <LabelList content={renderCustomLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
