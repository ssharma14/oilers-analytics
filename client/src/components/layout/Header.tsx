import logo from '../../assets/oilers-logo.png';

interface HeaderProps {
  children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="bg-oilers-navy border-b border-surface-light sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Logo" width={34} height={34}/>
            <div>
              <h1 className="text-xl font-bold text-oilers-white">
                Edmonton Oilers Analytics
              </h1>
              <p className="text-xs text-gray-400">
                Hockey Analytics Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {children}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;