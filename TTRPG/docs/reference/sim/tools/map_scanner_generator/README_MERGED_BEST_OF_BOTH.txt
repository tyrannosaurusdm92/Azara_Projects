Fantasy Map Location + Terrain Scanner — merged best-of-both build
================================================================= This ZIP merges the location overlay editor version with the 10-anchor pin revision. Primary merged behavior:
- GeoJSON overlays render as hoverable/clickable SVG cells above the image; they never replace the image.
- Location names are never printed on the map image itself. Names, details, NPCs, schedules, services, rumors, secrets, and intrigue appear in the immersive inspector/location panel.
- Imported/scanned GeoJSON cells normalize to 10 draggable white anchors.
- Each cell has a pointed center map pin.
- Pin color follows location type, including forest green for government, red for medical, and deep purple for worship.
- The Move Cell checkbox controls whether dragging the center pin moves the full cell. When Move Cell is off, drag anchors only.
- Zoom is clamped from 25% to 300%.
- Save selected GeoJSON exports only the selected edited location.
- Save replacement GeoJSON exports the full replacement-ready FeatureCollection. Compatibility note:
Some internal function/variable names still use “border” because the original scanner logic was built around polygon boundaries. User-facing UI now uses location/area wording, and older JSON using border/province-style keys can still be imported as location-area input.