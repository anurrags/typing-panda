import { TestStats } from "@/modules/types";
import { beautifyAndConvertToIST } from "@/modules/util";
import React from "react";

const HistoryRow = (item: TestStats, index: number) => {
  return (
    <tr
      key={item.testId}
      className={`text-grey-1 font-semibold transition-colors ${index % 2 === 0 ? "bg-dark-1" : "bg-grey-4"}`}
    >
      <td className="text-cyan-3 px-6 py-4 text-sm font-bold whitespace-nowrap">
        {item.meanWpm}
      </td>
      <td className="px-6 py-4 text-sm whitespace-nowrap">{item.accuracy}%</td>
      <td className="px-6 py-4 text-sm whitespace-nowrap">
        {item.correctChars}/{item.incorrectChars}/{item.extraChars}
      </td>
      <td className="px-6 py-4 text-sm whitespace-nowrap">
        {item.testTypeValue} {item.testType === "time" ? "s" : "words"}
      </td>
      <td className="px-6 py-4 text-sm whitespace-nowrap">
        {beautifyAndConvertToIST(item.created_at)}
      </td>
    </tr>
  );
};

export default HistoryRow;
