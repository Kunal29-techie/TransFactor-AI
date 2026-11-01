import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Workspace from './pages/Workspace';
import SequenceEditor from './pages/SequenceEditor';
import ProjectHistory from './pages/ProjectHistory';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="workspace" element={<Workspace />} />
          <Route path="editor" element={<SequenceEditor />} />
          <Route path="history" element={<ProjectHistory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
