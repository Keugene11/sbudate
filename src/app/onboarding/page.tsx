"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROMPT_OPTIONS, GENDER_OPTIONS, RESIDENCE_HALLS, SBU_MAJORS, DATING_INTENTIONS } from "@/types";
import { ChevronLeft, Plus, X } from "lucide-react";
import Dropdown from "@/components/Dropdown";

type Step = "basics" | "photos" | "prompts" | "intentions" | "preferences";
const STEPS: Step[] = ["basics", "photos", "prompts", "intentions", "preferences"];

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
  const [residenceHall, setResidenceHall] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [prompts, setPrompts] = useState([
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);
  const [genderPreference, setGenderPreference] = useState("");
  const [datingIntention, setDatingIntention] = useState("");

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
        hometown: hometown || null,
        residence_hall: residenceHall || null,
        dating_intention: datingIntention || null,
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
      case "intentions": return true; // Optional step
      case "preferences": return genderPreference;
    }
  };

  const next = () => stepIdx < STEPS.length - 1 ? setStep(STEPS[stepIdx + 1]) : handleSubmit();
  const prev = () => stepIdx > 0 && setStep(STEPS[stepIdx - 1]);

  const inputCls = "w-full h-[50px] bg-gray-50 rounded-xl px-4 text-[15px] outline-none input-hinge border border-transparent transition-colors";

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center px-4 h-[56px] flex-shrink-0">
        {stepIdx > 0 ? (
          <button onClick={prev} className="press p-1.5 -ml-1">
            <ChevronLeft className="w-6 h-6 text-gray-900" strokeWidth={2} />
          </button>
        ) : <div className="w-8" />}
        <div className="flex-1" />
        <span className="text-[13px] text-gray-400 font-medium tabular-nums">{stepIdx + 1} of {STEPS.length}</span>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 px-5 mb-8">
        {STEPS.map((_, i) => (
          <div key={i} className="h-[3px] rounded-full flex-1 bg-gray-200 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ease-out ${
              i <= stepIdx ? "w-full bg-gray-900" : "w-0"
            }`} />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-32" key={step}>
        {step === "basics" && (
          <div className="animate-slide-up">
            <h2 className="text-[28px] font-semibold tracking-tight mb-2">About you</h2>
            <p className="text-gray-400 text-[15px] mb-8">Let&apos;s get to know you</p>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">First name</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} placeholder="First" />
                </div>
                <div>
                  <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">Last name</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} placeholder="Last" />
                </div>
              </div>
              <div>
                <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className={inputCls} placeholder="21" />
              </div>
              <div>
                <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">Gender</label>
                <div className="flex gap-2.5">
                  {GENDER_OPTIONS.map((g) => (
                    <button key={g} onClick={() => setGender(g)}
                      className={`press flex-1 h-[50px] rounded-xl text-[14px] font-semibold transition-all duration-200 ${
                        gender === g ? "bg-gray-900 text-white animate-pill" : "bg-gray-50 text-gray-600 border border-border"
                      }`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">Height</label>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5 flex-1">
                    <input type="number" value={heightFeet} onChange={(e) => setHeightFeet(e.target.value)} className={inputCls} placeholder="5" />
                    <span className="text-gray-400 text-[14px] font-medium">ft</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    <input type="number" value={heightInches} onChange={(e) => setHeightInches(e.target.value)} className={inputCls} placeholder="8" />
                    <span className="text-gray-400 text-[14px] font-medium">in</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">Major</label>
                <Dropdown
                  value={major}
                  onChange={setMajor}
                  options={SBU_MAJORS.map((m) => ({ value: m, label: m }))}
                  placeholder="Select your major..."
                  searchable
                />
              </div>
              <div>
                <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">Graduation year</label>
                <input type="number" value={gradYear} onChange={(e) => setGradYear(e.target.value)} className={inputCls} placeholder="2027" />
              </div>
              <div>
                <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">Hometown</label>
                <input value={hometown} onChange={(e) => setHometown(e.target.value)} className={inputCls} placeholder="New York, NY" />
              </div>
              <div>
                <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">Residence Hall</label>
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
            </div>
          </div>
        )}

        {step === "photos" && (
          <div className="animate-slide-up">
            <h2 className="text-[28px] font-semibold tracking-tight mb-2">Your photos</h2>
            <p className="text-gray-400 text-[15px] mb-8">At least 2, up to 6. Show your personality.</p>
            <div className="grid grid-cols-3 gap-2.5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-square relative">
                  {photos[i] ? (
                    <div className="w-full h-full rounded-xl overflow-hidden animate-scale-in">
                      <img src={photos[i].preview} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/50 glass rounded-full flex items-center justify-center press">
                        <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </button>
                      {i === 0 && (
                        <div className="absolute bottom-2 left-2">
                          <span className="text-[10px] text-white font-semibold bg-black/40 glass px-2 py-0.5 rounded-full uppercase tracking-wide">
                            Main
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="w-full h-full rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors press">
                      <Plus className="w-6 h-6 text-gray-400" strokeWidth={1.8} />
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
            <h2 className="text-[28px] font-semibold tracking-tight mb-2">Your prompts</h2>
            <p className="text-gray-400 text-[15px] mb-8">Answer at least 2. Be creative!</p>
            <div className="space-y-4">
              {prompts.map((prompt, idx) => (
                <div key={idx} className={`${idx % 2 === 0 ? "bg-cream" : "bg-[#EDE8F5]"} rounded-2xl p-5`}>
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
                        className="w-full bg-transparent text-[18px] font-medium text-gray-900 leading-snug outline-none resize-none mt-2 placeholder:text-gray-400 placeholder:text-[14px] placeholder:font-normal" />
                      <div className="flex justify-end">
                        <span className="text-[11px] text-gray-400 tabular-nums">{prompt.answer.length}/225</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "intentions" && (
          <div className="animate-slide-up">
            <h2 className="text-[28px] font-semibold tracking-tight mb-2">Dating goals</h2>
            <p className="text-gray-400 text-[15px] mb-8">What are you looking for? This is optional.</p>
            <div className="space-y-2.5">
              {DATING_INTENTIONS.map((d) => (
                <button key={d} onClick={() => setDatingIntention(datingIntention === d ? "" : d)}
                  className={`press w-full h-[56px] rounded-xl text-[15px] font-semibold text-left px-6 transition-all duration-200 ${
                    datingIntention === d ? "bg-gray-900 text-white animate-pill" : "bg-gray-50 text-gray-700 border border-border"
                  }`}>{d}</button>
              ))}
            </div>
          </div>
        )}

        {step === "preferences" && (
          <div className="animate-slide-up">
            <h2 className="text-[28px] font-semibold tracking-tight mb-2">Show me</h2>
            <p className="text-gray-400 text-[15px] mb-8">Who are you interested in?</p>
            <div className="space-y-2.5">
              {["Women", "Men", "Everyone"].map((p) => (
                <button key={p} onClick={() => setGenderPreference(p)}
                  className={`press w-full h-[56px] rounded-xl text-[15px] font-semibold text-left px-6 transition-all duration-200 ${
                    genderPreference === p ? "bg-gray-900 text-white animate-pill" : "bg-gray-50 text-gray-700 border border-border"
                  }`}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-10 pt-6 bg-gradient-to-t from-surface via-surface to-transparent">
        <div className="max-w-lg mx-auto">
          <button onClick={next} disabled={!canAdvance() || loading}
            className={`press w-full h-[56px] rounded-2xl text-[15px] font-semibold transition-all duration-300 shadow-lg ${
              canAdvance() ? "bg-gray-900 text-white shadow-black/15" : "bg-gray-200 text-gray-400 shadow-transparent"
            }`}>
            {loading ? "Setting up..." : step === "preferences" ? "Get Started" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
