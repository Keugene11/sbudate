"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, X, Check } from "lucide-react";
import { PROMPT_OPTIONS, GENDER_OPTIONS, RESIDENCE_HALLS, SBU_MAJORS } from "@/types";
import Dropdown from "@/components/Dropdown";
import type { Profile, Photo, Prompt } from "@/types";

export default function EditProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fields
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

  // Photos & prompts
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [newPhotos, setNewPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [prompts, setPrompts] = useState<{ id?: string; question: string; answer: string }[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (!p) return;
      setProfileId(p.id);
      setFirstName(p.first_name);
      setLastName(p.last_name);
      setAge(String(p.age));
      setGender(p.gender);
      setGenderPreference(p.gender_preference);
      if (p.height_inches) {
        setHeightFeet(String(Math.floor(p.height_inches / 12)));
        setHeightInches(String(p.height_inches % 12));
      }
      setMajor(p.major || "");
      setGradYear(p.graduation_year ? String(p.graduation_year) : "");
      setHometown(p.hometown || "");
      setResidenceHall(p.residence_hall || "");

      const { data: photos } = await supabase.from("photos").select("*").eq("profile_id", p.id).order("position");
      setExistingPhotos(photos || []);

      const { data: promptData } = await supabase.from("prompts").select("*").eq("profile_id", p.id).order("position");
      const existing = (promptData || []).map((pr) => ({ id: pr.id, question: pr.question, answer: pr.answer }));
      while (existing.length < 3) existing.push({ id: undefined, question: "", answer: "" });
      setPrompts(existing);

      setLoading(false);
    };
    fetch();
  }, [supabase]);

  const removeExistingPhoto = async (photoId: string) => {
    await supabase.from("photos").delete().eq("id", photoId);
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleNewPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = existingPhotos.length + newPhotos.length;
    const allowed = Math.max(0, 6 - total);
    setNewPhotos((prev) => [...prev, ...files.slice(0, allowed).map((f) => ({ file: f, preview: URL.createObjectURL(f) }))]);
  };

  const removeNewPhoto = (idx: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!profileId || !userId) return;
    setSaving(true);

    try {
      const totalInches = heightFeet && heightInches ? parseInt(heightFeet) * 12 + parseInt(heightInches) : null;

      await supabase.from("profiles").update({
        first_name: firstName,
        last_name: lastName,
        age: parseInt(age),
        gender,
        gender_preference: genderPreference,
        height_inches: totalInches,
        major: major || null,
        graduation_year: gradYear ? parseInt(gradYear) : null,
        hometown: hometown || null,
        residence_hall: residenceHall || null,
      }).eq("id", profileId);

      // Upload new photos
      const startPos = existingPhotos.length;
      for (let i = 0; i < newPhotos.length; i++) {
        const ext = newPhotos[i].file.name.split(".").pop();
        const path = `${userId}/${profileId}/${Date.now()}_${i}.${ext}`;
        await supabase.storage.from("photos").upload(path, newPhotos[i].file);
        const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(path);
        await supabase.from("photos").insert({ profile_id: profileId, url: publicUrl, position: startPos + i });
      }

      // Update prompts — delete all existing and re-insert
      await supabase.from("prompts").delete().eq("profile_id", profileId);
      const valid = prompts.filter((p) => p.question && p.answer);
      for (let i = 0; i < valid.length; i++) {
        await supabase.from("prompts").insert({
          profile_id: profileId,
          question: valid[i].question,
          answer: valid[i].answer,
          position: i,
        });
      }

      router.push("/profile");
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full h-[48px] bg-gray-100 rounded-xl px-4 text-[15px] outline-none input-hinge border border-transparent";

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" /></div>;

  const totalPhotos = existingPhotos.length + newPhotos.length;

  return (
    <div className="max-w-lg mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-[52px]">
          <button onClick={() => router.push("/profile")} className="press p-1">
            <ChevronLeft className="w-6 h-6" strokeWidth={2} />
          </button>
          <h1 className="text-[16px] font-medium">Edit Profile</h1>
          <button onClick={handleSave} disabled={saving} className="press p-1">
            <Check className={`w-6 h-6 ${saving ? "text-gray-300" : "text-black"}`} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="px-5 py-6 pb-32 space-y-6">
        {/* Photos */}
        <div>
          <p className="text-[12px] text-gray-500 font-medium uppercase tracking-[0.1em] mb-3">Photos</p>
          <div className="grid grid-cols-3 gap-2">
            {existingPhotos.map((photo) => (
              <div key={photo.id} className="aspect-[3/4] relative rounded-xl overflow-hidden">
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeExistingPhoto(photo.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </button>
              </div>
            ))}
            {newPhotos.map((photo, idx) => (
              <div key={`new-${idx}`} className="aspect-[3/4] relative rounded-xl overflow-hidden animate-fade-in">
                <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeNewPhoto(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </button>
              </div>
            ))}
            {totalPhotos < 6 && (
              <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors active:scale-95 transition-transform duration-150">
                <Plus className="w-6 h-6 text-gray-400" strokeWidth={2} />
                <input type="file" accept="image/*" onChange={handleNewPhoto} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="space-y-4">
          <p className="text-[12px] text-gray-500 font-medium uppercase tracking-[0.1em]">Basic info</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1 block">First name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1 block">Last name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1 block">Age</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1 block">Gender</label>
            <div className="flex gap-2">
              {GENDER_OPTIONS.map((g) => (
                <button key={g} onClick={() => setGender(g)}
                  className={`press flex-1 h-[48px] rounded-xl text-[14px] font-medium transition-all duration-200 ${
                    gender === g ? "bg-black text-white" : "bg-gray-100 text-gray-700"
                  }`}>{g}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1 block">Show me</label>
            <div className="flex gap-2">
              {["Women", "Men", "Everyone"].map((p) => (
                <button key={p} onClick={() => setGenderPreference(p)}
                  className={`press flex-1 h-[48px] rounded-xl text-[14px] font-medium transition-all duration-200 ${
                    genderPreference === p ? "bg-black text-white" : "bg-gray-100 text-gray-700"
                  }`}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1 block">Height</label>
            <div className="flex gap-3">
              <div className="flex items-center gap-1 flex-1">
                <input type="number" value={heightFeet} onChange={(e) => setHeightFeet(e.target.value)} className={inputCls} placeholder="5" />
                <span className="text-gray-400 text-[14px]">ft</span>
              </div>
              <div className="flex items-center gap-1 flex-1">
                <input type="number" value={heightInches} onChange={(e) => setHeightInches(e.target.value)} className={inputCls} placeholder="8" />
                <span className="text-gray-400 text-[14px]">in</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1 block">Major</label>
            <Dropdown
              value={major}
              onChange={setMajor}
              options={SBU_MAJORS.map((m) => ({ value: m, label: m }))}
              placeholder="Select your major..."
              searchable
            />
          </div>
          <div>
            <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1 block">Graduation year</label>
            <input type="number" value={gradYear} onChange={(e) => setGradYear(e.target.value)} className={inputCls} placeholder="2027" />
          </div>
          <div>
            <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1 block">Residence hall</label>
            <Dropdown
              value={residenceHall}
              onChange={setResidenceHall}
              options={Object.entries(RESIDENCE_HALLS).flatMap(([group, halls]) =>
                halls.map((h) => ({ value: h, label: h, group }))
              )}
              placeholder="Select your dorm..."
              searchable
            />
          </div>
          <div>
            <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1 block">Hometown</label>
            <input value={hometown} onChange={(e) => setHometown(e.target.value)} className={inputCls} placeholder="New York, NY" />
          </div>
        </div>

        {/* Prompts */}
        <div>
          <p className="text-[12px] text-gray-500 font-medium uppercase tracking-[0.1em] mb-3">Prompts</p>
          <div className="space-y-4">
            {prompts.map((prompt, idx) => (
              <div key={idx} className="bg-cream rounded-xl p-4">
                <Dropdown
                  value={prompt.question}
                  onChange={(v) => { const u = [...prompts]; u[idx].question = v; setPrompts(u); }}
                  options={PROMPT_OPTIONS.filter((o) => !prompts.some((p, i) => i !== idx && p.question === o)).map((o) => ({ value: o, label: o }))}
                  placeholder="Choose a prompt..."
                />
                {prompt.question && (
                  <>
                    <textarea value={prompt.answer}
                      onChange={(e) => { const u = [...prompts]; u[idx].answer = e.target.value.slice(0, 225); setPrompts(u); }}
                      placeholder="Your answer..." maxLength={225} rows={3}
                      className="w-full bg-transparent text-[18px] font-medium text-black leading-snug outline-none resize-none placeholder:text-gray-400 placeholder:text-[14px] placeholder:font-normal" />
                    <p className="text-[11px] text-gray-400 text-right">{prompt.answer.length}/225</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-lg mx-auto">
          <button onClick={handleSave} disabled={saving}
            className="press w-full h-[52px] rounded-full bg-black text-white text-[14px] font-medium uppercase tracking-[0.08em] disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
