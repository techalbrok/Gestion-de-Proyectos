import React, { useState, useEffect } from 'react';
import { ProjectAttachment } from '../types';
import * as api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import Button from './ui/Button';
import { PaperclipIcon, TrashIcon, DownloadIcon } from './icons/Icons';

interface ProjectAttachmentsTabProps {
  projectId: string;
}

export const ProjectAttachmentsTab: React.FC<ProjectAttachmentsTabProps> = ({ projectId }) => {
  const { currentUser } = useAuth();
  const { addToast } = useUI();
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAttachments();
  }, [projectId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const data = await api.fetchProjectAttachments(projectId);
      setAttachments(data);
    } catch (error) {
      console.error('Error loading attachments:', error);
      addToast('Error al cargar los archivos adjuntos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !currentUser) return;

    const file = e.target.files[0];
    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      addToast('El archivo no puede superar los 10 MB', 'error');
      return;
    }

    try {
      setUploading(true);
      const newAttachment = await api.uploadProjectAttachment(projectId, currentUser.id, file);
      setAttachments(prev => [newAttachment, ...prev]);
      addToast('Archivo subido correctamente', 'success');
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      addToast('Error al subir el archivo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      await api.deleteProjectAttachment(attachmentId);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      addToast('Archivo eliminado', 'success');
    } catch (error) {
      console.error('Error deleting attachment:', error);
      addToast('Error al eliminar el archivo', 'error');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Archivos adjuntos ({attachments.length})
        </h3>
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button
              variant="primary"
              size="sm"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading}
              className="cursor-pointer"
            >
              <PaperclipIcon className="w-4 h-4" />
              {uploading ? 'Subiendo...' : 'Adjuntar archivo'}
            </Button>
          </label>
        </div>
      </div>

      {attachments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <PaperclipIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            No hay archivos adjuntos en este proyecto
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <PaperclipIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(attachment.file_size)} • {formatDate(attachment.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <a
                  href={attachment.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                  title="Descargar"
                >
                  <DownloadIcon className="w-4 h-4" />
                </a>
                {currentUser?.id === attachment.user_id && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    title="Eliminar"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        Tamaño máximo: 10 MB por archivo
      </div>
    </div>
  );
};
