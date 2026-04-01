"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROMPT_OPTIONS, GENDER_OPTIONS, DATING_INTENTIONS } from "@/types";
import { ChevronLeft, Plus, X, Camera } from "lucide-react";

type Step = "basics" | "photos" | "prompts" | "preferences";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("basics");
  const [loading, setLoading] = useState(false);

  // Basics
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

  // Photos
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);

  // Prompts
  const [prompts, setPrompts] = useState<{ question: string; answer: string }[]>([
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);

  // Preferences
  const [genderPreference, setGenderPreference] = useState("");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 6));
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const totalInches = heightFeet && heightInches
        ? parseInt(heightFeet) * 12 + parseInt(heightInches)
        : null;

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          age: parseInt(age),
          gender,
          gender_preference: genderPreference,
          height_inches: totalInches,
          major: major || null,
          graduation_year: gradYear ? parseInt(gradYear) : null,
          hometown: hometown || null,
          dating_intention: datingIntention || null,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Upload photos
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const fileExt = photo.file.name.split(".").pop();
        const filePath = `${user.id}/${profile.id}/${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(filePath, photo.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("photos")
          .getPublicUrl(filePath);

        await supabase.from("photos").insert({
          profile_id: profile.id,
          url: publicUrl,
          position: i,
        });
      }

      // Save prompts
      const validPrompts = prompts.filter((p) => p.question && p.answer);
      for (let i = 0; i < validPrompts.length; i++) {
        await supabase.from("prompts").insert({
          profile_id: profile.id,
          question: validPrompts[i].question,
          answer: validPrompts[i].answer,
          position: i,
        });
      }

      router.push("/discover");
    } catch (err) {
      console.error("Onboarding error:", err);
    } finally {
      setLoading(false);
    }
  };

  const canAdvance = () => {
    switch (step) {
      case "basics": return firstName && lastName && age && gender;
      case "photos": return photos.length >= 2;
      case "prompts": return prompts.filter((p) => p.question && p.answer).length >= 2;
      case "preferences": return genderPreference;
    }
  };

  const nextStep = () => {
    const steps: Step[] = ["basics", "photos", "prompts", "preferences"];
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
    else handleSubmit();
  };

  const prevStep = () => {
    const steps: Step[] = ["basics", "photos", "prompts", "preferences"];
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  };

  const stepIndex = ["basics", "photos", "prompts", "preferences"].indexOf(step);

  return (
    <div className="min-h-screen bg-hinge-white flex flex-col">
      {/* Header */}
      <div className="flex items-center px-5 pt-4 pb-2">
        {stepIndex > 0 && (
          <button onClick={prevStep} className="press p-1">
            <ChevronLeft className="w-6 h-6 text-hinge-black" />
          </button>
        )}
        <div className="flex-1" />
        <span className="text-[13px] text-dove font-medium">
          {stepIndex + 1} of 4
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 px-5 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-1 rounded-full flex-1 bg-border overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                i < stepIndex ? "w-full bg-hinge-black"
                : i === stepIndex ? "w-full bg-hinge-black animate-bar-fill"
                : "w-0 bg-hinge-black"
              }`}
            />
          </div>
        ))}
      </div>

      <div className="flex-1 px-5 pb-32 max-w-md mx-auto w-full animate-page-in" key={step}>
        {step === "basics" && (
          <div className="stagger">
            <h2 className="font-serif text-[28px] font-semibold tracking-tight mb-8">
              Let&apos;s get to know you
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-dove font-semibold mb-1.5 block">First name</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-[14px] outline-none input-hinge"
                    placeholder="First"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-dove font-semibold mb-1.5 block">Last name</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-[14px] outline-none input-hinge"
                    placeholder="Last"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-dove font-semibold mb-1.5 block">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-[14px] outline-none input-hinge"
                  placeholder="21"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-dove font-semibold mb-1.5 block">Gender</label>
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`press flex-1 py-3 rounded-xl text-[14px] font-medium border transition-all duration-250 ${
                        gender === g
                          ? "bg-hinge-black text-white border-hinge-black animate-pill-select"
                          : "bg-bg-input border-border text-stone"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-dove font-semibold mb-1.5 block">Height</label>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="number"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-[14px] outline-none input-hinge"
                      placeholder="5"
                    />
                    <span className="text-dove text-[14px]">ft</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="number"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-[14px] outline-none input-hinge"
                      placeholder="8"
                    />
                    <span className="text-dove text-[14px]">in</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-dove font-semibold mb-1.5 block">Major</label>
                <input
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-[14px] outline-none input-hinge"
                  placeholder="Computer Science"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-dove font-semibold mb-1.5 block">Graduation Year</label>
                <input
                  type="number"
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-[14px] outline-none input-hinge"
                  placeholder="2027"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-dove font-semibold mb-1.5 block">Hometown</label>
                <input
                  value={hometown}
                  onChange={(e) => setHometown(e.target.value)}
                  className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-[14px] outline-none input-hinge"
                  placeholder="New York, NY"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-dove font-semibold mb-1.5 block">Dating Intention</label>
                <div className="flex flex-wrap gap-2">
                  {DATING_INTENTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDatingIntention(d)}
                      className={`press px-4 py-2.5 rounded-full text-[13px] font-medium border transition-all duration-250 ${
                        datingIntention === d
                          ? "bg-hinge-black text-white border-hinge-black animate-pill-select"
                          : "bg-bg-input border-border text-stone"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "photos" && (
          <div>
            <h2 className="font-serif text-[28px] font-semibold tracking-tight mb-2">
              Add your photos
            </h2>
            <p className="text-dove text-[14px] mb-8">
              Add at least 2 photos to continue (up to 6).
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-[3/4] relative">
                  {photos[i] ? (
                    <div className="relative w-full h-full rounded-2xl overflow-hidden animate-fade-in">
                      <img
                        src={photos[i].preview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-2 right-2 w-7 h-7 bg-hinge-black/70 rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-full rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-dove transition-all duration-250 hover:scale-[1.02] active:scale-[0.97]">
                      {i === 0 ? (
                        <Camera className="w-6 h-6 text-dove" />
                      ) : (
                        <Plus className="w-6 h-6 text-dove" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "prompts" && (
          <div>
            <h2 className="font-serif text-[28px] font-semibold tracking-tight mb-2">
              Your prompts
            </h2>
            <p className="text-dove text-[14px] mb-8">
              Answer at least 2 prompts. This is what people will see.
            </p>

            <div className="space-y-6">
              {prompts.map((prompt, idx) => (
                <div key={idx} className="bg-bg-card border border-border rounded-2xl p-5 animate-prompt-in card-lift" style={{ animationDelay: `${idx * 80}ms` }}>
                  <label className="text-[11px] uppercase tracking-wider text-dove font-semibold mb-2 block">
                    Prompt {idx + 1}
                  </label>
                  <select
                    value={prompt.question}
                    onChange={(e) => {
                      const updated = [...prompts];
                      updated[idx].question = e.target.value;
                      setPrompts(updated);
                    }}
                    className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-[14px] outline-none input-hinge mb-3 appearance-none"
                  >
                    <option value="">Choose a prompt...</option>
                    {PROMPT_OPTIONS.filter(
                      (o) => !prompts.some((p, i) => i !== idx && p.question === o)
                    ).map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  {prompt.question && (
                    <textarea
                      value={prompt.answer}
                      onChange={(e) => {
                        const updated = [...prompts];
                        updated[idx].answer = e.target.value.slice(0, 225);
                        setPrompts(updated);
                      }}
                      placeholder="Your answer..."
                      maxLength={225}
                      rows={3}
                      className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-[14px] outline-none input-hinge resize-none"
                    />
                  )}
                  {prompt.answer && (
                    <p className="text-[11px] text-dove mt-1 text-right">
                      {prompt.answer.length}/225
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "preferences" && (
          <div>
            <h2 className="font-serif text-[28px] font-semibold tracking-tight mb-2">
              Who are you looking for?
            </h2>
            <p className="text-dove text-[14px] mb-8">
              Show me...
            </p>

            <div className="space-y-3">
              {["Women", "Men", "Everyone"].map((pref) => (
                <button
                  key={pref}
                  onClick={() => setGenderPreference(pref)}
                  className={`press w-full py-4 rounded-2xl text-[15px] font-medium border transition-all duration-250 text-left px-5 ${
                    genderPreference === pref
                      ? "bg-hinge-black text-white border-hinge-black animate-pill-select"
                      : "bg-bg-card border-border text-hinge-black"
                  }`}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-hinge-white via-hinge-white to-transparent">
        <div className="max-w-md mx-auto">
          <button
            onClick={nextStep}
            disabled={!canAdvance() || loading}
            className={`press w-full py-4 rounded-2xl text-[15px] font-semibold tracking-wide transition-all duration-400 ${
              canAdvance()
                ? "bg-hinge-black text-white shadow-lg shadow-black/10"
                : "bg-border text-dove"
            }`}
          >
            {loading
              ? "Setting up your profile..."
              : step === "preferences"
              ? "Start Discovering"
              : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
