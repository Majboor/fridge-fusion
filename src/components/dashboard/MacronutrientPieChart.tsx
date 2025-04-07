
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MacronutrientData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface MacronutrientPieChartProps {
  data: {
    protein: { value: number; percentage: number };
    carbs: { value: number; percentage: number };
    fat: { value: number; percentage: number };
    fiber?: { value: number; percentage: number };
  };
  containerClassName?: string;
}

export function MacronutrientPieChart({ data, containerClassName }: MacronutrientPieChartProps) {
  const chartData: MacronutrientData[] = [
    { name: "Protein", value: data.protein.value, percentage: data.protein.percentage, color: "#4ade80" },
    { name: "Carbs", value: data.carbs.value, percentage: data.carbs.percentage, color: "#facc15" },
    { name: "Fat", value: data.fat.value, percentage: data.fat.percentage, color: "#60a5fa" }
  ];
  
  if (data.fiber && data.fiber.value > 0) {
    chartData.push({ 
      name: "Fiber", 
      value: data.fiber.value, 
      percentage: data.fiber.percentage, 
      color: "#f59e0b" 
    });
  }

  return (
    <Card className={`h-full ${containerClassName || ''}`}>
      <CardHeader className="pb-2">
        <CardTitle>Macronutrients</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={45}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percentage }) => `${name} ${percentage}%`}
                labelLine={{ strokeWidth: 0.5, stroke: '#888' }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value}g`, name]}
                labelFormatter={() => ""} 
                wrapperStyle={{ zIndex: 100 }}
              />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: "10px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
