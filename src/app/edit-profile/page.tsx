"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { PROMPT_OPTIONS, GENDER_OPTIONS, RESIDENCE_HALLS, SBU_MAJORS } from "@/types";
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
      await supabase.from("prompts").delete().eq("profile_id", profileId);
      const valid = prompts.filter((p) => p.question && p.answer);
      for (let i = 0; i < valid.length; i++) {
        await supabase.from("prompts").insert({ profile_id: profileId, question: valid[i].question, answer: valid[i].answer, position: i });
      }
      router.push("/profile");
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  if (loading) return <div className="h-[100dvh] flex items-center justify-center bg-surface"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" /></div>;

  const totalPhotos = existingPhotos.length + newPhotos.length;
  const inputCls = "w-full h-[48px] bg-gray-50 rounded-[10px] px-4 text-[15px] text-gray-900 outline-none border border-gray-200 input-focus";
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  return (
    <div className="h-[100dvh] flex flex-col bg-surface">
      {/* Header — Cancel / Title / Done */}
      <div className="flex items-center justify-between px-4 h-[52px] flex-shrink-0" style={{ borderBottom: "1px solid #E0DFDB" }}>
        <button onClick={() => router.push("/profile")} className="press text-[15px] text-gray-400 w-16 text-left">Cancel</button>
        <span className="text-[16px] text-gray-900">Edit Profile</span>
        <button onClick={handleSave} disabled={saving} className="press text-[15px] text-rose disabled:text-gray-300 w-16 text-right">
          {saving ? "Saving" : "Done"}
        </button>
      </div>

      {/* Scrollable content — no bottom nav */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-5 space-y-6 pb-8">

          {/* Photos */}
          <div>
            <p className="text-[13px] text-gray-400 mb-3">Photos</p>
            <div className="grid grid-cols-3 gap-2">
              {existingPhotos.map((photo) => (
                <div key={photo.id} className="aspect-square relative rounded-[10px] overflow-hidden">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeExistingPhoto(photo.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center press">
                    <X className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
              {newPhotos.map((photo, idx) => (
                <div key={`new-${idx}`} className="aspect-square relative rounded-[10px] overflow-hidden">
                  <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setNewPhotos((p) => p.filter((_, i) => i !== idx))}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center press">
                    <X className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
              {totalPhotos < 6 && (
                <label className="aspect-square rounded-[10px] border border-dashed border-gray-300 flex items-center justify-center cursor-pointer press">
                  <Plus className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                  <input type="file" accept="image/*" onChange={handleNewPhoto} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <p className="text-[13px] text-gray-400">Info</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[12px] text-gray-400 mb-1 block">First name</label><input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} /></div>
              <div><label className="text-[12px] text-gray-400 mb-1 block">Last name</label><input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} /></div>
            </div>
            <div><label className="text-[12px] text-gray-400 mb-1 block">Age</label><input type="number" value={age} onChange={(e) => setAge(e.target.value)} className={inputCls} /></div>
            <div>
              <label className="text-[12px] text-gray-400 mb-1 block">Gender</label>
              <div className="flex gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <button key={g} onClick={() => setGender(g)}
                    className={`press flex-1 h-[44px] rounded-[10px] text-[14px] transition-colors duration-100 ${
                      gender === g ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>{g}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12px] text-gray-400 mb-1 block">Show me</label>
              <div className="flex gap-2">
                {["Women", "Men", "Everyone"].map((p) => (
                  <button key={p} onClick={() => setGenderPreference(p)}
                    className={`press flex-1 h-[44px] rounded-[10px] text-[14px] transition-colors duration-100 ${
                      genderPreference === p ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12px] text-gray-400 mb-1 block">Height</label>
              <div className="flex gap-2 items-center">
                <input type="number" value={heightFeet} onChange={(e) => setHeightFeet(e.target.value)} className={inputCls} placeholder="5" />
                <span className="text-gray-400 text-[13px]">ft</span>
                <input type="number" value={heightInches} onChange={(e) => setHeightInches(e.target.value)} className={inputCls} placeholder="8" />
                <span className="text-gray-400 text-[13px]">in</span>
              </div>
            </div>
            <div>
              <label className="text-[12px] text-gray-400 mb-1 block">Major</label>
              <select value={major} onChange={(e) => setMajor(e.target.value)} className={selectCls}>
                <option value="">Select...</option>
                {SBU_MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] text-gray-400 mb-1 block">Graduation year</label>
              <input type="number" value={gradYear} onChange={(e) => setGradYear(e.target.value)} className={inputCls} placeholder="2027" />
            </div>
            <div>
              <label className="text-[12px] text-gray-400 mb-1 block">Residence hall</label>
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
              <label className="text-[12px] text-gray-400 mb-1 block">Hometown</label>
              <input value={hometown} onChange={(e) => setHometown(e.target.value)} className={inputCls} placeholder="New York, NY" />
            </div>
          </div>

          {/* Prompts */}
          <div>
            <p className="text-[13px] text-gray-400 mb-3">Prompts</p>
            <div className="space-y-3">
              {prompts.map((prompt, idx) => (
                <div key={idx} className="bg-gray-50 rounded-[10px] p-4 border border-gray-200">
                  <select value={prompt.question}
                    onChange={(e) => { const u = [...prompts]; u[idx].question = e.target.value; setPrompts(u); }}
                    className="w-full bg-transparent text-[13px] text-gray-400 outline-none appearance-none cursor-pointer mb-2">
                    <option value="">Choose a prompt...</option>
                    {PROMPT_OPTIONS.filter((o) => !prompts.some((p, i) => i !== idx && p.question === o)).map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  {prompt.question && (
                    <textarea value={prompt.answer}
                      onChange={(e) => { const u = [...prompts]; u[idx].answer = e.target.value.slice(0, 225); setPrompts(u); }}
                      placeholder="Your answer..." maxLength={225} rows={3}
                      className="w-full bg-transparent text-[16px] text-gray-900 leading-snug outline-none resize-none placeholder:text-gray-400 placeholder:text-[14px]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
