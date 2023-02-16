// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {FormattedMessage, useIntl} from 'react-intl';

import OnboardingWorkTemplateTourTip from './worktemplate_explore_tour_tip';

interface BoardsTourTipProps {
    singleTip: boolean;
    boardCount?: string;
}

export const BoardsTourTip = ({singleTip, boardCount}: BoardsTourTipProps) => {
    // console.log('>>>> gonorrea >>>>', {singleTip, boardCount});

    const {formatMessage} = useIntl();
    const title = (
        <FormattedMessage
            id='pluggable_rhs.tourtip.boards.title'
            defaultMessage={'Access your {count} linked boards!'}
            values={{count: boardCount === '0' ? undefined : boardCount}}
        />
    );

    const screen = (
        <ul>
            <li>
                {formatMessage({
                    id: 'pluggable_rhs.tourtip.boards.access',
                    defaultMessage: 'Access your linked boards from the Boards icon on the right hand App bar.',
                })}
            </li>
            <li>
                {formatMessage({
                    id: 'pluggable_rhs.tourtip.boards.click',
                    defaultMessage: 'Click into boards from this right panel.',
                })}
            </li>
            <li>
                {formatMessage({
                    id: 'pluggable_rhs.tourtip.boards.review',
                    defaultMessage: 'Review boards updates from your channels.',
                })}
            </li>
        </ul>
    );

    return (
        <OnboardingWorkTemplateTourTip
            pulsatingDotPlacement={'left'}
            pulsatingDotTranslate={{x: 10, y: -140}}
            title={title}
            screen={screen}
            singleTip={singleTip}
            overlayPunchOut={null}
            placement='left-start'
            hideBackdrop={true}
            tippyBlueStyle={true}
            showOptOut={false}
        />
    );
};

