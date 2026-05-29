import crtFragment from './shaders/crt.frag.glsl';

export class CRTShader {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private timeUniform: WebGLUniformLocation | null;
  private resolutionUniform: WebGLUniformLocation | null;
  private flickerUniform: WebGLUniformLocation | null;
  private glitchUniform: WebGLUniformLocation | null;
  private startTime: number;
  private animationId: number | null = null;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) throw new Error(`Canvas #${canvasId} not found`);
    this.canvas = canvas;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    this.program = this.createProgram();
    this.timeUniform = gl.getUniformLocation(this.program, 'u_time');
    this.resolutionUniform = gl.getUniformLocation(this.program, 'u_resolution');
    this.flickerUniform = gl.getUniformLocation(this.program, 'u_flickerIntensity');
    this.glitchUniform = gl.getUniformLocation(this.program, 'u_glitchIntensity');
    this.startTime = Date.now();

    this.setupGeometry();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  start(): void {
    const render = () => {
      this.animationId = requestAnimationFrame(render);
      this.render();
    };
    render();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  setGlitchIntensity(intensity: number): void {
    this.gl.useProgram(this.program);
    if (this.glitchUniform) {
      this.gl.uniform1f(this.glitchUniform, intensity);
    }
  }

  private createProgram(): WebGLProgram {
    const vertexShader = this.createShader(`
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `, this.gl.VERTEX_SHADER);

    const fragmentShader = this.createShader(crtFragment, this.gl.FRAGMENT_SHADER);

    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(program));
    }

    return program;
  }

  private createShader(source: string, type: number): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
    }

    return shader;
  }

  private setupGeometry(): void {
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
  }

  private resize(): void {
    const rect = this.canvas.parentElement!.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  private render(): void {
    const time = (Date.now() - this.startTime) / 1000;

    this.gl.useProgram(this.program);
    if (this.timeUniform) this.gl.uniform1f(this.timeUniform, time);
    if (this.resolutionUniform) this.gl.uniform2f(this.resolutionUniform, this.canvas.width, this.canvas.height);
    if (this.flickerUniform) this.gl.uniform1f(this.flickerUniform, Math.random() > 0.95 ? 1.0 : 0.0);

    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
}
