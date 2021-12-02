// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useSelector, useDispatch} from 'react-redux';

import {FormattedMessage} from 'react-intl';

import {DispatchFunc} from 'mattermost-redux/types/actions';
import {GlobalState} from 'mattermost-redux/types/store';

import {isModalOpen} from 'selectors/views/modals';

import GenericModal from 'components/generic_modal';
import AlertSvg from 'components/common/svg_images_components/alert_svg';

import {ModalIdentifiers} from 'utils/constants';

import {closeModal} from 'actions/views/modals';

import './ee_license_modal.scss';

type Props = {
    onClose?: () => void;
    handleRemove?: (e: any) => Promise<void>;
}

const ConfirmLicenseRemovalModal: React.FC<Props> = (props: Props): JSX.Element | null => {
    const dispatch = useDispatch<DispatchFunc>();

    const show = useSelector((state: GlobalState) => isModalOpen(state, ModalIdentifiers.CONFIRM_LICENSE_REMOVAL));
    if (!show) {
        return null;
    }

    const handleOnClose = () => {
        if (props.onClose) {
            props.onClose();
        }
        dispatch(closeModal(ModalIdentifiers.CONFIRM_LICENSE_REMOVAL));
    };

    const handleRemoval = (e: any) => {
        if (props.handleRemove) {
            props.handleRemove(e);
        }
        dispatch(closeModal(ModalIdentifiers.CONFIRM_LICENSE_REMOVAL));
    };

    // Note: DO NOT LOCALISE THESE STRINGS. Legally we can not since the license is in English.
    return (
        <GenericModal
            className={'ConfirmLicenseRemovalModal'}
            show={show}
            id='ConfirmLicenseRemovalModal'
            onExited={handleOnClose}
        >
            <>
                <div
                    className='title'
                >
                    {'Enterprise Edition License:'}
                </div>
                <div className='main-body'>
                    <div className='alert-svg'>
                        <AlertSvg
                            width={200}
                            height={200}
                        />
                    </div>
                    <div className='title'>
                        <FormattedMessage
                            id='admin.license.confirm-license-removal.title'
                            defaultMessage='Are you sure?'
                        />
                    </div>
                    <div className='subtitle'>
                        <FormattedMessage
                            id='admin.license.confirm-license-removal.subtitle'
                            defaultMessage='Removing the license will downgrade your server from Enterprise to Starter. You may lose information. '
                        />
                    </div>
                </div>
                <div className='content-footer'>
                    <button
                        onClick={handleOnClose}
                        className='btn btn-primary'
                    >
                        <FormattedMessage
                            id='admin.license.confirm-license-removal.cancel'
                            defaultMessage='Cancel'
                        />
                    </button>
                    <button
                        onClick={handleRemoval}
                        className='btn btn-primary'
                    >
                        <FormattedMessage
                            id='admin.license.confirm-license-removal.title'
                            defaultMessage='Confirm'
                        />
                    </button>
                </div>
            </>
        </GenericModal>
    );
};

export default ConfirmLicenseRemovalModal;
