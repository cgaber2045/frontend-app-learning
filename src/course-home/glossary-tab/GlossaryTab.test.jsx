import React from 'react';
import { Factory } from 'rosie';
import { getConfig } from '@edx/frontend-platform';
import { sendTrackEvent } from '@edx/frontend-platform/analytics';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import MockAdapter from 'axios-mock-adapter';

import {
  fireEvent, initializeMockApp, logUnhandledRequests, render, screen, act,
} from '../../setupTest';
import { appendBrowserTimezoneToUrl, executeThunk } from '../../utils';
import * as thunks from '../data/thunks';
import GlossaryTab from './GlossaryTab';
import LoadedTabPage from '../../tab-page/LoadedTabPage';

initializeMockApp();
jest.mock('@edx/frontend-platform/analytics');

describe('Glossary Tab', () => {
  
});
