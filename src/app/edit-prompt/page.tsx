"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Pencil, X as XIcon } from "lucide-react";
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

  if (step === "write") {
    return (
      <div className="h-[100dvh] flex flex-col bg-surface">
        <div className="flex items-center justify-between px-4 h-[52px] flex-shrink-0" style={{ borderBottom: "1px solid #E0DFDB" }}>
          <button onClick={() => existingPromptId ? router.push("/edit-profile") : setStep("pick")} className="press p-1">
            <ChevronLeft className="w-6 h-6 text-gray-900" strokeWidth={1.8} />
          </button>
          <span className="text-[16px] text-gray-900">Write answer</span>
          <button onClick={handleDone} disabled={!answer.trim() || saving}
            className="press text-[15px] text-rose disabled:text-gray-300">Done</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Prompt question with edit icon */}
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-[12px] px-4 py-4 mb-4">
            <p className="text-[15px] text-gray-900 flex-1">{selectedQuestion}</p>
            <button onClick={() => setStep("pick")} className="press ml-3 flex-shrink-0">
              <Pencil className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
            </button>
          </div>

          {/* Answer textarea */}
          <div className="bg-gray-50 border border-gray-200 rounded-[12px] px-4 py-4 relative">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value.slice(0, 225))}
              placeholder="Write your answer..."
              rows={5}
              className="w-full bg-transparent text-[16px] text-gray-900 leading-relaxed outline-none resize-none placeholder:text-gray-400"
              autoFocus
            />
            {answer && (
              <button onClick={() => setAnswer("")} className="absolute bottom-3 right-3 press">
                <XIcon className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
              </button>
            )}
          </div>
          <p className="text-[12px] text-gray-400 mt-2 text-right">{answer.length}/225</p>

          {/* Delete option for existing prompts */}
          {existingPromptId && (
            <button onClick={handleDelete} className="press mt-8 text-[14px] text-gray-400">
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
      <div className="flex items-center justify-between px-4 h-[52px] flex-shrink-0" style={{ borderBottom: "1px solid #E0DFDB" }}>
        <button onClick={() => router.push("/edit-profile")} className="press p-1">
          <ChevronLeft className="w-6 h-6 text-gray-900" strokeWidth={1.8} />
        </button>
        <span className="text-[16px] text-gray-900">Prompts</span>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {available.map((q, i) => (
          <button key={q} onClick={() => pickQuestion(q)}
            className="w-full text-left px-5 py-4 press" style={i < available.length - 1 ? { borderBottom: "1px solid #E0DFDB" } : {}}>
            <p className="text-[15px] text-gray-900">{q}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EditPromptPage() {
  return (
    <Suspense fallback={<div className="h-[100dvh] flex items-center justify-center bg-surface"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" /></div>}>
      <EditPromptInner />
    </Suspense>
  );
}
