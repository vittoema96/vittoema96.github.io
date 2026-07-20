import { FeatImplementation } from '@/features/character/feats';


const perkDogmeat: FeatImplementation = {
    getFeatureUnlocks: () => [
        {
            type: 'tab',
            id: 'companion'
        },
        {
            type: 'companion',
            id: 'dog'
        }
    ]
};

export default perkDogmeat;
