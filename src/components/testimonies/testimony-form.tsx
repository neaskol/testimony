"use client";

import { useRouter } from "next/navigation";
import {
  useTransition,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { toast } from "sonner";
import { createTestimony, updateTestimony } from "@/actions/testimonies";
import { searchWitnessesByName } from "@/actions/witnesses";
import { detectLanguage } from "@/actions/ai";
import type { Testimony, Witness } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2Icon, PlusIcon, UserIcon, SparklesIcon } from "lucide-react";

interface TestimonyFormProps {
  witnesses: Pick<Witness, "id" | "full_name">[];
  testimony?: Testimony & {
    witness?: { id: string; full_name: string } | null;
  };
  mode: "create" | "edit";
}

export function TestimonyForm({
  witnesses,
  testimony,
  mode,
}: TestimonyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    testimony?.source_language ?? "fr"
  );

  // Witness autocomplete state
  const [witnessName, setWitnessName] = useState(
    testimony?.witness?.full_name ?? ""
  );
  const [witnessId, setWitnessId] = useState(testimony?.witness_id ?? "");
  const [suggestions, setSuggestions] = useState<
    Pick<Witness, "id" | "full_name">[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const formRef = useRef<HTMLFormElement>(null);
  const createAnotherRef = useRef(false);
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [languageAutoDetected, setLanguageAutoDetected] = useState(false);

  // Initialize witness name from existing testimony
  useEffect(() => {
    if (testimony?.witness) {
      // Use the joined witness data directly (most reliable)
      setWitnessName(testimony.witness.full_name);
      setWitnessId(testimony.witness.id);
    } else if (testimony?.witness_id) {
      const found = witnesses.find((w) => w.id === testimony.witness_id);
      if (found) {
        setWitnessName(found.full_name);
        setWitnessId(found.id);
      }
    }
  }, [testimony?.witness, testimony?.witness_id, witnesses]);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchWitnesses = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    const result = await searchWitnessesByName(query);
    if (result.data) {
      setSuggestions(result.data);
    }
    setIsSearching(false);
  }, []);

  function handleWitnessNameChange(value: string) {
    setWitnessName(value);
    setWitnessId(""); // Clear linked ID when typing a new name
    setShowSuggestions(true);

    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchWitnesses(value);
    }, 300);
  }

  function handleSelectSuggestion(witness: Pick<Witness, "id" | "full_name">) {
    setWitnessName(witness.full_name);
    setWitnessId(witness.id);
    setShowSuggestions(false);
    setSuggestions([]);
  }

  async function handleContentBlur(text: string) {
    if (!text.trim() || text.trim().length < 10) return;
    setIsDetectingLanguage(true);
    const result = await detectLanguage(text);
    if (result.data) {
      setSelectedLanguage(result.data);
      setLanguageAutoDetected(true);
    }
    setIsDetectingLanguage(false);
  }

  function resetForm() {
    formRef.current?.reset();
    setWitnessName("");
    setWitnessId("");
    setSelectedLanguage("fr");
    setLanguageAutoDetected(false);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handleSubmit(formData: FormData) {
    formData.set("witness_id", witnessId);
    formData.set("witness_name", witnessName);
    formData.set("source_language", selectedLanguage);

    const wantsAnother = createAnotherRef.current;
    createAnotherRef.current = false;

    startTransition(async () => {
      if (mode === "create") {
        const result = await createTestimony(formData);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        if (wantsAnother) {
          toast.success("Témoignage créé — prêt pour le suivant");
          resetForm();
        } else {
          toast.success("Témoignage créé avec succès");
          router.push(`/admin/testimonies/${result.data!.id}`);
        }
      } else {
        const result = await updateTestimony(testimony!.id, formData);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Témoignage mis à jour");
        router.push(`/admin/testimonies/${testimony!.id}`);
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-6">
      {/* Witness name with autocomplete */}
      <div className="space-y-2">
        <Label htmlFor="witness_name">Nom du témoin</Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <UserIcon className="size-4 text-muted-foreground" />
          </div>
          <Input
            ref={inputRef}
            id="witness_name"
            value={witnessName}
            onChange={(e) => handleWitnessNameChange(e.target.value)}
            onFocus={() => {
              if (witnessName.trim()) {
                setShowSuggestions(true);
                searchWitnesses(witnessName);
              }
            }}
            placeholder="Saisissez le nom du témoin (optionnel)"
            className="pl-9"
            autoComplete="off"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-md"
            >
              <ul className="max-h-48 overflow-y-auto py-1">
                {suggestions.map((w) => (
                  <li key={w.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectSuggestion(w)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                    >
                      <UserIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      {w.full_name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {witnessId && (
          <p className="text-xs text-muted-foreground">
            Témoin existant sélectionné
          </p>
        )}
        {witnessName.trim() && !witnessId && (
          <p className="text-xs text-muted-foreground">
            Un nouveau témoin sera créé automatiquement
          </p>
        )}
      </div>

      {/* Date de réception */}
      <div className="space-y-2">
        <Label htmlFor="received_at">Date de réception</Label>
        <Input
          id="received_at"
          name="received_at"
          type="date"
          defaultValue={
            testimony?.created_at
              ? new Date(testimony.created_at).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0]
          }
          className="w-full sm:w-56"
        />
        <p className="text-xs text-muted-foreground">
          Date à laquelle le témoignage a été reçu
        </p>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content">Contenu du témoignage</Label>
        <Textarea
          id="content"
          name="content"
          placeholder="Saisissez le témoignage..."
          defaultValue={testimony?.content ?? ""}
          rows={8}
          required
          className="min-h-[160px]"
          onBlur={(e) => handleContentBlur(e.target.value)}
        />
      </div>

      {/* Source language */}
      <div className="space-y-2">
        <Label htmlFor="source_language">Langue source</Label>
        <div className="flex items-center gap-2">
          <Select
            value={selectedLanguage}
            onValueChange={(val) => {
              setSelectedLanguage(val ?? "fr");
              setLanguageAutoDetected(false);
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="mg">Malgache</SelectItem>
            </SelectContent>
          </Select>
          {isDetectingLanguage && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <SparklesIcon className="size-3 animate-pulse" />
              Détection...
            </span>
          )}
        </div>
        {languageAutoDetected && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <SparklesIcon className="size-3" />
            Langue détectée automatiquement par l&apos;IA
          </p>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          name="tags"
          placeholder="guérison, foi, miracle (séparés par des virgules)"
          defaultValue={testimony?.tags?.join(", ") ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          Séparez les tags par des virgules
        </p>
      </div>

      {/* Private notes */}
      <div className="space-y-2">
        <Label htmlFor="private_notes">
          Notes visibles uniquement par le Pasteur
        </Label>
        <Textarea
          id="private_notes"
          name="private_notes"
          placeholder="Ces notes ne sont visibles que par vous..."
          defaultValue={testimony?.private_notes ?? ""}
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2Icon className="size-4 animate-spin" />}
          {mode === "create" ? "Créer le témoignage" : "Enregistrer"}
        </Button>
        {mode === "create" && (
          <Button
            type="submit"
            variant="secondary"
            disabled={isPending}
            onClick={() => {
              createAnotherRef.current = true;
            }}
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            <PlusIcon className="size-4" />
            Créer et ajouter un autre
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
