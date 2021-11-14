/* eslint-disable header/header */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable react/no-string-refs */

import React from 'react';
import {FormattedDate, FormattedTime, FormattedMessage} from 'react-intl';

import {ClientConfig, ClientLicense} from 'mattermost-redux/types/config';
import {ActionResult} from 'mattermost-redux/types/actions';
import {StatusOK} from 'mattermost-redux/types/client4';

import * as Utils from 'utils/utils.jsx';
import {isLicenseExpired, isLicenseExpiring, isTrialLicense} from 'utils/license_utils.jsx';

import * as AdminActions from 'actions/admin_actions.jsx';
import {trackEvent} from 'actions/telemetry_actions';

import FormattedMarkdownMessage from 'components/formatted_markdown_message.jsx';
import FormattedAdminHeader from 'components/widgets/admin_console/formatted_admin_header';
import LoadingWrapper from 'components/widgets/loading/loading_wrapper';

import {AboutLinks, CloudLinks, ModalIdentifiers} from 'utils/constants';

import {ModalData} from 'types/actions';

import RenewLinkCard from './renew_license_card/renew_license_card';
import TrialLicenseCard from './trial_license_card/trial_license_card';

import './license_settings.scss';

import TeamEditionLeftPanel from './team_edition/team_edition_left_panel';
import TeamEditionRightPanel from './team_edition/team_edition_right_panel';
import StarterEditionLeftPanel from './starter_edition/starter_edition_left_panel';
import StarterEditionRightPanel from './starter_edition/starter_edition_right_panel';
import EnterpriseVersionsLeftPanel from './enterprise_versions/enterprise_versions_left_panel';
import EnterpriseVersionsRightPanel from './enterprise_versions/enterprise_versions_right_panel';
import EELicenseModal from './ee_license_modal/ee_license_modal';
import {free30DayTrial} from './license_utils/license_utils';

type Props = {
    license: ClientLicense;
    enterpriseReady: boolean;
    upgradedFromTE: boolean;
    stats: any;
    config: Partial<ClientConfig>;
    isDisabled: boolean;
    prevTrialLicense: ClientLicense;
    actions: {
        getLicenseConfig: () => void;
        uploadLicense: (file: File) => Promise<ActionResult>;
        removeLicense: () => Promise<ActionResult>;
        getPrevTrialLicense: () => void;
        upgradeToE0: () => Promise<StatusOK>;
        upgradeToE0Status: () => Promise<ActionResult>;
        restartServer: () => Promise<StatusOK>;
        ping: () => Promise<{status: string}>;
        requestTrialLicense: (users: number, termsAccepted: boolean, receiveEmailsAccepted: boolean, featureName: string) => Promise<ActionResult>;
        openModal: <P>(modalData: ModalData<P>) => void;
    };
}

type State = {
    fileSelected: boolean;
    fileName: string | null;
    serverError: string | null;
    gettingTrialError: string | null;
    gettingTrial: boolean;
    removing: boolean;
    uploading: boolean;
    upgradingPercentage: number;
    upgradeError: string | null;
    restarting: boolean;
    restartError: string | null;
};
export default class LicenseSettings extends React.PureComponent<Props, State> {
    private fileInputRef: React.RefObject<HTMLInputElement>;
    private interval: ReturnType<typeof setInterval> | null;

    constructor(props: Props) {
        super(props);

        this.interval = null;
        this.state = {
            fileSelected: false,
            fileName: null,
            serverError: null,
            gettingTrialError: null,
            gettingTrial: false,
            removing: false,
            uploading: false,
            upgradingPercentage: 0,
            upgradeError: null,
            restarting: false,
            restartError: null,
        };

        this.fileInputRef = React.createRef();
    }

    componentDidMount() {
        if (this.props.enterpriseReady) {
            this.props.actions.getPrevTrialLicense();
        } else {
            this.reloadPercentage();
        }
        this.props.actions.getLicenseConfig();
        AdminActions.getStandardAnalytics();
    }

    componentWillUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    reloadPercentage = async () => {
        const {data: percentage, error} = await this.props.actions.upgradeToE0Status();
        if (percentage === 100 || error) {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
                if (error) {
                    trackEvent('api', 'upgrade_to_e0_failed', {error});
                } else {
                    trackEvent('api', 'upgrade_to_e0_success');
                }
            }
        } else if (percentage > 0 && !this.interval) {
            this.interval = setInterval(this.reloadPercentage, 2000);
        }
        this.setState({upgradingPercentage: percentage || 0, upgradeError: error as string});
    }

    handleChange = () => {
        const element = this.fileInputRef.current;
        if (element !== null && element.files !== null) {
            if (element.files.length > 0) {
                this.setState({fileSelected: true, fileName: element.files[0].name});
            }
        }
    }

    handleSubmit = async (e: any) => {
        e.preventDefault();

        const element = this.fileInputRef.current;
        if (!element || (element && element.files?.length === 0)) {
            return;
        }
        const files = element.files;
        const file = files && files.length > 0 ? files[0] : null;

        if (file === null) {
            return;
        }

        this.setState({uploading: true});

        const {error} = await this.props.actions.uploadLicense(file);
        if (error) {
            Utils.clearFileInput(element);
            this.setState({fileSelected: false, fileName: null, serverError: error.message, uploading: false});
            return;
        }

        await this.props.actions.getLicenseConfig();
        this.setState({fileSelected: false, fileName: null, serverError: null, uploading: false});
    }

    openEELicenseModal = async () => {
        this.props.actions.openModal({
            modalId: ModalIdentifiers.ENTERPRISE_EDITION_LICENSE,
            dialogType: EELicenseModal,
        });
    };

    handleRemove = async (e: any) => {
        e.preventDefault();

        this.setState({removing: true});

        const {error} = await this.props.actions.removeLicense();
        if (error) {
            this.setState({fileSelected: false, fileName: null, serverError: error.message, removing: false});
            return;
        }

        this.props.actions.getPrevTrialLicense();
        await this.props.actions.getLicenseConfig();
        this.setState({fileSelected: false, fileName: null, serverError: null, removing: false});
    }

    handleUpgrade = async (e: any) => {
        e.preventDefault();
        if (this.state.upgradingPercentage > 0) {
            return;
        }
        try {
            await this.props.actions.upgradeToE0();
            this.setState({upgradingPercentage: 1});
            await this.reloadPercentage();
        } catch (error: any) {
            trackEvent('api', 'upgrade_to_e0_failed', {error: error.message as string});
            this.setState({upgradeError: error.message, upgradingPercentage: 0});
        }
    }

    requestLicense = async (e: any) => {
        e.preventDefault();
        if (this.state.gettingTrial) {
            return;
        }
        this.setState({gettingTrial: true, gettingTrialError: null});
        const requestedUsers = Math.max(this.props.stats.TOTAL_USERS, 30);
        const {error} = await this.props.actions.requestTrialLicense(requestedUsers, true, true, 'license');
        if (error) {
            this.setState({gettingTrialError: error});
        }
        this.setState({gettingTrial: false});
        this.props.actions.getLicenseConfig();
    }

    checkRestarted = () => {
        this.props.actions.ping().then(() => {
            window.location.reload();
        }).catch(() => {
            setTimeout(this.checkRestarted, 1000);
        });
    }

    handleRestart = async (e: any) => {
        e.preventDefault();
        this.setState({restarting: true});
        try {
            await this.props.actions.restartServer();
        } catch (err) {
            this.setState({restarting: false, restartError: err as string});
        }
        setTimeout(this.checkRestarted, 1000);
    }

    currentPlan = (
        <div className='current-plan-legend'>
            <i className='icon-check-circle'/>
            {'Current Plan'}
        </div>
    );

    createLink = (link: string, text: string) => {
        return (
            <a
                target='_blank'
                id='privacyLink'
                rel='noopener noreferrer'
                href={link}
            >
                {text}
            </a>
        );
    }

    termsAndPolicy = (
        <div className='terms-and-policy'>
            {'See also '}
            {this.createLink(AboutLinks.TERMS_OF_SERVICE, 'Enterprise Edition Terms of Service')}
            {' and '}
            {this.createLink(AboutLinks.PRIVACY_POLICY, 'Privacy Policy')}
        </div>
    );

    comparePlans = (
        <div className='compare-plans-text'>
            {'Curious about upgrading? '}
            {this.createLink(CloudLinks.PRICING, 'Compare Plans')}
        </div>
    );

    renderStartTrial = (isDisabled: boolean, gettingTrialError: JSX.Element | null) => {
        return (
            <React.Fragment>
                <p className='trial'>
                    <button
                        type='button'
                        className='btn btn-primary'
                        onClick={this.requestLicense}
                        disabled={isDisabled}
                    >
                        <LoadingWrapper
                            loading={this.state.gettingTrial}
                            text={Utils.localizeMessage('admin.license.trial-request.loading', 'Getting trial')}
                        >
                            <FormattedMessage
                                id='admin.license.trial-request.submit'
                                defaultMessage='Start trial'
                            />
                        </LoadingWrapper>
                    </button>
                </p>
                {gettingTrialError}
                <p className='trial-legal-terms'>
                    <FormattedMarkdownMessage
                        id='admin.license.trial-request.accept-terms'
                        defaultMessage='By clicking **Start trial**, I agree to the [Mattermost Software Evaluation Agreement](!https://mattermost.com/software-evaluation-agreement/), [Privacy Policy](!https://mattermost.com/privacy-policy/), and receiving product emails.'
                    />
                </p>
            </React.Fragment>
        );
    }

    render() {
        let gettingTrialError: JSX.Element | null = null;
        if (this.state.gettingTrialError) {
            gettingTrialError = (
                <p className='trial-error'>
                    <FormattedMarkdownMessage
                        id='admin.license.trial-request.error'
                        defaultMessage='Trial license could not be retrieved. Visit [https://mattermost.com/trial/](https://mattermost.com/trial/) to request a license.'
                    />
                </p>
            );
        }

        const {license, upgradedFromTE, isDisabled} = this.props;
        const {uploading} = this.state;

        // let edition;
        // let licenseType;
        // let licenseContent;
        // let eelicense;

        const issued = (
            <React.Fragment>
                <FormattedDate value={new Date(parseInt(license.IssuedAt, 10))}/>
                {' '}
                <FormattedTime value={new Date(parseInt(license.IssuedAt, 10))}/>
            </React.Fragment>
        );
        const startsAt = <FormattedDate value={new Date(parseInt(license.StartsAt, 10))}/>;
        const expiresAt = <FormattedDate value={new Date(parseInt(license.ExpiresAt, 10))}/>;

        let leftPanel = null;
        let rightPanel = null;

        if (!this.props.enterpriseReady) { // Team Edition
            // Note: DO NOT LOCALISE THESE STRINGS. Legally we can not since the license is in English.
            leftPanel = (
                <TeamEditionLeftPanel
                    openEELicenseModal={this.openEELicenseModal}
                    currentPlan={this.currentPlan}
                />
            );

            rightPanel = (
                <TeamEditionRightPanel
                    upgradingPercentage={this.state.upgradingPercentage}
                    upgradeError={this.state.upgradeError}
                    restartError={this.state.restartError}
                    handleRestart={this.handleRestart}
                    handleUpgrade={this.handleUpgrade}
                    restarting={this.state.restarting}
                    openEEModal={this.openEELicenseModal}
                />
            );
        } else if (license.IsLicensed === 'true' && !uploading) {
            // Note: DO NOT LOCALISE THESE STRINGS. Legally we can not since the license is in English.
            // let skuShortName = license.SkuShortName;
            // if (isTrialLicense(license)) {
            //     skuShortName = `${license.SkuShortName} Trial`;
            // }
            // const sku = license.SkuShortName ? <React.Fragment>{`Edition: Mattermost Enterprise Edition ${skuShortName}`}<br/></React.Fragment> : null;
            // if (license.SkuShortName === 'E20') {
            //     edition = 'Mattermost Enterprise Edition. Enterprise features on this server have been unlocked with a license key.';
            // } else {
            //     edition = 'Mattermost Professional Edition. Enterprise features on this server have been unlocked with a license key.';
            // }
            // if (upgradedFromTE) {
            //     eelicense = this.renderEELicenseText();
            // }
            // licenseType = (
            //     <div>
            //         {!upgradedFromTE &&
            //             <p>
            //                 {'This software is offered under a commercial license.\n\nSee ENTERPRISE-EDITION-LICENSE.txt in your root install directory for details. See NOTICE.txt for information about open source software used in this system.\n\nYour subscription details are as follows:'}
            //             </p>}
            //         {upgradedFromTE &&
            //             <div>
            //                 <p>{'When using Mattermost Enterprise Edition, the software is offered under a commercial license. See below for “Enterprise Edition License” for details.'}</p>
            //                 <p>{'See NOTICE.txt for information about open source software used in the system.'}</p>
            //                 <p>{'Your subscription details are as follows:'}</p>
            //             </div>}
            //         {`Name: ${license.Name}`}<br/>
            //         {`Company or organization name: ${license.Company}`}<br/>
            //         {sku}
            //         {`Number of users: ${license.Users}`}<br/>
            //         {'License issued: '}{issued}<br/>
            //         {'Start date of license: '}{startsAt}<br/>
            //         {'Expiry date of license: '}{expiresAt}<br/>
            //         <br/>
            //         {'See also '}
            //         <a
            //             rel='noopener noreferrer'
            //             target='_blank'
            //             href='https://about.mattermost.com/enterprise-edition-terms/'
            //         >{'Enterprise Edition Terms of Service'}</a>{' and '}
            //         <a
            //             data-testid='privacyPolicyLink'
            //             rel='noopener noreferrer'
            //             target='_blank'
            //             href='https://about.mattermost.com/default-privacy-policy/'
            //         >{'Privacy Policy.'}</a>
            //     </div>
            // );
            // licenseContent = this.renderE10E20Content();
            leftPanel = (
                <EnterpriseVersionsLeftPanel
                    openEELicenseModal={this.openEELicenseModal}
                    upgradedFromTE={upgradedFromTE}
                    license={license}
                    isTrialLicense={isTrialLicense(license)}
                    issued={issued}
                    startsAt={startsAt}
                    expiresAt={expiresAt}
                    handleRemove={this.handleRemove}
                    isDisabled={isDisabled}
                    removing={this.state.removing}
                />
            );

            rightPanel = (
                <EnterpriseVersionsRightPanel
                    isTrialLicense={isTrialLicense(license)}
                    license={license}
                />
            );
        } else {
            // Note: DO NOT LOCALISE THESE STRINGS. Legally we can not since the license is in English.
            // This is Mattermost Starter (Already downloaded the binary but no license has been set, or ended the trial period)

            leftPanel = (
                <StarterEditionLeftPanel
                    openEELicenseModal={this.openEELicenseModal}
                    currentPlan={this.currentPlan}
                    upgradedFromTE={this.props.upgradedFromTE}
                    serverError={this.state.serverError}
                    fileSelected={this.state.fileSelected}
                    fileName={this.state.fileName}
                    uploading={this.state.uploading}
                    fileInputRef={this.fileInputRef}
                    isDisabled={this.props.isDisabled}
                    handleChange={this.handleChange}
                    handleSubmit={this.handleSubmit}
                />
            );

            rightPanel = (
                <StarterEditionRightPanel/>
            );

            // edition = (
            //     <div>
            //         {'Mattermost Enterprise Edition. A license is required to unlock enterprise features.'}
            //     </div>
            // );

            // if (upgradedFromTE) {
            //     licenseType = (
            //         <div>
            //             <p>{'When using Mattermost Enterprise Edition, the software is offered under a commercial license. See below for “Enterprise Edition License” for details.'}</p>
            //             <p>{'See NOTICE.txt for information about open source software used in the system.'}</p>
            //         </div>
            //     );
            //     eelicense = this.renderEELicenseText();
            // } else {
            //     licenseType = 'This software is offered under a commercial license.\n\nSee ENTERPRISE-EDITION-LICENSE.txt in your root install directory for details. See NOTICE.txt for information about open source software used in this system.';
            // }

            // licenseContent = this.renderE0Content();
        }

        return (
            <div className='wrapper--fixed'>
                <FormattedAdminHeader
                    id='admin.license.title'
                    defaultMessage='Edition and License'
                />

                <div className='admin-console__wrapper'>
                    <div className='admin-console__content'>
                        <div className='admin-console__banner_section'>
                            {this.props.prevTrialLicense?.IsLicensed !== 'true' &&
                                free30DayTrial(
                                    isDisabled,
                                    gettingTrialError,
                                    this.requestLicense,
                                    this.state.gettingTrial,
                                )
                            }
                        </div>
                        <div className='top-wrapper'>
                            <div className='left-pannel'>
                                <div className='panel-card'>
                                    {leftPanel}
                                </div>
                                {(!isTrialLicense(license)) && this.termsAndPolicy}
                            </div>
                            <div className='right-pannel'>
                                <div className='panel-card'>
                                    {rightPanel}
                                </div>
                                {this.comparePlans}
                            </div>
                        </div>
                        {/* <form
                            className='form-horizontal'
                            role='form'
                        >
                            {this.renewLicenseCard()}
                            <div className='form-group'>
                                <label
                                    className='control-label col-sm-4'
                                >
                                    <FormattedMessage
                                        id='admin.license.edition'
                                        defaultMessage='Edition: '
                                    />
                                </label>
                                <div className='col-sm-8'>
                                    {edition}
                                </div>
                            </div>
                            <div className='form-group'>
                                <label
                                    className='control-label col-sm-4'
                                >
                                    <FormattedMessage
                                        id='admin.license.type'
                                        defaultMessage='License: '
                                    />
                                </label>
                                <div className='col-sm-8'>
                                    {licenseType}
                                </div>
                            </div>
                            {licenseContent &&
                                <div className='form-group'>
                                    {licenseContent}
                                </div>}
                            {eelicense &&
                                <div className='form-group'>
                                    {eelicense}
                                </div>}
                        </form> */}
                    </div>
                </div>
            </div>
        );
    }

    // renderE10E20Content = () => {
    //     let removeButtonText = (
    //         <FormattedMessage
    //             id='admin.license.keyRemove'
    //             defaultMessage='Remove License and Downgrade Server'
    //         />
    //     );
    //     if (this.state.removing) {
    //         removeButtonText = (
    //             <FormattedMessage
    //                 id='admin.license.removing'
    //                 defaultMessage='Removing License...'
    //             />
    //         );
    //     }

    //     return (
    //         <>
    //             <label
    //                 className='control-label col-sm-4'
    //             >
    //                 <FormattedMessage
    //                     id='admin.license.key'
    //                     defaultMessage='License Key: '
    //                 />
    //             </label>
    //             <div className='col-sm-8'>
    //                 <button
    //                     type='button'
    //                     className='btn btn-danger'
    //                     onClick={this.handleRemove}
    //                     disabled={this.props.isDisabled}
    //                     id='remove-button'
    //                     data-testid='remove-button'
    //                 >
    //                     {removeButtonText}
    //                 </button>
    //                 <br/>
    //                 <br/>
    //                 <p className='help-text'>
    //                     {'If you migrate servers you may need to remove your license key to install it elsewhere. You can remove the key here, which will revert functionality to that of Team Edition.'}
    //                 </p>
    //             </div>
    //         </>
    //     );
    // }

    // renderE0Content = () => {
    //     let serverError: any = '';
    //     if (this.state.serverError) {
    //         serverError = (<div className='col-sm-12'><div className='form-group has-error'><label className='control-label'>
    //             <Markdown
    //                 enableFormatting={true}
    //                 message={this.state.serverError}
    //             />
    //         </label></div></div>);
    //     }

    //     let btnClass = 'btn';
    //     if (this.state.fileSelected) {
    //         btnClass = 'btn btn-primary';
    //     }

    //     let fileName;
    //     if (this.state.fileName) {
    //         fileName = this.state.fileName;
    //     } else {
    //         fileName = (
    //             <FormattedMessage
    //                 id='admin.license.noFile'
    //                 defaultMessage='No file uploaded'
    //             />
    //         );
    //     }

    //     let uploadButtonText = (
    //         <FormattedMessage
    //             id='admin.license.upload'
    //             defaultMessage='Upload'
    //         />
    //     );
    //     if (this.state.uploading) {
    //         uploadButtonText = (
    //             <FormattedMessage
    //                 id='admin.license.uploading'
    //                 defaultMessage='Uploading License...'
    //             />
    //         );
    //     }
    //     return (
    //         <>
    //             <label
    //                 className='control-label col-sm-4'
    //             >
    //                 <FormattedMessage
    //                     id='admin.license.key'
    //                     defaultMessage='License Key: '
    //                 />
    //             </label>
    //             <div className='col-sm-8'>
    //                 <div className='file__upload'>
    //                     <button
    //                         type='button'
    //                         className='btn btn-primary'
    //                     >
    //                         <FormattedMessage
    //                             id='admin.license.choose'
    //                             defaultMessage='Choose File'
    //                         />
    //                     </button>
    //                     <input
    //                         ref={this.fileInputRef}
    //                         type='file'
    //                         accept='.mattermost-license'
    //                         onChange={this.handleChange}
    //                         disabled={this.props.isDisabled}
    //                     />
    //                 </div>
    //                 <button
    //                     className={btnClass}
    //                     disabled={this.props.isDisabled || !this.state.fileSelected}
    //                     onClick={this.handleSubmit}
    //                     id='upload-button'
    //                 >
    //                     {uploadButtonText}
    //                 </button>
    //                 <div className='help-text m-0'>
    //                     {fileName}
    //                 </div>
    //                 <br/>
    //                 {serverError}
    //                 <p className='help-text m-0'>
    //                     <FormattedMarkdownMessage
    //                         id='admin.license.uploadDesc'
    //                         defaultMessage='Upload a license key for Mattermost Enterprise Edition to upgrade this server. [Visit us online](!http://mattermost.com) to learn more about the benefits of Enterprise Edition or to purchase a key.'
    //                     />
    //                 </p>
    //             </div>
    //         </>
    //     );
    // }

    // renderEELicenseText = () => {
    //     return (
    //         <>
    //             <label
    //                 className='control-label col-sm-4'
    //             >
    //                 <FormattedMessage
    //                     id='admin.license.enterprise-edition-license'
    //                     defaultMessage='Enterprise Edition License:'
    //                 />
    //             </label>
    //             <div className='col-sm-8 enterprise-license-text'>
    //                 <div>
    //                     <p>{'The Mattermost Enterprise Edition (EE) license (the “EE License”)'}</p>
    //                     <p>{'Copyright (c) 2016-present Mattermost, Inc.'}</p>
    //                     <p>{'The subscription-only features of the Mattermost Enterprise Edition software and associated documentation files (the "Software") may only be used if you (and any entity that you represent) (i) have agreed to, and are in compliance with, the Mattermost Subscription Terms of Service, available at https://about.mattermost.com/enterprise-edition-terms/ (the “EE Terms”), and (ii) otherwise have a valid Mattermost Enterprise Edition subscription for the correct features, number of user seats and instances of Mattermost Enterprise Edition that you are running, accessing, or using.  You may, however, utilize the free version of the Software (with several features not enabled) under this license without a license key or subscription provided that you otherwise comply with the terms and conditions of this Agreement. Subject to the foregoing, except as explicitly permitted in the EE Terms, it is forbidden to copy, merge, modify, publish, distribute, sublicense, stream, perform, display, create derivative works of and/or sell the Software in either source or executable form without written agreement from Mattermost.  Notwithstanding anything to the contrary, free versions of the Software are provided “AS-IS” without indemnification, support, or warranties of any kind, expressed or implied. You assume all risk associated with any use of free versions of the Software.'}</p>
    //                     <p>{'EXCEPT AS OTHERWISE SET FORTH IN A BINDING WRITTEN AGREEMENT BETWEEN YOU AND MATTERMOST, THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.'}</p>
    //                 </div>
    //             </div>
    //         </>
    //     );
    // }

    renewLicenseCard = () => {
        const {isDisabled} = this.props;
        if (isTrialLicense(this.props.license)) {
            return (
                <TrialLicenseCard
                    license={this.props.license}
                />
            );
        }
        if (isLicenseExpired(this.props.license) || isLicenseExpiring(this.props.license)) {
            return (
                <RenewLinkCard
                    license={this.props.license}
                    isLicenseExpired={isLicenseExpired(this.props.license)}
                    totalUsers={this.props.stats.TOTAL_USERS}
                    isDisabled={isDisabled}
                />
            );
        }
        return null;
    }
}
/* eslint-enable react/no-string-refs */
