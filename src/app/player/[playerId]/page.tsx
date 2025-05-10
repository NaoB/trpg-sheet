'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Statistics from "@/components/Statistics";

export default function PlayerPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <LogOut className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => router.push('/')}>
              Switch User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 h-screen">
        {/* Left Section - Skills */}
        <div className="p-4 h-full overflow-y-auto">
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
