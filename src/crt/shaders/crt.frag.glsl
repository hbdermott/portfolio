precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_flickerIntensity;
uniform float u_glitchIntensity;

varying vec2 v_uv;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = v_uv;
  vec2 centered = uv - 0.5;

  // Stronger barrel distortion for convex CRT look
  float dist = length(centered);
  float barrel = 1.0 + 0.18 * dist * dist + 0.05 * dist * dist * dist;
  vec2 distorted = centered * barrel + 0.5;

  // Chromatic aberration - RGB channels separate at edges
  float aberration = 0.004 * u_glitchIntensity + 0.002;
  vec2 rOffset = distorted + vec2(aberration * dist * dist, 0.0);
  vec2 gOffset = distorted;
  vec2 bOffset = distorted - vec2(aberration * dist * dist, 0.0);

  rOffset = clamp(rOffset, 0.0, 1.0);
  gOffset = clamp(gOffset, 0.0, 1.0);
  bOffset = clamp(bOffset, 0.0, 1.0);

  // Phosphor green with slight color variation
  vec3 color = vec3(0.15, 1.0, 0.15);

  // Horizontal scanlines
  float scanline = sin(distorted.y * u_resolution.y * 3.14159) * 0.5 + 0.5;
  scanline = pow(scanline, 0.25);
  color *= 0.6 + 0.4 * scanline;

  // Scanline gap darkness
  float scanDark = sin(distorted.y * u_resolution.y * 3.14159);
  if (scanDark > 0.0) {
    color *= 0.8;
  }

  // Strong vignette for barrel distortion edge falloff
  float vignette = 1.0 - dot(centered, centered) * 1.2;
  vignette = clamp(vignette, 0.0, 1.0);
  vignette = pow(vignette, 0.6);
  color *= vignette;

  // Analog noise
  float n = noise(distorted * u_resolution * 0.8 + u_time * 15.0);
  color += n * 0.02;

  // Random flicker
  float flicker = 1.0 - u_flickerIntensity * 0.06 * random(vec2(u_time * 0.1, 0.0));
  color *= flicker;

  // Glitch horizontal lines
  if (u_glitchIntensity > 0.0) {
    float glitchLine = step(0.92, random(vec2(floor(uv.y * 25.0), u_time)));
    color += glitchLine * 0.3 * vec3(0.2, 1.0, 0.2);
    // RGB shift during glitch
    color.r += glitchLine * 0.1;
  }

  // Color channel divergence
  color.r *= 0.88 + 0.12 * sin(u_time * 0.7);
  color.b *= 0.88 + 0.12 * cos(u_time * 0.5);

  // Hotspot - brighter in center
  float hotspot = 1.0 - dist * 0.3;
  hotspot = clamp(hotspot, 0.7, 1.0);
  color *= hotspot;

  // Output with slight transparency
  float alpha = 0.12 + 0.08 * scanline;
  gl_FragColor = vec4(color, alpha);
}
