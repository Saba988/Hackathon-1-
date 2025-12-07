# Sensor Simulation: The Eyes & Ears of the Robot

A robot cannot act if it cannot sense. In a Digital Twin, we replace physical drivers with **Sensor Plugins**. These plugins generate data that mimics the message structure of real hardware, allowing your ROS 2 nodes to run unchanged.

## 1. The Camera (RGB & Depth)

Cameras are essential for VLA (Vision-Language-Action) models.

### RGB Camera
Simulates a standard webcam or industrial camera.
*   **Parameters:** Resolution (e.g., 1920x1080), Field of View (FOV), Update Rate (FPS).
*   **Output:** `sensor_msgs/Image`

### Depth Camera (RGB-D)
Simulates devices like RealSense or Kinect. It produces a point cloud or depth map.
*   **Clip Planes:** `near` (min distance) and `far` (max distance).
*   **Noise:** Real depth cameras have noise that increases with distance. Gazebo allows you to inject Gaussian noise to test the robustness of your perception algorithms.

```xml
<sensor name="camera1" type="depth">
  <camera>
    <horizontal_fov>1.047</horizontal_fov>
    <image>
      <width>640</width>
      <height>480</height>
    </image>
    <clip>
      <near>0.1</near>
      <far>100</far>
    </clip>
  </camera>
  <!-- ROS 2 Plugin integration -->
  <plugin name="camera_controller" filename="libgazebo_ros_camera.so">
    ...
  </plugin>
</sensor>
```

## 2. LiDAR (Light Detection and Ranging)

LiDAR provides precise 360-degree distance measurements, crucial for SLAM (Simultaneous Localization and Mapping).

*   **Ray Cast:** Simulates laser beams hitting objects.
*   **Resolution:** Number of rays per sweep.
*   **GPU Acceleration:** Use GPU-accelerated ray casting for high-resolution 3D LiDARs to maintain performance.

## 3. IMU (Inertial Measurement Unit)

The inner ear of the robot. It measures:
*   **Linear Acceleration:** (Accelerometer)
*   **Angular Velocity:** (Gyroscope)

IMUs are noisy and suffer from **drift**. A good simulation must include:
*   **Bias:** Constant error offset.
*   **White Noise:** Random fluctuations.

## 4. Implementation Strategy

When building your Digital Twin:
1.  **Start Ideal:** accurate data, no noise. Verify your algorithms work in perfect conditions.
2.  **Add Realism:** Inject noise models derived from the datasheets of your physical sensors.
3.  **Stress Test:** Increase noise levels beyond specifications to ensure your system fails safely.