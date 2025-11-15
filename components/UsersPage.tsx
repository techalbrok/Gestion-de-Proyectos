import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import Avatar from './ui/Avatar';
import { PencilIcon, SearchIcon, UsersIcon, ShieldCheckIcon } from './icons/Icons';
import UserModal from './UserModal';
import { useData } from '../hooks/useData';

const UsersPage: React.FC = () => {
    const { users, departments, userDepartments } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) {
            return users;
        }
        return users.filter(user => 
            user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const userDepartmentMap = useMemo(() => {
        const map = new Map<string, string[]>();
        users.forEach(user => {
            const deptIds = userDepartments
                .filter(ud => ud.user_id === user.id)
                .map(ud => ud.department_id);
            const deptNames = departments
                .filter(d => deptIds.includes(d.id))
                .map(d => d.name);
            map.set(user.id, deptNames);
        });
        return map;
    }, [users, departments, userDepartments]);

    const roleStyles: Record<UserRole, string> = {
        [UserRole.ADMIN]: 'bg-primary/20 text-primary-dark dark:text-red-300',
        [UserRole.USER]: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };

    return (
        <div className="p-6 flex flex-col h-full">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg p-6 border-l-4 border-primary mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <UsersIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Gestión de Usuarios</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Administración y configuración de usuarios del sistema</p>
                    </div>
                </div>
            </div>
            
            <div className="p-4 mb-6 rounded-md bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <ShieldCheckIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                            Por seguridad, la gestión de usuarios (creación y eliminación) se realiza directamente desde la base de datos de Supabase.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <div className="relative max-w-xs">
                    <SearchIcon className="absolute w-5 h-5 text-gray-400 top-1/2 -translate-y-1/2 left-3" />
                    <input
                        type="text"
                        placeholder="Buscar usuario por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-2 pl-10 pr-4 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-dark-card dark:text-gray-300 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-bg dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Usuario</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3">Departamentos</th>
                                <th scope="col" className="px-6 py-3">Rol</th>
                                <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="bg-white border-b dark:bg-dark-card dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                                        <th scope="row" className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
                                            <Avatar user={user} size="md" />
                                            <div className="pl-3">
                                                <div className="text-base font-semibold">{user.full_name}</div>
                                            </div>
                                        </th>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4">
                                            {(userDepartmentMap.get(user.id) || []).join(', ')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs uppercase ${roleStyles[user.role]}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center space-x-2">
                                                <button onClick={() => handleEditUser(user)} className="text-gray-500 hover:text-primary dark:hover:text-primary-dark p-1 rounded-md" title="Editar Usuario">
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="mx-auto max-w-sm">
                                            <UsersIcon className="w-12 h-12 mx-auto text-gray-400" />
                                            <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                                                {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios'}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                {searchTerm 
                                                    ? 'Intenta con otro término de búsqueda.' 
                                                    : 'Cuando se registren nuevos usuarios, aparecerán aquí.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && selectedUser && <UserModal user={selectedUser} onClose={closeModal} />}
        </div>
    );
};

export default UsersPage;