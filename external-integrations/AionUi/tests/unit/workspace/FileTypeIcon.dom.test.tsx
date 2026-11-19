// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
// ║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
// ║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
// ║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
// ║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
// ║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FileTypeIcon from '@/renderer/pages/conversation/Workspace/components/FileTypeIcon';

describe('FileTypeIcon', () => {
  it('renders a file icon for a file node', () => {
    render(<FileTypeIcon node={{ name: 'report.pdf', relativePath: 'report.pdf', isFile: true }} />);
    expect(screen.getByTestId('file-type-icon-file')).toBeInTheDocument();
    expect(screen.queryByTestId('file-type-icon-folder')).not.toBeInTheDocument();
  });

  it('renders a folder icon for a directory node', () => {
    render(<FileTypeIcon node={{ name: 'src', relativePath: 'src', isFile: false }} />);
    expect(screen.getByTestId('file-type-icon-folder')).toBeInTheDocument();
    expect(screen.queryByTestId('file-type-icon-file')).not.toBeInTheDocument();
  });
});
