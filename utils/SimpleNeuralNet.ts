// A lightweight, deterministic Feed-Forward Neural Network engine
// It doesn't "learn" in real-time (no backprop), but it simulates
// a pre-initialized network state to provide realistic visualization data.

export class SimpleNeuralNet {
  private weights: number[][][]; // [Layer][InputNodeIndex][OutputNodeIndex]
  private biases: number[][];    // [Layer][NodeIndex]
  private layerSizes: number[];

  constructor(inputSize: number, hiddenSizes: number[], outputSize: number) {
    this.layerSizes = [inputSize, ...hiddenSizes, outputSize];
    this.weights = [];
    this.biases = [];
    this.initializeWeights();
  }

  // Initialize with deterministic "pseudo-random" values so the same drawing
  // always produces the same visual pattern, simulating a trained state.
  private initializeWeights() {
    for (let i = 0; i < this.layerSizes.length - 1; i++) {
      const inputSize = this.layerSizes[i];
      const outputSize = this.layerSizes[i + 1];
      
      const layerWeights: number[][] = [];
      const layerBiases: number[] = [];

      // Generate biases
      for (let b = 0; b < outputSize; b++) {
        // Small negative bias to simulate sparsity (ReLU-like behavior preference)
        layerBiases.push(-0.1);
      }

      // Generate weights
      for (let j = 0; j < inputSize; j++) {
        const nodeWeights: number[] = [];
        for (let k = 0; k < outputSize; k++) {
          // Deterministic seed based on indices
          const seed = (i * 1000) + (j * 100) + k;
          // Math.sin gives us a deterministic value between -1 and 1
          const val = Math.sin(seed) * 2 - 1; 
          
          // Weight initialization (Xavier-like scaling)
          nodeWeights.push(val / Math.sqrt(inputSize));
        }
        layerWeights.push(nodeWeights);
      }

      this.weights.push(layerWeights);
      this.biases.push(layerBiases);
    }
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  // Returns the activation values of ALL nodes in ALL layers for visualization
  public forwardPropagate(inputs: number[]): number[][] {
    const activations: number[][] = [];
    
    // Layer 0: Inputs
    activations.push([...inputs]);

    let currentActivations = inputs;

    // Hidden & Output Layers
    for (let i = 0; i < this.weights.length; i++) {
      const nextActivations: number[] = [];
      const layerW = this.weights[i];
      const layerB = this.biases[i];
      const outputCount = this.layerSizes[i + 1];

      for (let outIdx = 0; outIdx < outputCount; outIdx++) {
        let sum = layerB[outIdx];
        
        // Dot product
        for (let inIdx = 0; inIdx < currentActivations.length; inIdx++) {
          sum += currentActivations[inIdx] * layerW[inIdx][outIdx];
        }

        // Activation Function
        nextActivations.push(this.sigmoid(sum));
      }

      activations.push(nextActivations);
      currentActivations = nextActivations;
    }

    return activations;
  }

  public getLayerConfig() {
    return this.layerSizes;
  }
}

// Singleton instance for 8x8 input (64), hidden layers, 10 output
export const neuralNetEngine = new SimpleNeuralNet(64, [16, 12], 10);