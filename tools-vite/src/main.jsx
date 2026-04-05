import React from 'react';
import { createRoot } from 'react-dom/client';
import { CaseConverter } from './tools/case-converter/CaseConverter.jsx';

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<CaseConverter />);