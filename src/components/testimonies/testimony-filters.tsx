"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, SearchCheckIcon, XIcon, Loader2Icon, CalendarIcon } from "lucide-react";
import { semanticSearch } from "@/actions/ai";

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "received", label: "Reçu" },
  { value: "in_translation", label: "En traduction" },
  { value: "translated", label: "Traduit" },
  { value: "planned", label: "Planifié" },
  { value: "read", label: "Lu" },
] as const;

export function TestimonyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [isAiSearching, setIsAiSearching] = useState(false);

  const currentStatus = searchParams.get("status") ?? "all";
  const currentSearch = searchParams.get("search") ?? "";
  const currentDateFrom = searchParams.get("dateFrom") ?? "";
  const currentDateTo = searchParams.get("dateTo") ?? "";
  const isAiMode = searchParams.get("ai") === "1";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`/admin/testimonies?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateParams("search", value);
      }, 400);
    },
    [updateParams]
  );

  const toggleAiSearch = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (isAiMode) {
      params.delete("ai");
    } else {
      params.set("ai", "1");
    }
    startTransition(() => {
      router.push(`/admin/testimonies?${params.toString()}`);
    });
  }, [router, searchParams, startTransition, isAiMode]);

  const handleAiSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return;
      setIsAiSearching(true);
      const result = await semanticSearch(query);
      setIsAiSearching(false);

      if (result.data) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("ai", "1");
        params.set("search", query);
        if (result.data.length > 0) {
          params.set("aiIds", result.data.join(","));
        } else {
          params.set("aiIds", "none");
        }
        startTransition(() => {
          router.push(`/admin/testimonies?${params.toString()}`);
        });
      }
    },
    [router, searchParams, startTransition]
  );

  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.push("/admin/testimonies");
    });
  }, [router, startTransition]);

  const hasFilters = currentStatus !== "all" || currentSearch !== "" || currentDateFrom !== "" || currentDateTo !== "" || isAiMode;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          {isAiSearching ? (
            <Loader2Icon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-[#B8860B]" />
          ) : isAiMode ? (
            <SearchCheckIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#B8860B]" />
          ) : (
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            placeholder={
              isAiMode
                ? "Recherche approfondie..."
                : "Rechercher par nom ou contenu..."
            }
            defaultValue={currentSearch}
            className={`pl-8 ${isAiMode ? "border-[#B8860B]/30 focus-visible:ring-[#B8860B]/30" : ""}`}
            onChange={(e) => {
              if (!isAiMode) {
                handleSearchChange(e.currentTarget.value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                if (isAiMode) {
                  handleAiSearch(e.currentTarget.value);
                } else {
                  updateParams("search", e.currentTarget.value);
                }
              }
            }}
          />
        </div>

        <Button
          variant={isAiMode ? "default" : "outline"}
          size="sm"
          onClick={toggleAiSearch}
          className={isAiMode ? "bg-[#B8860B] hover:bg-[#996F09]" : ""}
          title="Recherche approfondie"
        >
          <SearchCheckIcon className="size-4" />
          Approfondie
        </Button>

        <Select
          value={currentStatus}
          onValueChange={(val) => updateParams("status", val ?? "all")}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <XIcon className="size-4" />
            Effacer
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Du</span>
          <Input
            type="date"
            defaultValue={currentDateFrom}
            className="w-auto"
            onChange={(e) => updateParams("dateFrom", e.currentTarget.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Au</span>
          <Input
            type="date"
            defaultValue={currentDateTo}
            className="w-auto"
            onChange={(e) => updateParams("dateTo", e.currentTarget.value)}
          />
        </div>
      </div>

      {isAiMode && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <SearchCheckIcon className="size-3 text-[#B8860B]" />
          Recherche approfondie — tapez votre recherche et appuyez sur Entrer
        </p>
      )}
    </div>
  );
}
