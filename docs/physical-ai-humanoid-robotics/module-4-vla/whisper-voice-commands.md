# Whisper: Voice-to-Action for Humanoids

The first step in enabling a humanoid robot to understand spoken commands is accurate speech-to-text conversion. OpenAI's **Whisper** model stands out for its high accuracy, multilingual support, and robustness to background noise, making it ideal for robotic applications.

## 1. Integrating OpenAI Whisper

Whisper can be deployed in various ways:

*   **API Integration:** For cloud-connected robots, the OpenAI API offers a straightforward way to send audio and receive transcription.
*   **Local Deployment:** For privacy-sensitive or latency-critical applications, smaller Whisper models can be run directly on the robot's onboard computer (e.g., NVIDIA Jetson with TensorRT optimization).

### ROS 2 Interface
A common pattern involves:
1.  **Audio Capture:** A ROS 2 node subscribes to an audio stream from microphones (e.g., `audio_common` package).
2.  **Transcription Node:** This node buffers audio, sends it to Whisper (API or local), and publishes the resulting text to a `/robot_say/text` topic.

## 2. Natural Language Understanding (NLU) for Commands

Once speech is transcribed to text, the robot needs to *understand* the intent and extract key information.

### Intent Recognition
*   **Simple Keywords:** For basic commands ("Stop", "Go", "Grab"), simple keyword matching might suffice.
*   **Machine Learning Classifiers:** Train a small classifier (e.g., using BERT embeddings) to categorize commands into predefined intents (e.g., `NAVIGATE`, `MANIPULATE`, `REPORT_STATUS`).

### Entity Extraction
From "Move to the red chair in the living room," we need to extract:
*   **Action:** `MOVE_TO`
*   **Object:** `CHAIR`
*   **Property:** `RED`
*   **Location:** `LIVING_ROOM`

This can be done using Named Entity Recognition (NER) models or by leveraging LLMs directly for structured output.

## 3. Designing a Robust Command Framework

*   **Finite State Machines (FSMs):** Use FSMs to manage the robot's response to commands. For instance, if the robot hears "Stop," it enters an `IDLE` or `PAUSED` state.
*   **Error Handling:** What if the command is ambiguous or impossible? The robot should be able to:
    *   Ask for clarification ("Which chair do you mean?").
    *   Report an impossibility ("I cannot reach that object.").

## 4. Example: "Bring me the water bottle"

1.  **Whisper:** "bring me the water bottle" -> `text="bring me the water bottle"`
2.  **NLU:** `text` -> `intent=GRAB_OBJECT`, `object=WATER_BOTTLE`
3.  **LLM Planner:** (as detailed in `llm-cognitive-planning.md`) -> Generates a sequence of actions:
    *   `NAVIGATE_TO(WATER_BOTTLE_LOCATION)`
    *   `DETECT_OBJECT(WATER_BOTTLE)`
    *   `PICK_UP(WATER_BOTTLE)`
    *   `NAVIGATE_TO(USER_LOCATION)`
    *   `HAND_OVER(WATER_BOTTLE)`