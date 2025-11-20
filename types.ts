export interface RecognitionResult {
  prediction: number;
  probabilities: number[];
  explanation: string;
  featureMapDescription: string;
}

export interface NeuralNode {
  id: string;
  x: number;
  y: number;
  layer: number;
  value: number; // The actual activation value (0-1)
}

export interface NeuralLink {
  source: string;
  target: string;
  weight: number;
}

export interface LayerConfig {
  inputSize: number;
  hiddenLayers: number[];
  outputSize: number;
}