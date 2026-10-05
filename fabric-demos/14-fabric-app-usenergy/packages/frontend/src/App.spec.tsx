//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import App from '@/App';

describe('App', () => {
  it('renders without throwing', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('mounts content into the document', () => {
    render(<App />);
    expect(document.body).not.toBeEmptyDOMElement();
  });

  it('renders an honest setup state when connector metadata is absent', () => {
    render(<App />);
    expect(screen.getByText('Connect the curated Lakehouse before exploring')).toBeInTheDocument();
    expect(screen.getByText(/No sample values are shown/)).toBeInTheDocument();
    expect(screen.queryByText(/synthetic demo data/i)).not.toBeInTheDocument();
  });
});
