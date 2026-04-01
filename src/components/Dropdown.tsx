"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

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
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && searchable) setTimeout(() => searchRef.current?.focus(), 50);
    if (!open) setSearch("");
  }, [open, searchable]);

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

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="press w-full h-[48px] bg-gray-100 rounded-xl px-4 text-[15px] outline-none border border-transparent flex items-center justify-between gap-2 text-left transition-all duration-200 focus:border-black focus:shadow-[0_0_0_2px_rgba(0,0,0,0.05)]"
      >
        <span className={selected ? "text-black truncate" : "text-gray-400 truncate"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-2xl shadow-lg shadow-black/10 border border-gray-100 overflow-hidden animate-slide-up" style={{ animationDuration: "0.2s" }}>
          {searchable && (
            <div className="px-3 pt-3 pb-2">
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 h-[40px]">
                <Search className="w-4 h-4 text-gray-400" strokeWidth={2} />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          )}
          <div className="max-h-[280px] overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="text-center text-gray-400 text-[14px] py-6">No results</p>
            )}
            {[...groups.entries()].map(([group, items]) => (
              <div key={group}>
                {group && (
                  <p className="px-4 pt-3 pb-1 text-[11px] text-gray-400 uppercase tracking-wider font-medium">{group}</p>
                )}
                {items.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { onChange(option.value); setOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-3 text-[15px] text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <span className={option.value === value ? "text-black" : "text-gray-700"}>{option.label}</span>
                    {option.value === value && <Check className="w-4 h-4 text-black flex-shrink-0" strokeWidth={2.5} />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
