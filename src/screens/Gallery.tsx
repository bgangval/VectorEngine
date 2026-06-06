import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FolderOpen, Trash2 } from 'lucide-react';
import {
    createProjectFile,
    deleteAllProjectFiles,
    deleteProjectFile,
    loadAllProjectsFromFiles,
    saveProjectToFile,
    type ProjectFile,
} from '../lib/fileStorage';

export default function Gallery() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<ProjectFile[]>([]);

    useEffect(() => {
        let active = true;
        void loadAllProjectsFromFiles().then((loadedProjects) => {
            if (active) setProjects(loadedProjects);
        });
        return () => {
            active = false;
        };
    }, []);

    const addProject = async () => {
        const project = createProjectFile();
        await saveProjectToFile(project);
        setProjects((prev) => [project, ...prev]);
        navigate(`/editor/${project.id}`);
    };

    const deleteProjectCard = async (projectId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await deleteProjectFile(projectId);
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
    };

    const handleClearAll = async () => {
        if (!window.confirm('Удалить все проекты?')) return;
        await deleteAllProjectFiles();
        setProjects([]);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="p-8 max-w-7xl mx-auto"
        >
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-white">My Projects</h1>

                <div className="flex gap-3">
                    {projects.length > 0 && (
                        <button
                            type="button"
                            onClick={() => void handleClearAll()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition-all"
                        >
                            <Trash2 size={18} />
                            Clear All
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => void addProject()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg text-white"
                    >
                        <Plus size={20} />
                        New Project
                    </button>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="text-center py-24">
                    <FolderOpen size={70} className="mx-auto text-slate-600 mb-6" />
                    <p className="text-slate-400 text-lg mb-4">No projects yet</p>
                    <p className="text-slate-500 text-sm">Click &quot;New Project&quot; to get started</p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {projects.map((project) => (
                        <div key={project.id} className="relative group">
                            <Link to={`/editor/${project.id}`}>
                                <motion.div
                                    whileHover={{ y: -10, scale: 1.03 }}
                                    transition={{ type: 'spring', stiffness: 250 }}
                                    className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-all cursor-pointer shadow-md hover:shadow-xl"
                                >
                                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors mb-4">
                                        {project.name}
                                    </h3>
                                    <p className="text-sm text-slate-400">
                                        Created: {new Date(project.createdAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Edited: {new Date(project.updatedAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Objects: {project.shapes?.length ?? 0}
                                    </p>
                                </motion.div>
                            </Link>

                            <button
                                type="button"
                                onClick={(e) => void deleteProjectCard(project.id, e)}
                                className="absolute top-3 right-3 p-2 bg-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                            >
                                <Trash2 size={16} className="text-slate-300 hover:text-white" />
                            </button>
                        </div>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
}
