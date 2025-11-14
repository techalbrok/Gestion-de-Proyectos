import React from 'react';
import { Notification, NotificationType } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import Avatar from './ui/Avatar';
// FIX: Removed ArrowUpRightIcon which is not exported, and other unused icons.
import { BellIcon } from './icons/Icons';
import { STAGE_CONFIG } from '../constants';

interface NotificationsPanelProps {
  notifications: Notification[];
  onClose: () => void;
}

const timeSince = (date: string): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "a";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min";
    return Math.floor(seconds) + "s";
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, onClose }) => {
    const { setView, setProjectToOpen } = useAppContext();

    const handleNotificationClick = (notification: Notification) => {
        setView('projects');
        setProjectToOpen(notification.project_id);
        onClose();
    };

    const getNotificationMessage = (n: Notification): React.ReactNode => {
        const actorName = <span className="font-semibold">{n.actor?.full_name || 'Alguien'}</span>;
        const projectTitle = <span className="font-semibold text-primary dark:text-red-400">{n.project?.title || 'un proyecto'}</span>;

        switch (n.type) {
            case NotificationType.MENTION:
                return <p>{actorName} te mencionó en {projectTitle}.</p>;
            case NotificationType.ASSIGNMENT:
                return <p>{actorName} te asignó al proyecto {projectTitle}.</p>;
            case NotificationType.STAGE_CHANGE:
                const stageTitle = n.comment_preview || 'una nueva etapa';
                const stageConfig = Object.values(STAGE_CONFIG).find(s => s.title === stageTitle);
                const stageDisplay = <span className={`font-semibold text-white px-1.5 py-0.5 text-xs rounded ${stageConfig?.color || 'bg-gray-500'}`}>{stageTitle}</span>;
                return <p>{actorName} cambió la etapa de {projectTitle} a {stageDisplay}.</p>;
            default:
                return <p>Nueva notificación.</p>;
        }
    };
    
    return (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 origin-top-right bg-white dark:bg-dark-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
            <div className="p-4 border-b border-gray-200 dark:border-dark-border">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    <ul>
                        {notifications.map(n => (
                            <li key={n.id} className="border-b border-gray-200 dark:border-dark-border last:border-b-0">
                                <button
                                    onClick={() => handleNotificationClick(n)}
                                    className={`flex items-start w-full p-4 space-x-3 text-left transition-colors duration-150 ${n.is_read ? 'hover:bg-gray-50 dark:hover:bg-dark-bg' : 'bg-red-50 dark:bg-primary/10 hover:bg-red-100 dark:hover:bg-primary/20'}`}
                                >
                                    <div className="flex-shrink-0">
                                        <Avatar user={n.actor} size="md" />
                                    </div>
                                    <div className="flex-1 text-sm">
                                        <div className="text-gray-800 dark:text-gray-200">{getNotificationMessage(n)}</div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeSince(n.created_at)}</p>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                         <BellIcon className="w-12 h-12 mx-auto mb-2 text-gray-400"/>
                        <h4 className="font-semibold">Todo al día</h4>
                        <p className="text-sm">No tienes notificaciones nuevas.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPanel;