import React from 'react';
import ToggleModalButtonRedux from 'components/toggle_modal_button_redux';
import ToggleModalButton from 'components/toggle_modal_button.jsx';

import {FormattedMessage} from 'react-intl';
import {Channel} from 'mattermost-redux/types/channels';


import InvitationModal from 'components/invitation_modal';
import ChannelInviteModal from 'components/channel_invite_modal';

import {ModalIdentifiers} from 'utils/constants';
import * as Utils from 'utils/utils.jsx';


import './add_members_call_to_action.scss';
import MembersSvg from './members_illustration.svg';

export interface AddMembersCallToActionProps {
    totalUsers: number;
    usersLimit: number;
    channel: Channel;
}
 
const AddMembersCallToAction: React.FC<AddMembersCallToActionProps> = ({totalUsers, usersLimit, channel}: AddMembersCallToActionProps) => {
    const inviteUsers = totalUsers > usersLimit;
    return ( 
         inviteUsers ? lessThanMaxFreeUsers() :moreThanMaxFreeUsers(channel)
     );
};

const lessThanMaxFreeUsers = () => {
    return (
        <div className="LessThanMaxFreeUsers">
            <MembersSvg/>
            <div className="titleAndButton">
                <FormattedMessage
                    id='intro_messages.inviteOthersToWorkspace.title'
                    defaultMessage='Let’s add some people to the workspace!'
                />
                <ToggleModalButtonRedux
                    accessibilityLabel={Utils.localizeMessage('intro_messages.inviteOthers', 'Invite others to this team')}
                    id='introTextInvite'
                    className='intro-links color--link cursor--pointer'
                    modalId={ModalIdentifiers.INVITATION}
                    dialogType={InvitationModal}
                >
                    <FormattedMessage
                        id='generic_icons.add'
                        defaultMessage='Add Icon'
                    >
                        {(title: string) => (
                            <i
                                className='icon fa fa-envelope'
                                title={title}
                            />
                        )}
                    </FormattedMessage>
                    <FormattedMessage
                        id='intro_messages.inviteOthersToWorkspace.button'
                        defaultMessage='Invite others to the workspace'
                    />
                </ToggleModalButtonRedux>
            </div>
        </div>
    )
}

const moreThanMaxFreeUsers = (channel: Channel) => {
    const modal = ChannelInviteModal;
    const channelIsArchived = channel.delete_at !== 0;
    if (channelIsArchived) {
        return null;
    }
    return (
        <div className="MoreThanMaxFreeUsers">
            <ToggleModalButton
                className='intro-links color--link'
                dialogType={modal}
                dialogProps={{channel}}
            >
                <FormattedMessage
                    id='generic_icons.add'
                    defaultMessage='Add Icon'
                >
                    {(title: string) => (
                        <i
                            className='fa fa-user-plus'
                            title={title}
                        />
                    )}
                </FormattedMessage>
                    <FormattedMessage
                        id='intro_messages.inviteOthersToChannel.button'
                        defaultMessage='Add members to this channel'
                    />
            </ToggleModalButton>
        </div>
    )
}
 
export default AddMembersCallToAction;