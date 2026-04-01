"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROMPT_OPTIONS, GENDER_OPTIONS, DATING_INTENTIONS } from "@/types";
import { ChevronLeft, Plus, X, Camera } from "lucide-react";

type Step = "basics" | "photos" | "prompts" | "preferences";
const STEPS: Step[] = ["basics", "photos", "prompts", "preferences"];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("basics");
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [major, setMajor] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [hometown, setHometown] = useState("");
  const [datingIntention, setDatingIntention] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [prompts, setPrompts] = useState([
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);
  const [genderPreference, setGenderPreference] = useState("");

  const stepIdx = STEPS.indexOf(step);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))].slice(0, 6));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const totalInches = heightFeet && heightInches ? parseInt(heightFeet) * 12 + parseInt(heightInches) : null;

      const { data: profile, error } = await supabase.from("profiles").insert({
        user_id: user.id, first_name: firstName, last_name: lastName,
        age: parseInt(age), gender, gender_preference: genderPreference,
        height_inches: totalInches, major: major || null,
        graduation_year: gradYear ? parseInt(gradYear) : null,
        hometown: hometown || null, dating_intention: datingIntention || null,
      }).select().single();
      if (error) throw error;

      for (let i = 0; i < photos.length; i++) {
        const ext = photos[i].file.name.split(".").pop();
        const path = `${user.id}/${profile.id}/${i}.${ext}`;
        await supabase.storage.from("photos").upload(path, photos[i].file);
        const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(path);
        await supabase.from("photos").insert({ profile_id: profile.id, url: publicUrl, position: i });
      }

      const valid = prompts.filter((p) => p.question && p.answer);
      for (let i = 0; i < valid.length; i++) {
        await supabase.from("prompts").insert({ profile_id: profile.id, question: valid[i].question, answer: valid[i].answer, position: i });
      }
      router.push("/discover");
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const canAdvance = () => {
    switch (step) {
      case "basics": return firstName && lastName && age && gender;
      case "photos": return photos.length >= 2;
      case "prompts": return prompts.filter((p) => p.question && p.answer).length >= 2;
      case "preferences": return genderPreference;
    }
  };

  const next = () => stepIdx < STEPS.length - 1 ? setStep(STEPS[stepIdx + 1]) : handleSubmit();
  const prev = () => stepIdx > 0 && setStep(STEPS[stepIdx - 1]);

  const inputCls = "w-full h-[48px] bg-gray-100 rounded-xl px-4 text-[15px] outline-none input-hinge border border-transparent";

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center px-4 h-[52px] flex-shrink-0">
        {stepIdx > 0 ? (
          <button onClick={prev} className="press p-1"><ChevronLeft className="w-6 h-6" strokeWidth={2} /></button>
        ) : <div className="w-8" />}
        <div className="flex-1" />
        <span className="text-[13px] text-gray-400 font-medium">{stepIdx + 1}/{STEPS.length}</span>
      </div>

      {/* Progress */}
      <div className="flex gap-1 px-4 mb-6">
        {STEPS.map((_, i) => (
          <div key={i} className="h-[3px] rounded-full flex-1 bg-gray-200 overflow-hidden">
            <div className={`h-full bg-black rounded-full transition-all duration-500 ${i <= stepIdx ? "w-full" : "w-0"}`} />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32" key={step}>
        {step === "basics" && (
          <div className="animate-slide-up">
            <h2 className="text-[24px] font-bold mb-8">About you</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5 block">First name</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} placeholder="First" />
                </div>
                <div>
                  <label className="text-[12px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5 block">Last name</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} placeholder="Last" />
                </div>
              </div>
              <div>
                <label className="text-[12px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5 block">Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className={inputCls} placeholder="21" />
              </div>
              <div>
                <label className="text-[12px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5 block">Gender</label>
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map((g) => (
                    <button key={g} onClick={() => setGender(g)}
                      className={`press flex-1 h-[48px] rounded-xl text-[14px] font-semibold transition-all duration-200 ${
                        gender === g ? "bg-black text-white animate-pill" : "bg-gray-100 text-gray-700"
                      }`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[12px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5 block">Height</label>
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
                <label className="text-[12px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5 block">Major</label>
                <input value={major} onChange={(e) => setMajor(e.target.value)} className={inputCls} placeholder="Computer Science" />
              </div>
              <div>
                <label className="text-[12px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5 block">Graduation year</label>
                <input type="number" value={gradYear} onChange={(e) => setGradYear(e.target.value)} className={inputCls} placeholder="2027" />
              </div>
              <div>
                <label className="text-[12px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5 block">Hometown</label>
                <input value={hometown} onChange={(e) => setHometown(e.target.value)} className={inputCls} placeholder="New York, NY" />
              </div>
              <div>
                <label className="text-[12px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5 block">Dating intention</label>
                <div className="flex flex-wrap gap-2">
                  {DATING_INTENTIONS.map((d) => (
                    <button key={d} onClick={() => setDatingIntention(d)}
                      className={`press px-4 h-[40px] rounded-full text-[13px] font-semibold transition-all duration-200 ${
                        datingIntention === d ? "bg-black text-white animate-pill" : "bg-gray-100 text-gray-700"
                      }`}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "photos" && (
          <div className="animate-slide-up">
            <h2 className="text-[24px] font-bold mb-1">Your photos</h2>
            <p className="text-gray-500 text-[14px] mb-6">At least 2, up to 6.</p>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-[3/4] relative">
                  {photos[i] ? (
                    <div className="w-full h-full rounded-xl overflow-hidden animate-fade-in">
                      <img src={photos[i].preview} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-full rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors active:scale-95 transition-transform duration-150">
                      <Plus className="w-6 h-6 text-gray-400" strokeWidth={2} />
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "prompts" && (
          <div className="animate-slide-up">
            <h2 className="text-[24px] font-bold mb-1">Your prompts</h2>
            <p className="text-gray-500 text-[14px] mb-6">Answer at least 2.</p>
            <div className="space-y-4">
              {prompts.map((prompt, idx) => (
                <div key={idx} className="bg-cream rounded-xl p-4">
                  <select value={prompt.question}
                    onChange={(e) => { const u = [...prompts]; u[idx].question = e.target.value; setPrompts(u); }}
                    className="w-full bg-transparent text-[13px] font-semibold text-gray-600 uppercase tracking-wide outline-none mb-2 appearance-none cursor-pointer">
                    <option value="">Choose a prompt...</option>
                    {PROMPT_OPTIONS.filter((o) => !prompts.some((p, i) => i !== idx && p.question === o)).map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  {prompt.question && (
                    <>
                      <textarea value={prompt.answer}
                        onChange={(e) => { const u = [...prompts]; u[idx].answer = e.target.value.slice(0, 225); setPrompts(u); }}
                        placeholder="Your answer..." maxLength={225} rows={3}
                        className="w-full bg-transparent font-serif text-[18px] font-bold text-black leading-snug outline-none resize-none placeholder:text-gray-400 placeholder:font-sans placeholder:text-[14px] placeholder:font-normal" />
                      <p className="text-[11px] text-gray-400 text-right">{prompt.answer.length}/225</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "preferences" && (
          <div className="animate-slide-up">
            <h2 className="text-[24px] font-bold mb-1">Show me</h2>
            <p className="text-gray-500 text-[14px] mb-6">Who are you interested in?</p>
            <div className="space-y-2">
              {["Women", "Men", "Everyone"].map((p) => (
                <button key={p} onClick={() => setGenderPreference(p)}
                  className={`press w-full h-[52px] rounded-xl text-[15px] font-semibold text-left px-5 transition-all duration-200 ${
                    genderPreference === p ? "bg-black text-white animate-pill" : "bg-gray-100 text-black"
                  }`}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-lg mx-auto">
          <button onClick={next} disabled={!canAdvance() || loading}
            className={`press w-full h-[52px] rounded-full text-[16px] font-semibold transition-all duration-300 ${
              canAdvance() ? "bg-black text-white" : "bg-gray-200 text-gray-400"
            }`}>
            {loading ? "Setting up..." : step === "preferences" ? "Start" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
