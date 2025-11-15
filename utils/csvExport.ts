import { Project } from '../types';
import { STAGE_CONFIG, PRIORITY_CONFIG } from '../constants';

export const exportProjectsToCSV = (projects: Project[], departments: any[], filename: string = 'proyectos.csv') => {
    const headers = [
        'Título',
        'Descripción',
        'Departamento',
        'Etapa',
        'Prioridad',
        'Fecha Inicio',
        'Fecha Límite',
        'Miembros',
        'Tareas Totales',
        'Comentarios'
    ];

    const rows = projects.map(project => {
        const department = departments.find(d => d.id === project.department_id);
        return [
            project.title,
            project.description || '',
            department?.name || '',
            STAGE_CONFIG[project.stage].title,
            PRIORITY_CONFIG[project.priority].label,
            new Date(project.start_date).toLocaleDateString(),
            project.due_date ? new Date(project.due_date).toLocaleDateString() : 'N/A',
            project.members.length.toString(),
            project.tasks_count?.toString() || '0',
            project.comments_count?.toString() || '0'
        ];
    });

    const csvContent = [
        headers.map(h => `"${h}"`).join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
