// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Posts} from 'mattermost-redux/constants';

import {shallowWithIntl} from 'tests/helpers/intl-test-helper';

import {Channel} from 'mattermost-redux/types/channels';

import AddMembersCallToAction from './add_members_call_to_action';

describe('components/post_view/channen_intro_message/add_members_call_to_action', () => {

    const setHeaderButton = React.createElement('button');
    let totalUsers = 9;
    const usersLimit = 10;
    const openChannel = {
        group_constrained: false,
        type: 'O',
        delete_at: 0
    } as Channel;

    const privateChannel = {
        group_constrained: false,
        type: 'P',
        delete_at: 0
    } as Channel;

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <AddMembersCallToAction setHeader={setHeaderButton} totalUsers={totalUsers} usersLimit={usersLimit} channel={openChannel} />,
        );

        expect(wrapper).toMatchSnapshot();
    });

});
