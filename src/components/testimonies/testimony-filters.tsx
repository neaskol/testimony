"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, XIcon } from "lucide-react";

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

  const currentStatus = searchParams.get("status") ?? "all";
  const currentSearch = searchParams.get("search") ?? "";

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

  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.push("/admin/testimonies");
    });
  }, [router, startTransition]);

  const hasFilters = currentStatus !== "all" || currentSearch !== "";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          defaultValue={currentSearch}
          className="pl-8"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParams("search", e.currentTarget.value);
            }
          }}
          onBlur={(e) => {
            if (e.currentTarget.value !== currentSearch) {
              updateParams("search", e.currentTarget.value);
            }
          }}
        />
      </div>

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
  );
}
