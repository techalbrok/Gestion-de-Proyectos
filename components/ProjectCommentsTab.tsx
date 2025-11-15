import React, { useState, useCallback } from 'react';
import { Project, Comment, User } from '../types';
import Avatar from './ui/Avatar';
import Input from './ui/Input';
import { PaperAirplaneIcon, LoadingSpinner } from './icons/Icons';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';

interface ProjectCommentsTabProps {
    project: Project;
    comments: Comment[];
    setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
    loadingData: boolean;
}

const ProjectCommentsTab: React.FC<ProjectCommentsTabProps> = ({ project, comments, setComments, loadingData }) => {
    const { addComment } = useData();
    const { currentUser } = useAuth();
    const { addToast } = useUI();

    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getUserById = useCallback((id: string, users: User[]) => users.find(u => u.id === id), []);
    const { users } = useData(); // Get all users for mapping

    const handleAddComment = async () => {
        if (!currentUser || !newComment.trim() || isSubmitting) return;

        const content = newComment.trim();

        const optimisticComment: Comment = {
            id: `optimistic-${Date.now()}`,
            project_id: project.id,
            user_id: currentUser.id,
            content: content,
            created_at: new Date().toISOString(),
        };

        setNewComment('');
        setIsSubmitting(true);
        setComments(prev => [...prev, optimisticComment]);

        try {
            const actualComment = await addComment(project.id, content);
            setComments(prev => prev.map(c => c.id === optimisticComment.id ? actualComment : c));
        } catch (error) {
            console.error("Failed to add comment:", error);
            addToast('No se pudo enviar el comentario.', 'error');
            setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
            setNewComment(content); // Restore content for retry
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-96">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {loadingData ? <LoadingSpinner /> : comments.map(comment => {
                    const user = getUserById(comment.user_id, users);
                    return (
                        <div key={comment.id} className="flex items-start space-x-3">
                            <Avatar user={user} size="md" />
                            <div className="flex-1">
                                <div className="bg-gray-100 dark:bg-dark-card rounded-lg p-3">
                                    <p className="text-sm font-semibold">{user?.full_name}</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                                </div>
                                <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="mt-4 flex items-center space-x-2">
                <Avatar user={currentUser} size="md" />
                <div className="relative flex-1">
                    <Input
                        placeholder="Escribe un comentario..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                        className="pr-10"
                        disabled={isSubmitting}
                    />
                    <button
                        onClick={handleAddComment}
                        disabled={isSubmitting || !newComment.trim()}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? <LoadingSpinner className="w-5 h-5" /> : <PaperAirplaneIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectCommentsTab;