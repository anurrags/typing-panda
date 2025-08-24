import React from "react";

type BlurOverlayProps = {
  onClick: () => void;
};
const BlurOverlay = ({ onClick }: BlurOverlayProps) => {
  return (
    <div
      onClick={onClick}
      className="bg-dark-1/50 absolute inset-0 flex cursor-pointer items-center justify-center rounded-lg backdrop-blur-sm"
    >
      <span className="text-cyan-1 text-xl font-medium">
        Click here or press any key to start
      </span>
    </div>
  );
};

export default BlurOverlay;
