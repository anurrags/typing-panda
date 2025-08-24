"use client";

import { StatsPerSecond } from "@/modules/types";
import React, { useEffect, useRef } from "react";
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
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const chartContainer = containerRef.current;
    if (!chartContainer) return;

    const removeSvgFocus = () => {
      const svgELement = chartContainer.querySelector("svg.recharts-surface");
      if (svgELement && svgELement.getAttribute("tabindex") !== "-1") {
        svgELement.setAttribute("tabindex", "-1");
      }
    };

    const hadnleFocusIn = (event: FocusEvent) => {
      if (
        event.target instanceof SVGElement &&
        event.target.classList.contains("recharts-surface")
      ) {
        event.target.blur();
      }
    };
    removeSvgFocus();
    chartContainer.addEventListener("focusin", hadnleFocusIn);

    const observer = new MutationObserver(() => {
      removeSvgFocus();
    });
    observer.observe(chartContainer, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      chartContainer.removeEventListener("focusin", hadnleFocusIn);
    };
  }, []);

  return (
    <div
      className="h-64 max-w-lg min-w-[60vw] rounded-lg bg-[#232429] p-4"
      ref={containerRef}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={testStat}>
          <XAxis dataKey="second" stroke="#9ca3af" fontSize={12} />

          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#2d2f35",
              border: "1px solid #4a4c52",
            }}
          />
          <Legend />

          <Line
            type="monotone"
            dataKey="wpm"
            stroke="#6ee7b7"
            strokeWidth={2}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="rawWpm"
            stroke="#9ca3af"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartComp;
