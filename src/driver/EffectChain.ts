import { Gain, ToneAudioNode, ToneAudioNodeOptions } from 'tone';
import { ToneWithContextOptions } from 'tone/build/esm/core/context/ToneWithContext';
import { Effect, EffectOptions } from 'tone/build/esm/effect/Effect';
import { LFO, LFOOptions } from 'tone';

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
  lfo: LFO | null = null;

  constructor(options: ToneAudioNodeOptions) {
    super(options);
    this.effectIdCounter = 0;
    this.input = new Gain(0, 'decibels');
    this.output = new Gain(0, 'decibels');
    this.effects = new Map<SynthEffect['id'], SynthEffect>();
    this.addEffect(this.input, 'input');
    this.addEffect(this.output, 'output');
    this.addLFO({});

    this.addConnection('input', 'output');
  }

  changeEffectOptions(
    id: SynthEffect['id'],
    options: Partial<EffectOptions | ToneAudioNodeOptions>
  ) {
    const effect = this.effects.get(id);

    if (!effect) {
      throw new Error(`Invalid effect id: ${id}`);
    }

    if (effect.node instanceof Effect) {
      effect.node.set(options as EffectOptions);
    } else {
      effect.node.set(options as ToneAudioNodeOptions);
    }
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

  static parseId(id: string): SynthEffect['id'] {
    return id === 'input' || id === 'output' ? id : +id;
  }

  dispose(): this {
    this.input.dispose();
    this.output.dispose();
    this.effects.forEach((effect) => {
      effect.node.dispose();
    });
    this.effects.clear();
    this.disposeLFO();

    return super.dispose();
  }

  addLFO(options: Partial<LFOOptions>): void {
    if (this.lfo) {
      this.lfo.dispose();
    }
    this.lfo = new LFO(options.frequency ?? '4n', options.min ?? -12, options.max ?? 0);
    this.lfo.start();
  }

  connectLFOToEffect(effectId: SynthEffect['id'], param: string): void {
    if (!this.lfo) {
      throw new Error('LFO has not been initialized.');
    }

    const effect = this.effects.get(effectId)?.node;

    if (!effect) {
      throw new Error(`Invalid effect id: ${effectId}`);
    }

    //@ts-expect-error param is string
    this.lfo.connect(effect[param]);
  }

  disposeLFO(): void {
    if (this.lfo) {
      this.lfo.dispose();
      this.lfo = null;
    }
  }
}
