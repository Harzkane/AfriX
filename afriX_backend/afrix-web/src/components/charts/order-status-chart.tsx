"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderStatusChartProps {
    data?: Array<{ name: string; value: number; color: string }>;
    successRate?: number;
}

export function OrderStatusChart({ data = [], successRate = 0 }: OrderStatusChartProps) {
    return (
        <Card className="col-span-4 lg:col-span-1">

            <CardHeader>
                <CardTitle>Transaction Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={2}
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
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8">
                        <div className="text-3xl font-bold">{Math.round(successRate)}%</div>
                        <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
