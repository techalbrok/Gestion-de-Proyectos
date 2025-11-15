import { Project, User, Department, UserRole, ProjectStage, Priority, Comment, ProjectHistory, UserDepartment, RecentHistoryEntry, Notification, NotificationType, Task, ProjectAttachment } from '../types';
import { supabase } from './supabase';
import { STAGE_CONFIG } from '../constants';

// --- AUTH FUNCTIONS ---
export const login = async (email: string, password?: string) => {
    if (!password) throw new Error('Password is required.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
};

export const register = async (fullName: string, email: string, password?: string) => {
    if (!password) throw new Error('Password is required.');
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: {
                full_name: fullName,
                avatar_url: `https://picsum.photos/seed/user${Date.now()}/100/100`
            }
        }
    });
    if (error) throw error;
    if (!data.user) throw new Error('Registration failed.');
};

export const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // URL to redirect to after password reset
    });
    if (error) throw error;
};


export const fetchUserProfile = async (userId: string): Promise<User> => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
    if (!data) {
        throw new Error('User profile not found.');
    }
    return data;
}

// --- DATA FETCHING FUNCTIONS ---
// Fetches only active projects for faster initial load.
export const fetchProjects = async (): Promise<Project[]> => {
    const { data, error } = await supabase
        .from('projects')
        .select('*, comments!project_id(count), sub_tasks!project_id(count)')
        .not('stage', 'in', `(${ProjectStage.COMPLETED},${ProjectStage.CANCELLED})`);

    if (error) throw error;
    
    return (data as any[]).map(p => ({ 
        ...p,
        comments_count: p.comments[0]?.count || 0,
        tasks_count: p.sub_tasks[0]?.count || 0,
        comments: undefined,
        sub_tasks: undefined,
        history: []
    }));
};

// Fetches archived projects on demand.
export const fetchArchivedProjects = async (): Promise<Project[]> => {
    const { data, error } = await supabase
        .from('projects')
        .select('*, comments!project_id(count), sub_tasks!project_id(count)')
        .in('stage', [ProjectStage.COMPLETED, ProjectStage.CANCELLED]);

    if (error) throw error;

    return (data as any[]).map(p => ({
        ...p,
        comments_count: p.comments[0]?.count || 0,
        tasks_count: p.sub_tasks[0]?.count || 0,
        comments: undefined,
        sub_tasks: undefined,
        history: []
    }));
};

export const fetchUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data;
};
export const fetchDepartments = async (): Promise<Department[]> => {
    const { data, error } = await supabase.from('departments').select('*');
    if (error) throw error;
    return data;
};
export const fetchUserDepartments = async (): Promise<UserDepartment[]> => {
    const { data, error } = await supabase.from('user_departments').select('*');
    if (error) throw error;
    return data;
};
export const fetchComments = async (projectId: string): Promise<Comment[]> => {
    const { data, error } = await supabase.from('comments').select('*').eq('project_id', projectId).order('created_at', { ascending: true });
    if (error) throw error;
    return data;
};

export const fetchProjectHistory = async (projectId: string): Promise<ProjectHistory[]> => {
    const { data, error } = await supabase.from('project_history').select('*').eq('project_id', projectId).order('timestamp', { ascending: false });
    if (error) throw error;
    return data;
};

export const fetchRecentHistory = async (): Promise<RecentHistoryEntry[]> => {
    const { data, error } = await supabase
        .from('project_history')
        .select('*, projects(title)')
        .order('timestamp', { ascending: false })
        .limit(5);
    if (error) throw error;
    return (data as any) || [];
};

export const fetchNotifications = async (): Promise<Notification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*, actor:actor_id(*), project:project_id(title)')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error fetching notifications:", error);
        throw error;
    }
    return (data as any) || []; // Type assertion needed due to joins
};


