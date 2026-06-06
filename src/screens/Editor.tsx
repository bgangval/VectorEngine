import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Save,
    Square,
    Circle,
    MousePointer2,
    Minus,
    Triangle as TriangleIcon,
    Spline,
    Layers,
    Trash2,
    ChevronUp,
    ChevronDown,
    ChevronsUp,
    ChevronsDown,
    FileJson,
    Copy,
    Download,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Shape } from '../lib/shapes';
import { PathBezier } from '../lib/shapes';
import { VectorEditorCanvas } from '../components/VectorEditorCanvas';
import type { EditorTool } from '../editor/types';
import { getShapeLabel } from '../editor/editableShape';
import {
    findShapeIndex,
    moveLayerUp,
    moveLayerDown,
    moveLayerToFront,
    moveLayerToBack,
    removeShape,
} from '../editor/layers';
import { serializeProjectDocument } from '../editor/projectStorage';
import { saveProjectToFile, loadProjectFromFile, type ProjectFile } from '../lib/fileStorage';
import { shapesFromJSON } from '../lib/shapeDeserializer';

const TOOLS: { id: EditorTool; icon: typeof Square; label: string }[] = [
    { id: 'select', icon: MousePointer2, label: 'Выбор' },
    { id: 'rect', icon: Square, label: 'Прямоугольник' },
    { id: 'oval', icon: Circle, label: 'Овал' },
    { id: 'line', icon: Minus, label: 'Линия' },
    { id: 'triangle', icon: TriangleIcon, label: 'Треугольник' },
    { id: 'quadratic', icon: Spline, label: 'Квадр. Безье' },
    { id: 'cubic', icon: Spline, label: 'Куб. Безье' },
    { id: 'path', icon: Spline, label: 'Путь' },
];

