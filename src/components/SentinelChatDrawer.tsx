import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Play,
  TrendingDown,
  Info,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { ChatMessage, SimulationResult, BusinessHealthScore } from '../types';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

interface SentinelChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadScenarioIntoSimulator?: (result: SimulationResult) => void;
  healthScore?: BusinessHealthScore | null;
}

export const SentinelChatDrawer: React.FC<SentinelChatDrawerProps> = ({
  isOpen,
  onClose,
  onLoadScenarioIntoSimulator,
  healthScore,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to the Sentinel Financial Copilot. I query your deterministic financial engine directly to evaluate cash runway, customer delays, and statutory payment compliance under the MSMED Act.\n\nAsk about your current health score, stress-test an account delay, or test working capital scenarios.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const currentScore = healthScore?.overallScore ?? 56;

  const quickPrompts = [
    `Why is my business health score ${currentScore}?`,
    'What happens if Apex Motors pays 15 days late?',
    'Which customer presents the largest risk?',
    'Can I afford a machinery purchase of ₹3.5L?',
    'What are my top 3 immediate risk items?',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/sentinel/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Analysis completed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolInvocations: data.toolInvocations,
        evidence: data.evidence,
        scenarioResult: data.scenarioResult,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'Unable to connect to the financial engine. Please verify the server connection.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#212534]/30 backdrop-blur-xs flex justify-end">
      <div className="bg-[#ede9f7] w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-[#dcd4f2]">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#dcd4f2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl neu-card-lavender flex items-center justify-center text-[#483a7a]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-[#212534]">Financial Intelligence Analyst</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#e4ddf4] text-[#483a7a] border border-[#dcd4f2]">
                  Deterministic
                </span>
              </div>
              <p className="text-[11px] text-[#565d70]">Grounded in verified invoice ledgers and bank positions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg neu-btn text-[#7a6ab4] hover:text-[#212534] bg-white/70 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational Pill */}
        <div className="bg-[#e4ddf4]/60 px-4 py-2 border-b border-[#dcd4f2] text-[11px] text-[#483a7a] flex items-center gap-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-[#7a6ab4] shrink-0" />
          <span>Internal decision support. Queries deterministic formulas without speculative approximations.</span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[90%] rounded-2xl p-4 leading-relaxed ${
                    isUser
                      ? 'neu-raised-sm bg-[#5b4a8c] text-[#111827] font-medium'
                      : 'neu-raised bg-white/75 text-[#212534] border border-[#d6d0e4]'
                  }`}
                >
                  {/* Tool Call Pills if present */}
                  {m.toolInvocations && m.toolInvocations.length > 0 && (
                    <div className="mb-2 pb-2 border-b border-[#dcd4f2] flex flex-wrap gap-1.5">
                      {m.toolInvocations.map((tc, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ede9f7] text-[#483a7a] border border-[#dcd4f2]"
                        >
                          <Wrench className="w-2.5 h-2.5 text-[#7a6ab4]" />
                          <span>{tc.toolName}()</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message paragraphs */}
                  <div className="space-y-2 whitespace-pre-line text-xs">
                    {m.content}
                  </div>

                  {/* Evidence Tags */}
                  {m.evidence && m.evidence.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-[#dcd4f2] flex flex-wrap gap-1.5">
                      {m.evidence.map((ev, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#ede9f7] text-[#483a7a] font-bold border border-[#dcd4f2]"
                        >
                          <strong>{ev.metric}:</strong> {ev.value}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Embedded Simulation Chart if run */}
                  {m.scenarioResult && (
                    <div className="mt-3 pt-2 border-t border-[#dcd4f2] bg-white/70 p-3 rounded-xl border border-[#dcd4f2]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-[#212534] text-[11px]">
                          {m.scenarioResult.scenarioTitle}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            m.scenarioResult.reserveBreach
                              ? 'bg-[#f8eaef] text-[#733045] border border-[#edd4dc]'
                              : 'bg-[#e7f2ec] text-[#235237] border border-[#cfe3d6]'
                          }`}
                        >
                          {m.scenarioResult.reserveBreach ? 'Breached' : 'Maintained'}
                        </span>
                      </div>

                      <div className="h-28 w-full mb-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={(m.scenarioResult.points || []).map((p) => ({
                              date: p.date.substring(5),
                              baseline: p.baselineCash,
                              simulated: p.simulatedCash,
                            }))}
                            margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                          >
                            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#7a6ab4' }} />
                            <YAxis
                              tick={{ fontSize: 9, fill: '#7a6ab4' }}
                              tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                            />
                            <ReferenceLine
                              y={m.scenarioResult.points?.[0]?.minimumReserve ?? 300000}
                              stroke="#c96f7c"
                              strokeDasharray="2 2"
                            />
                            <Line type="monotone" dataKey="baseline" stroke="#7a6ab4" strokeWidth={1.5} dot={false} />
                            <Line type="monotone" dataKey="simulated" stroke="#c96f7c" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {onLoadScenarioIntoSimulator && (
                        <button
                          onClick={() => {
                            onLoadScenarioIntoSimulator(m.scenarioResult!);
                            onClose();
                          }}
                          className="w-full py-1 text-center text-[10px] font-bold text-[#483a7a] hover:text-[#212534] cursor-pointer"
                        >
                          Inspect in Interactive Simulator →
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-[#7a6ab4] mt-1 px-1 font-medium">{m.timestamp}</span>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#483a7a] p-3 rounded-xl bg-white/70 border border-[#dcd4f2]">
              <RefreshCw className="w-4 h-4 text-[#7a6ab4] animate-spin" />
              <span className="font-semibold">Querying financial ledger engine...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Prompts */}
        <div className="p-3 border-t border-[#dcd4f2] overflow-x-auto no-scrollbar flex gap-2">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp)}
              disabled={isLoading}
              className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-xl neu-btn text-[#483a7a] font-bold cursor-pointer transition-all bg-white/70"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div className="p-3 border-t border-[#dcd4f2]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about cash runway, customer risk, or stress tests..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2 rounded-xl neu-input text-xs font-medium text-[#212534]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl neu-btn-primary disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
