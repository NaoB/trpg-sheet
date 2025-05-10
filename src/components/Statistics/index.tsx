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

export default function Statistics() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    
    const query = searchQuery.trim();
    const isUpperCase = query === query.toUpperCase() && query !== query.toLowerCase();
    
    return data.filter(stat => {
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
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search statistics or skills... (uppercase for shortname only)"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      <StatisticsTable data={filteredData} searchQuery={searchQuery} />
    </div>
  );
}

interface StatisticsTableProps {
  data: Statistic[];
  searchQuery: string;
}

function StatisticsTable({ data, searchQuery }: StatisticsTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  
  const columnHelper = createColumnHelper<Statistic | Skills>();
  
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
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("base", {
      header: "Base",
      cell: (info) => "base" in info.row.original ? info.getValue() : "",
    }),
    columnHelper.accessor("bonus", {
      header: "Bonus",
      cell: (info) => "bonus" in info.row.original ? info.getValue() : "",
    }),
    columnHelper.accessor("total", {
      header: "Total",
      cell: (info) => "total" in info.row.original ? info.getValue() : "",
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
