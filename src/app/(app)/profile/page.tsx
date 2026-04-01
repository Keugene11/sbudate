"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ChevronLeft, LogOut, ChevronRight } from "lucide-react";
import type { ProfileWithContent } from "@/types";
import { SBU_MAJORS, RESIDENCE_HALLS, GENDER_OPTIONS, PROMPT_OPTIONS } from "@/types";
import Dropdown from "@/components/Dropdown";
import { Cake, User, Ruler, MapPin, GraduationCap, Home, Building } from "lucide-react";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileWithContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"edit" | "view">("edit");
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [major, setMajor] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [hometown, setHometown] = useState("");
  const [residenceHall, setResidenceHall] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (!p) return;
      const [{ data: photos }, { data: prompts }] = await Promise.all([
        supabase.from("photos").select("*").eq("profile_id", p.id).order("position"),
        supabase.from("prompts").select("*").eq("profile_id", p.id).order("position"),
      ]);
      setProfile({ ...p, photos: photos || [], prompts: prompts || [] });
      setMajor(p.major || "");
      setGradYear(p.graduation_year ? String(p.graduation_year) : "");
      setHometown(p.hometown || "");
      setResidenceHall(p.residence_hall || "");
      if (p.height_inches) {
        setHeightFeet(String(Math.floor(p.height_inches / 12)));
        setHeightInches(String(p.height_inches % 12));
      }
      setLoading(false);
    };
    fetchProfile();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const saveField = async (field: string, value: string | number | null) => {
    if (!profile) return;
    setSaving(true);
    await supabase.from("profiles").update({ [field]: value }).eq("id", profile.id);
    setProfile({ ...profile, [field]: value });
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" /></div>;
  if (!profile) return null;

  const heightDisplay = profile.height_inches
    ? `${Math.floor(profile.height_inches / 12)}'${profile.height_inches % 12}"`
    : null;

  return (
    <div className="max-w-lg mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[52px]">
        <div className="w-8" />
        <p className="text-[18px] font-medium">{profile.first_name}</p>
        <button onClick={handleLogout} className="press p-1">
          <LogOut className="w-[18px] h-[18px] text-gray-500" strokeWidth={2} />
        </button>
      </div>

      {/* Edit / View tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab("edit")}
          className={`flex-1 py-3 text-center text-[15px] font-medium transition-colors ${
            tab === "edit" ? "text-black border-b-2 border-black" : "text-gray-400"
          }`}
        >
          Edit
        </button>
        <button
          onClick={() => setTab("view")}
          className={`flex-1 py-3 text-center text-[15px] font-medium transition-colors ${
            tab === "view" ? "text-black border-b-2 border-black" : "text-gray-400"
          }`}
        >
          View
        </button>
      </div>

      {tab === "edit" ? (
        <div className="pb-24">
          {/* Photos section */}
          <div className="px-5 py-4">
            <div className="grid grid-cols-3 gap-2">
              {profile.photos.map((photo) => (
                <div key={photo.id} className="aspect-[3/4] rounded-xl overflow-hidden">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {profile.photos.length < 6 && (
                <button
                  onClick={() => router.push("/profile/edit")}
                  className="aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[24px] press"
                >
                  +
                </button>
              )}
            </div>
          </div>

          {/* Prompts */}
          <div className="px-5 mb-2">
            <p className="text-[12px] text-gray-400 uppercase tracking-wider font-medium mb-3">My Prompts</p>
          </div>
          {profile.prompts.map((prompt, idx) => (
            <button
              key={prompt.id}
              onClick={() => router.push("/profile/edit")}
              className="w-full px-5 py-4 border-b border-gray-100 flex items-center justify-between press text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-gray-400">{prompt.question}</p>
                <p className="text-[15px] text-black mt-0.5 truncate">{prompt.answer}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 ml-3" strokeWidth={2} />
            </button>
          ))}
          {profile.prompts.length < 3 && (
            <button
              onClick={() => router.push("/profile/edit")}
              className="w-full px-5 py-4 border-b border-gray-100 flex items-center justify-between press text-left"
            >
              <p className="text-[15px] text-gray-400">Add a prompt...</p>
              <ChevronRight className="w-4 h-4 text-gray-300" strokeWidth={2} />
            </button>
          )}

          {/* My Vitals */}
          <div className="px-5 mt-6 mb-2">
            <p className="text-[12px] text-gray-400 uppercase tracking-wider font-medium">My Vitals</p>
          </div>
          <div className="border-t border-gray-100">
            <EditRow label="Major" value={major || "Not answered yet"} empty={!major}>
              <Dropdown
                value={major}
                onChange={(v) => { setMajor(v); saveField("major", v || null); }}
                options={SBU_MAJORS.map((m) => ({ value: m, label: m }))}
                placeholder="Select your major..."
                searchable
              />
            </EditRow>
            <EditRow label="Graduation Year" value={gradYear ? `Class of ${gradYear}` : "Not answered yet"} empty={!gradYear}>
              <input
                type="number"
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                onBlur={() => saveField("graduation_year", gradYear ? parseInt(gradYear) : null)}
                className="w-full h-[44px] bg-gray-100 rounded-xl px-4 text-[15px] outline-none border border-transparent input-hinge"
                placeholder="2027"
              />
            </EditRow>
            <EditRow label="Residence Hall" value={residenceHall || "Not answered yet"} empty={!residenceHall}>
              <Dropdown
                value={residenceHall}
                onChange={(v) => { setResidenceHall(v); saveField("residence_hall", v || null); }}
                options={Object.entries(RESIDENCE_HALLS).flatMap(([group, halls]) =>
                  halls.map((h) => ({ value: h, label: h, group }))
                )}
                placeholder="Select your dorm..."
                searchable
              />
            </EditRow>
            <EditRow label="Hometown" value={hometown || "Not answered yet"} empty={!hometown}>
              <input
                value={hometown}
                onChange={(e) => setHometown(e.target.value)}
                onBlur={() => saveField("hometown", hometown || null)}
                className="w-full h-[44px] bg-gray-100 rounded-xl px-4 text-[15px] outline-none border border-transparent input-hinge"
                placeholder="New York, NY"
              />
            </EditRow>
            <EditRow label="Height" value={heightDisplay || "Not answered yet"} empty={!heightDisplay}>
              <div className="flex gap-3">
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number"
                    value={heightFeet}
                    onChange={(e) => setHeightFeet(e.target.value)}
                    onBlur={() => {
                      const total = heightFeet && heightInches ? parseInt(heightFeet) * 12 + parseInt(heightInches) : null;
                      saveField("height_inches", total);
                    }}
                    className="w-full h-[44px] bg-gray-100 rounded-xl px-4 text-[15px] outline-none border border-transparent input-hinge"
                    placeholder="5"
                  />
                  <span className="text-gray-400 text-[14px]">ft</span>
                </div>
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number"
                    value={heightInches}
                    onChange={(e) => setHeightInches(e.target.value)}
                    onBlur={() => {
                      const total = heightFeet && heightInches ? parseInt(heightFeet) * 12 + parseInt(heightInches) : null;
                      saveField("height_inches", total);
                    }}
                    className="w-full h-[44px] bg-gray-100 rounded-xl px-4 text-[15px] outline-none border border-transparent input-hinge"
                    placeholder="8"
                  />
                  <span className="text-gray-400 text-[14px]">in</span>
                </div>
              </div>
            </EditRow>
          </div>
        </div>
      ) : (
        /* View tab — see profile as others see it */
        <div className="pb-24">
          <div className="px-4 pt-4 space-y-3">
            {(() => {
              const vitals: { icon: typeof Cake; value: string }[] = [];
              if (profile.age) vitals.push({ icon: Cake, value: String(profile.age) });
              if (profile.gender) vitals.push({ icon: User, value: profile.gender });
              if (heightDisplay) vitals.push({ icon: Ruler, value: heightDisplay });
              return vitals.length > 0 && (
                <div className="bg-[#F8F7F5] rounded-2xl overflow-hidden">
                  <div className="flex items-center">
                    {vitals.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className={`flex items-center gap-2 px-4 py-3.5 flex-shrink-0 ${i < vitals.length - 1 ? "border-r border-gray-200" : ""}`}>
                          <Icon className="w-[18px] h-[18px] text-gray-600" strokeWidth={1.8} />
                          <span className="text-[14px] text-black">{item.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {(() => {
              const details: { icon: typeof Cake; value: string }[] = [];
              if (profile.major) details.push({ icon: GraduationCap, value: profile.major });
              if (profile.residence_hall) details.push({ icon: Building, value: profile.residence_hall });
              if (profile.hometown) details.push({ icon: Home, value: profile.hometown });
              if (profile.graduation_year) details.push({ icon: GraduationCap, value: `Class of ${profile.graduation_year}` });
              return details.length > 0 && (
                <div className="bg-[#F8F7F5] rounded-2xl overflow-hidden">
                  {details.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className={`flex items-center gap-3.5 px-5 py-4 ${i < details.length - 1 ? "border-b border-gray-200" : ""}`}>
                        <Icon className="w-[20px] h-[20px] text-gray-700" strokeWidth={1.8} />
                        <span className="text-[15px] text-black">{item.value}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {profile.photos.map((photo, idx) => (
            <div key={photo.id} className="relative px-3 pt-3">
              {idx === 0 && (
                <div className="absolute bottom-0 left-3 right-3 px-5 pb-5 pt-16 bg-gradient-to-t from-black/50 to-transparent rounded-b-2xl z-10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-white text-[26px] font-medium">{profile.first_name}</span>
                    <span className="text-white/80 text-[24px]">{profile.age}</span>
                  </div>
                  {profile.major && <p className="text-white/70 text-[14px] mt-0.5">{profile.major}</p>}
                </div>
              )}
              <img src={photo.url} alt="" className="w-full aspect-[4/5] object-cover rounded-2xl" draggable={false} />
            </div>
          ))}

          {profile.prompts.map((prompt) => (
            <div key={prompt.id} className="bg-cream mx-3 mt-3 px-5 py-5 rounded-2xl">
              <p className="text-[12px] font-medium text-gray-500 uppercase tracking-[0.1em] mb-1.5">{prompt.question}</p>
              <p className="text-[18px] font-medium text-black leading-[1.4]">{prompt.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Expandable edit row component
function EditRow({ label, value, empty, children }: { label: string; value: string; empty: boolean; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between press text-left"
      >
        <div>
          <p className="text-[15px] text-black font-medium">{label}</p>
          <p className={`text-[13px] mt-0.5 ${empty ? "text-gray-400" : "text-gray-500"}`}>{value}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} strokeWidth={2} />
      </button>
      {expanded && (
        <div className="px-5 pb-4 animate-slide-up" style={{ animationDuration: "0.2s" }}>
          {children}
        </div>
      )}
    </div>
  );
}
