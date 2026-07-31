"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExerciseArt } from "@/components/exercise/ExerciseArt";
import {
  searchExercises,
  EQUIPMENT_LABEL,
  MUSCLE_GROUP_LABEL,
  type CatalogExercise,
} from "@/lib/exerciseLibrary";

export interface PickedExercise {
  name: string;
  catalog?: CatalogExercise;
}

interface ExercisePickerProps {
  onPick: (picked: PickedExercise) => void;
  placeholder?: string;
  /** Names already in the list — shown as "added" instead of being pickable. */
  existingNames?: string[];
  autoFocus?: boolean;
  className?: string;
}

/**
 * Search-as-you-type over the exercise catalog, with a fallback that turns
 * whatever the person typed into a custom exercise. Used by both the client's
 * plan builder and the coach's plan editor so the two stay in sync.
 */
export function ExercisePicker({
  onPick,
  placeholder = "Search exercises — e.g. bench press",
  existingNames = [],
  autoFocus = false,
  className,
}: ExercisePickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = useMemo(() => searchExercises(query, 8), [query]);
  const trimmed = query.trim();
  const alreadyAdded = useMemo(
    () => new Set(existingNames.map((n) => n.toLowerCase())),
    [existingNames],
  );

  const exactMatch = results.some(
    (r) => r.name.toLowerCase() === trimmed.toLowerCase(),
  );
  const showCustomOption = trimmed.length > 1 && !exactMatch;
  const optionCount = results.length + (showCustomOption ? 1 : 0);

  function reset() {
    setQuery("");
    setHighlight(0);
    setOpen(false);
  }

  /**
   * The results list is absolutely positioned, so it can't push the page
   * taller — at the bottom of a form it would hang off-screen with nothing to
   * scroll to. Open it upwards whenever there's more room above than below.
   */
  function openList() {
    const rect = inputRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setDropUp(below < Math.min(320, rect.top));
    }
    setOpen(true);
  }

  function pickCatalog(catalog: CatalogExercise) {
    onPick({ name: catalog.name, catalog });
    reset();
    inputRef.current?.focus();
  }

  function pickCustom() {
    if (!trimmed) return;
    onPick({ name: trimmed });
    reset();
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      openList();
      setHighlight((i) => (optionCount ? (i + 1) % optionCount : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => (optionCount ? (i - 1 + optionCount) % optionCount : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight < results.length) {
        const chosen = results[highlight];
        if (chosen) pickCatalog(chosen);
      } else {
        pickCustom();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ft-muted" />
        <input
          ref={inputRef}
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
            setOpen(true);
          }}
          onFocus={openList}
          // A blur that lands on an option would close the list before the
          // click registers, so let the click through first.
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={placeholder}
          className="flex h-11 w-full rounded-xl border border-ft-border bg-ft-surface pl-9 pr-3 text-sm text-ft-text outline-none placeholder:text-ft-muted focus-visible:ring-2 focus-visible:ring-ft-accent"
        />
      </div>

      {open && (results.length > 0 || showCustomOption) && (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            "absolute z-40 max-h-80 w-full overflow-y-auto rounded-xl border border-ft-border bg-ft-surface p-1 shadow-lg shadow-ft-text/5",
            dropUp ? "bottom-full mb-1.5" : "mt-1.5",
          )}
        >
          {results.map((result, i) => {
            const added = alreadyAdded.has(result.name.toLowerCase());
            return (
              <li key={result.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === highlight}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pickCatalog(result)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                    i === highlight ? "bg-ft-accent/[0.07]" : "hover:bg-ft-accent/[0.05]",
                  )}
                >
                  <ExerciseArt name={result.name} exerciseId={result.id} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ft-text">
                      {result.name}
                    </span>
                    <span className="block truncate text-xs text-ft-muted">
                      {MUSCLE_GROUP_LABEL[result.group]} · {EQUIPMENT_LABEL[result.equipment]} ·{" "}
                      {result.defaultSets} × {result.defaultReps}
                    </span>
                  </span>
                  {added && (
                    <span className="shrink-0 text-xs font-medium text-ft-muted">Added</span>
                  )}
                </button>
              </li>
            );
          })}

          {showCustomOption && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={highlight === results.length}
                onMouseEnter={() => setHighlight(results.length)}
                onClick={pickCustom}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                  highlight === results.length
                    ? "bg-ft-accent/[0.07]"
                    : "hover:bg-ft-accent/[0.05]",
                )}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-dashed border-ft-accent/50 text-ft-accent">
                  <Plus className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ft-text">
                    Create &ldquo;{trimmed}&rdquo;
                  </span>
                  <span className="block text-xs text-ft-muted">
                    Not in the library — add it as your own exercise
                  </span>
                </span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
