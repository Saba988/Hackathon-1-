# LLM Cognitive Planning: From Intent to Action

The ultimate goal of Cognitive AI in robotics is to enable a robot to understand high-level goals from humans and autonomously break them down into executable sub-tasks. **Large Language Models (LLMs)** are proving to be powerful tools for this **hierarchical planning**.

## 1. The LLM as a Reasoning Engine

Instead of hand-coding every possible robot behavior, we can leverage LLMs for:

*   **Task Decomposition:** Breaking "Make coffee" into "Go to kitchen", "Get mug", "Get coffee grounds", "Brew", "Serve".
*   **Commonsense Reasoning:** Understanding that "put the cup on the table" implies not dropping it, and putting it upright.
*   **Constraint Satisfaction:** Reasoning about object affordances (e.g., a knife can cut, a spoon cannot).

## 2. Grounding Language to Robot Capabilities

The biggest challenge is **grounding**: connecting the LLM's abstract linguistic understanding to the robot's physical capabilities.

*   **Action Primitives:** The robot must have a predefined set of low-level, deterministic actions (e.g., `move_to(x,y,z)`, `pick_up(object_id)`, `set_joint_angle(joint_name, angle)`).
*   **State Representation:** The robot needs an internal model of its environment and itself (e.g., "water bottle at (1,2,0)", "robot_state=holding_mug").

## 3. Prompt Engineering for Robotics

Communicating with the LLM is key. We craft prompts to guide its planning.

### Few-Shot Learning
Provide examples of successful task decompositions.
*   **Prompt Example:**
    ```
    You are a helpful robot assistant. Here are examples of how to accomplish tasks:
    Task: "Pick up the red apple"
    Plan:
    1. Navigate to red apple
    2. Grasp red apple
    3. Lift red apple

    Task: "Clean the table"
    Plan:
    1. Scan table for dirt
    2. Pick up cloth
    3. Wipe table surface
    ...
    Task: "Make coffee"
    Plan:
    ```

### Chain of Thought Reasoning
Encourage the LLM to "think step-by-step" to improve planning quality.
*   **Prompt Example:** "Let's think step by step how to make coffee. What's the first thing you need to do?"

## 4. Bridging with ROS 2

*   **LLM Interface Node:** A ROS 2 node receives the natural language goal, sends it to the LLM (API or local), and parses the LLM's response (a JSON or YAML plan).
*   **Task Executor Node:** This node takes the LLM's plan (sequence of action primitives) and calls the corresponding ROS 2 services or publishes to topics to execute the low-level actions.

## 5. Challenges & Future Directions

*   **Safety:** Ensuring the LLM doesn't generate dangerous or impossible plans.
*   **Long-Term Memory:** Maintaining context across multiple commands.
*   **Human Feedback:** Allowing humans to correct or refine LLM-generated plans.
*   **Embodied Learning:** Allowing the LLM to learn directly from robot experience.

> **Key Takeaway:** LLMs are moving beyond chatbots to become powerful **cognitive co-processors** for robots, enabling true human-robot collaboration through natural language.