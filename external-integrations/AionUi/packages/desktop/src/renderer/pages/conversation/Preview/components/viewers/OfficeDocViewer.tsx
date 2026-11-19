// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import OfficeWatchViewer from './OfficeWatchViewer';

interface OfficeDocPreviewProps {
  file_path?: string;
  content?: string;
  workspace?: string;
}

const OfficeDocPreview: React.FC<OfficeDocPreviewProps> = (props) => <OfficeWatchViewer docType='word' {...props} />;

export default OfficeDocPreview;
