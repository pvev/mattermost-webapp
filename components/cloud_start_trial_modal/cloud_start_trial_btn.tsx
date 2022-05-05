// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react';

import {useIntl} from 'react-intl';

import {useDispatch, useSelector} from 'react-redux';

import {EmbargoedEntityTrialError} from 'components/admin_console/license_settings/trial_banner/trial_banner';

import {DispatchFunc} from 'mattermost-redux/types/actions';
import {getLicenseConfig} from 'mattermost-redux/actions/general';

import {GlobalState} from 'types/store';

import {requestCloudTrialLicense} from 'actions/admin_actions';

import {trackEvent} from 'actions/telemetry_actions';

import {closeModal, openModal} from 'actions/views/modals';

import TrialBenefitsModal from 'components/trial_benefits_modal/trial_benefits_modal';

import {ModalIdentifiers, TELEMETRY_CATEGORIES} from 'utils/constants';

export type CloudStartTrialBtnProps = {
    message: string;
    email: string;
    telemetryId: string;
    onClick?: () => void;
    handleEmbargoError?: () => void;
};

enum TrialLoadStatus {
    NotStarted = 'NOT_STARTED',
    Started = 'STARTED',
    Success = 'SUCCESS',
    Failed = 'FAILED',
    Embargoed = 'EMBARGOED',
}

const CloudStartTrialBtn = ({
    message,
    email,
    telemetryId,
    onClick,
    handleEmbargoError,
}: CloudStartTrialBtnProps) => {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch<DispatchFunc>();
    const stats = useSelector((state: GlobalState) => state.entities.admin.analytics);

    const [status, setLoadStatus] = useState(TrialLoadStatus.NotStarted);

    const requestLicense = async (): Promise<TrialLoadStatus> => {
        setLoadStatus(TrialLoadStatus.Started);
        let users = 0;
        if (stats && (typeof stats.TOTAL_USERS === 'number')) {
            users = stats.TOTAL_USERS;
        }
        const requestedUsers = Math.max(users, 30);
        const {error, data} = await dispatch(requestCloudTrialLicense(requestedUsers, true, true, 'start_cloud_trial', email));
        if (error) {
            if (typeof data?.status !== 'undefined' && data.status === 451) {
                setLoadStatus(TrialLoadStatus.Embargoed);
                if (typeof handleEmbargoError === 'function') {
                    handleEmbargoError();
                }
                return TrialLoadStatus.Embargoed;
            }
            setLoadStatus(TrialLoadStatus.Failed);
            return TrialLoadStatus.Failed;
        }

        await dispatch(getLicenseConfig());

        // TODO freemium maybe close the enter bussiness email modal?
        await dispatch(closeModal(ModalIdentifiers.CLOUD_START_TRIAL_MODAL));
        setLoadStatus(TrialLoadStatus.Success);
        return TrialLoadStatus.Success;
    };

    const openTrialBenefitsModal = async (status: TrialLoadStatus) => {
        // Only open the benefits modal if the trial request succeeded
        if (status !== TrialLoadStatus.Success) {
            return;
        }
        await dispatch(openModal({
            modalId: ModalIdentifiers.TRIAL_BENEFITS_MODAL,
            dialogType: TrialBenefitsModal,
            dialogProps: {trialJustStarted: true},
        }));
    };

    const btnText = (status: TrialLoadStatus): string => {
        switch (status) {
        case TrialLoadStatus.Started:
            return formatMessage({id: 'start_cloud_trial.modal.gettingTrial', defaultMessage: 'Getting Trial...'});
        case TrialLoadStatus.Success:
            return formatMessage({id: 'start_cloud_trial.modal.loaded', defaultMessage: 'Loaded!'});
        case TrialLoadStatus.Failed:
            return formatMessage({id: 'start_cloud_trial.modal.failed', defaultMessage: 'Failed'});
        case TrialLoadStatus.Embargoed:
            return formatMessage({id: 'admin.license.trial-request.embargoed'});
        default:
            return message;
        }
    };
    const startCloudTrial = async () => {
        // reading status from here instead of normal flow because
        // by the time the function needs the updated value from requestLicense,
        // it will be too late to wait for the render cycle to happen again
        // to close over the updated value
        const updatedStatus = await requestLicense();
        await openTrialBenefitsModal(updatedStatus);
        if (onClick && updatedStatus === TrialLoadStatus.Success) {
            onClick();
        }
        trackEvent(
            TELEMETRY_CATEGORIES.SELF_HOSTED_START_TRIAL_MODAL,
            telemetryId,
        );
    };

    if (status === TrialLoadStatus.Embargoed) {
        return (
            <div className='CloudStartTrialBtn embargoed'>
                <EmbargoedEntityTrialError/>
            </div>
        );
    }
    return (
        <button
            className='CloudStartTrialBtn start-trial-btn'
            onClick={startCloudTrial}
        >
            {btnText(status)}
        </button>
    );
};

export default CloudStartTrialBtn;
