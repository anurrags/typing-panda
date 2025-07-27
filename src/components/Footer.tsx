import React from "react";

const Footer = () => {
  return (
    <div className="flex flex-col items-center justify-center pb-2">
      <div>
        Created with ❤️ by{" "}
        <a
          className="text-cyan-2 hover:text-cyan-1"
          href="https://github.com/anurrags"
          target="_blank"
          rel="noopener noreferrer"
        >
          anurrags
        </a>
      </div>
    </div>
  );
};

export default Footer;
