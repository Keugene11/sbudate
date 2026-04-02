"use client";

import { useEffect, useState } from "react";
import { Shield, Users, MessageCircle, Flag, Trash2, X, ChevronRight, ChevronLeft } from "lucide-react";

type Tab = "reports" | "users" | "messages";

interface Report {
  id: string; reporter_profile_id: string; reported_profile_id: string;
  reason: string; details: string | null; created_at: string;
  reporter_name: string; reported_name: string;
}
interface UserProfile {
  id: string; first_name: string; last_name: string; age: number;
  gender: string; major: string | null; created_at: string;
}
interface Match {
  id: string; profile1_id: string; profile2_id: string;
  name1: string; name2: string; messageCount: number; created_at: string;
}
interface Message {
  id: string; match_id: string; sender_id: string; content: string; created_at: string;
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("reports");
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [viewingMatch, setViewingMatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (t: Tab) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin?action=${t}`);
      if (!res.ok) { setError("Unauthorized — admin only"); setLoading(false); return; }
      const data = await res.json();
      if (t === "reports") setReports(data);
      if (t === "users") setUsers(data);
      if (t === "messages") setMatches(data);
    } catch { setError("Failed to load"); }
    setLoading(false);
  };

  const fetchMessages = async (matchId: string) => {
    setViewingMatch(matchId);
    const res = await fetch(`/api/admin?action=messages&matchId=${matchId}`);
    const data = await res.json();
    setMessages(data.messages);
    setNames(data.names);
  };

  useEffect(() => { fetchData(tab); }, [tab]);

  const deleteUser = async (profileId: string) => {
    if (!confirm("Delete this user and all their data?")) return;
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteUser", profileId }),
    });
    fetchData(tab);
  };

  const dismissReport = async (reportId: string) => {
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismissReport", reportId }),
    });
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-[18px] font-semibold text-gray-900 mb-1">Admin Only</p>
        <p className="text-[14px] text-gray-400">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-5 h-5 text-gray-900" strokeWidth={2} />
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {([
              { key: "reports", label: "Reports", icon: Flag },
              { key: "users", label: "Users", icon: Users },
              { key: "messages", label: "Messages", icon: MessageCircle },
            ] as const).map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setViewingMatch(null); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium press transition-all ${
                  tab === t.key ? "bg-gray-900 text-white" : "bg-surface text-gray-500 border border-border"
                }`}>
                <t.icon className="w-4 h-4" strokeWidth={1.8} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Reports */}
              {tab === "reports" && (
                <div className="space-y-3">
                  {reports.length === 0 ? (
                    <p className="text-center text-gray-400 py-16 text-[15px]">No reports</p>
                  ) : reports.map(report => (
                    <div key={report.id} className="bg-surface border border-border rounded-2xl p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-[15px] font-semibold text-gray-900">
                            {report.reporter_name} reported {report.reported_name}
                          </p>
                          <p className="text-[12px] text-gray-400 mt-0.5">
                            {new Date(report.created_at).toLocaleDateString()} · {report.reason}
                          </p>
                        </div>
                      </div>
                      {report.details && (
                        <p className="text-[14px] text-gray-600 bg-gray-50 rounded-xl px-4 py-3 mb-3">{report.details}</p>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => deleteUser(report.reported_profile_id)}
                          className="press flex items-center gap-1.5 px-3.5 py-2 bg-red-50 text-red-500 rounded-xl text-[13px] font-medium">
                          <Trash2 className="w-3.5 h-3.5" /> Remove User
                        </button>
                        <button onClick={() => dismissReport(report.id)}
                          className="press flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 text-gray-500 rounded-xl text-[13px] font-medium">
                          <X className="w-3.5 h-3.5" /> Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Users */}
              {tab === "users" && (
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                  {users.length === 0 ? (
                    <p className="text-center text-gray-400 py-16 text-[15px]">No users</p>
                  ) : users.map((user, i) => (
                    <div key={user.id} className={`flex items-center justify-between px-5 py-4 ${i < users.length - 1 ? "border-b border-border" : ""}`}>
                      <div>
                        <p className="text-[15px] font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                        <p className="text-[12px] text-gray-400">{user.age} · {user.gender} · {user.major || "No major"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-300">{user.id.slice(0, 8)}</span>
                        <button onClick={() => deleteUser(user.id)}
                          className="press p-2 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4 text-gray-300 hover:text-red-500" strokeWidth={1.8} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Messages */}
              {tab === "messages" && !viewingMatch && (
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                  {matches.length === 0 ? (
                    <p className="text-center text-gray-400 py-16 text-[15px]">No matches</p>
                  ) : matches.map((match, i) => (
                    <button key={match.id} onClick={() => fetchMessages(match.id)}
                      className={`w-full flex items-center justify-between px-5 py-4 press text-left hover:bg-gray-50 ${i < matches.length - 1 ? "border-b border-border" : ""}`}>
                      <div>
                        <p className="text-[15px] font-medium text-gray-900">{match.name1} & {match.name2}</p>
                        <p className="text-[12px] text-gray-400">{match.messageCount} messages</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              )}

              {tab === "messages" && viewingMatch && (
                <div>
                  <button onClick={() => setViewingMatch(null)} className="flex items-center gap-1 text-[14px] text-gray-400 mb-4 press">
                    <ChevronLeft className="w-4 h-4" /> Back to matches
                  </button>
                  <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-[14px]">No messages in this conversation</p>
                    ) : messages.map(msg => (
                      <div key={msg.id} className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-[11px] font-semibold text-gray-500">{(names[msg.sender_id] || "?")[0]}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[13px] font-semibold text-gray-900">{names[msg.sender_id] || msg.sender_id.slice(0, 8)}</span>
                            <span className="text-[11px] text-gray-300">{new Date(msg.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-[14px] text-gray-700">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
