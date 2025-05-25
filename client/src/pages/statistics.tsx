import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";

export default function Statistics() {
  // Monthly recycling data
  const monthlyData = [
    { name: "Ene", bottles: 42 },
    { name: "Feb", bottles: 55 },
    { name: "Mar", bottles: 68 },
    { name: "Abr", bottles: 75 },
    { name: "May", bottles: 92 },
    { name: "Jun", bottles: 110 },
    { name: "Jul", bottles: 125 },
    { name: "Ago", bottles: 138 },
    { name: "Sep", bottles: 158 },
    { name: "Oct", bottles: 0 },
    { name: "Nov", bottles: 0 },
    { name: "Dic", bottles: 0 }
  ];

  // Material distribution data
  const materialData = [
    { name: "PET Transparente", value: 65 },
    { name: "PET Color", value: 25 },
    { name: "HDPE", value: 10 }
  ];

  // Collection points data
  const pointsData = [
    { name: "Punto Central", bottles: 72 },
    { name: "Punto Norte", bottles: 35 },
    { name: "Punto Sur", bottles: 28 },
    { name: "Centro Municipal", bottles: 23 }
  ];

  // Environmental impact over time
  const impactData = [
    { month: "Mar", kg: 5.1 },
    { month: "Abr", kg: 5.6 },
    { month: "May", kg: 6.9 },
    { month: "Jun", kg: 8.3 },
    { month: "Jul", kg: 9.4 },
    { month: "Ago", kg: 10.4 },
    { month: "Sep", kg: 11.9 }
  ];

  const COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#EC4899"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
        <p className="mt-2 text-gray-600">Visualiza el impacto de tu contribución al reciclaje</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Botellas Recicladas por Mes</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bottles" fill="#10B981" name="Botellas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Distribución por Material</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={materialData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {materialData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Botellas por Punto de Recolección</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={pointsData}
                  margin={{ top: 10, right: 30, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="bottles" fill="#3B82F6" name="Botellas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Impacto Ambiental (kg de plástico)</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={impactData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="kg" stroke="#065F46" activeDot={{ r: 8 }} name="Kg Plástico Reciclado" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
