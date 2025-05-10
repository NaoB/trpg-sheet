"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  ExpandedState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Search, MoreHorizontal, BicepsFlexedIcon, Plus, Minus } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Skills, Statistic } from "./types";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog";
// import { useParams } from "next/navigation";
import { getStatistics, updateStatistic, updateSkill, initializeStatistics } from "@/app/actions";
import { toast } from "sonner";

export default function Statistics() {
  // const params = useParams();
  // const userId = params.userId as string;
  const userId = 'dc90a488-47a1-4b84-af21-afa06d5405ef'

  const [searchQuery, setSearchQuery] = useState("");
  const [statisticsData, setStatisticsData] = useState<Statistic[]>([]);
  const [isEditable, setIsEditable] = useState(false);
  const [availableXP, setAvailableXP] = useState(100);
  const [xpAmount, setXpAmount] = useState("0");
  const [pendingLevelUp, setPendingLevelUp] = useState<{
    data: Statistic | Skills;
    xpCost: number;
    newLevel: number;
    finalXP: number;
  } | null>(null);
  const [showLevelUpDialog, setShowLevelUpDialog] = useState(false);
  const [levelUpError, setLevelUpError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getStatistics(userId);
        if (result.success && result.data) {
          // Sort statistics by name
          const sortedStatistics = result.data.sort((a, b) => a.name.localeCompare(b.name));
          
          // Sort skills within each statistic
          const statisticsWithSortedSkills = sortedStatistics.map(stat => ({
            ...stat,
            skills: stat.skills.sort((a, b) => a.name.localeCompare(b.name))
          }));
          
          setStatisticsData(statisticsWithSortedSkills);
        } else {
          toast.error("Failed to fetch statistics");
        }
      } catch (error: unknown) {
        console.error('Error fetching statistics:', error);
        toast.error("An error occurred while fetching statistics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);
  
  const handleXpChange = (amount: number) => {
    setAvailableXP(prev => Math.max(0, prev + amount));
    setXpAmount("0");
  };

  // Helper to recalculate totals
  function recalculateTotals(stats: Statistic[]): Statistic[] {
    return stats.map(stat => {
      const newStat = { ...stat };
      if (Array.isArray(stat.skills)) {
        newStat.skills = stat.skills.map(skill => {
          if (typeof skill.base === 'number' && typeof skill.level === 'number' && typeof skill.bonus === 'number') {
            return { ...skill, total: skill.base + skill.level + skill.bonus };
          }
          return skill;
        });
      }
      return newStat;
    });
  }

  const handleDataEdit = async (data: Statistic | Skills, field: string, value: number) => {
    try {
      const isStatistic = Array.isArray((data as Statistic).skills);
      let result;

      if (isStatistic) {
        result = await updateStatistic(userId, data.id, { [field]: value });
      } else {
        result = await updateSkill(data.id, { [field]: value });
      }

      if (result.success) {
        setStatisticsData(prevData => {
          const updated = prevData.map(stat => {
            if (isStatistic && stat.id === data.id) {
              return { ...stat, [field]: value };
            }
            if (!isStatistic) {
              const updatedSkills = stat.skills.map(skill => {
                if (skill.id === data.id) {
                  return { ...skill, [field]: value };
                }
                return skill;
              });
              return { ...stat, skills: updatedSkills };
            }
            return stat;
          });
          return recalculateTotals(updated);
        });
        toast.success("Update successful");
      } else {
        toast.error("Failed to update");
      }
    } catch (error: unknown) {
      console.error('Error updating data:', error);
      toast.error("An error occurred while updating");
    }
  };
  
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return statisticsData;
    
    const query = searchQuery.trim();
    const isUpperCase = query === query.toUpperCase() && query !== query.toLowerCase();
    
    return statisticsData.filter(stat => {
      if (isUpperCase) {
        // For uppercase queries, only search in shortnames
        return stat.shortName.toLowerCase().includes(query.toLowerCase());
      }
      
      // For lowercase/mixed case queries, search in names and skills
      const mainStatMatch = 
        stat.name.toLowerCase().includes(query.toLowerCase()) || 
        stat.shortName.toLowerCase().includes(query.toLowerCase());
      
      const skillMatch = stat.skills.some(skill => 
        skill.name.toLowerCase().includes(query.toLowerCase())
      );
      
      return mainStatMatch || skillMatch;
    });
  }, [searchQuery, statisticsData]);

  // Add a handler for level up logic
  const handleLevelUp = (data: Statistic | Skills) => {
    if (typeof data.level !== "number") return;
    const isStatistic = Array.isArray((data as Statistic).skills);
    const newLevel = data.level + 1;
    const xpCost = isStatistic
      ? data.level * 10
      : (data.level * ("costPerLevel" in data ? data.costPerLevel : 1));
    const finalXP = availableXP - xpCost;
    if (isStatistic) {
      if (data.level >= 10) {
        setLevelUpError("Statistic cannot be leveled up beyond level 10.");
        setShowErrorDialog(true);
        return;
      }
      if (availableXP < xpCost) {
        setLevelUpError(`Not enough XP. Required: ${xpCost}, Available: ${availableXP}`);
        setShowErrorDialog(true);
        return;
      }
    } else {
      if (availableXP < xpCost) {
        setLevelUpError(`Not enough XP. Required: ${xpCost}, Available: ${availableXP}`);
        setShowErrorDialog(true);
        return;
      }
    }
    setPendingLevelUp({ data, xpCost, newLevel, finalXP });
    setShowLevelUpDialog(true);
  };

  const confirmLevelUp = async () => {
    if (!pendingLevelUp) return;
    const { data, xpCost } = pendingLevelUp;
    const isStatistic = Array.isArray((data as Statistic).skills);
    
    try {
      let result;
      if (isStatistic) {
        result = await updateStatistic(userId, data.id, { level: data.level + 1 });
      } else {
        result = await updateSkill(data.id, { level: data.level + 1 });
      }

      if (result.success) {
        setAvailableXP(prev => prev - xpCost);
        setStatisticsData(prevData => {
          const updated = prevData.map(stat => {
            if (isStatistic && stat.id === data.id) {
              return { ...stat, level: stat.level + 1 };
            }
            if (!isStatistic) {
              const updatedSkills = stat.skills.map(skill => {
                if (skill.id === data.id) {
                  return { ...skill, level: skill.level + 1 };
                }
                return skill;
              });
              return { ...stat, skills: updatedSkills };
            }
            return stat;
          });
          return recalculateTotals(updated);
        });
        toast.success("Level up successful");
      } else {
        toast.error("Failed to level up");
      }
    } catch (error: unknown) {
      console.error('Error leveling up:', error);
      toast.error("An error occurred while leveling up");
    }
    
    setShowLevelUpDialog(false);
    setPendingLevelUp(null);
  };

  const cancelLevelUp = () => {
    setShowLevelUpDialog(false);
    setPendingLevelUp(null);
  };

  const handleInitialize = async () => {
    try {
      const result = await initializeStatistics(userId);
      if (result.success) {
        toast.success("Statistics initialized successfully");
        // Refresh the data
        const fetchResult = await getStatistics(userId);
        if (fetchResult.success && fetchResult.data) {
          setStatisticsData(fetchResult.data);
        }
      } else {
        toast.error(result.error || "Failed to initialize statistics");
      }
    } catch (error: unknown) {
      console.error('Error initializing statistics:', error);
      toast.error("An error occurred while initializing statistics");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Error AlertDialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Level Up Not Possible</AlertDialogTitle>
            <AlertDialogDescription>
              {levelUpError}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showLevelUpDialog} onOpenChange={setShowLevelUpDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Level Up</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingLevelUp && (
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">Level:</span> {pendingLevelUp.data.level} → {pendingLevelUp.newLevel}
                  </div>
                  <div>
                    <span className="font-semibold">XP Cost:</span> {pendingLevelUp.xpCost}
                  </div>
                  <div>
                    <span className="font-semibold">Final XP:</span> {pendingLevelUp.finalXP}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLevelUp}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLevelUp}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <Dialog>
            <DialogTrigger asChild>
              <Badge variant="secondary" className="text-sm cursor-pointer hover:bg-secondary/80">
                Available XP: {availableXP}
              </Badge>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage XP</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Enter the amount of XP you want to add or subtract, then click the plus or minus button.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={xpAmount}
                    onChange={(e) => setXpAmount(e.target.value)}
                    className="w-24"
                    min="1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleXpChange(Number(xpAmount))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleXpChange(-Number(xpAmount))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search statistics or skills... (uppercase for shortname only)"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="outline"
            onClick={handleInitialize}
            className="mr-2"
          >
            Init
          </Button>
          <Switch
            id="edit-mode"
            checked={isEditable}
            onCheckedChange={setIsEditable}
          />
          <Label htmlFor="edit-mode">Edit Mode</Label>
        </div>
      </div>
      <StatisticsTable 
        data={filteredData} 
        searchQuery={searchQuery} 
        onDataEdit={handleDataEdit}
        isEditable={isEditable}
        onLevelUp={handleLevelUp}
      />
    </div>
  );
}

