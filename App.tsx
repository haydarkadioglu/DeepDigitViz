import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import DrawingCanvas from './components/DrawingCanvas';
import NeuralNetworkViz from './components/NeuralNetworkViz';
import ResultsPanel from './components/ResultsPanel';
import { analyzeDigit } from './services/geminiService';
import { RecognitionResult } from './types';
import { Brain, Info, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary to catch runtime crashes
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-dark-bg text-white p-4">
          <div className="bg-dark-card p-6 rounded-xl border border-red-500/30 max-w-md text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-4">
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  // Initialize 8x8 grid (64)
  const [inputGrid, setInputGrid] = useState<number[]>(Array(64).fill(0));

  const handleAnalysis = async (imageData: string, gridData: number[]) => {
    setIsAnalyzing(true);
    setResult(null);
    setInputGrid(gridData);
    
    try {
        // Artificial delay for UX to let the visualization sink in
        const minTime = new Promise(resolve => setTimeout(resolve, 1500));
        
        const [analysisData] = await Promise.all([
            analyzeDigit(imageData),
            minTime
        ]);

        setResult(analysisData);
    } catch (e) {
        console.error("Analysis failed", e);
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-200 font-sans selection:bg-neon-purple selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-dark-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-neon-blue to-neon-purple rounded-lg">
                <Brain className="text-white h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              DeepDigit<span className="font-light text-neon-blue">Viz</span>
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-neon-blue"></div>Input (8x8)</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-500"></div>Hidden Layers</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-neon-green"></div>Output</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            
            {/* Left Column: Input */}
            <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-dark-card rounded-xl border border-slate-800 p-6 shadow-xl">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="text-neon-blue">1.</span> Draw a Digit
                    </h2>
                    <DrawingCanvas onAnalyze={handleAnalysis} isAnalyzing={isAnalyzing} />
                </div>

                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-neon-purple shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-400">
                             The image is downsampled to an 8x8 pixel grid. These 64 values are fed into the Neural Network engine (simulated locally) and verified by Gemini AI.
                        </p>
                    </div>
                </div>
            </div>

            {/* Middle Column: Neural Viz */}
            <div className="lg:col-span-8 flex flex-col h-full">
                <div className="bg-dark-card rounded-xl border border-slate-800 p-6 shadow-xl h-full flex flex-col">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="text-neon-blue">2.</span> Neural Processing Architecture
                    </h2>
                    <div className="flex-grow min-h-[300px]">
                        <NeuralNetworkViz 
                            isAnalyzing={isAnalyzing} 
                            probabilities={result?.probabilities || null}
                            predictedDigit={result?.prediction ?? null}
                            inputActivations={inputGrid}
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Grid: Results */}
        <div className="grid grid-cols-1">
            <div className="bg-dark-card rounded-xl border border-slate-800 p-6 shadow-xl">
                 <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-neon-blue">3.</span> Probabilistic Output & Analysis
                </h2>
                <div className="h-[350px]">
                    <ResultsPanel result={result} isAnalyzing={isAnalyzing} />
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;