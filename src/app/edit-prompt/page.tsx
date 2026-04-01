"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Pencil, X as XIcon, Search } from "lucide-react";
import { PROMPT_OPTIONS } from "@/types";
import { Suspense } from "react";

function EditPromptInner() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const promptIndex = parseInt(searchParams.get("index") || "0");
  const [step, setStep] = useState<"pick" | "write">("pick");
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [existingPromptId, setExistingPromptId] = useState<string | null>(null);
  const [usedQuestions, setUsedQuestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      if (!profile) return;
      setProfileId(profile.id);

      const { data: prompts } = await supabase.from("prompts").select("*").eq("profile_id", profile.id).order("position");
      if (prompts) {
        setUsedQuestions(prompts.filter((_, i) => i !== promptIndex).map((p) => p.question));
        if (prompts[promptIndex]) {
          setSelectedQuestion(prompts[promptIndex].question);
          setAnswer(prompts[promptIndex].answer);
          setExistingPromptId(prompts[promptIndex].id);
          setStep("write");
        }
      }
    })();
  }, [supabase, promptIndex]);

  const pickQuestion = (q: string) => {
    setSelectedQuestion(q);
    setAnswer("");
    setStep("write");
  };

  const handleDone = async () => {
    if (!profileId || !selectedQuestion || !answer.trim()) return;
    setSaving(true);
    if (existingPromptId) {
      await supabase.from("prompts").update({ question: selectedQuestion, answer: answer.trim() }).eq("id", existingPromptId);
    } else {
      await supabase.from("prompts").insert({ profile_id: profileId, question: selectedQuestion, answer: answer.trim(), position: promptIndex });
    }
    router.push("/edit-profile");
  };

  const handleDelete = async () => {
    if (existingPromptId) {
      await supabase.from("prompts").delete().eq("id", existingPromptId);
    }
    router.push("/edit-profile");
  };

  const available = PROMPT_OPTIONS.filter((o) => !usedQuestions.includes(o));
  const filteredPrompts = searchQuery
    ? available.filter((q) => q.toLowerCase().includes(searchQuery.toLowerCase()))
    : available;

  if (step === "write") {
    return (
      <div className="h-[100dvh] flex flex-col bg-surface">
        <div className="flex items-center justify-between px-4 h-[56px] flex-shrink-0 border-b border-border">
          <button onClick={() => existingPromptId ? router.push("/edit-profile") : setStep("pick")} className="press p-1.5 -ml-1">
            <ChevronLeft className="w-6 h-6 text-gray-900" strokeWidth={2} />
          </button>
          <span className="text-[16px] text-gray-900 font-semibold">Write Answer</span>
          <button onClick={handleDone} disabled={!answer.trim() || saving}
            className="press text-[15px] text-rose font-semibold disabled:text-gray-300">
            {saving ? "Saving" : "Done"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {/* Selected prompt question */}
          <button
            onClick={() => setStep("pick")}
            className="w-full flex items-center justify-between bg-cream rounded-2xl px-5 py-4 mb-5 press text-left"
          >
            <p className="text-[15px] text-gray-900 font-medium flex-1">{selectedQuestion}</p>
            <Pencil className="w-4 h-4 text-gray-400 flex-shrink-0 ml-3" strokeWidth={1.8} />
          </button>

          {/* Answer */}
          <div className="bg-gray-50 border border-border rounded-2xl px-5 py-5 relative">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value.slice(0, 225))}
              placeholder="Write your answer..."
              rows={5}
              className="w-full bg-transparent text-[17px] text-gray-900 leading-relaxed outline-none resize-none placeholder:text-gray-400 font-medium"
              autoFocus
            />
            {answer && (
              <button onClick={() => setAnswer("")} className="absolute top-4 right-4 press p-1">
                <XIcon className="w-4 h-4 text-gray-300" strokeWidth={2} />
              </button>
            )}
          </div>
          <p className="text-[12px] text-gray-400 mt-2.5 text-right tabular-nums">{answer.length}/225</p>

          {existingPromptId && (
            <button onClick={handleDelete} className="press mt-10 text-[14px] text-red-400 font-medium">
              Remove this prompt
            </button>
          )}
        </div>
      </div>
    );
  }

  // Prompt picker
  return (
    <div className="h-[100dvh] flex flex-col bg-surface">
      <div className="flex items-center justify-between px-4 h-[56px] flex-shrink-0 border-b border-border">
        <button onClick={() => router.push("/edit-profile")} className="press p-1.5 -ml-1">
          <ChevronLeft className="w-6 h-6 text-gray-900" strokeWidth={2} />
        </button>
        <span className="text-[16px] text-gray-900 font-semibold">Choose a Prompt</span>
        <div className="w-8" />
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-4 h-[44px]">
          <Search className="w-4 h-4 text-gray-400" strokeWidth={2} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts..."
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredPrompts.length === 0 && (
          <p className="text-center text-gray-400 text-[14px] py-12">No matching prompts</p>
        )}
        {filteredPrompts.map((q, i) => (
          <button key={q} onClick={() => pickQuestion(q)}
            className={`w-full text-left px-5 py-4 press hover:bg-gray-50 transition-colors ${
              i < filteredPrompts.length - 1 ? "border-b border-border" : ""
            }`}>
            <p className="text-[15px] text-gray-900">{q}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EditPromptPage() {
  return (
    <Suspense fallback={
      <div className="h-[100dvh] flex items-center justify-center bg-surface">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <EditPromptInner />
    </Suspense>
  );
}
