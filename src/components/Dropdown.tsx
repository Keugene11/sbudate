"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

interface DropdownOption {
  value: string;
  label: string;
  group?: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  searchable?: boolean;
}

export default function Dropdown({ value, onChange, options, placeholder = "Select...", searchable = false }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      if (searchable) setTimeout(() => searchRef.current?.focus(), 50);
      if (value && listRef.current) {
        setTimeout(() => {
          const el = listRef.current?.querySelector("[data-selected='true']");
          if (el) el.scrollIntoView({ block: "center" });
        }, 50);
      }
    } else {
      setSearch("");
    }
  }, [open, searchable, value]);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Group options
  const groups = new Map<string, DropdownOption[]>();
  filtered.forEach((o) => {
    const g = o.group || "";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(o);
  });

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="press w-full h-[50px] bg-gray-50 rounded-xl px-4 text-[15px] outline-none border border-border flex items-center justify-between gap-2 text-left transition-all duration-200"
      >
        <span className={selected ? "text-gray-900 truncate font-medium" : "text-gray-400 truncate"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-surface rounded-xl border border-border shadow-card overflow-hidden animate-scale-in origin-top">
          {/* Search */}
          {searchable && (
            <div className="p-2.5 border-b border-border">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 h-[38px]">
                <Search className="w-[14px] h-[14px] text-gray-400 flex-shrink-0" strokeWidth={2} />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-gray-400"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="press">
                    <X className="w-3.5 h-3.5 text-gray-400" strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options list */}
          <div ref={listRef} className="max-h-[240px] overflow-y-auto overscroll-contain">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-8">
                <p className="text-gray-400 text-[14px]">No results</p>
              </div>
            )}
            {[...groups.entries()].map(([group, items]) => (
              <div key={group || "__default"}>
                {group && (
                  <div className="sticky top-0 bg-gray-50 px-3.5 py-2 border-b border-border">
                    <p className="text-[11px] text-gray-400 uppercase tracking-[0.08em] font-semibold">{group}</p>
                  </div>
                )}
                {items.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      data-selected={isSelected || undefined}
                      onClick={() => handleSelect(option.value)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left press transition-colors hover:bg-gray-50 ${
                        isSelected ? "bg-gray-50" : ""
                      }`}
                    >
                      <span className={`text-[14px] ${isSelected ? "text-gray-900 font-semibold" : "text-gray-700"}`}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-gray-900 flex-shrink-0" strokeWidth={2.5} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
