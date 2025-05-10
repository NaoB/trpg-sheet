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
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Skills, Statistic } from "./types";
import { data } from "./data";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

export default function Statistics() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statisticsData, setStatisticsData] = useState(data);
  const [isEditable, setIsEditable] = useState(false);
  
  const handleDataEdit = (data: Statistic | Skills, field: string, value: number) => {
    setStatisticsData(prevData => {
      return prevData.map(stat => {
        // Check if this is the main statistic row
        if (stat === data) {
          return { ...stat, [field]: value };
        }
        
        // Check if this is a skill row
        const updatedSkills = stat.skills.map(skill => {
          if (skill === data) {
            return { ...skill, [field]: value };
          }
          return skill;
        });
        
        return { ...stat, skills: updatedSkills };
      });
    });
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search statistics or skills... (uppercase for shortname only)"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2 ml-4">
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
      />
    </div>
  );
}

interface StatisticsTableProps {
  data: Statistic[];
  searchQuery: string;
  onDataEdit: (data: Statistic | Skills, field: string, value: number) => void;
  isEditable: boolean;
}

function StatisticsTable({ data, searchQuery, onDataEdit, isEditable }: StatisticsTableProps) {
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
            <span>{row.getValue("name")}</span>
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
