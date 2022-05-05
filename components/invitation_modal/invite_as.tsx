// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {useSelector} from 'react-redux';

import {FormattedMessage, useIntl} from 'react-intl';

import {GlobalState} from 'types/store';

import {getLicense} from 'mattermost-redux/selectors/entities/general';
import {cloudFreeEnabled} from 'mattermost-redux/selectors/entities/preferences';

import RadioGroup from 'components/common/radio_group';

import './invite_as.scss';

export const InviteType = {
    MEMBER: 'MEMBER',
    GUEST: 'GUEST',
} as const;

export type InviteType = typeof InviteType[keyof typeof InviteType];

export type Props = {
    setInviteAs: (inviteType: InviteType) => void;
    inviteType: InviteType;
    titleClass?: string;
}

export default function InviteAs(props: Props) {
    const {formatMessage} = useIntl();
    const license = useSelector(getLicense);
    const isCloudFreeEnabled = true; //useSelector(cloudFreeEnabled);
    const subscription = useSelector((state: GlobalState) => state.entities.cloud.subscription);

    let extraGuessLegend = true;
    let guestDisabledClass = '';
    let badges = null;
    let guessDisabled = null;

    const isCloud = license?.Cloud === 'true';
    const isCloudFreeTrial = subscription?.is_free_trial === 'true';

    if (isCloud && isCloudFreeEnabled && !isCloudFreeTrial) {
        guessDisabled = (id: string) => {
            return (id === InviteType.GUEST);
        };
        guestDisabledClass = 'disabled-legend';
        badges = {
            matchVal: InviteType.GUEST as string,
            text: formatMessage({id: 'cloud_free.professional_feature.try_free', defaultMessage: 'Professional feature- try it out free'}),
        };
        extraGuessLegend = false;
    }

    return (
        <div className='InviteAs'>
            <div className={props.titleClass}>
                <FormattedMessage
                    id='invite_modal.as'
                    defaultMessage='Invite as'
                />
            </div>
            <div>
                <RadioGroup
                    onChange={(e) => props.setInviteAs(e.target.value as InviteType)}
                    value={props.inviteType}
                    id='invite-as'
                    values={[
                        {
                            key: (
                                <FormattedMessage
                                    id='invite_modal.choose_member'
                                    defaultMessage='Member'
                                />
                            ),
                            value: InviteType.MEMBER,
                            testId: 'inviteMembersLink',
                        },
                        {
                            key: (
                                <span className={`InviteAs__label ${guestDisabledClass}`}>
                                    <FormattedMessage
                                        id='invite_modal.choose_guest_a'
                                        defaultMessage='Guest'
                                    />
                                    {extraGuessLegend && <span className='InviteAs__label--parenthetical'>
                                        {' - '}
                                        <FormattedMessage
                                            id='invite_modal.choose_guest_b'
                                            defaultMessage='limited to select channels and teams'
                                        />
                                    </span>}
                                </span>
                            ),
                            value: InviteType.GUEST,
                            testId: 'inviteGuestLink',
                        },
                    ]}
                    isDisabled={guessDisabled}
                    badge={badges} // Mejor reemplazar el side legend aquí mismo, porque tiene que tener el otro click
                />
            </div>
        </div>
    );
}
