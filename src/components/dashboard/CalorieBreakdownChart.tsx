
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalorieBreakdownItem {
  name: string;
  calories: number;
  percentage: number;
}

interface CalorieBreakdownChartProps {
  items: CalorieBreakdownItem[];
}

export function CalorieBreakdownChart({ items }: CalorieBreakdownChartProps) {
  // Sort items by calorie content descending
  const sortedItems = [...items].sort((a, b) => b.calories - a.calories);
  
  // Take top 5 items for better visualization
  const displayItems = sortedItems.slice(0, 5).map(item => ({
    name: item.name.length > 10 ? `${item.name.substring(0, 10)}...` : item.name,
    calories: item.calories,
    percentage: item.percentage
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Calorie Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayItems}
              margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end"
                height={60} 
              />
              <YAxis label={{ value: 'Calories', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value, name) => [name === "calories" ? `${value} cal` : `${value}%`, name === "calories" ? "Calories" : "Percentage"]}
                labelFormatter={(label) => `Food: ${label}`}
              />
              <Bar dataKey="calories" fill="#8884d8" name="Calories" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
