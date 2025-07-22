import Image from "next/image";

const Header = () => {
  return (
    <div className="flex justify-between items-center py-4 px-12">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <Image src="/panda.svg" alt="icon" width={32} height={32} />
          <h1 className="text-2xl font-bold">Typing Panda</h1>
        </div>
        <div>
          <ul className="flex items-center gap-4">
            <li>Practice</li>
            <li>Leaderboard</li>
            <li>About</li>
          </ul>
        </div>
      </div>
      <div>
        <ul className="flex items-center gap-4">
          <li>
            <Image src="/setting-white.svg" alt="icon" width={32} height={32} />
          </li>
          <li>
            <Image src="/profile-white.svg" alt="icon" width={32} height={32} />
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Header;
