Today's Starry Sky v3 - Gyro mode

GitHub Pages: upload index.html as the site root.

Changes:
- Added UI gyro toggle button
- Gyro mode follows rear-camera direction using full 3-D device attitude
- Handles zenith crossing and upside-down poses without azimuth singularity
- Corrects screen rotation for portrait/landscape
- Uses iOS webkitCompassHeading yaw correction when available
- Uses current observation latitude/longitude from the main app
- Retains the Safari canvas ghosting fix from v15
- Moon and planets are included in gyro view
