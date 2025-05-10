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
import { ChevronDown, ChevronRight, Search, MoreHorizontal, BicepsFlexedIcon, Plus, Minus, RotateCcw, Pencil } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
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
import { getStatistics, updateStatistic, updateSkill, getUser, updateUserXp, resetAllSkills, createStatistic, createSkill } from "@/app/actions";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { InfoIcon } from "lucide-react";

export default function Statistics() {
  const params = useParams();
  const userId = params.playerId as string;

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
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetXpGain, setResetXpGain] = useState(0);
  const [showStatDialog, setShowStatDialog] = useState(false);
  const [statFormData, setStatFormData] = useState<{
    id?: string;
    name: string;
    shortName: string;
    description: string;
  }>({
    name: "",
    shortName: "",
    description: "",
  });
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const [selectedStatistic, setSelectedStatistic] = useState<Statistic | null>(null);
  const [skillFormData, setSkillFormData] = useState<{
    name: string;
    costPerLevel: number;
  }>({
    name: "",
    costPerLevel: 1,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResult, userResult] = await Promise.all([
          getStatistics(userId),
          getUser(userId)
        ]);

        if (statsResult.success && statsResult.data) {
          // Sort statistics by name
          const sortedStatistics = statsResult.data.sort((a, b) => a.name.localeCompare(b.name));
          
          // Sort skills within each statistic
          const statisticsWithSortedSkills = sortedStatistics.map(stat => ({
            ...stat,
            skills: stat.skills.sort((a, b) => a.name.localeCompare(b.name))
          }));
          
          setStatisticsData(statisticsWithSortedSkills);
        } else {
          toast.error("Failed to fetch statistics");
        }

        if (userResult.success && userResult.data) {
          setAvailableXP(userResult.data.xp);
        } else {
          toast.error("Failed to fetch user data");
        }
      } catch (error: unknown) {
        console.error('Error fetching data:', error);
        toast.error("An error occurred while fetching data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);
  
  const handleXpChange = async (amount: number) => {
    const newXp = Math.max(0, availableXP + amount);
    try {
      const result = await updateUserXp(userId, newXp);
      if (result.success) {
        setAvailableXP(newXp);
        setXpAmount("0");
        toast.success("XP updated successfully");
      } else {
        toast.error("Failed to update XP");
      }
    } catch (error: unknown) {
      console.error('Error updating XP:', error);
      toast.error("An error occurred while updating XP");
    }
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
      if ('skills' in data) {
        // This is a Statistic
        const result = await updateStatistic(userId, data.id, { level: value });
        if (result.success && result.data) {
          setStatisticsData(prevData => {
            const updated = prevData.map(stat => {
              if (stat.id === data.id) {
                return {
                  ...stat,
                  level: value,
                  // Update all skills' base values to match the new statistic level
                  skills: stat.skills.map(skill => ({
                    ...skill,
                    base: value,
                    total: value + skill.level + skill.bonus
                  }))
                };
              }
              return stat;
            });
            return updated;
          });
        } else {
          toast.error("Failed to update statistic");
        }
      } else {
        // This is a Skill
        const result = await updateSkill(userId, data.id, { [field]: value });
        if (result.success && result.data) {
          setStatisticsData(prevData => {
            const updated = prevData.map(stat => {
              if (stat.id === data.statisticId) {
                return {
                  ...stat,
                  skills: stat.skills.map(skill => {
                    if (skill.id === data.id) {
                      const updatedSkill = { ...skill, [field]: value };
                      // Recalculate total based on the new value
                      updatedSkill.total = updatedSkill.base + updatedSkill.level + updatedSkill.bonus;
                      return updatedSkill;
                    }
                    return skill;
                  })
                };
              }
              return stat;
            });
            return updated;
          });
        } else {
          toast.error("Failed to update skill");
        }
      }
    } catch (error) {
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
    const { data, finalXP } = pendingLevelUp;
    const isStatistic = Array.isArray((data as Statistic).skills);
    
    try {
      const [updateResult, xpResult] = await Promise.all([
        isStatistic
          ? updateStatistic(userId, data.id, { level: data.level + 1 })
          : updateSkill(userId, data.id, { level: data.level + 1 }),
        updateUserXp(userId, finalXP)
      ]);

      if (updateResult.success && xpResult.success) {
        setAvailableXP(finalXP);
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

  const handleReset = () => {
    let totalXpGain = 0;
    
    // Calculate XP gain from skills only
    statisticsData.forEach(stat => {
      stat.skills.forEach(skill => {
        if (skill.level > 0) {
          // Sum of all levels from 1 to current level, multiplied by costPerLevel
          const costPerLevel = skill.costPerLevel || 1;
          totalXpGain += (skill.level * (skill.level + 1)) / 2 * costPerLevel;
        }
      });
    });
    
    setResetXpGain(totalXpGain);
    setShowResetDialog(true);
  };

  const confirmReset = async () => {
    try {
      const [resetResult, xpResult] = await Promise.all([
        resetAllSkills(userId),
        updateUserXp(userId, availableXP + resetXpGain)
      ]);

      if (resetResult.success && xpResult.success) {
        setAvailableXP(availableXP + resetXpGain);
        setStatisticsData(prevData => {
          const updated = prevData.map(stat => ({
            ...stat,
            skills: stat.skills.map(skill => ({ ...skill, level: 0 }))
          }));
          return recalculateTotals(updated);
        });
        toast.success("Reset successful");
      } else {
        toast.error("Failed to reset levels");
      }
    } catch (error: unknown) {
      console.error('Error resetting levels:', error);
      toast.error("An error occurred while resetting levels");
    }
    
    setShowResetDialog(false);
  };

  const cancelReset = () => {
    setShowResetDialog(false);
  };

  const handleCreateStatistic = async () => {
    if (!statFormData.name.trim() || !statFormData.shortName.trim() || !statFormData.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const result = await createStatistic(userId, {
        name: statFormData.name.trim(),
        shortName: statFormData.shortName.trim(),
        description: statFormData.description.trim(),
      });

      if (result.success && result.data) {
        setStatisticsData(prevData => {
          const updated = [...prevData, { ...result.data, skills: [] }];
          return updated.sort((a, b) => a.name.localeCompare(b.name));
        });
        toast.success("Statistic created successfully");
        setShowStatDialog(false);
        setStatFormData({ name: "", shortName: "", description: "" });
      } else {
        toast.error("Failed to create statistic");
      }
    } catch (error: unknown) {
      console.error('Error creating statistic:', error);
      toast.error("An error occurred while creating statistic");
    }
  };

  const handleEditStatistic = async () => {
    if (!statFormData.id || !statFormData.name.trim() || !statFormData.shortName.trim() || !statFormData.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const result = await updateStatistic(userId, statFormData.id, {
        name: statFormData.name.trim(),
        shortName: statFormData.shortName.trim(),
        description: statFormData.description.trim(),
      });

      if (result.success && result.data) {
        setStatisticsData(prevData => {
          const updated = prevData.map(stat => 
            stat.id === statFormData.id 
              ? { ...stat, ...result.data }
              : stat
          );
          return updated.sort((a, b) => a.name.localeCompare(b.name));
        });
        toast.success("Statistic updated successfully");
        setShowStatDialog(false);
        setStatFormData({ name: "", shortName: "", description: "" });
      } else {
        toast.error("Failed to update statistic");
      }
    } catch (error: unknown) {
      console.error('Error updating statistic:', error);
      toast.error("An error occurred while updating statistic");
    }
  };

  const handleStatDialogSubmit = () => {
    if (statFormData.id) {
      handleEditStatistic();
    } else {
      handleCreateStatistic();
    }
  };

  const openEditDialog = (statistic: Statistic) => {
    setStatFormData({
      id: statistic.id,
      name: statistic.name,
      shortName: statistic.shortName,
      description: statistic.description,
    });
    setShowStatDialog(true);
  };

  const handleCreateSkill = async () => {
    if (!selectedStatistic || !skillFormData.name.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const result = await createSkill(selectedStatistic.id, {
        name: skillFormData.name.trim(),
        costPerLevel: skillFormData.costPerLevel,
      });

      if (result.success && result.data) {
        setStatisticsData(prevData => {
          const updated = prevData.map(stat => {
            if (stat.id === selectedStatistic.id) {
              return {
                ...stat,
                skills: [...stat.skills, result.data].sort((a, b) => a.name.localeCompare(b.name))
              };
            }
            return stat;
          });
          return updated;
        });
        toast.success("Skill created successfully");
        setShowSkillDialog(false);
        setSkillFormData({ name: "", costPerLevel: 1 });
      } else {
        toast.error("Failed to create skill");
      }
    } catch (error: unknown) {
      console.error('Error creating skill:', error);
      toast.error("An error occurred while creating skill");
    }
  };

  const openCreateSkillDialog = (statistic: Statistic) => {
    setSelectedStatistic(statistic);
    setShowSkillDialog(true);
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
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Reset</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>This will reset all skills to level 0.</p>
                <p>You will gain {resetXpGain} XP from this reset.</p>
                <p>Are you sure you want to proceed?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelReset}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={showStatDialog} onOpenChange={setShowStatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{statFormData.id ? "Edit Statistic" : "Create New Statistic"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={statFormData.name}
                onChange={(e) => setStatFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter statistic name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortName">Short Name</Label>
              <Input
                id="shortName"
                value={statFormData.shortName}
                onChange={(e) => setStatFormData(prev => ({ ...prev, shortName: e.target.value }))}
                placeholder="Enter short name (e.g. STR)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={statFormData.description}
                onChange={(e) => setStatFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter statistic description"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowStatDialog(false);
              setStatFormData({ name: "", shortName: "", description: "" });
            }}>
              Cancel
            </Button>
            <Button onClick={handleStatDialogSubmit}>
              {statFormData.id ? "Save Changes" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showSkillDialog} onOpenChange={setShowSkillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Skill for {selectedStatistic?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="skillName">Name</Label>
              <Input
                id="skillName"
                value={skillFormData.name}
                onChange={(e) => setSkillFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter skill name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPerLevel">Cost Per Level</Label>
              <Input
                id="costPerLevel"
                type="number"
                min="1"
                value={skillFormData.costPerLevel}
                onChange={(e) => setSkillFormData(prev => ({ ...prev, costPerLevel: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowSkillDialog(false);
              setSkillFormData({ name: "", costPerLevel: 1 });
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateSkill}>
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <div className="flex items-center gap-2">
              {isEditable ? (
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
              ) : (
                <Badge variant="secondary" className="text-sm">
                  Available XP: {availableXP}
                </Badge>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                className="h-6 w-6"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-mode"
                checked={isEditable}
                onCheckedChange={setIsEditable}
              />
              <Label htmlFor="edit-mode">Edit Mode</Label>
            </div>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search statistics or skills... (uppercase for shortname only)"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
        </div>
      </div>
      <StatisticsTable 
        data={filteredData} 
        searchQuery={searchQuery} 
        onDataEdit={handleDataEdit}
        isEditable={isEditable}
        onLevelUp={handleLevelUp}
        onEditStatistic={openEditDialog}
        onCreateSkill={openCreateSkillDialog}
      />
      {isEditable && (
        <div className="flex justify-end">
          <Button onClick={() => setShowStatDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Statistic
          </Button>
        </div>
      )}
    </div>
  );
}

interface StatisticsTableProps {
  data: Statistic[];
  searchQuery: string;
  onDataEdit: (data: Statistic | Skills, field: string, value: number) => void;
  isEditable: boolean;
  onLevelUp: (data: Statistic | Skills) => void;
  onEditStatistic?: (statistic: Statistic) => void;
  onCreateSkill?: (statistic: Statistic) => void;
}

function StatisticsTable({ data, searchQuery, onDataEdit, isEditable, onLevelUp, onEditStatistic, onCreateSkill }: StatisticsTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [editingCell, setEditingCell] = useState<{ data: Statistic | Skills; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [selectedStatistic, setSelectedStatistic] = useState<Statistic | null>(null);
  
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
      cell: ({ row }) => {
        const isStatistic = Array.isArray((row.original as Statistic).skills);
        
        return (
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
            {isStatistic ? (
              <button
                onClick={() => setSelectedStatistic(row.original as Statistic)}
                className="font-semibold hover:underline text-left"
              >
                {row.getValue("name")}
              </button>
            ) : (
              <span className="flex items-center gap-1">
                {row.getValue("name")}
                {"costPerLevel" in row.original && row.original.costPerLevel > 1 && (
                  <span className="ml-1 text-yellow-600" title={`This skill costs ${row.original.costPerLevel} XP per level`}>
                    <AlertCircle className="h-4 w-4" />
                  </span>
                )}
              </span>
            )}
          </div>
        );
      },
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
      cell: ({ row }) => {
        const isStatistic = Array.isArray((row.original as Statistic).skills);
        const value = row.getValue("base") as number;
        
        if (isStatistic) {
          return (
            <div className="flex items-center gap-2">
              <span>{value}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Statistic level used as base value for linked skills</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        }

        const isEditing = editingCell?.data === row.original && editingCell?.field === "base";
        
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
            onClick={() => handleCellClick(row.original, "base", value)}
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
        const isStatistic = Array.isArray((row.original as Statistic).skills);
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isStatistic && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      onEditStatistic?.(row.original as Statistic);
                    }}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onCreateSkill?.(row.original as Statistic);
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Create Skill
                  </DropdownMenuItem>
                </>
              )}
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
      <Dialog open={!!selectedStatistic} onOpenChange={() => setSelectedStatistic(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedStatistic?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {selectedStatistic?.description}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
