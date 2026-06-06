import type { Shape } from '../lib/shapes';
import { deserializeShapes, serializeShapes } from './shapeSerializer';

export interface StoredProject {
    id: string;
    name: string;
    date: string;
    lastEdited: string;
    shapes: object[];
}

export const PROJECTS_STORAGE_KEY = 'vectorengine_projects';

export function loadAllProjects(): StoredProject[] {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw) as StoredProject[];
        return Array.isArray(parsed)
            ? parsed.map((p) => ({ ...p, shapes: p.shapes ?? [] }))
            : [];
    } catch {
        return [];
    }
}

export function saveAllProjects(projects: StoredProject[]): void {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

export function findProject(id: string): StoredProject | undefined {
    return loadAllProjects().find((p) => p.id === id);
}

export function upsertProject(id: string, name: string, shapes: Shape[]): StoredProject {
    const projects = loadAllProjects();
    const now = new Date().toLocaleDateString();
    const serialized = serializeShapes(shapes);
    const index = projects.findIndex((p) => p.id === id);

    if (index >= 0) {
        projects[index] = {
            ...projects[index],
            name,
            lastEdited: now,
            shapes: serialized,
        };
        saveAllProjects(projects);
        return projects[index];
    }

    const created: StoredProject = {
        id,
        name,
        date: now,
        lastEdited: now,
        shapes: serialized,
    };
    projects.unshift(created);
    saveAllProjects(projects);
    return created;
}

export function loadProjectShapes(id: string): Shape[] {
    const project = findProject(id);
    if (!project) return [];
    return deserializeShapes(project.shapes);
}

export function deleteProject(id: string): void {
    saveAllProjects(loadAllProjects().filter((p) => p.id !== id));
}

export function deleteAllProjects(): void {
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
    saveAllProjects([]);
}

export function createEmptyProject(name?: string): StoredProject {
    const projects = loadAllProjects();
    const project: StoredProject = {
        id: Date.now().toString(),
        name: name ?? `Project ${projects.length + 1}`,
        date: new Date().toLocaleDateString(),
        lastEdited: new Date().toLocaleDateString(),
        shapes: [],
    };
    projects.unshift(project);
    saveAllProjects(projects);
    return project;
}

export function serializeProjectDocument(id: string, name: string, shapes: Shape[]): object {
    return {
        version: 1,
        id,
        name,
        lastEdited: new Date().toLocaleDateString(),
        shapes: serializeShapes(shapes),
    };
}
