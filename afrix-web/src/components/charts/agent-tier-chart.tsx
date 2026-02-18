"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AgentTierChartProps {
    data?: Array<{ name: string; value: number }>;
}

export function AgentTierChart({ data = [] }: AgentTierChartProps) {
    return (
        <Card className="col-span-4 lg:col-span-2">
            <CardHeader>
                <CardTitle>Agent Tier Distribution</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                            opacity={0.3}
                        />
                        <XAxis
                            type="number"
                            stroke="currentColor"
                            className="text-muted-foreground"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            stroke="currentColor"
                            className="text-muted-foreground"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
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
                        <Bar
                            dataKey="value"
                            fill="#6366f1"
                            radius={[0, 4, 4, 0]}
                            name="Agents"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
