import React from 'react';
import {SectionVitrine} from './sections';

import { Trans } from 'react-i18next';
import { traduire } from '../langutils.js';

import './messages.css';

const MESSAGES_LIBELLE = 'page.messages', MESSAGES_URL = '/messages.json';

export class MessagesVitrine extends SectionVitrine {

  getDocumentLibelle() {
    return MESSAGES_LIBELLE;
  }

  getDocumentUrl() {
    return MESSAGES_URL;
  }

  render() {
    return (
      <div>
        <h1><Trans>messages.titrePage</Trans></h1>
      </div>
    );
  }
}
