import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import NavBar from './components/NavBar';
import Gallery from './screens/Gallery';
import Editor from './screens/Editor';
import { CanvasTest } from './components/CanvasTest';
import type { LineAlg } from './lib/raster/RasterRenderer';

function AnimatedRoutes({ lineAlg, onLineAlgChange }: { lineAlg: LineAlg; onLineAlgChange: (alg: LineAlg) => void }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <>
              <NavBar />
              <Gallery />
            </>
          }
        />

        <Route
          path="/editor/:id"
          element={
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <Editor />
            </motion.div>
          }
        />

        <Route
          path="/raster-test"
          element={
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full h-screen"
            >
              <CanvasTest lineAlg={lineAlg} onLineAlgChange={onLineAlgChange} />
            </motion.div>
          }
        />

        <Route
          path="*"
          element={<div className="text-white p-10">404 Not Found</div>}
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [lineAlg, setLineAlg] = useState<LineAlg>('bresenham');

  console.log("App: текущий алгоритм =", lineAlg);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950">
        <AnimatedRoutes lineAlg={lineAlg} onLineAlgChange={(alg) => {
          console.log("App: меняем алгоритм на", alg);
          setLineAlg(alg);
        }} />
      </div>
    </BrowserRouter>
  );
}