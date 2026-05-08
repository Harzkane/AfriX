"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SalesChartProps {
    data?: Array<{ name: string; transactions: number; activity: number }>;
}

export function SalesChart({ data = [] }: SalesChartProps) {
    return (
        <Card className="col-span-4 lg:col-span-3">

            <CardHeader>
                <CardTitle>Transaction Volume & Activity</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
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
                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                borderRadius: '8px',
                                border: '1px solid hsl(var(--border))',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                color: 'hsl(var(--popover-foreground))'
                            }}
                            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        />
                        <Legend />
                        <Bar dataKey="transactions" fill="#f97316" radius={[4, 4, 0, 0]} name="Transactions" />
                        <Bar dataKey="activity" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="User Activity" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
