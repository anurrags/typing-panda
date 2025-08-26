"use client";

import { History } from "@/components";
import { supabase } from "@/lib/supabaseClient";
import { OverAllStats, TestStats } from "@/modules/types";
import { getOverallStats } from "@/modules/util/getOverallStats";
import React, { useEffect } from "react";
import { MoonLoader } from "react-spinners";

const Page = () => {
  const [data, setData] = React.useState<TestStats[]>([]);
  const [overallStats, setOverallStats] = React.useState<OverAllStats>(
    getOverallStats([]),
  );
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("testData")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) {
          throw error;
        }
        setData(data as TestStats[]);
        setOverallStats(getOverallStats(data as TestStats[]));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return (
    <div className="px-10">
      {loading ? (
        <div className="flex h-[60vh] w-full items-center justify-center">
          <MoonLoader color="#fff" />
        </div>
      ) : (
        <History data={data} overAllStats={overallStats} />
      )}
    </div>
  );
};

export default Page;
