# Nav2 for Humanoids: Walking, Not Rolling

The **Nav2** (Navigation 2) stack is the industry standard for mobile robotics. However, it was originally designed for wheeled robots (differential drive, omni-drive). Adapting it for a bipedal humanoid requires specific tuning.

## 1. The Locomotion Challenge

Wheeled robots move smoothly. Humanoids sway, step, and balance.
*   **Odometry:** Nav2 relies on accurate odometry. We must fuse Visual SLAM (from Isaac ROS) with IMU data to provide a stable "odom" frame, filtering out the high-frequency jitter of walking.
*   **Footprint:** A wheeled robot is often a circle or box. A humanoid's footprint changes as it steps. We typically approximate this with a cylinder for path planning, but use a more complex voxel check for collision avoidance.

## 2. Costmaps: 2D vs. 3D

*   **Standard Nav2:** Uses a 2D Costmap (occupancy grid).
*   **Humanoid Nav2:** We utilize **Voxel Layers**.
    *   We must detect obstacles at *different heights*. A table is an obstacle for the torso but not for the feet.
    *   We clear obstacles from the costmap dynamically as the robot moves.

## 3. Planners and Controllers

*   **Global Planner:** (e.g., SmacPlanner) Calculates the high-level path (A* or Dijkstra). It finds the optimal route from Room A to Room B.
*   **Local Planner (Controller):** (e.g., MPPI - Model Predictive Path Integral).
    *   This is critical for humanoids. MPPI simulates thousands of potential trajectories on the GPU to find one that is kinematically feasible and collision-free.
    *   It outputs velocity commands (`cmd_vel`) that the humanoid's walking controller (gait engine) translates into joint angles.

## 4. Behavior Trees

Nav2 uses **Behavior Trees (BT)** to manage logic.
*   **Recovery Behaviors:** If the robot gets stuck, what does it do?
    *   *Wheeled:* Spin in place.
    *   *Humanoid:* Step in place, look down, or crouch. We must write custom BT nodes to trigger these specific humanoid recovery actions.