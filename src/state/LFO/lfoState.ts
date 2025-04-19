import { Frequency } from 'tone/build/esm/core/type/Units';
import { proxy } from 'valtio';
import subscribeLFO from './subscribers/lfoSub';

interface LFOStateType {
  frequency: Frequency | undefined;
  shape: OscillatorType;
}

export const lfoState: LFOStateType = proxy({
  frequency: undefined,
  shape: 'sine',
});

subscribeLFO();
