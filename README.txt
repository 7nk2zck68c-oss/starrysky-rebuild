Today's Starry Sky v4 - Gyro Rebuild

GitHub Pages: upload index.html at repository root.

Key changes:
- rebuilt DeviceOrientation transform from W3C Z-X' -Y" convention
- compass anchors alpha (yaw) rather than rear-camera azimuth
- corrected screen-axis rotation
- one focal length for both axes (no constellation stretching)
- zenith-safe full 3D camera basis
- canvas dimensions measured from actual CSS box for Safari
- cardinal markers on horizon for field verification
