// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';

// import ScoreEllipseSvg from 'components/common/svg_images_components/score_ellipse_svg';
import Chip from 'components/common/chip/chip';

import './dashboard.scss';

type ChipsInfoKeys = 'info' | 'warning' | 'error';

export type ChipsInfoType = { [key in ChipsInfoKeys]: number };

type ChipsListProps = {
    chipsData: ChipsInfoType;
};

const ChipsList = ({
    chipsData,
}: ChipsListProps): JSX.Element | null => {
    const chipsList = Object.entries(chipsData).map(([chipKey, count]) => {
        if (count === 0) {
            return false;
        }
        let id;
        let defaultMessage;

        switch (chipKey) {
        case 'info':
            id = 'admin.reporting.workspace_optimization.suggestions';
            defaultMessage = 'Suggestions';
            break;
        case 'warning':
            id = 'admin.reporting.workspace_optimization.warnings';
            defaultMessage = 'Warnings';
            break;
        case 'error':
        default:
            id = 'admin.reporting.workspace_optimization.problems';
            defaultMessage = 'Problems';
            break;
        }

        return (
            <Chip
                key={chipKey}
                id={id}
                defaultMessage={`${defaultMessage}: ${count}`}
                className={chipKey}
            />
        );
    });
    return (
        <>
            {chipsList}
        </>
    );
};

export default ChipsList;
