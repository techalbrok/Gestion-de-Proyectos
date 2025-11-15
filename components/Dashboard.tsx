import React from 'react';
import { ProjectStage, Priority, Project, ProjectHistory } from '../types';
import { ClipboardListIcon, Cog6ToothIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon, UsersIcon } from './icons/Icons';
import Avatar from './ui/Avatar';
import { STAGE_CONFIG, PRIORITY_CONFIG } from '../constants';
import { useMemo } from 'react';
import StatCard from './ui/StatCard';
import { useData } from '../hooks/useData';

interface ProgressInfo {
  label: string;
  count: number;
  color: string;
  percentage: number;
}

const ProgressSection: React.FC<{ title: string; data: ProgressInfo[] }> = ({ title, data }) => (
    <div className="bg-white dark:bg-dark-card shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="space-y-4">
            {data.map((item) => (
            <div key={item.label}>
                <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className={`${item.color} h-2.5 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                </div>
            </div>
            ))}
        </div>
    </div>
);


const Dashboard: React.FC = () => {
  const { projects, users, recentHistory } = useData();

  const projectStats = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter(p => p.stage === ProjectStage.COMPLETED).length;
    const inDevelopment = projects.filter(p => p.stage === ProjectStage.IN_PROGRESS).length;
    const overdue = projects.filter(p => p.due_date && new Date(p.due_date) < new Date() && p.stage !== ProjectStage.COMPLETED).length;
    return { total, completed, inDevelopment, overdue };
  }, [projects]);
  
  const projectsByStage = useMemo(() => {
    const counts = projects.reduce((acc, project) => {
        acc[project.stage] = (acc[project.stage] || 0) + 1;
        return acc;
    }, {} as Record<ProjectStage, number>);
    return Object.values(ProjectStage).map(stage => ({
        label: STAGE_CONFIG[stage].title,
        count: counts[stage] || 0,
        color: STAGE_CONFIG[stage].color,
        percentage: projects.length > 0 ? ((counts[stage] || 0) / projects.length) * 100 : 0
    }));
  }, [projects]);

  const projectsByPriority = useMemo(() => {
    const counts = projects.reduce((acc, project) => {
        acc[project.priority] = (acc[project.priority] || 0) + 1;
        return acc;
    }, {} as Record<Priority, number>);
    return Object.values(Priority).map(priority => ({
        label: PRIORITY_CONFIG[priority].label,
        count: counts[priority] || 0,
        color: PRIORITY_CONFIG[priority].color,
        percentage: projects.length > 0 ? ((counts[priority] || 0) / projects.length) * 100 : 0,
    }));
  }, [projects]);

  const teamWorkload = useMemo(() => {
      return users.map(user => ({
          user,
          projectCount: projects.filter(p => p.members.includes(user.id)).length
      })).sort((a,b) => b.projectCount - a.projectCount);
  }, [users, projects]);
  

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Proyectos Totales" value={projectStats.total} icon={ClipboardListIcon} color="bg-blue-500" />
        <StatCard title="Completados" value={projectStats.completed} icon={CheckCircleIcon} color="bg-green-500" />
        <StatCard title="En Desarrollo" value={projectStats.inDevelopment} icon={Cog6ToothIcon} color="bg-amber-500" />
        <StatCard title="Vencidos" value={projectStats.overdue} icon={ExclamationTriangleIcon} color="bg-red-500" />
      </div>

      {/* Charts & Team Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <ProgressSection title="Proyectos por Etapa" data={projectsByStage} />
           <ProgressSection title="Proyectos por Prioridad" data={projectsByPriority} />
        </div>

        <div className="bg-white dark:bg-dark-card shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Carga de Trabajo del Equipo</h3>
            {teamWorkload.length > 0 ? (
              <ul className="space-y-4">
                {teamWorkload.map(({user, projectCount}) => (
                    <li key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Avatar user={user} size="md" />
                            <span className="ml-3 font-medium">{user.full_name}</span>
                        </div>
                        <span className="font-semibold px-2 py-1 bg-gray-100 dark:bg-dark-bg rounded-md text-sm">{projectCount} proyectos</span>
                    </li>
                ))}
              </ul>
            ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <UsersIcon className="w-8 h-8 mx-auto mb-2"/>
                    <p className="text-sm">No hay datos de equipo para mostrar.</p>
                </div>
            )}
        </div>
      </div>
      
       {/* Recent Activity */}
      <div className="bg-white dark:bg-dark-card shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actividad Reciente</h3>
        {recentHistory.length > 0 ? (
            <ul className="space-y-4">
                {recentHistory.map(activity => {
                    const user = users.find(u => u.id === activity.changed_by);
                    return (
                        <li key={activity.id} className="flex items-start space-x-3">
                            <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-800 dark:text-gray-200">
                                    <span className="font-semibold">{user?.full_name || 'Usuario'}</span> actualizó el proyecto <span className="font-semibold text-primary dark:text-red-400">{activity.projects?.title || 'un proyecto'}</span> a la etapa <span className={`font-semibold text-white px-1.5 py-0.5 text-xs rounded ${STAGE_CONFIG[activity.new_stage].color}`}>{STAGE_CONFIG[activity.new_stage].title}</span>.
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(activity.timestamp).toLocaleString()}</p>
                            </div>
                        </li>
                    )
                })}
            </ul>
        ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <ClockIcon className="w-8 h-8 mx-auto mb-2"/>
                <p className="text-sm">No hay actividad reciente.</p>
            </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;