export default function Editor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [projectName, setProjectName] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [activeTool, setActiveTool] = useState<EditorTool>('select');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [jsonCopied, setJsonCopied] = useState(false);
    const shapesRef = useRef(shapes);
    const createdAtRef = useRef(new Date().toISOString());
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        shapesRef.current = shapes;
    }, [shapes]);

    const buildProjectFile = useCallback((): ProjectFile | null => {
        if (!id) return null;
        return {
            id,
            name: projectName,
            createdAt: createdAtRef.current,
            updatedAt: new Date().toISOString(),
            lineAlg: 'bresenham',
            shapes: shapesRef.current.map((s) => s.toJSON()),
        };
    }, [id, projectName]);

    const syncShapes = useCallback(() => {
        setShapes([...shapesRef.current]);
    }, []);

    const persistProject = useCallback(async () => {
        const project = buildProjectFile();
        if (!project) return;
        await saveProjectToFile(project);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 1500);
    }, [buildProjectFile]);

    const scheduleSave = useCallback(() => {
        if (!id || !loaded) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            persistProject();
        }, 350);
    }, [id, loaded, persistProject]);

    useEffect(() => {
        if (!id) return;
        const loadProject = async () => {
            const project = await loadProjectFromFile(id);
            if (project) {
                setProjectName(project.name);
                createdAtRef.current = project.createdAt;
                const loadedShapes = shapesFromJSON(project.shapes);
                shapesRef.current = loadedShapes;
                setShapes(loadedShapes);
            } else {
                setProjectName(`Project ${id.slice(-4)}`);
                createdAtRef.current = new Date().toISOString();
                shapesRef.current = [];
                setShapes([]);
            }
            setLoaded(true);
        };
        void loadProject();
    }, [id]);

    useEffect(() => {
        scheduleSave();
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [shapes, projectName, scheduleSave]);

    useEffect(() => {
        return () => {
            if (loaded) {
                const saveOnUnmount = async () => {
                    const project = buildProjectFile();
                    if (!project) return;
                    await saveProjectToFile(project);
                };
                void saveOnUnmount();
            }
        };
    }, [buildProjectFile, loaded]);

    const handleGoBack = async () => {
        const project = buildProjectFile();
        if (project) {
            await saveProjectToFile(project);
        }
        navigate(-1);
    };

    const handleSaveAndGoHome = async () => {
        const project = buildProjectFile();
        if (project) {
            await saveProjectToFile(project);
        }
        navigate('/', { replace: true });
    };

    const handleShapesChange = () => {
        syncShapes();
        scheduleSave();
    };

    const handleDelete = () => {
        if (!selectedId) return;
        if (removeShape(shapesRef.current, selectedId)) {
            setSelectedId(null);
            handleShapesChange();
        }
    };

    const handleLayerAction = (action: 'up' | 'down' | 'front' | 'back') => {
        if (!selectedId) return;
        let ok = false;
        if (action === 'up') ok = moveLayerUp(shapesRef.current, selectedId);
        if (action === 'down') ok = moveLayerDown(shapesRef.current, selectedId);
        if (action === 'front') ok = moveLayerToFront(shapesRef.current, selectedId);
        if (action === 'back') ok = moveLayerToBack(shapesRef.current, selectedId);
        if (ok) handleShapesChange();
    };

    const handleRemovePathPoint = () => {
        if (!selectedId) return;
        const shape = shapesRef.current.find((s) => s.id === selectedId);
        if (!(shape instanceof PathBezier)) return;
        const idx = shape.points.length - 1;
        if (idx > 1) {
            shape.removePoint(idx);
            handleShapesChange();
        }
    };

    const selectedShape = selectedId
        ? shapes.find((s) => s.id === selectedId)
        : null;

    const layersForUi = [...shapes].reverse();

    const projectJson = id
        ? serializeProjectDocument(id, projectName, shapes)
        : null;

    const selectedShapeJson = selectedShape ? selectedShape.toJSON() : null;

    const handleCopyProjectJson = async () => {
        if (!projectJson) return;
        await navigator.clipboard.writeText(JSON.stringify(projectJson, null, 2));
        setJsonCopied(true);
        setTimeout(() => setJsonCopied(false), 1500);
    };

    const handleDownloadProjectJson = () => {
        if (!projectJson) return;
        const blob = new Blob([JSON.stringify(projectJson, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${projectName || 'project'}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-screen flex flex-col bg-slate-950">
            <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleGoBack}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-400" />
                    </motion.button>
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Project name"
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500 w-48"
                    />
                    {isSaved && <span className="text-green-400 text-sm">Сохранено</span>}
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveAndGoHome}
                    className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                    <Save size={16} />
                    <span className="text-sm text-white">Save</span>
                </motion.button>
            </header>

            <div className="flex flex-1 min-h-0">
                <aside className="w-14 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3 gap-1 shrink-0 overflow-y-auto">
                    {TOOLS.map(({ id: toolId, icon: Icon, label }) => (
                        <motion.button
                            key={toolId}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            title={label}
                            onClick={() => setActiveTool(toolId)}
                            className={`p-2.5 rounded-lg transition-colors ${
                                activeTool === toolId
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                            }`}
                        >
                            <Icon size={18} />
                        </motion.button>
                    ))}
                </aside>

                <main className="flex-1 min-w-0 bg-slate-800 p-2">
                    <div className="w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
                        {loaded && (
                            <VectorEditorCanvas
                                activeTool={activeTool}
                                shapes={shapes}
                                selectedId={selectedId}
                                onShapesChange={handleShapesChange}
                                onSelect={setSelectedId}
                                onToolChange={setActiveTool}
                            />
                        )}
                    </div>
                </main>

                <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
                    <div className="p-4 border-b border-slate-800">
                        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                            <Layers size={16} />
                            Слои
                        </h3>
                        <p className="text-slate-500 text-xs mt-1">Сверху — передний план</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {layersForUi.length === 0 && (
                            <p className="text-slate-500 text-xs px-2 py-4">Нет объектов</p>
                        )}
                        {layersForUi.map((shape) => {
                            const z = findShapeIndex(shapes, shape.id);
                            return (
                                <button
                                    key={shape.id}
                                    type="button"
                                    onClick={() => setSelectedId(shape.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                        selectedId === shape.id
                                            ? 'bg-blue-600/30 text-blue-200 border border-blue-500/50'
                                            : 'text-slate-300 hover:bg-slate-800 border border-transparent'
                                    }`}
                                >
                                    <span className="font-medium">{getShapeLabel(shape)}</span>
                                    <span className="block text-xs text-slate-500">слой {z + 1}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-4 border-t border-slate-800 space-y-3">
                        <h3 className="text-white font-semibold text-sm">Слой</h3>
                        <div className="grid grid-cols-4 gap-1">
                            <button
                                type="button"
                                title="На передний план"
                                disabled={!selectedId}
                                onClick={() => handleLayerAction('front')}
                                className="p-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                            >
                                <ChevronsUp size={16} className="mx-auto" />
                            </button>
                            <button
                                type="button"
                                title="Выше"
                                disabled={!selectedId}
                                onClick={() => handleLayerAction('up')}
                                className="p-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                            >
                                <ChevronUp size={16} className="mx-auto" />
                            </button>
                            <button
                                type="button"
                                title="Ниже"
                                disabled={!selectedId}
                                onClick={() => handleLayerAction('down')}
                                className="p-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                            >
                                <ChevronDown size={16} className="mx-auto" />
                            </button>
                            <button
                                type="button"
                                title="На задний план"
                                disabled={!selectedId}
                                onClick={() => handleLayerAction('back')}
                                className="p-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                            >
                                <ChevronsDown size={16} className="mx-auto" />
                            </button>
                        </div>

                        <button
                            type="button"
                            disabled={!selectedId}
                            onClick={handleDelete}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-300 text-sm disabled:opacity-40"
                        >
                            <Trash2 size={16} />
                            Удалить (Del)
                        </button>

                        {selectedShape instanceof PathBezier && (
                            <button
                                type="button"
                                onClick={handleRemovePathPoint}
                                className="w-full px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                            >
                                Удалить последнюю точку пути
                            </button>
                        )}

                        <div className="pt-2 border-t border-slate-800 space-y-2">
                            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                                <FileJson size={16} />
                                JSON (лаб. 6)
                            </h3>
                            <p className="text-slate-500 text-xs">
                                Каждая фигура сериализуется через toJSON() и сохраняется в файл.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleCopyProjectJson}
                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                                >
                                    <Copy size={14} />
                                    {jsonCopied ? 'Скопировано' : 'Копировать'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownloadProjectJson}
                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                                >
                                    <Download size={14} />
                                    .json
                                </button>
                            </div>
                            {selectedShapeJson && (
                                <pre className="text-[10px] leading-snug text-slate-400 bg-slate-950 rounded-lg p-2 max-h-32 overflow-auto border border-slate-800">
                                    {JSON.stringify(selectedShapeJson, null, 2)}
                                </pre>
                            )}
                        </div>

                        <p className="text-slate-500 text-xs leading-relaxed">
                            Двойной клик по пути — добавить точку. После создания фигуры сразу
                            можно двигать и менять размер.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
