import { z } from 'zod';
import { ProjectStage, Priority, UserRole } from '../types';

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email({ message: 'Debe ser un correo electrónico válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export const registerSchema = z.object({
  fullName: z.string().min(3, { message: 'El nombre completo es obligatorio.' }),
  email: z.string().email({ message: 'Debe ser un correo electrónico válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
});

// Profile Schema
export const profileSchema = z.object({
  full_name: z.string().min(3, { message: 'El nombre completo debe tener al menos 3 caracteres.' }),
});

// Department Schema
export const departmentSchema = z.object({
    name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
    description: z.string().optional(),
    coordinator_id: z.string().optional(),
});

// User Schema (for editing)
export const userSchema = z.object({
    full_name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
    // FIX: Replaced `invalid_type_error` with `message` for Zod nativeEnum validation to match the expected type.
    role: z.nativeEnum(UserRole, { message: "Rol inválido." }),
});

// Project Schema
export const projectSchema = z.object({
    title: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres.' }),
    description: z.string().optional(),
    department_id: z.string().uuid({ message: 'Debe seleccionar un departamento válido.' }),
    // FIX: Replaced `invalid_type_error` with `message` for Zod nativeEnum validation to match the expected type.
    stage: z.nativeEnum(ProjectStage, { message: "Etapa inválida." }),
    // FIX: Replaced `invalid_type_error` with `message` for Zod nativeEnum validation to match the expected type.
    priority: z.nativeEnum(Priority, { message: "Prioridad inválida." }),
    start_date: z.string().min(1, { message: 'La fecha de inicio es obligatoria.' }),
    due_date: z.string().nullable().optional(),
    members: z.array(z.string()).optional(),
});