"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserGrowthChartProps {
    data?: Array<{ name: string; users: number }>;
}

export function UserGrowthChart({ data = [] }: UserGrowthChartProps) {
    return (
        <Card className="col-span-4 lg:col-span-2">
            <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                            opacity={0.3}
                        />
                        <XAxis
                            dataKey="name"
                            stroke="currentColor"
                            className="text-muted-foreground"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="currentColor"
                            className="text-muted-foreground"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 1 }}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                borderRadius: '8px',
                                border: '1px solid hsl(var(--border))',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                color: 'hsl(var(--popover-foreground))'
                            }}
                            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="users"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="New Users"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
