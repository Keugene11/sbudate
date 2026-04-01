"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, X, ChevronRight } from "lucide-react";
import { GENDER_OPTIONS, RESIDENCE_HALLS, SBU_MAJORS } from "@/types";
import type { Photo } from "@/types";

export default function EditProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [major, setMajor] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [hometown, setHometown] = useState("");
  const [residenceHall, setResidenceHall] = useState("");
  const [genderPreference, setGenderPreference] = useState("");
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [newPhotos, setNewPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [prompts, setPrompts] = useState<{ id?: string; question: string; answer: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (!p) return;
      setProfileId(p.id);
      setFirstName(p.first_name); setLastName(p.last_name); setAge(String(p.age));
      setGender(p.gender); setGenderPreference(p.gender_preference);
      if (p.height_inches) { setHeightFeet(String(Math.floor(p.height_inches / 12))); setHeightInches(String(p.height_inches % 12)); }
      setMajor(p.major || ""); setGradYear(p.graduation_year ? String(p.graduation_year) : "");
      setHometown(p.hometown || ""); setResidenceHall(p.residence_hall || "");
      const { data: photos } = await supabase.from("photos").select("*").eq("profile_id", p.id).order("position");
      setExistingPhotos(photos || []);
      const { data: promptData } = await supabase.from("prompts").select("*").eq("profile_id", p.id).order("position");
      const existing = (promptData || []).map((pr: { id: string; question: string; answer: string }) => ({ id: pr.id, question: pr.question, answer: pr.answer }));
      while (existing.length < 3) existing.push({ id: undefined as unknown as string, question: "", answer: "" });
      setPrompts(existing);
      setLoading(false);
    })();
  }, [supabase]);

  const removeExistingPhoto = async (photoId: string) => {
    await supabase.from("photos").delete().eq("id", photoId);
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleNewPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowed = Math.max(0, 6 - existingPhotos.length - newPhotos.length);
    setNewPhotos((prev) => [...prev, ...files.slice(0, allowed).map((f) => ({ file: f, preview: URL.createObjectURL(f) }))]);
  };

  const handleSave = async () => {
    if (!profileId || !userId) return;
    setSaving(true);
    try {
      const totalInches = heightFeet && heightInches ? parseInt(heightFeet) * 12 + parseInt(heightInches) : null;
      await supabase.from("profiles").update({
        first_name: firstName, last_name: lastName, age: parseInt(age), gender,
        gender_preference: genderPreference, height_inches: totalInches, major: major || null,
        graduation_year: gradYear ? parseInt(gradYear) : null, hometown: hometown || null,
        residence_hall: residenceHall || null,
      }).eq("id", profileId);
      for (let i = 0; i < newPhotos.length; i++) {
        const ext = newPhotos[i].file.name.split(".").pop();
        const path = `${userId}/${profileId}/${Date.now()}_${i}.${ext}`;
        await supabase.storage.from("photos").upload(path, newPhotos[i].file);
        const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(path);
        await supabase.from("photos").insert({ profile_id: profileId, url: publicUrl, position: existingPhotos.length + i });
      }
      router.push("/profile");
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="h-[100dvh] flex items-center justify-center bg-surface">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );

  const totalPhotos = existingPhotos.length + newPhotos.length;
  const inputCls = "w-full h-[48px] bg-gray-50 rounded-xl px-4 text-[15px] text-gray-900 outline-none border border-border input-hinge transition-colors";
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  return (
    <div className="h-[100dvh] flex flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[56px] flex-shrink-0 border-b border-border">
        <button onClick={() => router.push("/profile")} className="press text-[15px] text-gray-400 font-medium w-16 text-left">
          Cancel
        </button>
        <span className="text-[16px] text-gray-900 font-semibold">Edit Profile</span>
        <button onClick={handleSave} disabled={saving}
          className="press text-[15px] text-rose font-semibold disabled:text-gray-300 w-16 text-right">
          {saving ? "Saving" : "Done"}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-6 space-y-7 pb-10">

          {/* Photos */}
          <div>
            <p className="text-[12px] text-gray-400 uppercase tracking-[0.08em] font-medium mb-3">Photos</p>
            <div className="grid grid-cols-3 gap-2.5">
              {existingPhotos.map((photo) => (
                <div key={photo.id} className="aspect-[3/4] relative rounded-xl overflow-hidden">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeExistingPhoto(photo.id)}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 glass rounded-full flex items-center justify-center press">
                    <X className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
              {newPhotos.map((photo, idx) => (
                <div key={`new-${idx}`} className="aspect-[3/4] relative rounded-xl overflow-hidden">
                  <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setNewPhotos((p) => p.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 glass rounded-full flex items-center justify-center press">
                    <X className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
              {totalPhotos < 6 && (
                <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer press hover:border-gray-400 transition-colors">
                  <Plus className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
                  <input type="file" accept="image/*" onChange={handleNewPhoto} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-4">
            <p className="text-[12px] text-gray-400 uppercase tracking-[0.08em] font-medium">Info</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[12px] text-gray-500 font-medium mb-1.5 block">First name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-[12px] text-gray-500 font-medium mb-1.5 block">Last name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-[12px] text-gray-500 font-medium mb-1.5 block">Age</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[12px] text-gray-500 font-medium mb-1.5 block">Gender</label>
              <div className="flex gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <button key={g} onClick={() => setGender(g)}
                    className={`press flex-1 h-[46px] rounded-xl text-[14px] font-medium transition-all duration-200 ${
                      gender === g ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-500 border border-border"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12px] text-gray-500 font-medium mb-1.5 block">Show me</label>
              <div className="flex gap-2">
                {["Women", "Men", "Everyone"].map((p) => (
                  <button key={p} onClick={() => setGenderPreference(p)}
                    className={`press flex-1 h-[46px] rounded-xl text-[14px] font-medium transition-all duration-200 ${
                      genderPreference === p ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-500 border border-border"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12px] text-gray-500 font-medium mb-1.5 block">Height</label>
              <div className="flex gap-2.5 items-center">
                <input type="number" value={heightFeet} onChange={(e) => setHeightFeet(e.target.value)} className={inputCls} placeholder="5" />
                <span className="text-gray-400 text-[13px] font-medium">ft</span>
                <input type="number" value={heightInches} onChange={(e) => setHeightInches(e.target.value)} className={inputCls} placeholder="8" />
                <span className="text-gray-400 text-[13px] font-medium">in</span>
              </div>
            </div>
            <div>
              <label className="text-[12px] text-gray-500 font-medium mb-1.5 block">Major</label>
              <select value={major} onChange={(e) => setMajor(e.target.value)} className={selectCls}>
                <option value="">Select...</option>
                {SBU_MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] text-gray-500 font-medium mb-1.5 block">Graduation year</label>
              <input type="number" value={gradYear} onChange={(e) => setGradYear(e.target.value)} className={inputCls} placeholder="2027" />
            </div>
            <div>
              <label className="text-[12px] text-gray-500 font-medium mb-1.5 block">Residence hall</label>
              <select value={residenceHall} onChange={(e) => setResidenceHall(e.target.value)} className={selectCls}>
                <option value="">Select...</option>
                {Object.entries(RESIDENCE_HALLS).map(([group, halls]) => (
                  <optgroup key={group} label={group}>
                    {halls.map((h) => <option key={h} value={h}>{h}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[12px] text-gray-500 font-medium mb-1.5 block">Hometown</label>
              <input value={hometown} onChange={(e) => setHometown(e.target.value)} className={inputCls} placeholder="New York, NY" />
            </div>
          </div>

          {/* Prompts */}
          <div>
            <p className="text-[12px] text-gray-400 uppercase tracking-[0.08em] font-medium mb-3">Prompts</p>
            <div className="space-y-2.5">
              {[0, 1, 2].map((idx) => {
                const prompt = prompts[idx];
                return (
                  <button key={idx} onClick={() => router.push(`/edit-prompt?index=${idx}`)}
                    className="w-full text-left bg-gray-50 border border-border rounded-xl px-5 py-4 flex items-center justify-between press hover:bg-gray-100 transition-colors">
                    {prompt?.question ? (
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-[12px] text-gray-400 font-medium">{prompt.question}</p>
                        <p className="text-[15px] text-gray-900 mt-0.5 line-clamp-2 font-medium">{prompt.answer}</p>
                      </div>
                    ) : (
                      <p className="text-[15px] text-gray-400">Add a prompt...</p>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" strokeWidth={2} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
