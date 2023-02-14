// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useSelector} from 'react-redux';

import {GlobalState} from 'types/store';
import {PluginComponent} from 'types/store/plugins';

type HookReturnType = {
    pluggableId: string;
    pluginIdsList: Map<string, string>;
    pluginComponent: PluginComponent | undefined;
};

export const useGetRHSPluggablesIds = (): HookReturnType => {
    const rhsPlugins = useSelector((state: GlobalState) => state.plugins.components.RightHandSidebarComponent);
    const pluggableId = useSelector((state: GlobalState) => state.views.rhs.pluggableId);

    const pluginIdsList: Map<string, string> = new Map<string, string>();
    rhsPlugins.forEach((plugin) => pluginIdsList.set(plugin.pluginId, plugin.id));

    const pluginComponent = rhsPlugins.find((element: PluginComponent) => element.id === pluggableId);

    return {pluggableId, pluginIdsList, pluginComponent};
};
