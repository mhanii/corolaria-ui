import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Loader2, Sparkles, Globe, Database, Cpu, Layout, FileText, ChevronRight } from 'lucide-react';

/**
 * REUSABLE RESEARCH PLAN COMPONENT
 * @param {Array} steps - List of { id, label } objects
 * @param {Number} currentStep - The index of the step currently in progress
 * @param {Array} completedSteps - Array of indices that have finished
 * @param {Boolean} isVisible - Controls the collapse/expand animation
 */
const ResearchPlan = ({ steps, currentStep, completedSteps, isVisible }) => {
    return (
        <div className={`overflow-hidden transition-all duration-700 ease-in-out ${isVisible ? 'max-h-[600px] opacity-100 mt-12' : 'max-h-0 opacity-0 mt-0'}`}>
            <div className="p-6 md:p-8 rounded-2xl border border-zinc-800 bg-[#121212]/30 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-200">Research Plan</h3>
                </div>

                <div className="relative ml-2">
                    {/* The Track: Vertical line that connects the dots */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-zinc-800" />

                    <div className="space-y-6 relative">
                        {steps.map((step, index) => {
                            const isCompleted = completedSteps.includes(index);
                            const isActive = currentStep === index;
                            const isPending = !isCompleted && !isActive;

                            return (
                                <div
                                    key={step.id}
                                    className={`flex items-start gap-4 md:gap-6 transition-all duration-500 ${isPending ? 'opacity-30' : 'opacity-100'}`}
                                >
                                    {/* The Dot Indicator */}
                                    <div className="relative z-10 flex items-center justify-center mt-1.5">
                                        <div className={`
                      w-[14px] h-[14px] rounded-full transition-all duration-700
                      ${isCompleted
                                                ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                                                : isActive
                                                    ? 'bg-zinc-800 border border-blue-400 scale-110'
                                                    : 'bg-zinc-900 border border-zinc-700'}
                    `} />
                                    </div>

                                    {/* The Label */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm transition-colors duration-500 ${isActive ? 'text-white font-medium' : isCompleted ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentStep, setCurrentStep] = useState(-1);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [showResults, setShowResults] = useState(false);

    const researchSteps = [
        { id: 0, label: "Analyzing search intent" },
        { id: 1, label: "Browsing technical documentation" },
        { id: 2, label: "Synthesizing cross-domain data" },
        { id: 3, label: "Identifying key patterns and trends" },
        { id: 4, label: "Structuring findings for clarity" },
        { id: 5, label: "Drafting comprehensive report" }
    ];

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (!query.trim() || isSearching || isGenerating) return;

        setIsSearching(true);
        setIsGenerating(false);
        setCurrentStep(0);
        setCompletedSteps([]);
        setShowResults(false);
    };

    useEffect(() => {
        if (isSearching && currentStep < researchSteps.length) {
            const timer = setTimeout(() => {
                setCompletedSteps(prev => [...prev, currentStep]);
                if (currentStep < researchSteps.length - 1) {
                    setCurrentStep(prev => prev + 1);
                } else {
                    setTimeout(() => {
                        setIsSearching(false);
                        setIsGenerating(true);
                    }, 400);
                }
            }, 600);

            return () => clearTimeout(timer);
        }
    }, [isSearching, currentStep, researchSteps.length]);

    useEffect(() => {
        if (isGenerating) {
            const timer = setTimeout(() => {
                setIsGenerating(false);
                setShowResults(true);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [isGenerating]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-blue-500/30">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 max-w-3xl mx-auto px-6 pt-24 pb-20">
                {!isSearching && !isGenerating && !showResults && (
                    <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            DeepSearch Engine
                        </div>
                        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
                            What do you want to discover?
                        </h1>
                    </div>
                )}

                <div className={`transition-all duration-700 ease-in-out ${showResults || isSearching || isGenerating ? 'mt-0' : 'mt-8'}`}>
                    <form onSubmit={handleSearch} className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-10 group-focus-within:opacity-30 transition-opacity duration-500" />
                        <div className="relative flex items-center bg-[#111] border border-zinc-800 rounded-2xl p-2 shadow-2xl transition-all duration-300 group-focus-within:border-zinc-700">
                            <input
                                type="text"
                                placeholder="Ask anything..."
                                className="w-full bg-transparent border-none outline-none px-4 py-3 text-lg text-white placeholder-zinc-500"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                disabled={isSearching || isGenerating}
                            />
                            <button
                                type="submit"
                                disabled={isSearching || isGenerating || !query.trim()}
                                className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${query.trim() && !isSearching && !isGenerating
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                        : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'
                                    }`}
                            >
                                {(isSearching || isGenerating) ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Refactored Research Plan Component */}
                <ResearchPlan
                    steps={researchSteps}
                    currentStep={currentStep}
                    completedSteps={completedSteps}
                    isVisible={isSearching}
                />

                {isGenerating && (
                    <div className="mt-20 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                            <div className="absolute inset-2 rounded-full border-2 border-purple-500/20 border-b-purple-500 animate-spin-slow" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-medium text-white tracking-tight">Generating response</h3>
                            <p className="text-zinc-500 text-sm">Synthesizing findings into a structured report...</p>
                        </div>
                    </div>
                )}

                {showResults && !isSearching && !isGenerating && (
                    <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center gap-4">
                            <div className="p-1 px-3 rounded-md bg-blue-500/10 text-blue-400 text-xs font-mono border border-blue-500/20">
                                DEEP ANALYSIS COMPLETE
                            </div>
                            <span className="text-zinc-600 text-xs font-mono uppercase tracking-widest">4.8s total time</span>
                        </div>
                        <article className="prose prose-invert max-w-none">
                            <h2 className="text-2xl font-semibold text-white mb-4 leading-tight">Research Summary: {query}</h2>
                            <div className="space-y-6 text-zinc-300 leading-relaxed text-[17px]">
                                <p>Our deep research protocol has successfully aggregated and analyzed primary datasets related to <span className="text-blue-400 font-medium italic">"{query}"</span>.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
                                        <h4 className="text-xs font-bold text-zinc-500 mb-3 flex items-center gap-2 uppercase tracking-wider"><Globe className="w-3.5 h-3.5" /> Sources</h4>
                                        <ul className="text-sm space-y-2 text-zinc-400">
                                            <li>• Academic Peer Reviews</li>
                                            <li>• Industry Benchmark Data</li>
                                        </ul>
                                    </div>
                                    <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
                                        <h4 className="text-xs font-bold text-zinc-500 mb-3 flex items-center gap-2 uppercase tracking-wider"><Cpu className="w-3.5 h-3.5" /> Logical Deductions</h4>
                                        <ul className="text-sm space-y-2 text-zinc-400">
                                            <li>• Higher cost-to-benefit ratio</li>
                                            <li>• 34% efficiency improvement</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </article>

                        <div className="pt-10 border-t border-zinc-900 flex items-center justify-between">
                            <button
                                onClick={() => { setShowResults(false); setQuery(''); }}
                                className="group text-zinc-500 hover:text-white text-sm flex items-center gap-2 transition-all"
                            >
                                <div className="w-6 h-6 rounded-full border border-zinc-800 flex items-center justify-center group-hover:border-zinc-600">
                                    <Search className="w-3 h-3" />
                                </div>
                                New research session
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
        </div>
    );
};

export default App;