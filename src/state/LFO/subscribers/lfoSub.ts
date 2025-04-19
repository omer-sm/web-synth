import { subscribeKey } from "valtio/utils"
import { effectChain } from "../../../driver/driver"
import { lfoState } from "../lfoState"

export default () => {
    subscribeKey(lfoState, 'frequency', (newFrequency) => {
        effectChain.lfo?.set({
            frequency: newFrequency,
        });
    });

    subscribeKey(lfoState, 'shape', (newShape) => {
        effectChain.lfo?.set({
            type: newShape,
        });
    });
}