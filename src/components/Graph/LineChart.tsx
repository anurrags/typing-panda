"use client";

import { StatsPerSecond } from "@/modules/types";
import React from "react";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type LineChartProps = {
  testStat: StatsPerSecond[];
};
const LineChartComp = ({ testStat }: LineChartProps) => {
  return (
    <div className="h-64 max-w-lg min-w-[60vw] rounded-lg bg-[#232429] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={testStat}>
          {/* X-axis represents the seconds of the test */}
          <XAxis dataKey="second" stroke="#9ca3af" fontSize={12} />

          {/* Y-axis represents the speed */}
          <YAxis stroke="#9ca3af" fontSize={12} />

          {/* A tooltip to show data on hover */}
          <Tooltip
            contentStyle={{
              backgroundColor: "#2d2f35",
              border: "1px solid #4a4c52",
            }}
          />

          {/* Legend to label the lines */}
          <Legend />

          {/* Line for WPM (Words Per Minute) */}
          <Line
            type="monotone"
            dataKey="wpm"
            stroke="#6ee7b7" // Bamboo green
            strokeWidth={2}
            dot={false}
          />

          {/* Line for Raw WPM */}
          <Line
            type="monotone"
            dataKey="rawWpm"
            stroke="#38bdf8" // Sky blue
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5" // Dashed to distinguish it
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartComp;