// --- DATA MUTATION FUNCTIONS ---
export const updateProjectStage = async (projectId: string, newStage: ProjectStage, currentUser: User, userDepartments: UserDepartment[]): Promise<Project> => {
    const { data: projectBeforeUpdate, error: findError } = await supabase.from('projects').select('stage, members, department_id').eq('id', projectId).single();
    if(findError) throw findError;
    if(!projectBeforeUpdate) throw new Error("Proyecto no encontrado.");

    // Frontend permission check
    const canEdit = currentUser.role === UserRole.ADMIN ||
                    (userDepartments && userDepartments.length > 0 &&
                     userDepartments.some(ud => ud.user_id === currentUser.id && ud.department_id === projectBeforeUpdate.department_id));
    if (!canEdit) {
        throw new Error("No tienes permiso para editar este proyecto.");
    }

    const { data, error } = await supabase.from('projects').update({ stage: newStage }).eq('id', projectId).select().single();
    if (error) throw error;
    
    // Log history
    const historyEntry = {
        project_id: projectId,
        changed_by: currentUser.id,
        previous_stage: projectBeforeUpdate.stage,
        new_stage: newStage,
    }
    const { error: historyError } = await supabase.from('project_history').insert(historyEntry);
    if(historyError) console.error("Failed to log history:", historyError);

    // Create notifications for members
    if (projectBeforeUpdate.members && projectBeforeUpdate.members.length > 0) {
        const notifications = projectBeforeUpdate.members
            .filter((memberId: string) => memberId !== currentUser.id) // Don't notify the actor
            .map((memberId: string) => ({
                user_id: memberId,
                actor_id: currentUser.id,
                project_id: projectId,
                type: NotificationType.STAGE_CHANGE,
                comment_preview: STAGE_CONFIG[newStage].title // Use comment_preview to store stage title
            }));
        if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications);
        }
    }

    return { ...data, history: [] };
};

export const addProject = async (projectData: Omit<Project, 'id' | 'created_by' | 'history' | 'comments_count' | 'tasks_count'>, userId: string): Promise<Project> => {
    const projectToInsert = { ...projectData, created_by: userId };
    const { data, error } = await supabase.from('projects').insert(projectToInsert).select().single();
    if (error) throw error;

    // Log history
    const historyEntry = {
        project_id: data.id,
        changed_by: userId,
        previous_stage: null,
        new_stage: projectData.stage,
    }
    const { error: historyError } = await supabase.from('project_history').insert(historyEntry);
    if (historyError) console.error("Failed to log initial history:", historyError);

    // Create notifications for assigned members
    if (data.members && data.members.length > 0) {
        const notifications = data.members.map((memberId: string) => ({
            user_id: memberId,
            actor_id: userId,
            project_id: data.id,
            type: NotificationType.ASSIGNMENT,
        }));
        await supabase.from('notifications').insert(notifications);
    }

    return { ...data, history: [], comments_count: 0, tasks_count: 0 };
};

export const updateProject = async (projectData: Project, currentUser: User, userDepartments: UserDepartment[]): Promise<Project> => {
    // Frontend permission check
    const canEdit = currentUser.role === UserRole.ADMIN ||
                    (userDepartments && userDepartments.length > 0 &&
                     userDepartments.some(ud => ud.user_id === currentUser.id && ud.department_id === projectData.department_id));
    if (!canEdit) {
        throw new Error("No tienes permiso para editar este proyecto.");
    }

    const { id, history, comments_count, tasks_count, ...updateData } = projectData;

    const { data: projectBeforeUpdate, error: findError } = await supabase.from('projects').select('members').eq('id', id).single();
    if(findError) throw findError;
    if(!projectBeforeUpdate) throw new Error("Proyecto no encontrado.");

    const { data, error } = await supabase.from('projects').update(updateData).eq('id', id).select().single();
    if (error) throw error;

    // Diff members for assignment notifications
    const oldMembers = new Set(projectBeforeUpdate.members || []);
    const newMembers = new Set(data.members || []);
    const newlyAddedMembers = [...newMembers].filter(memberId => !oldMembers.has(memberId));
    
    if (newlyAddedMembers.length > 0) {
        if (currentUser) {
            const notifications = newlyAddedMembers.map((memberId: string) => ({
                user_id: memberId,
                actor_id: currentUser.id,
                project_id: id,
                type: NotificationType.ASSIGNMENT,
            }));
            await supabase.from('notifications').insert(notifications);
        }
    }
    
    return { ...data, history: [], comments_count: comments_count, tasks_count: tasks_count };
};

