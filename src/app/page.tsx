import Statistics from "@/components/Statistics";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 h-screen">
        {/* Left Section - Skills */}
        <div className="bg-blue-200 p-4 h-full overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">Skills</h2>
          <Statistics />
        </div>

        {/* Right Section Container */}
        <div className="flex flex-col h-full">
          {/* Top Section - Player */}
          <div className="bg-green-200 p-4 h-1/3 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Player</h2>
          </div>

          {/* Bottom Section - Inventory */}
          <div className="bg-yellow-200 p-4 flex-grow overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Inventory</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
