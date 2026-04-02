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

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      if (searchable) setTimeout(() => searchRef.current?.focus(), 100);
      // Scroll to selected item
      if (value && listRef.current) {
        setTimeout(() => {
          const el = listRef.current?.querySelector("[data-selected='true']");
          if (el) el.scrollIntoView({ block: "center" });
        }, 150);
      }
    } else {
      document.body.style.overflow = "";
      setSearch("");
    }
    return () => { document.body.style.overflow = ""; };
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
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press w-full h-[50px] bg-gray-50 rounded-xl px-4 text-[15px] outline-none border border-border flex items-center justify-between gap-2 text-left transition-all duration-200"
      >
        <span className={selected ? "text-gray-900 truncate font-medium" : "text-gray-400 truncate"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={2} />
      </button>

      {/* Full-screen bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-[90] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 animate-backdrop"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="relative z-10 bg-surface rounded-t-[20px] max-h-[85vh] flex flex-col animate-sheet-up">
            {/* Handle + header */}
            <div className="flex-shrink-0">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-[4px] rounded-full bg-gray-300" />
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <h3 className="text-[17px] font-semibold text-gray-900">
                  {placeholder?.replace("...", "").replace("Select ", "").replace("your ", "") || "Select"}
                </h3>
                <button onClick={() => setOpen(false)} className="press w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" strokeWidth={2} />
                </button>
              </div>

              {/* Search */}
              {searchable && (
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-2.5 bg-gray-100 rounded-xl px-4 h-[44px]">
                    <Search className="w-[16px] h-[16px] text-gray-400 flex-shrink-0" strokeWidth={2} />
                    <input
                      ref={searchRef}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-gray-400"
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="press">
                        <X className="w-4 h-4 text-gray-400" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="h-px bg-border" />
            </div>

            {/* Options list */}
            <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain">
              {filtered.length === 0 && (
                <div className="flex flex-col items-center py-16">
                  <p className="text-gray-400 text-[15px]">No results found</p>
                  {search && (
                    <button onClick={() => setSearch("")} className="press text-rose text-[14px] mt-2 font-medium">
                      Clear search
                    </button>
                  )}
                </div>
              )}
              {[...groups.entries()].map(([group, items]) => (
                <div key={group || "__default"}>
                  {group && (
                    <div className="sticky top-0 bg-surface/95 glass px-5 py-2.5 border-b border-border">
                      <p className="text-[12px] text-gray-400 uppercase tracking-[0.08em] font-semibold">{group}</p>
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
                        className={`w-full flex items-center justify-between px-5 py-3.5 text-left press transition-colors ${
                          isSelected ? "bg-gray-50" : ""
                        }`}
                      >
                        <span className={`text-[15px] ${isSelected ? "text-gray-900 font-semibold" : "text-gray-700"}`}>
                          {option.label}
                        </span>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
              {/* Bottom safe area */}
              <div className="h-8" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