export const deleteProject = async (projectId: string, currentUser: User, userDepartments: UserDepartment[]): Promise<void> => {
    // Fetch project to check its department for permission validation
    const { data: project, error: findProjectError } = await supabase.from('projects').select('department_id').eq('id', projectId).single();
    if (findProjectError) throw findProjectError;
    if (!project) throw new Error("Proyecto no encontrado.");

    // Frontend permission check
    const canDelete = currentUser.role === UserRole.ADMIN ||
                      (userDepartments && userDepartments.length > 0 &&
                       userDepartments.some(ud => ud.user_id === currentUser.id && ud.department_id === project.department_id));
    if (!canDelete) {
        throw new Error("No tienes permiso para eliminar este proyecto.");
    }

    // Delete all associated data first to maintain integrity
    const deleteComments = supabase.from('comments').delete().eq('project_id', projectId);
    const deleteHistory = supabase.from('project_history').delete().eq('project_id', projectId);
    const deleteNotifications = supabase.from('notifications').delete().eq('project_id', projectId);
    // Also delete tasks
    const deleteTasks = supabase.from('sub_tasks').delete().eq('project_id', projectId);


    const [commentsResult, historyResult, notificationsResult, tasksResult] = await Promise.all([
        deleteComments,
        deleteHistory,
        deleteNotifications,
        deleteTasks
    ]);

    if (commentsResult.error) throw commentsResult.error;
    if (historyResult.error) throw historyResult.error;
    if (notificationsResult.error) throw notificationsResult.error;
    if (tasksResult.error) throw tasksResult.error;

    // Finally, delete the project itself
    const { error: projectError } = await supabase.from('projects').delete().eq('id', projectId);
    if (projectError) throw projectError;
};

export const addComment = async (projectId: string, content: string, userId: string): Promise<Comment> => {
    const newComment = { project_id: projectId, content, user_id: userId };
    const { data, error } = await supabase.from('comments').insert(newComment).select().single();
    if (error) throw error;

    // Mention notifications
    const { data: allUsers } = await supabase.from('users').select('id, full_name');
    if (allUsers) {
        const mentionRegex = /@([\w\s]+)/g;
        let match;
        const mentionedUserIds = new Set<string>();

        while ((match = mentionRegex.exec(content)) !== null) {
            const userName = match[1].trim();
            const mentionedUser = allUsers.find(u => u.full_name.toLowerCase() === userName.toLowerCase());
            if (mentionedUser && mentionedUser.id !== userId) {
                mentionedUserIds.add(mentionedUser.id);
            }
        }

        if(mentionedUserIds.size > 0) {
            const notifications = Array.from(mentionedUserIds).map(mentionedId => ({
                user_id: mentionedId,
                actor_id: userId,
                project_id: projectId,
                type: NotificationType.MENTION,
                comment_preview: content.substring(0, 70)
            }));
            await supabase.from('notifications').insert(notifications);
        }
    }
    return data;
};

