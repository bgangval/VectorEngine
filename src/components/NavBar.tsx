import { NavLink, useNavigate } from 'react-router-dom';
import { createProjectFile, saveProjectToFile } from '../lib/fileStorage';

export default function NavBar() {
    const navigate = useNavigate();

    const handleCreateNew = async () => {
        const project = createProjectFile();
        await saveProjectToFile(project);
        navigate(`/editor/${project.id}`);
    };

    return (
        <nav className="flex items-center justify-between px-8 py-4 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg" />
                <span className="text-xl font-bold text-white">VectorEngine</span>
            </div>

            <div className="flex gap-6 items-center">
                <NavLink
                    to="/"
                    end
                    className={({ isActive }: { isActive: boolean }) =>
                        `text-sm font-medium transition-colors ${
                            isActive ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                        }`
                    }
                >
                    Gallery
                </NavLink>
                <button
                    type="button"
                    onClick={() => void handleCreateNew()}
                    className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                    Create New
                </button>
                <NavLink
                    to="/raster-test"
                    className={({ isActive }: { isActive: boolean }) =>
                        `text-sm font-medium transition-colors ${
                            isActive ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                        }`
                    }
                >
                    Растеризатор
                </NavLink>
            </div>
        </nav>
    );
}
