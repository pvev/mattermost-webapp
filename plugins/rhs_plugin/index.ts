// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';

import {GlobalState} from 'types/store';
import {PluginComponent} from 'types/store/plugins';

import {getInt} from 'mattermost-redux/selectors/entities/preferences';

import {getWorkTemplatesLinkedProducts} from 'mattermost-redux/selectors/entities/general';

import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';

import {getActiveRhsComponent, getPluggableId} from 'selectors/rhs';

import {TutorialTourName, WorkTemplateTourSteps} from 'components/tours';

import {suitePluginIds} from 'utils/constants';

import RHSPlugin from './rhs_plugin';

function mapStateToProps(state: GlobalState) {
    const rhsPlugins: PluginComponent[] = state.plugins.components.RightHandSidebarComponent;
    const pluggableId = getPluggableId(state);
    const pluginComponent = rhsPlugins.find((element: PluginComponent) => element.id === pluggableId);
    const pluginTitle = pluginComponent ? pluginComponent.title : '';

    // work templates related code to show the tourtip
    const activeRhsComponent = getActiveRhsComponent(state);
    const pluginId = activeRhsComponent?.pluginId || '';

    const currentUserId = getCurrentUserId(state);
    const enableTutorial = state.entities.general.config.EnableTutorial === 'true';

    const tutorialStep = getInt(state, TutorialTourName.WORK_TEMPLATE_TUTORIAL, currentUserId, 0);

    // commented out until we define if we only show it once and hide it forever after discarded, or shown on every template creation
    const workTemplateTourTipShown = tutorialStep === WorkTemplateTourSteps.FINISHED;
    const showProductTour = !workTemplateTourTipShown && enableTutorial;

    // for showing the tourtip
    const channelLinkedItems = showProductTour ? getWorkTemplatesLinkedProducts(state) : {};

    const boardsCount = channelLinkedItems?.boards || 0;
    const playbooksCount = channelLinkedItems?.playbooks || 0;

    const showBoardsTour = showProductTour && pluginId === suitePluginIds.boards && boardsCount > 0;
    const showPlaybooksTour = showProductTour && pluginId === suitePluginIds.playbooks && playbooksCount > 0;

    return {
        showPluggable: Boolean(pluginComponent),
        pluggableId,
        workTemplateTourData: {
            showBoardsTour,
            showPlaybooksTour,
            boardsCount: channelLinkedItems.boards,
            playbooksCount: channelLinkedItems.playbooks,
        },
        title: pluginTitle,
        pluginId,
    };
}

export default connect(mapStateToProps)(RHSPlugin);
