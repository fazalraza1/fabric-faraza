// #region rayfin:app-owned — copied verbatim by the Rayfin CLI; edit freely.
//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import type {
  ConnectorConfig,
  ConnectorsRuntime,
} from '@microsoft/rayfin-connectors';
import {
  connectorConfig as stateenergylakehouseConfig,
  type StateenergylakehouseSchema,
} from '../../../../rayfin/connectors/stateenergylakehouse/schema';
// #endregion rayfin:app-owned

export type AppConnectorsSchema = {
  stateenergylakehouse: StateenergylakehouseSchema;
};

export const connectorConfigs: Record<string, ConnectorConfig> = {
  stateenergylakehouse: stateenergylakehouseConfig,
};

export const connectorRuntimes: ConnectorsRuntime = {};
