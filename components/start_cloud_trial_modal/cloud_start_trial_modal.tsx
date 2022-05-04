// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';

import {FormattedMessage, useIntl} from 'react-intl';

import {trackEvent} from 'actions/telemetry_actions';

import {TELEMETRY_CATEGORIES} from 'utils/constants';

import GenericModal from 'components/generic_modal';
import FormattedMarkdownMessage from 'components/formatted_markdown_message';
import Input from 'components/widgets/inputs/input/input';

import {isEmail} from 'mattermost-redux/utils/helpers';

import StartCloudTrialBtn from './cloud_start_trial_btn';
import './cloud_start_trial_modal.scss';

type Props = {
    onClose?: () => void;
    onExited: () => void;
}

const CloudStartTrialModal = (
    {
        onClose,
        onExited,
    }: Props): JSX.Element | null => {
    const {formatMessage} = useIntl();
    const [email, setEmail] = useState<string>('');

    const [emailError, setEmailError] = useState<string>('');

    useEffect(() => {
        trackEvent(
            TELEMETRY_CATEGORIES.CLOUD_START_TRIAL_MODAL,
            'start_cloud_trial_modal_view',
        );
    }, []);

    const handleOnClose = useCallback(() => {
        if (onClose) {
            onClose();
        }

        onExited();
    }, [onClose, onExited]);

    const handleEmailValues = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const email = e.target.value;

        if (email) {
            setEmail(email.trim().toLowerCase());
        }
    }, []);

    const validateEmail = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const email = e.target.value;

        // function isEmail aready handle empty / null value
        if (isEmail(email)) {
            setEmailError('');
        } else {
            const errMsg = formatMessage({id: 'start_cloud_trial.modal.enter_trial_email.invalid', defaultMessage: 'This doesnt look like a bussiness email'});
            setEmailError(errMsg);
        }
    }, []);

    return (
        <GenericModal
            className='CloudStartTrialModal'
            id='cloudStartTrialModal'
            onExited={handleOnClose}
        >
            <div className='start-trial-email-title'>
                <FormattedMessage
                    id='start_cloud_trial.modal.enter_trial_email.title'
                    defaultMessage='Enter an email to start your trial'
                />
            </div>
            <div className='start-trial-email-description'>
                <FormattedMessage
                    id='start_cloud_trial.modal.enter_trial_email.description'
                    defaultMessage='Start a trial and enter a business email to get started. '
                />
            </div>
            <div className='start-trial-email-input'>
                <Input
                    type='email'
                    autoComplete='off'
                    autoFocus={true}
                    required={true}
                    value={email}
                    name='new-channel-modal-name'
                    containerClassName='new-channel-modal-name-container'
                    inputClassName='new-channel-modal-name-input'
                    label={formatMessage({id: 'start_cloud_trial.modal.enter_trial_email.input.label', defaultMessage: 'Enter business email'})}
                    placeholder={formatMessage({id: 'start_cloud_trial.modal.enter_trial_email.input.placeholder', defaultMessage: 'name@companyname.com'})}
                    onChange={handleEmailValues}
                    onBlur={validateEmail}
                    customError={emailError}
                />
            </div>
            <div className='start-trial-email-disclaimer'>
                <span>
                    <FormattedMarkdownMessage
                        id='start_trial.modal.disclaimer'
                        defaultMessage='By selecting “Start trial”, I agree to the [Mattermost Software Evaluation Agreement,](!https://mattermost.com/software-evaluation-agreement) [privacy policy,](!https://mattermost.com/privacy-policy/) and receiving product emails.'
                    />
                </span>
            </div>
            <div className='start-trial-button'>
                <StartCloudTrialBtn
                    message={formatMessage({id: 'cloud.startTrial.modal.btn', defaultMessage: 'Start trial'})}
                    email={email}
                    handleEmbargoError={() => null}
                    telemetryId='start_cloud_trial'
                />
            </div>
        </GenericModal>
    );
};

export default CloudStartTrialModal;