// --- TASK FUNCTIONS ---
export const fetchTasks = async (projectId: string): Promise<Task[]> => {
    const { data, error } = await supabase.from('sub_tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: true });
    if (error) throw error;
    return data;
};

export const addTask = async (taskData: Omit<Task, 'id' | 'created_at'>): Promise<Task> => {
    const { data, error } = await supabase.from('sub_tasks').insert(taskData).select().single();
    if (error) throw error;
    return data;
};

export const updateTask = async (taskId: string, updateData: Partial<Omit<Task, 'id'>>): Promise<Task> => {
    const { data, error } = await supabase.from('sub_tasks').update(updateData).eq('id', taskId).select().single();
    if (error) throw error;
    return data;
};

export const deleteTask = async (taskId: string): Promise<void> => {
    const { error } = await supabase.from('sub_tasks').delete().eq('id', taskId);
    if (error) throw error;
};

export const fetchUserTasks = async (userId: string): Promise<Task[]> => {
    const { data, error } = await supabase
        .from('sub_tasks')
        .select('*')
        .eq('assigned_to', userId)
        .order('is_completed', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data;
};
// --------------------


export const updateUser = async (userData: User): Promise<User> => {
    const { id, ...updateData } = userData;
    const { data, error } = await supabase.from('users').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const uploadAvatar = async (file: File, userId: string): Promise<User> => {
    // 1. Get the old avatar URL to delete it later
    const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', userId)
        .single();
    if (userError) console.error("Could not fetch old avatar url, proceeding anyway.");

    // 2. Upload the new file with a unique name
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
    if (uploadError) throw uploadError;

    // 3. Get the public URL of the newly uploaded file
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    if (!publicUrl) throw new Error('Could not get public URL for the uploaded file.');

    // 4. Update the user's profile with the new avatar URL
    const { data, error } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)
        .select()
        .single();
    if (error) throw error;

    // 5. If there was an old avatar and it's a Supabase storage URL, delete it
    if (userProfile?.avatar_url && userProfile.avatar_url.includes(supabase.storage.from('avatars').getPublicUrl('').data.publicUrl)) {
        const oldFileName = userProfile.avatar_url.split('/').pop();
        if (oldFileName) {
            const { error: removeError } = await supabase.storage.from('avatars').remove([oldFileName]);
            if (removeError) console.error("Failed to remove old avatar:", removeError.message);
        }
    }
    
    return data;
};


export const deleteUser = async (userId: string): Promise<void> => {
    // This only deletes the public profile, not the auth user.
    // Deleting auth users requires admin privileges and is more complex.
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
};

export const addDepartment = async (deptData: Omit<Department, 'id'>, currentUser: User): Promise<Department> => {
    if (currentUser.role !== UserRole.ADMIN) {
        throw new Error("Solo los administradores pueden crear departamentos.");
    }
    const payload = {
        ...deptData,
        coordinator_id: deptData.coordinator_id === '' ? null : deptData.coordinator_id,
    };
    const { data, error } = await supabase.from('departments').insert(payload).select().single();
    if (error) throw error;
    return data;
};

export const updateDepartment = async (deptData: Department, currentUser: User): Promise<Department> => {
    if (currentUser.role !== UserRole.ADMIN) {
        throw new Error("Solo los administradores pueden editar departamentos.");
    }
    const { id } = deptData;
    
    // Create a clean payload with only the columns that exist in the 'departments' table.
    // This prevents errors from extra properties added in the frontend for display (e.g., coordinator object, memberCount).
    const payload: Partial<Omit<Department, 'id'>> = {
        name: deptData.name,
        description: deptData.description,
        // Ensure coordinator_id is set to null if it's an empty string.
        coordinator_id: deptData.coordinator_id === '' ? null : deptData.coordinator_id,
    };
    
    const { data, error } = await supabase.from('departments').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const deleteDepartment = async (deptId: string, currentUser: User): Promise<void> => {
    if (currentUser.role !== UserRole.ADMIN) {
        throw new Error("Solo los administradores pueden eliminar departamentos.");
    }
    // Check if any projects are associated with this department
    const { count, error: countError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', deptId);

    if (countError) {
        console.error("Error checking for projects in department:", countError);
        throw new Error("Could not verify department's projects.");
    }

    if (count && count > 0) {
        throw new Error(`No se puede eliminar el departamento porque tiene ${count} proyecto(s) asociado(s).`);
    }

    const { error } = await supabase.from('departments').delete().eq('id', deptId);
    if (error) throw error;
};

export const updateDepartmentMembers = async (departmentId: string, memberIds: string[], currentUser: User): Promise<void> => {
    if (currentUser.role !== UserRole.ADMIN) {
        throw new Error("Solo los administradores pueden gestionar miembros de departamento.");
    }
    // Remove existing members for this department
    const { error: deleteError } = await supabase.from('user_departments').delete().eq('department_id', departmentId);
    if (deleteError) throw deleteError;

    // Add new members
    if(memberIds.length > 0) {
        const newMembers = memberIds.map(userId => ({ user_id: userId, department_id: departmentId }));
        const { error: insertError } = await supabase.from('user_departments').insert(newMembers);
        if (insertError) throw insertError;
    }
};

export const markAllAsRead = async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    if (error) {
        console.error("Failed to mark notifications as read:", error);
        throw error;
    };
};

// --- PROJECT ATTACHMENTS ---
export const fetchProjectAttachments = async (projectId: string): Promise<ProjectAttachment[]> => {
    const { data, error } = await supabase
        .from('project_attachments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const uploadProjectAttachment = async (
    projectId: string,
    userId: string,
    file: File
): Promise<ProjectAttachment> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${projectId}/${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('project-attachments')
        .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from('project-attachments')
        .getPublicUrl(fileName);

    const attachmentData = {
        project_id: projectId,
        user_id: userId,
        file_name: file.name,
        file_path: publicUrl,
        file_type: file.type,
        file_size: file.size,
    };

    const { data, error } = await supabase
        .from('project_attachments')
        .insert(attachmentData)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteProjectAttachment = async (attachmentId: string): Promise<void> => {
    const { data: attachment, error: fetchError } = await supabase
        .from('project_attachments')
        .select('file_path')
        .eq('id', attachmentId)
        .single();

    if (fetchError) throw fetchError;
    if (!attachment) throw new Error('Attachment not found');

    const fileName = attachment.file_path.split('/').slice(-2).join('/');

    const { error: storageError } = await supabase.storage
        .from('project-attachments')
        .remove([fileName]);

    if (storageError) console.error('Error deleting file from storage:', storageError);

    const { error } = await supabase
        .from('project_attachments')
        .delete()
        .eq('id', attachmentId);

    if (error) throw error;
};