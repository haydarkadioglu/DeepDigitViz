import React, { useEffect, useState, useMemo } from 'react';
import { NeuralNode } from '../types';
import { neuralNetEngine } from '../utils/SimpleNeuralNet';

interface NeuralNetworkVizProps {
  isAnalyzing: boolean;
  probabilities: number[] | null; // From Gemini (True Ground Truth)
  predictedDigit: number | null;
  inputActivations: number[]; // 64 inputs
}

const WIDTH = 600;
const HEIGHT = 400;

const NeuralNetworkViz: React.FC<NeuralNetworkVizProps> = ({ 
  isAnalyzing, 
  probabilities, 
  predictedDigit,
  inputActivations 
}) => {
  const [activations, setActivations] = useState<number[][]>([]);
  
  // Get structure from the engine
  const layerSizes = useMemo(() => neuralNetEngine.getLayerConfig(), []); // [64, 16, 12, 10]

  // --- 1. Compute Network State ---
  useEffect(() => {
    // If we have inputs, run the local engine to get hidden layer states
    if (inputActivations && inputActivations.length === 64) {
        const calculatedActivations = neuralNetEngine.forwardPropagate(inputActivations);
        
        // If we have the REAL result from Gemini (probabilities), 
        // overwrite the last layer of our local simulation with the real truth.
        // This hybrid approach gives cool visuals + accurate results.
        if (probabilities && probabilities.length === 10) {
            calculatedActivations[calculatedActivations.length - 1] = probabilities;
        }
        
        setActivations(calculatedActivations);
    } else {
        // Zero state
        setActivations(layerSizes.map(size => Array(size).fill(0)));
    }
  }, [inputActivations, probabilities, layerSizes]);

  // --- 2. Generate Geometry (Nodes) ---
  const nodes = useMemo(() => {
    const nodeList: NeuralNode[] = [];
    
    layerSizes.forEach((size, layerIndex) => {
      const isInput = layerIndex === 0;
      const x = (layerIndex / (layerSizes.length - 1)) * (WIDTH - 80) + 40;
      
      // For Input Layer (64 nodes), we pack them tighter or differently?
      // Let's just pack them tighter vertically.
      const availableHeight = HEIGHT - 40;
      const spacingY = availableHeight / (size + (isInput ? 4 : 0)); // Add padding for input to avoid crowd
      
      for (let i = 0; i < size; i++) {
        nodeList.push({
          id: `l${layerIndex}-n${i}`,
          layer: layerIndex,
          x: x,
          y: 20 + (i * spacingY) + (isInput ? 0 : (availableHeight - (size * spacingY)) / 2), // Center non-input layers
          value: 0 // Placeholder, updated in render
        });
      }
    });
    return nodeList;
  }, [layerSizes]);

  // --- 3. Render Helpers ---
  
  // Optimization: Only render connections if source activation is high enough
  const renderConnections = () => {
    if (activations.length === 0) return null;

    const lines: React.ReactNode[] = [];
    
    for (let l = 0; l < layerSizes.length - 1; l++) {
        const sourceLayer = activations[l];
        
        // Skip drawing thousands of lines for the input layer if they are weak.
        // Optimization: Only draw lines from active nodes.
        
        for (let i = 0; i < sourceLayer.length; i++) {
            const sourceVal = sourceLayer[i];
            if (sourceVal < 0.05) continue; // Cull weak signals

            const targetCount = layerSizes[l+1];
            const sourceNode = nodes.find(n => n.id === `l${l}-n${i}`);
            if (!sourceNode) continue;

            for (let j = 0; j < targetCount; j++) {
                const targetNode = nodes.find(n => n.id === `l${l+1}-n${j}`);
                if (!targetNode) continue;

                // Deterministic visual weight (using the engine's internal logic would be O(N^2) to fetch here)
                // We simplify visual weight calculation for rendering speed
                // We just use source intensity as the driver for the line opacity
                const intensity = sourceVal * 0.5;

                lines.push(
                    <line
                        key={`l${l}-${i}-${j}`}
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke={l === layerSizes.length - 2 && j === predictedDigit ? "#0aff0a" : "#00f3ff"}
                        strokeWidth={1}
                        opacity={intensity * 0.4} // Slightly transparent
                    />
                );
            }
        }
    }
    return lines;
  };

  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-dark-card/50 rounded-lg border border-slate-700 relative overflow-hidden">
      <svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="overflow-visible">
        <defs>
           <filter id="glow-node">
             <feGaussianBlur stdDeviation="2" result="coloredBlur" />
             <feMerge>
               <feMergeNode in="coloredBlur" />
               <feMergeNode in="SourceGraphic" />
             </feMerge>
           </filter>
        </defs>

        {/* Render Connections first (z-index bottom) */}
        {renderConnections()}

        {/* Render Nodes */}
        {nodes.map((node) => {
            // Get current real-time value
            const layerVals = activations[node.layer];
            const rawVal = layerVals ? layerVals[parseInt(node.id.split('-n')[1])] : 0;
            const val = rawVal || 0;

            const isInput = node.layer === 0;
            const isOutput = node.layer === layerSizes.length - 1;
            const isWinning = isOutput && predictedDigit !== null && parseInt(node.id.split('-n')[1]) === predictedDigit;

            let radius = isInput ? 2 : 5;
            if (isOutput) radius = 6;
            if (isWinning) radius = 10;

            let fill = '#1e293b'; // inactive dark
            if (val > 0.1) {
                if (isWinning) fill = '#0aff0a';
                else if (isOutput) fill = `rgba(188, 19, 254, ${val})`;
                else fill = `rgba(0, 243, 255, ${val})`;
            }

            return (
                <g key={node.id}>
                    <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius}
                        fill={fill}
                        filter={val > 0.5 ? 'url(#glow-node)' : ''}
                        className="transition-all duration-300"
                    />
                    {isOutput && (
                        <text 
                            x={node.x + 15} 
                            y={node.y + 4} 
                            fill={isWinning ? '#0aff0a' : '#64748b'}
                            fontSize={isWinning ? 16 : 12}
                            fontWeight={isWinning ? 'bold' : 'normal'}
                            className="font-mono"
                        >
                            {parseInt(node.id.split('-n')[1])}
                        </text>
                    )}
                </g>
            );
        })}
      </svg>
    </div>
  );
};

export default NeuralNetworkViz;