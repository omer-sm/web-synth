import { Gain, ToneAudioNode, ToneAudioNodeOptions } from 'tone';
import { ToneWithContextOptions } from 'tone/build/esm/core/context/ToneWithContext';
import { Effect, EffectOptions } from 'tone/build/esm/effect/Effect';

export interface SynthEffect {
  id: number | 'input' | 'output';
  node: Effect<EffectOptions> | ToneAudioNode<ToneWithContextOptions>;
  inputs: SynthEffect['id'][];
  outputs: SynthEffect['id'][];
}

export default class EffectChain extends ToneAudioNode<ToneAudioNodeOptions> {
  input: ToneAudioNode<ToneWithContextOptions>;
  output: ToneAudioNode<ToneWithContextOptions>;
  readonly name: string = 'EffectChain';
  effects: Map<SynthEffect['id'], SynthEffect>;
  effectIdCounter: number;

  constructor(options: ToneAudioNodeOptions) {
    super(options);
    this.effectIdCounter = 0;
    this.input = new Gain({ context: this.context });
    this.output = new Gain({ context: this.context });
    this.effects = new Map<SynthEffect['id'], SynthEffect>();
    this.addEffect(this.input, 'input');
    this.addEffect(this.output, 'output');

    this.addConnection('input', 'output');
  }

  addEffect(node: SynthEffect['node'], id?: SynthEffect['id']): SynthEffect['id'] {
    id = id ?? this.effectIdCounter++;
    this.effects.set(id, { id, node, inputs: [], outputs: [] });

    return id;
  }

  removeEffect(id: SynthEffect['id']): void {
    const effect = this.effects.get(id);
    if (!effect) {
      throw new Error(`Invalid effect id: ${id}`);
    }

    effect.inputs.forEach((inputId) => {
      const inputEffect = this.effects.get(inputId);
      if (inputEffect) {
        inputEffect.outputs = inputEffect.outputs.filter((output) => output !== id);
      }
    });

    effect.outputs.forEach((outputId) => {
      const outputEffect = this.effects.get(outputId);
      if (outputEffect) {
        outputEffect.inputs = outputEffect.inputs.filter((input) => input !== id);
      }
    });

    this.effects.delete(id);
  }

  addConnection(from: SynthEffect['id'], to: SynthEffect['id']): void {
    const fromEffect = this.effects.get(from);
    const toEffect = this.effects.get(to);

    if (!fromEffect || !toEffect) {
      throw new Error(`Invalid effect id: ${from} or ${to}`);
    }

    fromEffect.outputs.push(to);
    toEffect.inputs.push(from);
    fromEffect.node.connect(toEffect.node);
  }

  removeConnection(from: SynthEffect['id'], to: SynthEffect['id']): void {
    const fromEffect = this.effects.get(from);
    const toEffect = this.effects.get(to);

    if (!fromEffect || !toEffect) {
      throw new Error(`Invalid effect id: ${from} or ${to}`);
    }

    fromEffect.outputs = fromEffect.outputs.filter((output) => output !== to);
    toEffect.inputs = toEffect.inputs.filter((input) => input !== from);
    fromEffect.node.disconnect(toEffect.node);
  }

  dispose(): this {
    this.input.dispose();
    this.output.dispose();
    this.effects.forEach((effect) => {
      effect.node.dispose();
    });
    this.effects.clear();

    return super.dispose();
  }
}
