export default function ChatHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 border-b border-gray-100">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-400 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🐱</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-800">집사 냥</h1>
            <p className="text-xs text-gray-500">아파트 매매 전문가</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <i className="fas fa-map-marker-alt text-lg"></i>
          </button>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <i className="fas fa-bars text-lg"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
