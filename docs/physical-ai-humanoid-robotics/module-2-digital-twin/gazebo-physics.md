# Gazebo Physics: Gravity, Collision & Dynamics

Gazebo is the de facto standard simulator for the Robot Operating System (ROS). It provides the physics engine that calculates how your robot interacts with the world. To build a credible Digital Twin, one must move beyond visual meshes and understand the underlying physical properties.

## 1. The Physics Engines
Gazebo supports multiple physics engines, with the **Open Dynamics Engine (ODE)** being the default.
*   **ODE:** Balanced performance and accuracy. Good for general robotics.
*   **Bullet:** Often offers better collision detection for complex shapes.
*   **Dart:** Excellent for articulated body dynamics (multi-jointed chains like humanoids).

## 2. Defining Physical Properties (URDF & SDF)

A robot's visual appearance (mesh) is separate from its physical behavior. You must define the following in your URDF (Unified Robot Description Format) or SDF (Simulation Description Format):

### Inertial Properties
The distribution of mass is critical for stable control.
```xml
<inertial>
  <mass value="5.0"/>
  <inertia ixx="0.1" ixy="0.0" ixz="0.0" iyy="0.1" iyz="0.0" izz="0.1"/>
</inertial>
```
*   **Tip:** Incorrect inertia tensors are the #1 cause of "exploding" simulations. Use simplified geometry (boxes, cylinders) to calculate initial estimates.

### Collision Geometry
Collision meshes should be simpler than visual meshes to maintain performance.
```xml
<collision>
  <geometry>
    <cylinder length="0.6" radius="0.2"/>
  </geometry>
</collision>
```

### Friction & Contact
Friction coefficients (`mu1`, `mu2`) define how slippery a surface is.
*   **mu1:** Static friction coefficient.
*   **mu2:** Dynamic friction coefficient.
*   **kp/kd:** Contact stiffness and damping. High stiffness prevents objects from sinking into each other but can cause jitter.

## 3. The Loop: Physics Update Rate
The simulation step size determines accuracy.
*   **Standard:** 1000Hz (1ms step).
*   **Real-time Factor:** A factor of 1.0 means simulation time matches wall-clock time. < 1.0 means the sim is running slow (lagging).

## 4. Practical Exercise: The Falling Cube
To test gravity and collision:
1.  Spawn a cube with `mass=1kg` at `z=5.0m`.
2.  Observe the freefall. $d = 0.5 * g * t^2$.
3.  Add a ground plane with high friction.
4.  Observe the impact. Does it jitter? Adjust `kp` (stiffness) and `kd` (damping) in the `<surface>` tag.

> **Critical Concept:** A Digital Twin is only as good as its physics parameters. "Garbage in, garbage out." Always validate your simulation against real-world baselines.