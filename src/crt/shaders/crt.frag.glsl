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

  float dist = length(centered);
  float barrel = 1.0 + 0.1 * dist * dist;
  vec2 distorted = centered * barrel + 0.5;

  float aberration = 0.003 * u_glitchIntensity + 0.001;
  vec2 rOffset = distorted + vec2(aberration * dist, 0.0);
  vec2 gOffset = distorted;
  vec2 bOffset = distorted - vec2(aberration * dist, 0.0);

  rOffset = clamp(rOffset, 0.0, 1.0);
  gOffset = clamp(gOffset, 0.0, 1.0);
  bOffset = clamp(bOffset, 0.0, 1.0);

  vec3 color = vec3(0.2, 1.0, 0.2);

  float scanline = sin(distorted.y * u_resolution.y * 3.14159) * 0.5 + 0.5;
  scanline = pow(scanline, 0.3);
  color *= 0.7 + 0.3 * scanline;

  float scanDark = sin(distorted.y * u_resolution.y * 3.14159);
  if (scanDark > 0.0) {
    color *= 0.85;
  }

  float vignette = 1.0 - dot(centered, centered) * 0.8;
  vignette = clamp(vignette, 0.0, 1.0);
  color *= vignette;

  float n = noise(distorted * u_resolution * 0.5 + u_time * 10.0);
  color += n * 0.03;

  float flicker = 1.0 - u_flickerIntensity * 0.05 * random(vec2(u_time * 0.1, 0.0));
  color *= flicker;

  if (u_glitchIntensity > 0.0) {
    float glitchLine = step(0.95, random(vec2(floor(uv.y * 20.0), u_time)));
    color += glitchLine * 0.2 * vec3(0.2, 1.0, 0.2);
  }

  color.r *= 0.9 + 0.1 * sin(u_time * 0.5);
  color.b *= 0.9 + 0.1 * cos(u_time * 0.3);

  float alpha = 0.15 + 0.1 * scanline;
  gl_FragColor = vec4(color, alpha);
}
