"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
    { name: "Jan", sales: 40, views: 24 },
    { name: "Feb", sales: 30, views: 13 },
    { name: "Mar", sales: 98, views: 68 },
    { name: "Apr", sales: 39, views: 29 },
    { name: "May", sales: 48, views: 38 },
    { name: "Jun", sales: 38, views: 28 },
    { name: "Jul", sales: 43, views: 68 },
    { name: "Aug", sales: 29, views: 19 },
    { name: "Sep", sales: 58, views: 48 },
];

export function SalesChart() {
    return (
        <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
                <CardTitle>Sales & Views</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}k`}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="sales" fill="#f97316" radius={[4, 4, 0, 0]} name="Sales" />
                        <Bar dataKey="views" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Views" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
