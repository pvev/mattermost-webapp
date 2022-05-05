// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect} from 'react';

import {FormattedMessage} from 'react-intl';

import {trackEvent} from 'actions/telemetry_actions';

import {TELEMETRY_CATEGORIES} from 'utils/constants';

import GenericModal from 'components/generic_modal';

import './invite_guest_with_trial_modal.scss';

type Props = {
    onClose?: () => void;
    onExited: () => void;
}

const InviteGuestWithTrialModal = (
    {
        onClose,
        onExited,
    }: Props): JSX.Element | null => {
    useEffect(() => {
        trackEvent(
            TELEMETRY_CATEGORIES.CLOUD_START_TRIAL_MODAL,
            'invite_guest_trial_modal_view',
        );
    }, []);

    const handleOnClose = useCallback(() => {
        if (onClose) {
            onClose();
        }

        onExited();
    }, [onClose, onExited]);

    return (
        <GenericModal
            className='InviteGuestWithTrialModal'
            id='InviteGuestWithTrialModal'
            onExited={handleOnClose}
        >
            <div className='invite-guest-with-trial-title'>
                <FormattedMessage
                    id='invite_guest_with_trial.modal.title'
                    defaultMessage='Try inviting guests with a free trial'
                />
            </div>
            <div className='invite-guest-with-trial-description'>
                <FormattedMessage
                    id='invite_guest_with_trial.modal.description'
                    defaultMessage='Collaborate with users outside of your organization while tightly controlling their access to channels and team members. Get the full guest accounts experience when you start a free, 30-day trial.'
                />
            </div>
            <div className='start-trial-button'>
                {/* <StartCloudTrialBtn/> */}
                <button>{'Try free for 30 days'}</button>
            </div>
        </GenericModal>
    );
};

export default InviteGuestWithTrialModal;
