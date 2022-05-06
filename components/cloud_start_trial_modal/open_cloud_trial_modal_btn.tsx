// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {useIntl} from 'react-intl';

import {useDispatch} from 'react-redux';

import {DispatchFunc} from 'mattermost-redux/types/actions';

import {trackEvent} from 'actions/telemetry_actions';

import {openModal} from 'actions/views/modals';

import {ModalIdentifiers, TELEMETRY_CATEGORIES} from 'utils/constants';

import CloudStartTrialModal from './cloud_start_trial_modal';

export type OpenCloudTrialModalBtnProps = {
    telemetryId: string;
    onClick?: () => void;
};

const OpenCloudTrialModalBtn = ({
    telemetryId,
    onClick,
}: OpenCloudTrialModalBtnProps) => {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch<DispatchFunc>();

    const openTrialBenefitsModal = async () => {
        trackEvent(
            TELEMETRY_CATEGORIES.SELF_HOSTED_START_TRIAL_MODAL,
            telemetryId,
        );
        await dispatch(openModal({
            modalId: ModalIdentifiers.CLOUD_START_TRIAL_MODAL,
            dialogType: CloudStartTrialModal,
        }));

        if (onClick) {
            onClick();
        }
    };

    return (
        <button
            className='OpenCloudTrialModalBtn start-trial-btn'
            onClick={openTrialBenefitsModal}
        >
            {formatMessage({id: 'cloud_trial.open_modal.try_it_free', defaultMessage: 'Try free for 30 days'})}
        </button>
    );
};

export default OpenCloudTrialModalBtn;
