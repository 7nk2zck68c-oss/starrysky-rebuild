Today's Starry Sky v6 - Gyro Compass Lock

Fixes v5 azimuth jump:
- iOS webkitCompassHeading is sampled only during gyro start-up
- compass yaw offset is locked after calibration and never re-blended while moving
- continuous motion thereafter comes only from the W3C 3-D device attitude
- no mixed deviceorientation/deviceorientationabsolute streams
- calibration is suppressed near zenith/nadir
- retains v5 named-star labels and v4 3-D projection