interface StatisticsTableProps {
  data: Statistic[];
  searchQuery: string;
  onDataEdit: (data: Statistic | Skills, field: string, value: number) => void;
  isEditable: boolean;
  onLevelUp: (data: Statistic | Skills) => void;
}

function StatisticsTable({ data, searchQuery, onDataEdit, isEditable, onLevelUp }: StatisticsTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [editingCell, setEditingCell] = useState<{ data: Statistic | Skills; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  
  const columnHelper = createColumnHelper<Statistic | Skills>();
  
  const handleCellClick = (data: Statistic | Skills, field: string, value: number) => {
    if (!isEditable) return;
    setEditingCell({ data, field });
    setEditValue(value.toString());
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const numValue = Number(editValue);
      if (!isNaN(numValue)) {
        onDataEdit(editingCell!.data, editingCell!.field, numValue);
      }
      setEditingCell(null);
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const handleEditBlur = () => {
    setEditingCell(null);
  };

  const columns = [
    columnHelper.accessor("name", {
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2" style={{ paddingLeft: `${row.depth * 2}rem` }}>
          {row.getCanExpand() && (
            <button
              onClick={row.getToggleExpandedHandler()}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {row.depth === 0 ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} aria-label={row.original.name} className="font-semibold cursor-help focus:outline-none">{row.getValue("name")}</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-72">{(row.original as Statistic).description}</TooltipContent>
            </Tooltip>
          ) : (
            <span className="flex items-center gap-1">
              {row.getValue("name")}
              {"costPerLevel" in row.original && row.original.costPerLevel > 1 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} aria-label="This skill costs more XP per level" className="ml-1 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    This skill costs {row.original.costPerLevel} XP per level.
                  </TooltipContent>
                </Tooltip>
              )}
            </span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor("level", {
      header: "Level",
      cell: (info) => {
        const isEditing = editingCell?.data === info.row.original && editingCell?.field === "level";
        const value = info.getValue() as number;
        
        if (isEditing) {
          return (
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={handleEditBlur}
              className="w-16 px-1 py-0.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          );
        }
        
        return (
          <div
            onClick={() => handleCellClick(info.row.original, "level", value)}
            className={`${isEditable ? "cursor-pointer hover:bg-gray-50" : ""} px-2 py-1 rounded`}
          >
            {value}
          </div>
        );
      },
    }),
    columnHelper.accessor("base", {
      header: "Base",
      cell: (info) => {
        if (!("base" in info.row.original)) return "-";
        
        const isEditing = editingCell?.data === info.row.original && editingCell?.field === "base";
        const value = info.getValue() as number;
        
        if (isEditing) {
          return (
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={handleEditBlur}
              className="w-16 px-1 py-0.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          );
        }
        
        return (
          <div
            onClick={() => handleCellClick(info.row.original, "base", value)}
            className={`${isEditable ? "cursor-pointer hover:bg-gray-50" : ""} px-2 py-1 rounded`}
          >
            {value}
          </div>
        );
      },
    }),
    columnHelper.accessor("bonus", {
      header: "Bonus",
      cell: (info) => {
        if (!("bonus" in info.row.original)) return "-";
        
        const isEditing = editingCell?.data === info.row.original && editingCell?.field === "bonus";
        const value = info.getValue() as number;
        
        if (isEditing) {
          return (
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={handleEditBlur}
              className="w-16 px-1 py-0.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          );
        }
        
        return (
          <div
            onClick={() => handleCellClick(info.row.original, "bonus", value)}
            className={`${isEditable ? "cursor-pointer hover:bg-gray-50" : ""} px-2 py-1 rounded`}
          >
            {value}
          </div>
        );
      },
    }),
    columnHelper.accessor("total", {
      header: "Total",
      cell: (info) => "total" in info.row.original ? info.getValue() : info.row.original.level,
    }),
    columnHelper.display({
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  onLevelUp(row.original);
                }}
              >
                <BicepsFlexedIcon className="mr-1 h-4 w-4" />
                Level Up
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => Array.isArray((row.original as Statistic).skills) && (row.original as Statistic).skills.length > 0,
    getSubRows: (row) => (row as Statistic).skills ?? [],
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const isSubRow = row.depth > 0;
            const query = searchQuery.trim();
            const isUpperCase = query === query.toUpperCase() && query !== query.toLowerCase();
            
            const isMatch = searchQuery.trim() !== "" && 
              isSubRow && 
              !isUpperCase && // Only highlight subrows for non-uppercase searches
              row.original.name.toLowerCase().includes(query.toLowerCase());
            
            return (
              <TableRow 
                key={row.id}
                className={isMatch ? "bg-yellow-50 hover:bg-yellow-100" : ""}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
