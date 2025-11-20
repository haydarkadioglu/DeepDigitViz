# DeepDigit Viz

An interactive Deep Learning visualization tool built with React, Tailwind CSS, and the Gemini API.

This application allows users to draw handwritten digits (0-9) and visualizes how a simplified Feed-Forward Neural Network processes the image layer by layer to produce a prediction.

## Features

*   **Interactive Drawing Canvas**: Draw digits with touch or mouse support.
*   **Real-time Preprocessing**: Downsamples user input to an 8x8 grayscale grid (64 neurons) similar to the UCI Optical Recognition of Handwritten Digits dataset.
*   **Neural Network Engine**: A custom, browser-based deterministic neural network engine (`SimpleNeuralNet.ts`) simulates Matrix Multiplication and Activation functions (Sigmoid/ReLU) to visualize the signal flow accurately.
*   **Gemini API Integration**: Uses Google's Gemini 2.5 Flash model to provide "Ground Truth" analysis, detailed explanations of visual features, and accurate probability distributions.
*   **Dynamic Visualization**: SVG-based visualization of neurons and synapses that light up based on actual activation values.

## Tech Stack

*   **Frontend**: React 19, TypeScript, Tailwind CSS
*   **Visualization**: Recharts (bar charts), Custom SVG (network graph)
*   **AI**: Google GenAI SDK (`@google/genai`)
*   **Icons**: Lucide React

## How it Works

1.  **Input**: The user draws on the HTML5 Canvas.
2.  **Preprocessing**: The canvas pixels are aggregated into an 8x8 grid (64 float values between 0 and 1).
3.  **Local Simulation**: These 64 values are passed to `SimpleNeuralNet`, which runs a forward pass through 2 hidden layers (16 and 12 neurons) to the 10 output neurons. This drives the visual animation.
4.  **AI Verification**: Simultaneously, the high-resolution image is sent to Gemini 2.5 Flash. The AI returns the predicted digit, confidence scores, and a text explanation.
5.  **Hybrid Output**: The visualization combines the local simulation (for the hidden layers) with the AI's result (for the final output layer) to create a seamless educational experience.

## Installation

1.  Clone the repository.
2.  Run `npm install`.
3.  Set your `API_KEY` in the environment variables.
4.  Run `npm start`.
