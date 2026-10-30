import { WebGLRenderer } from 'three';

/** Reusing a canvas after responsive teardown also reuses its GL context.
 * Clear pixel upload flags before Three creates its default array textures. */
export function createWebGLRenderer(canvas: HTMLCanvasElement) {
  const options: WebGLContextAttributes = { alpha: true, antialias: true, powerPreference: 'low-power' };
  const context = canvas.getContext('webgl2', options);
  if (!context || context.isContextLost()) throw new Error('WebGL non disponibile');
  context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, false);
  context.pixelStorei(context.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  return new WebGLRenderer({ canvas, context, ...options });
}
