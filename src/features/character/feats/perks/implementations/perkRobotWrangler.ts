import { FeatImplementation } from '@/features/character/feats';


const perkRobotWrangler: FeatImplementation = {
    getFeatureUnlocks: () => [
        {
            type: 'tab',
            id: 'companion'
        },
        {
            type: 'companion',
            id: 'eyebot'
        }
    ]
};

export default perkRobotWrangler;
