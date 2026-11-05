import { useTranslation } from 'react-i18next';
import { usePopup } from '@/app/contexts/PopupContext.tsx';
import { ACTIONS, ACTION_CATEGORIES } from '@/features/actions/actions.ts';
import TraitPerkItem from './TraitPerkItem.tsx';

function ActionsList() {
    const { t } = useTranslation();
    const { showD20Popup } = usePopup();

    return (
        <div className="stack">
            {ACTION_CATEGORIES.map(category => (
                <section
                    key={category}
                    className="stack no-gap"
                    aria-labelledby={`${category}-actions-heading`}
                >
                    <h2 id={`${category}-actions-heading`} className="h3 no-margin">
                        {t(`${category}Actions`)}
                    </h2>
                    <div className="stack no-gap">
                        {ACTIONS.filter(action => action.category === category).map(action => (
                            <TraitPerkItem
                                key={action.id}
                                id={action.id}
                                {...(action.rollSkill
                                    ? {
                                          actionButton: {
                                              label: 'roll',
                                              onClick: () =>
                                                  showD20Popup({ skillId: action.rollSkill! }),
                                          },
                                      }
                                    : {})}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

export default ActionsList;
