// https://phaser.discourse.group/t/camera-mask-shape-for-a-round-minimap/1999

import Phaser from 'phaser';

export default new Phaser.Class({

	Extends: Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline,

	initialize:

	function CustomPipeline (game)
	{
			Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline.call(this, {
					game: game,
					renderer: game.renderer,
					fragShader: `
					precision mediump float;

					uniform sampler2D uMainSampler;
					uniform vec2 uResolution;
					uniform float uTime;

					varying vec2 outTexCoord;
					varying vec4 outTint;

					vec4 plasma()
					{
							vec2 pixelPos = gl_FragCoord.xy / uResolution * 20.0;
							float freq = 0.8;
							float value =
									sin(uTime + pixelPos.x * freq) +
									sin(uTime + pixelPos.y * freq) +
									sin(uTime + (pixelPos.x + pixelPos.y) * freq) +
									cos(uTime + sqrt(length(pixelPos - 0.5)) * freq * 2.0);

							return vec4(
									cos(value),
									sin(value),
									sin(value * 3.14 * 2.0),
									cos(value)
							);
					}

					void main() 
					{
							vec4 texel = texture2D(uMainSampler, outTexCoord);
							texel *= vec4(outTint.rgb * outTint.a, outTint.a);
							gl_FragColor = texel * plasma();
					}

					`
			});
	}
});
