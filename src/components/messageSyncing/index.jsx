export function MessageSyncing() {
  return (
    <div className="flex items-center justify-center h-full py-4 px-6 bg-[#F1F3F5] border border-[#E3E3E3] rounded-lg ">
      <div className="flex items-center flex-col space-y-3">
        <div className="w-8 h-8 animate-spin border-4 border-[#E3E3E3] border-t-4 border-t-[#4F8DFF] rounded-full"></div>
        <div className="text-[#727272] text-lg font-semibold text-center">
          <span>We're building something awesome,</span>
          <span>just for you! Check back soon.</span>
        </div>
        <p className="text-xl">🚧</p>
      </div>
    </div>
  );
}