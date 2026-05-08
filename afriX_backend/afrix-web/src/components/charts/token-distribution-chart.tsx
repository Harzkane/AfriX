"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TokenDistributionChartProps {
    data?: Array<{ name: string; value: number; color: string }>;
}

export function TokenDistributionChart({ data = [] }: TokenDistributionChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className="col-span-4 lg:col-span-2">
            <CardHeader>
                <CardTitle>Token Distribution (TVL)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    borderRadius: '8px',
                                    border: '1px solid hsl(var(--border))',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    color: 'hsl(var(--popover-foreground))'
                                }}
                                itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value, entry: any) => {
                                    const percentage = ((entry.payload.value / total) * 100).toFixed(1);
                                    return `${value} (${percentage}%)`;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8">
                        <div className="text-2xl font-bold">${total.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Total TVL</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
