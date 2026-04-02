"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft } from "lucide-react";
import { GENDER_OPTIONS, RESIDENCE_HALLS, SBU_MAJORS, DRINKING_OPTIONS, SMOKING_OPTIONS } from "@/types";
import Dropdown from "@/components/Dropdown";

const FIELDS: Record<string, {
  label: string;
  dbKey: string;
  type: "text" | "dropdown" | "height" | "pills";
  options?: string[];
  dropdownOptions?: { value: string; label: string; group?: string }[];
  searchable?: boolean;
  placeholder?: string;
}> = {
  major: { label: "Major", dbKey: "major", type: "dropdown", dropdownOptions: SBU_MAJORS.map(m => ({ value: m, label: m })), searchable: true },
  graduation_year: { label: "Graduation Year", dbKey: "graduation_year", type: "dropdown", dropdownOptions: ["2025","2026","2027","2028","2029","2030"].map(y => ({ value: y, label: `Class of ${y}` })) },
  height: { label: "Height", dbKey: "height_inches", type: "height" },
  residence_hall: { label: "Residence Hall", dbKey: "residence_hall", type: "dropdown", dropdownOptions: Object.entries(RESIDENCE_HALLS).flatMap(([group, halls]) => halls.map(h => ({ value: h, label: h, group }))), searchable: true },
  hometown: { label: "Hometown", dbKey: "hometown", type: "text", placeholder: "New York, NY" },
  gender: { label: "Gender", dbKey: "gender", type: "pills", options: GENDER_OPTIONS },
  drinking: { label: "Drinking", dbKey: "drinking", type: "pills", options: DRINKING_OPTIONS },
  smoking: { label: "Smoking", dbKey: "smoking", type: "pills", options: SMOKING_OPTIONS },
};

export default function EditFieldPage() {
  return <Suspense><EditFieldContent /></Suspense>;
}

function EditFieldContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fieldKey = searchParams.get("field") || "";
  const field = FIELDS[fieldKey];

  const supabase = createClient();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!field) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (!p) return;
      setProfileId(p.id);
      if (field.type === "height" && p.height_inches) {
        setFeet(String(Math.floor(p.height_inches / 12)));
        setInches(String(p.height_inches % 12));
      } else if (fieldKey === "graduation_year") {
        setValue(p.graduation_year ? String(p.graduation_year) : "");
      } else {
        setValue((p as unknown as Record<string, string>)[field.dbKey] || "");
      }
      setLoading(false);
    })();
  }, [supabase, field, fieldKey]);

  const handleSave = async () => {
    if (!profileId) return;
    setSaving(true);
    let updateData: Record<string, unknown> = {};
    if (field.type === "height") {
      updateData = { height_inches: feet && inches ? parseInt(feet) * 12 + parseInt(inches) : null };
    } else if (fieldKey === "graduation_year") {
      updateData = { [field.dbKey]: value ? parseInt(value) : null };
    } else {
      updateData = { [field.dbKey]: value || null };
    }
    await supabase.from("profiles").update(updateData).eq("id", profileId);
    router.push("/profile");
  };

  if (!field) {
    router.push("/profile");
    return null;
  }

  if (loading) return (
    <div className="h-[100dvh] flex items-center justify-center bg-surface">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-[100dvh] flex flex-col bg-surface animate-push-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[56px] flex-shrink-0 border-b border-border max-w-lg mx-auto w-full">
        <button onClick={() => router.push("/profile")} className="press text-[15px] text-gray-400 font-medium">
          Cancel
        </button>
        <span className="text-[16px] text-gray-900 font-semibold">{field.label}</span>
        <button onClick={handleSave} disabled={saving}
          className="press text-[15px] text-rose font-semibold disabled:text-gray-300">
          {saving ? "Saving" : "Done"}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-8">
          {field.type === "text" && (
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={field.placeholder || field.label}
              className="w-full h-[50px] bg-gray-50 rounded-xl px-4 text-[15px] text-gray-900 outline-none border border-border input-hinge"
              autoFocus
            />
          )}

          {field.type === "dropdown" && (
            <Dropdown
              value={value}
              onChange={setValue}
              options={field.dropdownOptions || []}
              placeholder={`Select ${field.label.toLowerCase()}...`}
              searchable={field.searchable}
            />
          )}

          {field.type === "height" && (
            <div className="flex gap-3 items-center">
              <input type="number" value={feet} onChange={(e) => setFeet(e.target.value)}
                className="flex-1 h-[50px] bg-gray-50 rounded-xl px-4 text-[15px] text-gray-900 outline-none border border-border input-hinge text-center"
                placeholder="5" autoFocus />
              <span className="text-gray-400 text-[14px] font-medium">ft</span>
              <input type="number" value={inches} onChange={(e) => setInches(e.target.value)}
                className="flex-1 h-[50px] bg-gray-50 rounded-xl px-4 text-[15px] text-gray-900 outline-none border border-border input-hinge text-center"
                placeholder="8" />
              <span className="text-gray-400 text-[14px] font-medium">in</span>
            </div>
          )}

          {field.type === "pills" && (
            <div className="space-y-2.5">
              {field.options?.map((opt) => (
                <button key={opt} onClick={() => setValue(value === opt ? "" : opt)}
                  className={`press w-full h-[52px] rounded-xl text-[15px] font-medium text-left px-5 transition-all duration-200 ${
                    value === opt ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700 border border-border"
                  }`}>
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
