import React, { useCallback } from 'react';
import { ProjectHistory, User } from '../types';
import { LoadingSpinner, ClockIcon } from './icons/Icons';
import { STAGE_CONFIG } from '../constants';

interface ProjectHistoryTabProps {
    history: ProjectHistory[];
    loadingData: boolean;
    users: User[];
}

const ProjectHistoryTab: React.FC<ProjectHistoryTabProps> = ({ history, loadingData, users }) => {
    const getUserById = useCallback((id: string) => users.find(u => u.id === id), [users]);

    if (loadingData) {
        return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
    }

    return (
        <div className="space-y-4 max-h-96 overflow-y-auto">
            {history.map(entry => {
                const user = getUserById(entry.changed_by);
                return (
                    <div key={entry.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 pt-1">
                            <ClockIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm">
                                <span className="font-semibold">{user?.full_name || 'Usuario'}</span> cambió la etapa
                                {entry.previous_stage && <> de <span className={`font-semibold ${STAGE_CONFIG[entry.previous_stage]?.color} text-white px-1.5 py-0.5 rounded`}>{STAGE_CONFIG[entry.previous_stage]?.title}</span></>}
                                &nbsp;a <span className={`font-semibold ${STAGE_CONFIG[entry.new_stage]?.color} text-white px-1.5 py-0.5 rounded`}>{STAGE_CONFIG[entry.new_stage]?.title}</span>.
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(entry.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ProjectHistoryTab;