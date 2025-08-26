import { TableProps } from "@/modules/types";
import React from "react";

const Table = <T,>({ headers, data, renderRow }: TableProps<T>) => {
  return (
    <div className="bg-grey-3 w-full overflow-hidden rounded-lg shadow-lg">
      <table className="min-w-full divide-y divide-gray-200 text-white">
        <thead className="bg-black">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
