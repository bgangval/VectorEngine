import { BaseDirectory, mkdir, readTextFile, writeTextFile, readDir, remove } from '@tauri-apps/plugin-fs';

const PROJECTS_DIR = 'VectorEngine';

export type ProjectShapeJSON = object;

export interface ProjectFile {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    lineAlg: string;
    shapes: ProjectShapeJSON[];
}

export async function ensureProjectsDir(): Promise<void> {
    try {
        await mkdir(PROJECTS_DIR, { baseDir: BaseDirectory.Document, recursive: true });
    } catch (error) {
        console.error('Error creating projects directory:', error);
    }
}

export async function saveProjectToFile(project: ProjectFile): Promise<void> {
    await ensureProjectsDir();
    const filePath = `${PROJECTS_DIR}/${project.id}.json`;
    const content = JSON.stringify(project, null, 2);
    await writeTextFile(filePath, content, { baseDir: BaseDirectory.Document });
}

export async function loadProjectFromFile(id: string): Promise<ProjectFile | null> {
    try {
        const filePath = `${PROJECTS_DIR}/${id}.json`;
        const content = await readTextFile(filePath, { baseDir: BaseDirectory.Document });
        return JSON.parse(content) as ProjectFile;
    } catch (error) {
        console.error('Error loading project:', error);
        return null;
    }
}

export async function loadAllProjectsFromFiles(): Promise<ProjectFile[]> {
    await ensureProjectsDir();
    try {
        const files = await readDir(PROJECTS_DIR, { baseDir: BaseDirectory.Document });
        const projects: ProjectFile[] = [];
        
        for (const file of files) {
            if (file.isFile && file.name.endsWith('.json')) {
                const id = file.name.replace('.json', '');
                const project = await loadProjectFromFile(id);
                if (project) {
                    projects.push(project);
                }
            }
        }
        
        return projects.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    } catch (error) {
        console.error('Error loading projects list:', error);
        return [];
    }
}

export async function deleteProjectFile(id: string): Promise<boolean> {
    try {
        const filePath = `${PROJECTS_DIR}/${id}.json`;
        await remove(filePath, { baseDir: BaseDirectory.Document });
        return true;
    } catch (error) {
        console.error('Error deleting project:', error);
        return false;
    }
}

export async function deleteAllProjectFiles(): Promise<void> {
    const projects = await loadAllProjectsFromFiles();
    await Promise.all(projects.map((project) => deleteProjectFile(project.id)));
}

export function createProjectFile(name?: string): ProjectFile {
    const now = new Date().toISOString();
    const id = Date.now().toString();
    return {
        id,
        name: name ?? `Project ${id.slice(-4)}`,
        createdAt: now,
        updatedAt: now,
        lineAlg: 'bresenham',
        shapes: [],
    };
}
